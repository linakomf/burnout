const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../db');
const { authMiddleware, adminOnly, optionalAuthMiddleware } = require('../middleware/auth');
const { pickTargetRole, pickTargetGender, appendAudienceFilter } = require('../utils/audienceTargeting');
const { dbErrorToMessage } = require('../utils/dbErrorToMessage');
const { pickCategory, pickKind } = require('../utils/readingCategories');
const { unlinkReadingCover } = require('../utils/readingUploadCleanup');

const router = express.Router();
const uploadsAbs = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsAbs),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `reading_${Date.now()}_${Math.random().toString(36).slice(2, 10)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const name = String(file.originalname || '').toLowerCase();
    const byExt = /\.(jpe?g|png|gif|webp|avif|bmp|heic|heif)$/i.test(name);
    const byMime = String(file.mimetype || '').toLowerCase().startsWith('image/');
    if (byMime || byExt) cb(null, true);
    else cb(new Error('Обложка: только изображения (JPG, PNG, WebP и т.д.)'));
  },
});

const bodyImageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsAbs),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `reading_body_${Date.now()}_${Math.random().toString(36).slice(2, 10)}${ext}`);
  },
});

const bodyImageUpload = multer({
  storage: bodyImageStorage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const name = String(file.originalname || '').toLowerCase();
    const byExt = /\.(jpe?g|png|gif|webp|avif|bmp|heic|heif)$/i.test(name);
    const byMime = String(file.mimetype || '').toLowerCase().startsWith('image/');
    if (byMime || byExt) cb(null, true);
    else cb(new Error('Только изображения (JPG, PNG, WebP и т.д.)'));
  },
});

function apiErrorMessage(e) {
  return dbErrorToMessage(e) || e?.message || 'Ошибка сервера';
}

function withCoverUpload(req, res, next) {
  upload.single('cover')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Файл слишком большой (макс. 12 МБ)' });
    }
    return res.status(400).json({ message: err.message || 'Ошибка загрузки файла' });
  });
}

function parseReadingPublicId(param) {
  const s = String(param || '').trim();
  const article = /^article-(\d+)$/.exec(s);
  if (article) return { kind: 'article', id: parseInt(article[1], 10) };
  const book = /^book-(\d+)$/.exec(s);
  if (book) return { kind: 'book', id: parseInt(book[1], 10) };
  return null;
}

function normalizeReadUrl(raw) {
  const u = String(raw || '').trim();
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

function rowToPublic(row) {
  const kind = row.kind || 'article';
  const base = {
    id: `${kind}-${row.reading_id}`,
    readingDbId: row.reading_id,
    kind,
    title: row.title,
    category: row.category,
    coverImage: row.cover_url || '',
    descriptionShort: row.description_short || '',
    isRemoteReading: true,
    target_role: row.target_role || 'all',
    target_gender: row.target_gender || 'all',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
  if (kind === 'article') {
    return {
      ...base,
      bodyFull: row.body_full || '',
      sourceUrl: row.read_url || '',
    };
  }
  return {
    ...base,
    readUrl: row.read_url || '',
  };
}

function readBody(body, files, existing) {
  const kind = pickKind(body.kind, existing);
  const fallbackCat = kind === 'book' ? 'psychology' : 'burnout';
  const category = pickCategory(kind, body.category, existing?.category || fallbackCat);

  const description_short = String(
    body.description_short ?? existing?.description_short ?? ''
  ).trim().slice(0, 2000);

  const body_full = String(body.body_full ?? existing?.body_full ?? '').trim();
  const read_url = normalizeReadUrl(
    Object.prototype.hasOwnProperty.call(body, 'read_url') ? body.read_url : existing?.read_url
  );

  const isCreate = !existing;
  if (kind === 'article') {
    if (isCreate && !body_full) {
      return { error: 'Укажите полный текст статьи' };
    }
  } else if (isCreate && !read_url) {
    return { error: 'Укажите ссылку для чтения книги (http/https)' };
  }

  if (Object.prototype.hasOwnProperty.call(body, 'read_url') && kind === 'book' && !read_url) {
    return { error: 'Укажите ссылку для чтения книги (http/https)' };
  }

  return {
    kind,
    category,
    description_short,
    body_full: kind === 'article' ? body_full : '',
    read_url: kind === 'book' ? read_url : read_url || existing?.read_url || '',
    cover_url: files?.cover ? `/uploads/${files.cover.filename}` : undefined,
    target_role: Object.prototype.hasOwnProperty.call(body, 'target_role')
      ? pickTargetRole(body.target_role)
      : existing?.target_role || 'all',
    target_gender: Object.prototype.hasOwnProperty.call(body, 'target_gender')
      ? pickTargetGender(body.target_gender)
      : existing?.target_gender || 'all',
  };
}

router.get('/', optionalAuthMiddleware, async (req, res) => {
  try {
    const aud = appendAudienceFilter(req.user, '', 1);
    const r = await pool.query(
      `SELECT reading_id, kind, title, category, cover_url, description_short, body_full, read_url,
              target_role, target_gender, created_at, updated_at
       FROM reading_items WHERE 1=1${aud.sql} ORDER BY reading_id ASC`,
      aud.params
    );
    const items = r.rows.map(rowToPublic);
    res.json({
      items,
      articles: items.filter((i) => i.kind === 'article'),
      books: items.filter((i) => i.kind === 'book'),
    });
  } catch (e) {
    res.status(500).json({ message: apiErrorMessage(e) });
  }
});

router.post('/body-image', authMiddleware, adminOnly, (req, res) => {
  bodyImageUpload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Файл слишком большой (макс. 12 МБ)' });
      }
      return res.status(400).json({ message: err.message || 'Ошибка загрузки файла' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Выберите изображение' });
    }
    return res.status(201).json({ url: `/uploads/${req.file.filename}` });
  });
});

router.get('/:readingKey', optionalAuthMiddleware, async (req, res) => {
  try {
    const parsed = parseReadingPublicId(req.params.readingKey);
    if (!parsed) return res.status(404).json({ message: 'Материал не найден' });
    const aud = appendAudienceFilter(req.user, '', 3);
    const r = await pool.query(
      `SELECT reading_id, kind, title, category, cover_url, description_short, body_full, read_url,
              target_role, target_gender, created_at, updated_at
       FROM reading_items WHERE reading_id=$1 AND kind=$2${aud.sql}`,
      [parsed.id, parsed.kind, ...aud.params]
    );
    if (r.rows.length === 0) return res.status(404).json({ message: 'Материал не найден' });
    res.json(rowToPublic(r.rows[0]));
  } catch (e) {
    res.status(500).json({ message: apiErrorMessage(e) });
  }
});

router.post('/', authMiddleware, adminOnly, withCoverUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Загрузите обложку' });
    }
    const title = String(req.body.title || '').trim();
    if (!title) return res.status(400).json({ message: 'Укажите название' });

    const parsed = readBody(req.body, { cover: req.file }, null);
    if (parsed.error) return res.status(400).json({ message: parsed.error });

    const ins = await pool.query(
      `INSERT INTO reading_items (kind, title, category, cover_url, description_short, body_full, read_url, target_role, target_gender)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING reading_id, kind, title, category, cover_url, description_short, body_full, read_url,
                 target_role, target_gender, created_at, updated_at`,
      [
        parsed.kind,
        title,
        parsed.category,
        parsed.cover_url,
        parsed.description_short,
        parsed.body_full,
        parsed.read_url,
        parsed.target_role,
        parsed.target_gender,
      ]
    );

    res.status(201).json(rowToPublic(ins.rows[0]));
  } catch (e) {
    console.error('POST /reading', e);
    res.status(500).json({ message: apiErrorMessage(e) });
  }
});

router.patch('/:readingKey', authMiddleware, adminOnly, withCoverUpload, async (req, res) => {
  try {
    const key = parseReadingPublicId(req.params.readingKey);
    if (!key) return res.status(404).json({ message: 'Материал не найден' });

    const cur = await pool.query(`SELECT * FROM reading_items WHERE reading_id=$1`, [key.id]);
    if (cur.rows.length === 0) return res.status(404).json({ message: 'Материал не найден' });
    const existing = cur.rows[0];
    if (existing.kind !== key.kind) {
      return res.status(400).json({ message: 'Нельзя сменить тип записи — создайте новую' });
    }

    const parsed = readBody(req.body, req.file ? { cover: req.file } : {}, existing);
    if (parsed.error) return res.status(400).json({ message: parsed.error });

    const patch = {};
    if (Object.prototype.hasOwnProperty.call(req.body, 'title')) {
      const title = String(req.body.title || '').trim();
      if (!title) return res.status(400).json({ message: 'Укажите название' });
      patch.title = title;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'category')) patch.category = parsed.category;
    if (Object.prototype.hasOwnProperty.call(req.body, 'description_short')) {
      patch.description_short = parsed.description_short;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'body_full')) patch.body_full = parsed.body_full;
    if (Object.prototype.hasOwnProperty.call(req.body, 'read_url')) patch.read_url = parsed.read_url;
    if (parsed.cover_url) {
      const { safeUnlinkUploadPath } = require('../utils/eventUploadCleanup');
      safeUnlinkUploadPath(uploadsAbs, existing.cover_url);
      patch.cover_url = parsed.cover_url;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'target_role')) {
      patch.target_role = parsed.target_role;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'target_gender')) {
      patch.target_gender = parsed.target_gender;
    }

    const keys = Object.keys(patch);
    if (keys.length === 0) {
      return res.json(rowToPublic(existing));
    }

    const sets = keys.map((k, i) => `${k}=$${i + 1}`);
    const vals = keys.map((k) => patch[k]);
    vals.push(key.id);

    const upd = await pool.query(
      `UPDATE reading_items SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE reading_id=$${keys.length + 1}
       RETURNING reading_id, kind, title, category, cover_url, description_short, body_full, read_url,
                 target_role, target_gender, created_at, updated_at`,
      vals
    );

    res.json(rowToPublic(upd.rows[0]));
  } catch (e) {
    console.error('PATCH /reading', e);
    res.status(500).json({ message: apiErrorMessage(e) });
  }
});

router.delete('/:readingKey', authMiddleware, adminOnly, async (req, res) => {
  try {
    const key = parseReadingPublicId(req.params.readingKey);
    if (!key) return res.status(404).json({ message: 'Материал не найден' });

    const r = await pool.query(
      `DELETE FROM reading_items WHERE reading_id=$1 RETURNING cover_url`,
      [key.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ message: 'Материал не найден' });

    unlinkReadingCover(uploadsAbs, r.rows[0].cover_url);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: apiErrorMessage(e) });
  }
});

module.exports = router;

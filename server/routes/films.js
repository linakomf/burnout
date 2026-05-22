const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { dbErrorToMessage } = require('../utils/dbErrorToMessage');
const { normalizeFilmTags } = require('../utils/filmTagWhitelist');
const { unlinkFilmAssets, safeUnlinkUploadPath } = require('../utils/filmUploadCleanup');

const router = express.Router();

const uploadsAbs = path.join(__dirname, '..', 'uploads');

const ALLOWED_CATEGORY_IDS = new Set([
  'burnout',
  'anxiety',
  'stress',
  'sleep',
  'focus',
  'motivation',
]);

const ALLOWED_PSYCH_TAGS = new Set(['antistress', 'motivating', 'light', 'emotional_release']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsAbs),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `film_${Date.now()}_${Math.random().toString(36).slice(2, 10)}${ext}`);
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
    else cb(new Error('Только изображения (JPG, PNG, WebP и т.д.)'));
  },
});

function filmApiErrorMessage(e) {
  return dbErrorToMessage(e) || e?.message || 'Ошибка сервера';
}

/** Multer должен отдавать JSON, иначе админка видит пустую ошибку. */
function withUpload(fields) {
  const mw = upload.fields(fields);
  return (req, res, next) => {
    mw(req, res, (err) => {
      if (!err) return next();
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Файл слишком большой (макс. 12 МБ)' });
      }
      if (String(err.message || '').includes('Только изображения')) {
        return res.status(400).json({ message: err.message });
      }
      return res.status(400).json({ message: err.message || 'Ошибка загрузки файла' });
    });
  };
}

function parseFilmPublicId(param) {
  const m = /^film-(\d+)$/.exec(String(param || '').trim());
  return m ? parseInt(m[1], 10) : null;
}

function rowToPublicFilm(row) {
  const gallery =
    Array.isArray(row.gallery_urls) ? row.gallery_urls : [];
  const tagsRaw = row.tags && typeof row.tags === 'object' ? row.tags : {};
  const tags = normalizeFilmTags(tagsRaw);
  const id = `film-${row.film_id}`;
  return {
    id,
    filmDbId: row.film_id,
    title: row.title,
    description: row.description_short || '',
    descriptionFull: row.description_full || '',
    source: row.source || '',
    duration: row.duration || '',
    year: row.year || '',
    rating: row.rating || '',
    categoryId: row.category_id || 'burnout',
    psychTag: row.psych_tag || 'light',
    genres: row.genres_display || '',
    tags,
    poster: row.poster_url || '',
    gallery,
    embedUrl: row.embed_url || '',
    watchUrl: row.watch_url || '',
    country: row.country || '',
    director: row.director || '',
    screenwriter: row.screenwriter || '',
    quote: row.quote || '',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function parseTagsField(raw) {
  if (raw == null || raw === '') return normalizeFilmTags({});
  if (typeof raw === 'object') return normalizeFilmTags(raw);
  try {
    return normalizeFilmTags(JSON.parse(String(raw)));
  } catch {
    return normalizeFilmTags({});
  }
}

function normalizeWatchUrl(raw) {
  const u = String(raw || '').trim();
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  return '';
}

function normalizeOptionalHttp(raw) {
  const u = String(raw || '').trim();
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  return '';
}

function parseKeepGalleryUrls(raw, existingGallery) {
  const existingSet = new Set(Array.isArray(existingGallery) ? existingGallery : []);
  let arr = [];
  if (typeof raw === 'string' && raw.trim()) {
    try {
      arr = JSON.parse(raw);
    } catch {
      arr = [];
    }
  } else if (Array.isArray(raw)) arr = raw;
  if (!Array.isArray(arr)) return [];
  const out = [];
  const seen = new Set();
  for (const item of arr) {
    if (typeof item !== 'string') continue;
    const url = item.trim();
    if (!url || seen.has(url)) continue;
    if (!existingSet.has(url)) continue;
    seen.add(url);
    out.push(url);
    if (out.length >= 6) break;
  }
  return out;
}

/** GET список для каталога */
router.get('/', async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT film_id, title, description_short, description_full, watch_url, poster_url, gallery_urls, tags,
              source, duration, year, rating, category_id, psych_tag, genres_display, embed_url,
              director, screenwriter, country, quote, created_at, updated_at
       FROM films ORDER BY film_id ASC`
    );
    res.json({ films: r.rows.map(rowToPublicFilm) });
  } catch (e) {
    res.status(500).json({ message: filmApiErrorMessage(e) });
  }
});

/** GET один фильм по film-{id} */
router.get('/:filmKey', async (req, res) => {
  try {
    const filmId = parseFilmPublicId(req.params.filmKey);
    if (!filmId) return res.status(404).json({ message: 'Фильм не найден' });
    const r = await pool.query(
      `SELECT film_id, title, description_short, description_full, watch_url, poster_url, gallery_urls, tags,
              source, duration, year, rating, category_id, psych_tag, genres_display, embed_url,
              director, screenwriter, country, quote, created_at, updated_at
       FROM films WHERE film_id=$1`,
      [filmId]
    );
    if (r.rows.length === 0) return res.status(404).json({ message: 'Фильм не найден' });
    res.json(rowToPublicFilm(r.rows[0]));
  } catch (e) {
    res.status(500).json({ message: filmApiErrorMessage(e) });
  }
});

router.post(
  '/',
  authMiddleware,
  adminOnly,
  withUpload([
    { name: 'poster', maxCount: 1 },
    { name: 'gallery', maxCount: 6 },
  ]),
  async (req, res) => {
    try {
      const posterFile = req.files?.poster?.[0];
      if (!posterFile) {
        return res.status(400).json({ message: 'Загрузите главное изображение (постер)' });
      }

      const title = String(req.body.title || '').trim();
      if (!title) return res.status(400).json({ message: 'Укажите название' });

      const watchUrl = normalizeWatchUrl(req.body.watch_url);
      if (!watchUrl) return res.status(400).json({ message: 'Укажите корректную ссылку на просмотр (http/https)' });

      const description_short = String(req.body.description_short ?? '').trim();
      const description_full = String(req.body.description_full ?? '').trim();

      const tags = parseTagsField(req.body.tags);

      let category_id = String(req.body.category_id || 'burnout').trim();
      if (!ALLOWED_CATEGORY_IDS.has(category_id)) category_id = 'burnout';

      let psych_tag = String(req.body.psych_tag || 'light').trim();
      if (!ALLOWED_PSYCH_TAGS.has(psych_tag)) psych_tag = 'light';

      const genres_display = String(req.body.genres_display ?? '').trim().slice(0, 255);
      const source = String(req.body.source ?? '').trim().slice(0, 180);
      const duration = String(req.body.duration ?? '').trim().slice(0, 32);
      const year = String(req.body.year ?? '').trim().slice(0, 16);
      const rating = String(req.body.rating ?? '').trim().slice(0, 16);
      const embed_url = normalizeOptionalHttp(req.body.embed_url);
      const director = String(req.body.director ?? '').trim().slice(0, 255);
      const screenwriter = String(req.body.screenwriter ?? '').trim().slice(0, 255);
      const country = String(req.body.country ?? '').trim().slice(0, 255);
      const quote = String(req.body.quote ?? '').trim().slice(0, 2000);

      const poster_url = `/uploads/${posterFile.filename}`;
      const galleryFiles = req.files?.gallery || [];
      const gallery_urls = galleryFiles.slice(0, 6).map((f) => `/uploads/${f.filename}`);

      const ins = await pool.query(
        `INSERT INTO films (
          title, description_short, description_full, watch_url, poster_url, gallery_urls, tags,
          source, duration, year, rating, category_id, psych_tag, genres_display, embed_url,
          director, screenwriter, country, quote
        ) VALUES (
          $1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,
          $8,$9,$10,$11,$12,$13,$14,$15,
          $16,$17,$18,$19
        )
        RETURNING film_id, title, description_short, description_full, watch_url, poster_url, gallery_urls, tags,
                  source, duration, year, rating, category_id, psych_tag, genres_display, embed_url,
                  director, screenwriter, country, quote, created_at, updated_at`,
        [
          title,
          description_short,
          description_full,
          watchUrl,
          poster_url,
          JSON.stringify(gallery_urls),
          JSON.stringify(tags),
          source,
          duration,
          year,
          rating,
          category_id,
          psych_tag,
          genres_display,
          embed_url,
          director,
          screenwriter,
          country,
          quote,
        ]
      );

      res.status(201).json(rowToPublicFilm(ins.rows[0]));
    } catch (e) {
      console.error('POST /films', e);
      if (e.message === 'Только изображения' || String(e.message || '').includes('Только изображения')) {
        return res.status(400).json({ message: e.message });
      }
      res.status(500).json({ message: filmApiErrorMessage(e) });
    }
  }
);

router.patch(
  '/:filmKey',
  authMiddleware,
  adminOnly,
  withUpload([
    { name: 'poster', maxCount: 1 },
    { name: 'gallery', maxCount: 6 },
  ]),
  async (req, res) => {
    try {
      const filmId = parseFilmPublicId(req.params.filmKey);
      if (!filmId) return res.status(404).json({ message: 'Фильм не найден' });

      const cur = await pool.query(
        `SELECT film_id, poster_url, gallery_urls FROM films WHERE film_id=$1`,
        [filmId]
      );
      if (cur.rows.length === 0) return res.status(404).json({ message: 'Фильм не найден' });

      const existing = cur.rows[0];
      const existingGallery = Array.isArray(existing.gallery_urls) ? existing.gallery_urls : [];

      const patch = {};

      if (Object.prototype.hasOwnProperty.call(req.body, 'title')) {
        const title = String(req.body.title || '').trim();
        if (!title) return res.status(400).json({ message: 'Укажите название' });
        patch.title = title;
      }

      if (Object.prototype.hasOwnProperty.call(req.body, 'watch_url')) {
        const watchUrl = normalizeWatchUrl(req.body.watch_url);
        if (!watchUrl) return res.status(400).json({ message: 'Укажите корректную ссылку на просмотр (http/https)' });
        patch.watch_url = watchUrl;
      }

      if (Object.prototype.hasOwnProperty.call(req.body, 'description_short')) {
        patch.description_short = String(req.body.description_short ?? '').trim();
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'description_full')) {
        patch.description_full = String(req.body.description_full ?? '').trim();
      }

      if (Object.prototype.hasOwnProperty.call(req.body, 'tags')) {
        patch.tags = JSON.stringify(parseTagsField(req.body.tags));
      }

      if (Object.prototype.hasOwnProperty.call(req.body, 'category_id')) {
        let category_id = String(req.body.category_id || 'burnout').trim();
        if (!ALLOWED_CATEGORY_IDS.has(category_id)) category_id = 'burnout';
        patch.category_id = category_id;
      }

      if (Object.prototype.hasOwnProperty.call(req.body, 'psych_tag')) {
        let psych_tag = String(req.body.psych_tag || 'light').trim();
        if (!ALLOWED_PSYCH_TAGS.has(psych_tag)) psych_tag = 'light';
        patch.psych_tag = psych_tag;
      }

      const sliceStr = (key, max) => {
        if (Object.prototype.hasOwnProperty.call(req.body, key)) {
          patch[key] = String(req.body[key] ?? '').trim().slice(0, max);
        }
      };
      sliceStr('genres_display', 255);
      sliceStr('source', 180);
      sliceStr('duration', 32);
      sliceStr('year', 16);
      sliceStr('rating', 16);
      sliceStr('director', 255);
      sliceStr('screenwriter', 255);
      sliceStr('country', 255);
      sliceStr('quote', 2000);

      if (Object.prototype.hasOwnProperty.call(req.body, 'embed_url')) {
        patch.embed_url = normalizeOptionalHttp(req.body.embed_url);
      }

      const posterFile = req.files?.poster?.[0];
      if (posterFile) {
        safeUnlinkUploadPath(uploadsAbs, existing.poster_url);
        patch.poster_url = `/uploads/${posterFile.filename}`;
      }

      let nextGallery = existingGallery;
      const galleryFiles = req.files?.gallery || [];
      const hasGalleryDirective = Object.prototype.hasOwnProperty.call(req.body, 'keep_gallery_urls');
      if (hasGalleryDirective || galleryFiles.length > 0) {
        const kept = hasGalleryDirective
          ? parseKeepGalleryUrls(req.body.keep_gallery_urls, existingGallery)
          : [...existingGallery];
        const appended = galleryFiles.map((f) => `/uploads/${f.filename}`);
        nextGallery = [...kept, ...appended].slice(0, 6);
        const removed = existingGallery.filter((u) => !nextGallery.includes(u));
        for (const u of removed) safeUnlinkUploadPath(uploadsAbs, u);
        patch.gallery_urls = JSON.stringify(nextGallery);
      }

      const keys = Object.keys(patch);
      if (keys.length === 0) {
        const full = await pool.query(
          `SELECT film_id, title, description_short, description_full, watch_url, poster_url, gallery_urls, tags,
                  source, duration, year, rating, category_id, psych_tag, genres_display, embed_url,
                  director, screenwriter, country, quote, created_at, updated_at
           FROM films WHERE film_id=$1`,
          [filmId]
        );
        return res.json(rowToPublicFilm(full.rows[0]));
      }

      const sets = keys.map((k, i) => `${k}=$${i + 1}`);
      const vals = keys.map((k) => patch[k]);
      vals.push(filmId);
      const idParam = keys.length + 1;

      const upd = await pool.query(
        `UPDATE films SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE film_id=$${idParam}
        RETURNING film_id, title, description_short, description_full, watch_url, poster_url, gallery_urls, tags,
                  source, duration, year, rating, category_id, psych_tag, genres_display, embed_url,
                  director, screenwriter, country, quote, created_at, updated_at`,
        vals
      );

      res.json(rowToPublicFilm(upd.rows[0]));
    } catch (e) {
      if (e.message === 'Только изображения') {
        return res.status(400).json({ message: e.message });
      }
      res.status(500).json({ message: filmApiErrorMessage(e) });
    }
  }
);

router.delete('/:filmKey', authMiddleware, adminOnly, async (req, res) => {
  try {
    const filmId = parseFilmPublicId(req.params.filmKey);
    if (!filmId) return res.status(404).json({ message: 'Фильм не найден' });

    const r = await pool.query(
      `DELETE FROM films WHERE film_id=$1 RETURNING poster_url, gallery_urls`,
      [filmId]
    );
    if (r.rows.length === 0) return res.status(404).json({ message: 'Фильм не найден' });

    unlinkFilmAssets(uploadsAbs, r.rows[0].poster_url, r.rows[0].gallery_urls);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: filmApiErrorMessage(e) });
  }
});

module.exports = router;

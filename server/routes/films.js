const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../db');
const { authMiddleware, adminOnly, optionalAuthMiddleware } = require('../middleware/auth');
const { pickTargetRole, pickTargetGender, appendAudienceFilter } = require('../utils/audienceTargeting');
const { dbErrorToMessage } = require('../utils/dbErrorToMessage');
const { parseFilmPublicId, parsePublicFilmIds, slugifyTitle } = require('../utils/filmCollectionItems');
const { normalizeFilmTags } = require('../utils/filmTagWhitelist');
const { unlinkFilmAssets, safeUnlinkUploadPath } = require('../utils/filmUploadCleanup');
const { resolveMediaUrl, resolveMediaUrlList } = require('../utils/resolveMediaUrl');
const { publicUploadPath } = require('../utils/mirrorUpload');

const router = express.Router();

const { getUploadsDir } = require('../utils/uploadsDir');
const uploadsAbs = getUploadsDir();

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
    poster: resolveMediaUrl(row.poster_url),
    gallery,
    embedUrl: row.embed_url || '',
    watchUrl: row.watch_url || '',
    country: row.country || '',
    director: row.director || '',
    screenwriter: row.screenwriter || '',
    quote: row.quote || '',
    target_role: row.target_role || 'all',
    target_gender: row.target_gender || 'all',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function rowToCollection(row, filmIds = []) {
  const ids = Array.isArray(filmIds) ? filmIds : [];
  return {
    id: row.slug,
    slug: row.slug,
    collectionId: row.collection_id,
    title: row.title || '',
    description: row.description || '',
    image: resolveMediaUrl(row.cover_url),
    filmIds: ids,
    filmsCount: ids.length,
    isActive: row.is_active !== false,
    sort_order: row.sort_order || 0,
  };
}

async function loadCollectionFilmMap() {
  const r = await pool.query(
    `SELECT fci.collection_id, fci.film_id, fci.sort_order
     FROM film_collection_items fci
     INNER JOIN films f ON f.film_id = fci.film_id
     ORDER BY fci.collection_id ASC, fci.sort_order ASC, fci.film_id ASC`
  );
  const byCollection = new Map();
  for (const row of r.rows) {
    if (!byCollection.has(row.collection_id)) byCollection.set(row.collection_id, []);
    byCollection.get(row.collection_id).push(`film-${row.film_id}`);
  }
  return byCollection;
}

async function syncCollectionFilms(collectionId, publicFilmIds) {
  await pool.query(`DELETE FROM film_collection_items WHERE collection_id = $1`, [collectionId]);
  const ids = parsePublicFilmIds(publicFilmIds);
  if (!ids.length) return;
  let order = 0;
  for (const pubId of ids) {
    const filmId = parseFilmPublicId(pubId);
    if (filmId == null) continue;
    await pool.query(
      `INSERT INTO film_collection_items (collection_id, film_id, sort_order)
       VALUES ($1, $2, $3)
       ON CONFLICT (collection_id, film_id) DO UPDATE SET sort_order = EXCLUDED.sort_order`,
      [collectionId, filmId, order]
    );
    order += 1;
  }
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


router.get('/', optionalAuthMiddleware, async (req, res) => {
  try {
    const aud = appendAudienceFilter(req.user, '', 1);
    const r = await pool.query(
      `SELECT film_id, title, description_short, description_full, watch_url, poster_url, gallery_urls, tags,
              source, duration, year, rating, category_id, psych_tag, genres_display, embed_url,
              director, screenwriter, country, quote, target_role, target_gender, created_at, updated_at
       FROM films WHERE 1=1${aud.sql} ORDER BY film_id ASC`,
      aud.params
    );
    res.json({ films: r.rows.map(rowToPublicFilm) });
  } catch (e) {
    res.status(500).json({ message: filmApiErrorMessage(e) });
  }
});

router.get('/collections', optionalAuthMiddleware, async (req, res) => {
  try {
    const collectionsR = await pool.query(
      `SELECT collection_id, slug, title, description, cover_url, sort_order, is_active
       FROM film_collections
       WHERE is_active = true
       ORDER BY sort_order ASC, collection_id ASC`
    );
    const filmMap = await loadCollectionFilmMap();
    res.json({
      collections: collectionsR.rows.map((row) => rowToCollection(row, filmMap.get(row.collection_id) || [])),
    });
  } catch (e) {
    res.status(500).json({ message: filmApiErrorMessage(e) });
  }
});

router.get('/collections/:slug', optionalAuthMiddleware, async (req, res) => {
  try {
    const slug = String(req.params.slug || '').trim();
    if (!slug) return res.status(404).json({ message: 'Подборка не найдена' });
    const r = await pool.query(
      `SELECT collection_id, slug, title, description, cover_url, sort_order, is_active
       FROM film_collections
       WHERE slug = $1 AND is_active = true`,
      [slug]
    );
    if (r.rows.length === 0) return res.status(404).json({ message: 'Подборка не найдена' });
    const filmMap = await loadCollectionFilmMap();
    res.json(rowToCollection(r.rows[0], filmMap.get(r.rows[0].collection_id) || []));
  } catch (e) {
    res.status(500).json({ message: filmApiErrorMessage(e) });
  }
});

router.get('/:filmKey', optionalAuthMiddleware, async (req, res) => {
  try {
    const filmId = parseFilmPublicId(req.params.filmKey);
    if (!filmId) return res.status(404).json({ message: 'Фильм не найден' });
    const aud = appendAudienceFilter(req.user, '', 2);
    const r = await pool.query(
      `SELECT film_id, title, description_short, description_full, watch_url, poster_url, gallery_urls, tags,
              source, duration, year, rating, category_id, psych_tag, genres_display, embed_url,
              director, screenwriter, country, quote, target_role, target_gender, created_at, updated_at
       FROM films WHERE film_id=$1${aud.sql}`,
      [filmId, ...aud.params]
    );
    if (r.rows.length === 0) return res.status(404).json({ message: 'Фильм не найден' });
    res.json(rowToPublicFilm(r.rows[0]));
  } catch (e) {
    res.status(500).json({ message: filmApiErrorMessage(e) });
  }
});

router.post(
  '/collections',
  authMiddleware,
  adminOnly,
  withUpload([{ name: 'cover', maxCount: 1 }]),
  async (req, res) => {
    try {
      const title = String(req.body.title || '').trim();
      if (!title) return res.status(400).json({ message: 'Укажите название подборки' });
      const description = String(req.body.description || '').trim();
      const sort_order = parseInt(req.body.sort_order, 10) || 0;
      const coverFile = req.files?.cover?.[0];
      if (!coverFile) {
        return res.status(400).json({ message: 'Загрузите изображение подборки' });
      }

      const ins = await pool.query(
        `INSERT INTO film_collections (slug, title, description, cover_url, sort_order, is_active)
         VALUES ($1, $2, $3, $4, $5, true)
         RETURNING collection_id, slug, title, description, cover_url, sort_order, is_active`,
        ['tmp', title.slice(0, 120), description, publicUploadPath(coverFile), sort_order]
      );
      const row = ins.rows[0];
      const slug = slugifyTitle(title, row.collection_id);
      await pool.query(`UPDATE film_collections SET slug = $1 WHERE collection_id = $2`, [
        slug,
        row.collection_id,
      ]);

      if (Object.prototype.hasOwnProperty.call(req.body, 'film_ids')) {
        await syncCollectionFilms(row.collection_id, req.body.film_ids);
      }

      const filmMap = await loadCollectionFilmMap();
      const full = await pool.query(
        `SELECT collection_id, slug, title, description, cover_url, sort_order, is_active
         FROM film_collections
         WHERE collection_id = $1`,
        [row.collection_id]
      );
      res.status(201).json(rowToCollection(full.rows[0], filmMap.get(row.collection_id) || []));
    } catch (e) {
      console.error('POST /films/collections', e);
      res.status(500).json({ message: filmApiErrorMessage(e) });
    }
  }
);

router.patch(
  '/collections/:slug',
  authMiddleware,
  adminOnly,
  withUpload([{ name: 'cover', maxCount: 1 }]),
  async (req, res) => {
    try {
      const slug = String(req.params.slug || '').trim();
      if (!slug) return res.status(400).json({ message: 'Укажите подборку' });
      const cur = await pool.query(`SELECT * FROM film_collections WHERE slug = $1`, [slug]);
      if (cur.rows.length === 0) return res.status(404).json({ message: 'Подборка не найдена' });

      const existing = cur.rows[0];
      const patch = {};

      if (Object.prototype.hasOwnProperty.call(req.body, 'title')) {
        const title = String(req.body.title || '').trim();
        if (!title) return res.status(400).json({ message: 'Название не может быть пустым' });
        patch.title = title.slice(0, 120);
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'description')) {
        patch.description = String(req.body.description || '').trim();
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'sort_order')) {
        patch.sort_order = parseInt(req.body.sort_order, 10) || 0;
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'is_active')) {
        patch.is_active = String(req.body.is_active) !== 'false';
      }

      const coverFile = req.files?.cover?.[0];
      if (coverFile) {
        safeUnlinkUploadPath(uploadsAbs, existing.cover_url);
        patch.cover_url = publicUploadPath(coverFile);
      }

      if (Object.keys(patch).length > 0) {
        const keys = Object.keys(patch);
        const sets = keys.map((k, i) => `${k}=$${i + 1}`);
        const vals = keys.map((k) => patch[k]);
        vals.push(slug);
        await pool.query(
          `UPDATE film_collections SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP
           WHERE slug = $${keys.length + 1}`,
          vals
        );
      }

      if (Object.prototype.hasOwnProperty.call(req.body, 'film_ids')) {
        await syncCollectionFilms(existing.collection_id, req.body.film_ids);
      }

      const filmMap = await loadCollectionFilmMap();
      const full = await pool.query(
        `SELECT collection_id, slug, title, description, cover_url, sort_order, is_active
         FROM film_collections
         WHERE collection_id = $1`,
        [existing.collection_id]
      );
      res.json(rowToCollection(full.rows[0], filmMap.get(existing.collection_id) || []));
    } catch (e) {
      console.error('PATCH /films/collections/:slug', e);
      res.status(500).json({ message: filmApiErrorMessage(e) });
    }
  }
);

router.delete('/collections/:slug', authMiddleware, adminOnly, async (req, res) => {
  try {
    const slug = String(req.params.slug || '').trim();
    const cur = await pool.query(
      `DELETE FROM film_collections WHERE slug = $1 RETURNING cover_url`,
      [slug]
    );
    if (cur.rows.length === 0) return res.status(404).json({ message: 'Подборка не найдена' });
    safeUnlinkUploadPath(uploadsAbs, cur.rows[0].cover_url);
    res.json({ ok: true });
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

      const poster_url = publicUploadPath(posterFile);
      const galleryFiles = req.files?.gallery || [];
      const gallery_urls = galleryFiles.slice(0, 6).map((f) => publicUploadPath(f));

      const target_role = pickTargetRole(req.body.target_role);
      const target_gender = pickTargetGender(req.body.target_gender);

      const ins = await pool.query(
        `INSERT INTO films (
          title, description_short, description_full, watch_url, poster_url, gallery_urls, tags,
          source, duration, year, rating, category_id, psych_tag, genres_display, embed_url,
          director, screenwriter, country, quote, target_role, target_gender
        ) VALUES (
          $1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,
          $8,$9,$10,$11,$12,$13,$14,$15,
          $16,$17,$18,$19,$20,$21
        )
        RETURNING film_id, title, description_short, description_full, watch_url, poster_url, gallery_urls, tags,
                  source, duration, year, rating, category_id, psych_tag, genres_display, embed_url,
                  director, screenwriter, country, quote, target_role, target_gender, created_at, updated_at`,
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
          target_role,
          target_gender,
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
      if (Object.prototype.hasOwnProperty.call(req.body, 'target_role')) {
        patch.target_role = pickTargetRole(req.body.target_role);
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'target_gender')) {
        patch.target_gender = pickTargetGender(req.body.target_gender);
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
        patch.poster_url = publicUploadPath(posterFile);
      }

      let nextGallery = existingGallery;
      const galleryFiles = req.files?.gallery || [];
      const hasGalleryDirective = Object.prototype.hasOwnProperty.call(req.body, 'keep_gallery_urls');
      if (hasGalleryDirective || galleryFiles.length > 0) {
        const kept = hasGalleryDirective
          ? parseKeepGalleryUrls(req.body.keep_gallery_urls, existingGallery)
          : [...existingGallery];
        const appended = galleryFiles.map((f) => publicUploadPath(f));
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

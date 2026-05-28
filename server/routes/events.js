const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../db');
const { authMiddleware, adminOnly, optionalAuthMiddleware } = require('../middleware/auth');
const { pickTargetRole, pickTargetGender, appendAudienceFilter } = require('../utils/audienceTargeting');
const { dbErrorToMessage } = require('../utils/dbErrorToMessage');
const {
  KINDS,
  FILTER_CATS,
  normalizePriceKey,
  buildCardTags,
  parseTagsField,
  parseJsonArray,
  pickTfLoc,
  pickTfDate,
  pickTfTime,
  pickTfMood,
} = require('../utils/eventFilters');
const { unlinkEventAssets, safeUnlinkUploadPath } = require('../utils/eventUploadCleanup');

const router = express.Router();
const { getUploadsDir } = require('../utils/uploadsDir');
const uploadsAbs = getUploadsDir();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsAbs),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `event_${Date.now()}_${Math.random().toString(36).slice(2, 10)}${ext}`);
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

function apiErrorMessage(e) {
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

function parseEventPublicId(param) {
  const m = /^event-(\d+)$/.exec(String(param || '').trim());
  return m ? parseInt(m[1], 10) : null;
}

function rowToPublicEvent(row) {
  const tags = Array.isArray(row.card_tags) ? row.card_tags : [];
  const gallery = Array.isArray(row.gallery_urls) ? row.gallery_urls : [];
  const suitTags = Array.isArray(row.suit_tags) ? row.suit_tags : [];
  const important = Array.isArray(row.important_notes) ? row.important_notes : [];

  return {
    id: `event-${row.event_id}`,
    eventDbId: row.event_id,
    title: row.title,
    kind: row.kind || 'solo',
    filterCat: row.filter_cat || 'other',
    categoryLabel: row.category_label || '',
    priceKey: row.price_key || 'eventsEvPriceFrom2000',
    tf: {
      loc: row.tf_loc || 'almaty',
      date: row.tf_date || 'this_month',
      time: row.tf_time || 'evening',
      mood: row.tf_mood || 'calm',
    },
    tags,
    image: row.cover_url || '',
    detail: {
      ticketUrl: row.ticket_url || '',
      heroImage: row.hero_url || row.cover_url || '',
      venueLine: row.venue_line || '',
      teaser: row.teaser || '',
      aboutText: row.about_text || '',
      durationLabel: row.duration_label || '',
      ageLabel: row.age_label || '',
      genreLabel: row.genre_label || '',
      refundLabel: row.refund_label || '',
      venueImage: row.venue_image_url || '',
      venuePinText: row.venue_pin_text || '',
      organizerName: row.organizer_name || '',
      organizerDesc: row.organizer_desc || '',
      suitTags,
      importantNotes: important,
      gallery,
    },
    isRemoteEvent: true,
    target_role: row.target_role || 'all',
    target_gender: row.target_gender || 'all',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function normalizeTicketUrl(raw) {
  const u = String(raw || '').trim();
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  return '';
}

function readEventBody(body, files, existing) {
  const kind = KINDS.has(String(body.kind || existing?.kind || 'solo').trim())
    ? String(body.kind || existing?.kind || 'solo').trim()
    : 'solo';

  let filter_cat = String(body.filter_cat || existing?.filter_cat || 'other').trim();
  if (!FILTER_CATS.has(filter_cat)) filter_cat = 'other';

  const category_label = String(body.category_label ?? existing?.category_label ?? '').trim().slice(0, 120);

  const price_key = normalizePriceKey(body.price_key, existing?.price_key);

  let card_tags;
  if (Object.prototype.hasOwnProperty.call(body, 'card_tags')) {
    card_tags = parseTagsField(body.card_tags, kind);
  } else if (
    Object.prototype.hasOwnProperty.call(body, 'location_text') ||
    Object.prototype.hasOwnProperty.call(body, 'when_text') ||
    Object.prototype.hasOwnProperty.call(body, 'is_offline') ||
    Object.prototype.hasOwnProperty.call(body, 'kind')
  ) {
    card_tags = buildCardTags(body, kind);
  }

  const ticket_url = normalizeTicketUrl(
    Object.prototype.hasOwnProperty.call(body, 'ticket_url')
      ? body.ticket_url
      : existing?.ticket_url
  );
  const needTicket = Object.prototype.hasOwnProperty.call(body, 'ticket_url') || !existing;
  if (needTicket && !ticket_url) {
    return { error: 'Укажите ссылку на билеты / регистрацию (http/https)' };
  }

  return {
    kind,
    filter_cat,
    category_label,
    price_key,
    tf_loc: pickTfLoc(body.tf_loc ?? existing?.tf_loc),
    tf_date: pickTfDate(body.tf_date ?? existing?.tf_date),
    tf_time: pickTfTime(body.tf_time ?? existing?.tf_time),
    tf_mood: pickTfMood(body.tf_mood ?? existing?.tf_mood),
    card_tags,
    ticket_url,
    venue_line: String(body.venue_line ?? existing?.venue_line ?? '').trim().slice(0, 255),
    teaser: String(body.teaser ?? existing?.teaser ?? '').trim().slice(0, 2000),
    about_text: String(body.about_text ?? existing?.about_text ?? '').trim().slice(0, 8000),
    duration_label: String(body.duration_label ?? existing?.duration_label ?? '').trim().slice(0, 64),
    age_label: String(body.age_label ?? existing?.age_label ?? '').trim().slice(0, 64),
    genre_label: String(body.genre_label ?? existing?.genre_label ?? '').trim().slice(0, 120),
    refund_label: String(body.refund_label ?? existing?.refund_label ?? '').trim().slice(0, 120),
    venue_pin_text: String(body.venue_pin_text ?? existing?.venue_pin_text ?? '').trim().slice(0, 255),
    organizer_name: String(body.organizer_name ?? existing?.organizer_name ?? '').trim().slice(0, 180),
    organizer_desc: String(body.organizer_desc ?? existing?.organizer_desc ?? '').trim().slice(0, 2000),
    suit_tags: JSON.stringify(
      parseJsonArray(body.suit_tags, 12).length
        ? parseJsonArray(body.suit_tags, 12)
        : existing?.suit_tags || []
    ),
    important_notes: JSON.stringify(
      parseJsonArray(body.important_notes, 12).length
        ? parseJsonArray(body.important_notes, 12)
        : existing?.important_notes || []
    ),
    cover_url: files?.cover?.[0] ? `/uploads/${files.cover[0].filename}` : undefined,
    hero_url: files?.hero?.[0] ? `/uploads/${files.hero[0].filename}` : undefined,
    venue_image_url: files?.venue_image?.[0]
      ? `/uploads/${files.venue_image[0].filename}`
      : undefined,
    gallery_urls: undefined,
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
      `SELECT event_id, title, kind, filter_cat, category_label, price_key, tf_loc, tf_date, tf_time, tf_mood,
              card_tags, cover_url, hero_url, ticket_url, venue_line, teaser, about_text, duration_label,
              age_label, genre_label, refund_label, venue_image_url, venue_pin_text, organizer_name,
              organizer_desc, suit_tags, important_notes, gallery_urls, target_role, target_gender,
              created_at, updated_at
       FROM events WHERE 1=1${aud.sql} ORDER BY event_id ASC`,
      aud.params
    );
    res.json({ events: r.rows.map(rowToPublicEvent) });
  } catch (e) {
    res.status(500).json({ message: apiErrorMessage(e) });
  }
});

router.get('/:eventKey', optionalAuthMiddleware, async (req, res) => {
  try {
    const id = parseEventPublicId(req.params.eventKey);
    if (!id) return res.status(404).json({ message: 'Событие не найдено' });
    const aud = appendAudienceFilter(req.user, '', 2);
    const r = await pool.query(
      `SELECT event_id, title, kind, filter_cat, category_label, price_key, tf_loc, tf_date, tf_time, tf_mood,
              card_tags, cover_url, hero_url, ticket_url, venue_line, teaser, about_text, duration_label,
              age_label, genre_label, refund_label, venue_image_url, venue_pin_text, organizer_name,
              organizer_desc, suit_tags, important_notes, gallery_urls, target_role, target_gender,
              created_at, updated_at
       FROM events WHERE event_id=$1${aud.sql}`,
      [id, ...aud.params]
    );
    if (r.rows.length === 0) return res.status(404).json({ message: 'Событие не найдено' });
    res.json(rowToPublicEvent(r.rows[0]));
  } catch (e) {
    res.status(500).json({ message: apiErrorMessage(e) });
  }
});

router.post(
  '/',
  authMiddleware,
  adminOnly,
  withUpload([
    { name: 'cover', maxCount: 1 },
    { name: 'hero', maxCount: 1 },
    { name: 'venue_image', maxCount: 1 },
    { name: 'gallery', maxCount: 4 },
  ]),
  async (req, res) => {
    try {
      if (!req.files?.cover?.[0]) {
        return res.status(400).json({ message: 'Загрузите обложку для карточки' });
      }

      const title = String(req.body.title || '').trim();
      if (!title) return res.status(400).json({ message: 'Укажите название события' });

      const parsed = readEventBody(req.body, req.files, null);
      if (parsed.error) return res.status(400).json({ message: parsed.error });

      const galleryFiles = req.files?.gallery || [];
      const gallery_urls = galleryFiles.slice(0, 4).map((f) => `/uploads/${f.filename}`);

      const ins = await pool.query(
        `INSERT INTO events (
          title, kind, filter_cat, category_label, price_key, tf_loc, tf_date, tf_time, tf_mood,
          card_tags, cover_url, hero_url, ticket_url, venue_line, teaser, about_text, duration_label,
          age_label, genre_label, refund_label, venue_image_url, venue_pin_text, organizer_name,
          organizer_desc, suit_tags, important_notes, gallery_urls, target_role, target_gender
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25::jsonb,$26::jsonb,$27::jsonb,$28,$29
        )
        RETURNING event_id, title, kind, filter_cat, category_label, price_key, tf_loc, tf_date, tf_time, tf_mood,
                  card_tags, cover_url, hero_url, ticket_url, venue_line, teaser, about_text, duration_label,
                  age_label, genre_label, refund_label, venue_image_url, venue_pin_text, organizer_name,
                  organizer_desc, suit_tags, important_notes, gallery_urls, target_role, target_gender,
                  created_at, updated_at`,
        [
          title,
          parsed.kind,
          parsed.filter_cat,
          parsed.category_label,
          parsed.price_key,
          parsed.tf_loc,
          parsed.tf_date,
          parsed.tf_time,
          parsed.tf_mood,
          JSON.stringify(parsed.card_tags || buildCardTags(req.body, parsed.kind)),
          parsed.cover_url,
          parsed.hero_url || parsed.cover_url,
          parsed.ticket_url,
          parsed.venue_line,
          parsed.teaser,
          parsed.about_text,
          parsed.duration_label,
          parsed.age_label,
          parsed.genre_label,
          parsed.refund_label,
          parsed.venue_image_url || '',
          parsed.venue_pin_text,
          parsed.organizer_name,
          parsed.organizer_desc,
          parsed.suit_tags,
          parsed.important_notes,
          JSON.stringify(gallery_urls),
          parsed.target_role,
          parsed.target_gender,
        ]
      );

      res.status(201).json(rowToPublicEvent(ins.rows[0]));
    } catch (e) {
      console.error('POST /events', e);
      res.status(500).json({ message: apiErrorMessage(e) });
    }
  }
);

router.patch(
  '/:eventKey',
  authMiddleware,
  adminOnly,
  withUpload([
    { name: 'cover', maxCount: 1 },
    { name: 'hero', maxCount: 1 },
    { name: 'venue_image', maxCount: 1 },
    { name: 'gallery', maxCount: 4 },
  ]),
  async (req, res) => {
    try {
      const id = parseEventPublicId(req.params.eventKey);
      if (!id) return res.status(404).json({ message: 'Событие не найдено' });

      const cur = await pool.query(
        `SELECT * FROM events WHERE event_id=$1`,
        [id]
      );
      if (cur.rows.length === 0) return res.status(404).json({ message: 'Событие не найдено' });
      const existing = cur.rows[0];

      const patch = {};

      if (Object.prototype.hasOwnProperty.call(req.body, 'title')) {
        const title = String(req.body.title || '').trim();
        if (!title) return res.status(400).json({ message: 'Укажите название' });
        patch.title = title;
      }

      const parsed = readEventBody(req.body, req.files, existing);
      if (parsed.error && Object.prototype.hasOwnProperty.call(req.body, 'ticket_url')) {
        return res.status(400).json({ message: parsed.error });
      }

      const scalarKeys = [
        'kind',
        'filter_cat',
        'category_label',
        'price_key',
        'tf_loc',
        'tf_date',
        'tf_time',
        'tf_mood',
        'venue_line',
        'teaser',
        'about_text',
        'duration_label',
        'age_label',
        'genre_label',
        'refund_label',
        'venue_pin_text',
        'organizer_name',
        'organizer_desc',
      ];
      for (const key of scalarKeys) {
        if (Object.prototype.hasOwnProperty.call(req.body, key) || (key === 'kind' && parsed.kind)) {
          if (parsed[key] !== undefined) patch[key] = parsed[key];
        }
      }

      if (parsed.card_tags) {
        patch.card_tags = JSON.stringify(parsed.card_tags);
      }

      if (Object.prototype.hasOwnProperty.call(req.body, 'ticket_url')) {
        patch.ticket_url = parsed.ticket_url;
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'suit_tags')) {
        patch.suit_tags = parsed.suit_tags;
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'important_notes')) {
        patch.important_notes = parsed.important_notes;
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'target_role')) {
        patch.target_role = parsed.target_role;
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'target_gender')) {
        patch.target_gender = parsed.target_gender;
      }

      if (parsed.cover_url) {
        safeUnlinkUploadPath(uploadsAbs, existing.cover_url);
        patch.cover_url = parsed.cover_url;
      }
      if (parsed.hero_url) {
        safeUnlinkUploadPath(uploadsAbs, existing.hero_url);
        patch.hero_url = parsed.hero_url;
      }
      if (parsed.venue_image_url) {
        safeUnlinkUploadPath(uploadsAbs, existing.venue_image_url);
        patch.venue_image_url = parsed.venue_image_url;
      }

      const galleryFiles = req.files?.gallery || [];
      const hasGalleryDirective = Object.prototype.hasOwnProperty.call(req.body, 'keep_gallery_urls');
      if (hasGalleryDirective || galleryFiles.length > 0) {
        const existingGallery = Array.isArray(existing.gallery_urls) ? existing.gallery_urls : [];
        let kept = existingGallery;
        if (hasGalleryDirective) {
          let arr = [];
          try {
            arr = JSON.parse(req.body.keep_gallery_urls || '[]');
          } catch {
            arr = [];
          }
          const set = new Set(existingGallery);
          kept = Array.isArray(arr) ? arr.filter((u) => typeof u === 'string' && set.has(u)) : [];
        }
        const appended = galleryFiles.map((f) => `/uploads/${f.filename}`);
        const nextGallery = [...kept, ...appended].slice(0, 4);
        const removed = existingGallery.filter((u) => !nextGallery.includes(u));
        for (const u of removed) safeUnlinkUploadPath(uploadsAbs, u);
        patch.gallery_urls = JSON.stringify(nextGallery);
      }

      const keys = Object.keys(patch);
      if (keys.length === 0) {
        return res.json(rowToPublicEvent(existing));
      }

      const sets = keys.map((k, i) => `${k}=$${i + 1}`);
      const vals = keys.map((k) => patch[k]);
      vals.push(id);

      const upd = await pool.query(
        `UPDATE events SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE event_id=$${keys.length + 1}
         RETURNING event_id, title, kind, filter_cat, category_label, price_key, tf_loc, tf_date, tf_time, tf_mood,
                   card_tags, cover_url, hero_url, ticket_url, venue_line, teaser, about_text, duration_label,
                   age_label, genre_label, refund_label, venue_image_url, venue_pin_text, organizer_name,
                   organizer_desc, suit_tags, important_notes, gallery_urls, created_at, updated_at`,
        vals
      );

      res.json(rowToPublicEvent(upd.rows[0]));
    } catch (e) {
      console.error('PATCH /events', e);
      res.status(500).json({ message: apiErrorMessage(e) });
    }
  }
);

router.delete('/:eventKey', authMiddleware, adminOnly, async (req, res) => {
  try {
    const id = parseEventPublicId(req.params.eventKey);
    if (!id) return res.status(404).json({ message: 'Событие не найдено' });

    const r = await pool.query(
      `DELETE FROM events WHERE event_id=$1 RETURNING cover_url, hero_url, venue_image_url, gallery_urls`,
      [id]
    );
    if (r.rows.length === 0) return res.status(404).json({ message: 'Событие не найдено' });

    const row = r.rows[0];
    unlinkEventAssets(uploadsAbs, row.cover_url, row.hero_url, row.venue_image_url, row.gallery_urls);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: apiErrorMessage(e) });
  }
});

module.exports = router;

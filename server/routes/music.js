const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../db');
const { authMiddleware, adminOnly, optionalAuthMiddleware } = require('../middleware/auth');
const { pickTargetRole, pickTargetGender, appendAudienceFilter } = require('../utils/audienceTargeting');
const { dbErrorToMessage } = require('../utils/dbErrorToMessage');
const { parseYoutubeUrl } = require('../utils/youtubeUrl');
const { safeUnlinkUploadPath } = require('../utils/meditationUploadCleanup');
const {
  pickKind,
  pickMood,
  pickIcon,
  formatDurationDisplay,
} = require('../utils/musicMoods');
const { moodsForPersonalizationLikes, trackMatchesPersonalMoods } = require('../utils/musicPersonalization');
const {
  parseMusicPublicId: parseTrackPublicId,
  slugifyTitle,
  parsePublicTrackIds,
} = require('../utils/musicCollectionTracks');

const router = express.Router();
const uploadsAbs = path.join(__dirname, '..', 'uploads');

const AUDIO_SOURCES = new Set(['file', 'youtube', 'url']);
const MAX_TRACK_DURATION_MIN = 1440;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsAbs),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || (file.fieldname === 'audio' ? '.mp3' : '.jpg');
    cb(null, `music_${Date.now()}_${Math.random().toString(36).slice(2, 10)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 48 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const name = String(file.originalname || '').toLowerCase();
    if (file.fieldname === 'cover') {
      const byExt = /\.(jpe?g|png|gif|webp|avif|bmp|heic|heif)$/i.test(name);
      const byMime = String(file.mimetype || '').toLowerCase().startsWith('image/');
      if (byMime || byExt) return cb(null, true);
      return cb(new Error('Обложка: только изображения'));
    }
    if (file.fieldname === 'audio') {
      const byExt = /\.(mp3|m4a|wav|ogg|webm|aac|flac)$/i.test(name);
      const byMime = String(file.mimetype || '').toLowerCase().startsWith('audio/');
      if (byMime || byExt) return cb(null, true);
      return cb(new Error('Аудио: MP3, M4A, WAV, OGG и др.'));
    }
    cb(new Error('Неизвестное поле файла'));
  },
});

function apiErrorMessage(e) {
  return dbErrorToMessage(e) || e?.message || 'Ошибка сервера';
}

function parseBool(raw) {
  if (raw === true || raw === 1) return true;
  const s = String(raw ?? '').trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes' || s === 'on';
}

async function loadUserPersonalizationLikes(userId) {
  if (!userId) return [];
  try {
    const r = await pool.query(
      'SELECT daily_personalization_json FROM users WHERE user_id = $1',
      [userId]
    );
    const raw = r.rows[0]?.daily_personalization_json;
    if (!raw) return [];
    const likes = typeof raw === 'object' && raw !== null ? raw.likes : null;
    return Array.isArray(likes) ? likes : [];
  } catch {
    return [];
  }
}

async function clearFeaturedPickExcept(musicDbId) {
  await pool.query(
    `UPDATE music_items SET is_featured_pick = false
     WHERE is_featured_pick = true AND ($1::int IS NULL OR music_id <> $1)`,
    [musicDbId ?? null]
  );
}

function rowToCollection(row, trackIds = []) {
  const ids = Array.isArray(trackIds) ? trackIds : [];
  return {
    id: row.slug,
    slug: row.slug,
    collectionId: row.collection_id,
    title: row.title || row.label_key || '',
    labelKey: row.label_key || '',
    mood: row.mood || 'calm_down',
    image: row.cover_url || '',
    trackIds: ids,
    tracksCount: ids.length,
    isActive: row.is_active !== false,
  };
}

async function loadCollectionTrackMap() {
  const r = await pool.query(
    `SELECT mct.collection_id, mct.music_id, mct.sort_order, mi.kind
     FROM music_collection_tracks mct
     INNER JOIN music_items mi ON mi.music_id = mct.music_id
     WHERE mi.kind = 'track'
     ORDER BY mct.collection_id ASC, mct.sort_order ASC, mct.music_id ASC`
  );
  const byCollection = new Map();
  for (const row of r.rows) {
    if (!byCollection.has(row.collection_id)) byCollection.set(row.collection_id, []);
    byCollection.get(row.collection_id).push(`music-${row.music_id}`);
  }
  return byCollection;
}

async function syncCollectionTracks(collectionId, publicTrackIds) {
  await pool.query(`DELETE FROM music_collection_tracks WHERE collection_id = $1`, [collectionId]);
  const ids = parsePublicTrackIds(publicTrackIds);
  if (!ids.length) return;
  let order = 0;
  for (const pubId of ids) {
    const key = parseTrackPublicId(pubId);
    if (!key) continue;
    await pool.query(
      `INSERT INTO music_collection_tracks (collection_id, music_id, sort_order)
       VALUES ($1, $2, $3)
       ON CONFLICT (collection_id, music_id) DO UPDATE SET sort_order = EXCLUDED.sort_order`,
      [collectionId, key.id, order]
    );
    order += 1;
  }
}

function withUpload(fields) {
  const mw = upload.fields(fields);
  return (req, res, next) => {
    mw(req, res, (err) => {
      if (!err) return next();
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Файл слишком большой (макс. 48 МБ)' });
      }
      return res.status(400).json({ message: err.message || 'Ошибка загрузки файла' });
    });
  };
}

function parseMusicPublicId(param) {
  const s = String(param || '').trim();
  const quick = /^music-quick-(\d+)$/.exec(s);
  if (quick) return { id: parseInt(quick[1], 10), kind: 'quick' };
  const track = /^music-(\d+)$/.exec(s);
  if (track) return { id: parseInt(track[1], 10), kind: 'track' };
  return null;
}

function publicIdForRow(row) {
  const kind = row.kind || 'track';
  return kind === 'quick' ? `music-quick-${row.music_id}` : `music-${row.music_id}`;
}

function rowToPublicMusic(row) {
  const kind = row.kind || 'track';
  const audioSource = row.audio_source || 'youtube';
  let audioUrl = '';
  if (audioSource === 'file') audioUrl = row.audio_file_url || '';
  else if (audioSource === 'url') audioUrl = row.audio_external_url || '';

  const watchUrl =
    row.youtube_video_id
      ? `https://www.youtube.com/watch?v=${row.youtube_video_id}`
      : row.audio_external_url || '';

  return {
    id: publicIdForRow(row),
    musicDbId: row.music_id,
    kind,
    title: row.title,
    artist: row.artist || '',
    mood: row.mood || 'calm',
    genreLabel: row.genre_label || '',
    descriptionShort: row.description_short || '',
    durationMin: Math.max(1, parseInt(row.duration_min, 10) || 3),
    durationShort: row.duration_display || formatDurationDisplay(row.duration_min),
    icon: row.icon_name || 'Music2',
    poster: row.cover_url || '',
    coverImage: row.cover_url || '',
    audioSource,
    audioUrl,
    embedUrl: row.youtube_embed_url || '',
    youtubeVideoId: row.youtube_video_id || '',
    watchUrl,
    hasAudio: Boolean(
      (audioSource === 'file' && row.audio_file_url) ||
        (audioSource === 'url' && row.audio_external_url) ||
        (audioSource === 'youtube' && row.youtube_embed_url)
    ),
    isRemoteMusic: true,
    isFeaturedPick: Boolean(row.is_featured_pick),
    target_role: row.target_role || 'all',
    target_gender: row.target_gender || 'all',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function parseDurationMin(raw) {
  const n = parseInt(String(raw || '').trim(), 10);
  if (Number.isFinite(n) && n >= 1 && n <= MAX_TRACK_DURATION_MIN) return n;
  return 3;
}

function parseAudioPayload(body, files, existingRow) {
  const source = String(body.audio_source || existingRow?.audio_source || 'youtube').trim();
  if (!AUDIO_SOURCES.has(source)) {
    return { error: 'Некорректный тип аудио' };
  }

  const audioFile = files?.audio?.[0];
  const out = { audio_source: source };

  if (source === 'file') {
    if (audioFile) {
      out.audio_file_url = `/uploads/${audioFile.filename}`;
      out.audio_external_url = '';
      out.youtube_embed_url = '';
      out.youtube_video_id = '';
    } else if (existingRow?.audio_file_url) {
      out.audio_file_url = existingRow.audio_file_url;
      out.audio_external_url = '';
      out.youtube_embed_url = '';
      out.youtube_video_id = '';
    } else {
      return { error: 'Загрузите аудиофайл' };
    }
    return out;
  }

  if (source === 'url') {
    const url = String(body.audio_external_url || existingRow?.audio_external_url || '').trim();
    if (!/^https?:\/\//i.test(url)) {
      return { error: 'Укажите ссылку на аудио (http/https)' };
    }
    out.audio_external_url = url;
    out.audio_file_url = '';
    out.youtube_embed_url = '';
    out.youtube_video_id = '';
    return out;
  }

  const ytRaw = String(body.youtube_url || body.audio_external_url || '').trim();
  const parsed = parseYoutubeUrl(ytRaw || existingRow?.youtube_embed_url || '');
  if (!parsed) {
    return { error: 'Укажите корректную ссылку YouTube' };
  }
  out.youtube_embed_url = parsed.embedUrl;
  out.youtube_video_id = parsed.videoId;
  out.audio_external_url = '';
  out.audio_file_url = '';
  return out;
}

router.get('/', optionalAuthMiddleware, async (req, res) => {
  try {
    const aud = appendAudienceFilter(req.user, '', 1);
    const r = await pool.query(
      `SELECT music_id, kind, title, artist, mood, genre_label, description_short, duration_min,
              duration_display, icon_name, cover_url, audio_source, audio_file_url, audio_external_url,
              youtube_embed_url, youtube_video_id, is_featured_pick, target_role, target_gender,
              created_at, updated_at
       FROM music_items WHERE 1=1${aud.sql} ORDER BY music_id ASC`,
      aud.params
    );
    const items = r.rows.map(rowToPublicMusic);
    res.json({
      items,
      tracks: items.filter((i) => i.kind === 'track'),
      quickSounds: items.filter((i) => i.kind === 'quick'),
    });
  } catch (e) {
    res.status(500).json({ message: apiErrorMessage(e) });
  }
});

router.get('/hub', optionalAuthMiddleware, async (req, res) => {
  try {
    const aud = appendAudienceFilter(req.user, '', 1);
    const itemsR = await pool.query(
      `SELECT music_id, kind, title, artist, mood, genre_label, description_short, duration_min,
              duration_display, icon_name, cover_url, audio_source, audio_file_url, audio_external_url,
              youtube_embed_url, youtube_video_id, is_featured_pick, target_role, target_gender,
              created_at, updated_at
       FROM music_items WHERE 1=1${aud.sql} ORDER BY music_id ASC`,
      aud.params
    );
    const collectionsR = await pool.query(
      `SELECT collection_id, slug, title, label_key, mood, cover_url, sort_order, is_active
       FROM music_collections WHERE is_active = true ORDER BY sort_order ASC, collection_id ASC`
    );
    const trackMap = await loadCollectionTrackMap();

    const items = itemsR.rows.map(rowToPublicMusic);
    const tracks = items.filter((i) => i.kind === 'track');

    const collections = collectionsR.rows.map((row) =>
      rowToCollection(row, trackMap.get(row.collection_id) || [])
    );

    const featured =
      tracks.find((t) => t.isFeaturedPick) ||
      tracks[0] ||
      null;

    const likes = await loadUserPersonalizationLikes(req.user?.user_id);
    const personalMoods = moodsForPersonalizationLikes(likes);
    const personalizedTracks =
      personalMoods.length > 0
        ? tracks.filter((tr) => trackMatchesPersonalMoods(tr, personalMoods)).slice(0, 8)
        : [];

    res.json({
      items,
      tracks,
      quickSounds: items.filter((i) => i.kind === 'quick'),
      collections,
      featuredTrackId: featured?.id || null,
      featuredTrack: featured,
      personalizedTracks,
      personalizationLikes: likes,
    });
  } catch (e) {
    res.status(500).json({ message: apiErrorMessage(e) });
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

      const mood = pickMood(req.body.mood, 'calm_down');
      const sort_order = parseInt(req.body.sort_order, 10) || 0;
      const coverFile = req.files?.cover?.[0];
      const cover_url = coverFile ? `/uploads/${coverFile.filename}` : '';

      const ins = await pool.query(
        `INSERT INTO music_collections (slug, title, label_key, mood, cover_url, sort_order, is_active)
         VALUES ($1, $2, '', $3, $4, $5, true)
         RETURNING collection_id, slug, title, label_key, mood, cover_url, sort_order, is_active`,
        ['tmp', title, mood, cover_url, sort_order]
      );
      const row = ins.rows[0];
      const slug = slugifyTitle(title, row.collection_id);
      await pool.query(`UPDATE music_collections SET slug = $1 WHERE collection_id = $2`, [
        slug,
        row.collection_id,
      ]);

      if (Object.prototype.hasOwnProperty.call(req.body, 'track_ids')) {
        await syncCollectionTracks(row.collection_id, req.body.track_ids);
      }

      const trackMap = await loadCollectionTrackMap();
      const full = await pool.query(`SELECT * FROM music_collections WHERE collection_id = $1`, [
        row.collection_id,
      ]);
      res.status(201).json(rowToCollection(full.rows[0], trackMap.get(row.collection_id) || []));
    } catch (e) {
      console.error('POST /music/collections', e);
      res.status(500).json({ message: apiErrorMessage(e) });
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

      const cur = await pool.query(`SELECT * FROM music_collections WHERE slug = $1`, [slug]);
      if (cur.rows.length === 0) return res.status(404).json({ message: 'Подборка не найдена' });

      const existing = cur.rows[0];
      const patch = {};

      if (Object.prototype.hasOwnProperty.call(req.body, 'title')) {
        const title = String(req.body.title || '').trim();
        if (!title) return res.status(400).json({ message: 'Название не может быть пустым' });
        patch.title = title.slice(0, 120);
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'mood')) {
        patch.mood = pickMood(req.body.mood, existing.mood);
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'sort_order')) {
        patch.sort_order = parseInt(req.body.sort_order, 10) || 0;
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'is_active')) {
        patch.is_active = parseBool(req.body.is_active);
      }

      const coverFile = req.files?.cover?.[0];
      if (coverFile) {
        safeUnlinkUploadPath(uploadsAbs, existing.cover_url);
        patch.cover_url = `/uploads/${coverFile.filename}`;
      }

      if (Object.keys(patch).length > 0) {
        const keys = Object.keys(patch);
        const sets = keys.map((k, i) => `${k}=$${i + 1}`);
        const vals = keys.map((k) => patch[k]);
        vals.push(slug);
        await pool.query(
          `UPDATE music_collections SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP
           WHERE slug=$${keys.length + 1}`,
          vals
        );
      }

      if (Object.prototype.hasOwnProperty.call(req.body, 'track_ids')) {
        await syncCollectionTracks(existing.collection_id, req.body.track_ids);
      }

      const trackMap = await loadCollectionTrackMap();
      const full = await pool.query(`SELECT * FROM music_collections WHERE collection_id = $1`, [
        existing.collection_id,
      ]);
      res.json(rowToCollection(full.rows[0], trackMap.get(existing.collection_id) || []));
    } catch (e) {
      console.error('PATCH /music/collections/:slug', e);
      res.status(500).json({ message: apiErrorMessage(e) });
    }
  }
);

router.delete('/collections/:slug', authMiddleware, adminOnly, async (req, res) => {
  try {
    const slug = String(req.params.slug || '').trim();
    const cur = await pool.query(
      `DELETE FROM music_collections WHERE slug = $1 RETURNING cover_url`,
      [slug]
    );
    if (cur.rows.length === 0) return res.status(404).json({ message: 'Подборка не найдена' });
    safeUnlinkUploadPath(uploadsAbs, cur.rows[0].cover_url);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: apiErrorMessage(e) });
  }
});

router.get('/:musicKey', optionalAuthMiddleware, async (req, res) => {
  try {
    const key = parseMusicPublicId(req.params.musicKey);
    if (!key) return res.status(404).json({ message: 'Трек не найден' });
    const aud = appendAudienceFilter(req.user, '', 2);
    const r = await pool.query(
      `SELECT music_id, kind, title, artist, mood, genre_label, description_short, duration_min,
              duration_display, icon_name, cover_url, audio_source, audio_file_url, audio_external_url,
              youtube_embed_url, youtube_video_id, is_featured_pick, target_role, target_gender,
              created_at, updated_at
       FROM music_items WHERE music_id=$1${aud.sql}`,
      [key.id, ...aud.params]
    );
    if (r.rows.length === 0 || r.rows[0].kind !== key.kind) {
      return res.status(404).json({ message: 'Трек не найден' });
    }
    res.json(rowToPublicMusic(r.rows[0]));
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
    { name: 'audio', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const coverFile = req.files?.cover?.[0];
      if (!coverFile) return res.status(400).json({ message: 'Загрузите обложку' });

      const title = String(req.body.title || '').trim();
      if (!title) return res.status(400).json({ message: 'Укажите название' });

      const kind = pickKind(req.body.kind, null);
      const mood = pickMood(req.body.mood);
      const duration_min = parseDurationMin(req.body.duration_min);
      const duration_display =
        String(req.body.duration_display || '').trim() || formatDurationDisplay(duration_min);

      const audio = parseAudioPayload(req.body, req.files, null);
      if (audio.error) return res.status(400).json({ message: audio.error });

      const target_role = pickTargetRole(req.body.target_role);
      const target_gender = pickTargetGender(req.body.target_gender);
      const is_featured_pick =
        kind === 'track' ? parseBool(req.body.is_featured_pick) : false;

      if (is_featured_pick) await clearFeaturedPickExcept(null);

      const ins = await pool.query(
        `INSERT INTO music_items (
          kind, title, artist, mood, genre_label, description_short, duration_min, duration_display,
          icon_name, cover_url, audio_source, audio_file_url, audio_external_url,
          youtube_embed_url, youtube_video_id, is_featured_pick, target_role, target_gender
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
        RETURNING music_id, kind, title, artist, mood, genre_label, description_short, duration_min,
                  duration_display, icon_name, cover_url, audio_source, audio_file_url, audio_external_url,
                  youtube_embed_url, youtube_video_id, is_featured_pick, target_role, target_gender,
                  created_at, updated_at`,
        [
          kind,
          title,
          kind === 'track' ? String(req.body.artist || '').trim().slice(0, 180) : '',
          mood,
          String(req.body.genre_label || '').trim().slice(0, 120),
          String(req.body.description_short ?? '').trim(),
          duration_min,
          duration_display,
          kind === 'quick' ? pickIcon(req.body.icon_name) : 'Music2',
          `/uploads/${coverFile.filename}`,
          audio.audio_source,
          audio.audio_file_url || '',
          audio.audio_external_url || '',
          audio.youtube_embed_url || '',
          audio.youtube_video_id || '',
          is_featured_pick,
          target_role,
          target_gender,
        ]
      );

      res.status(201).json(rowToPublicMusic(ins.rows[0]));
    } catch (e) {
      console.error('POST /music', e);
      res.status(500).json({ message: apiErrorMessage(e) });
    }
  }
);

router.patch(
  '/:musicKey',
  authMiddleware,
  adminOnly,
  withUpload([
    { name: 'cover', maxCount: 1 },
    { name: 'audio', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const key = parseMusicPublicId(req.params.musicKey);
      if (!key) return res.status(404).json({ message: 'Трек не найден' });

      const cur = await pool.query(`SELECT * FROM music_items WHERE music_id=$1`, [key.id]);
      if (cur.rows.length === 0 || cur.rows[0].kind !== key.kind) {
        return res.status(404).json({ message: 'Трек не найден' });
      }
      const existing = cur.rows[0];
      const patch = {};

      if (Object.prototype.hasOwnProperty.call(req.body, 'title')) {
        const title = String(req.body.title || '').trim();
        if (!title) return res.status(400).json({ message: 'Укажите название' });
        patch.title = title;
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'artist')) {
        patch.artist = String(req.body.artist ?? '').trim().slice(0, 180);
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'mood')) {
        patch.mood = pickMood(req.body.mood, existing.mood);
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'genre_label')) {
        patch.genre_label = String(req.body.genre_label ?? '').trim().slice(0, 120);
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'description_short')) {
        patch.description_short = String(req.body.description_short ?? '').trim();
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'duration_min')) {
        const duration_min = parseDurationMin(req.body.duration_min);
        patch.duration_min = duration_min;
        patch.duration_display = formatDurationDisplay(duration_min);
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'icon_name') && existing.kind === 'quick') {
        patch.icon_name = pickIcon(req.body.icon_name);
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'target_role')) {
        patch.target_role = pickTargetRole(req.body.target_role);
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'target_gender')) {
        patch.target_gender = pickTargetGender(req.body.target_gender);
      }
      if (
        existing.kind === 'track' &&
        Object.prototype.hasOwnProperty.call(req.body, 'is_featured_pick')
      ) {
        patch.is_featured_pick = parseBool(req.body.is_featured_pick);
        if (patch.is_featured_pick) await clearFeaturedPickExcept(existing.music_id);
      }

      const coverFile = req.files?.cover?.[0];
      if (coverFile) {
        safeUnlinkUploadPath(uploadsAbs, existing.cover_url);
        patch.cover_url = `/uploads/${coverFile.filename}`;
      }

      const audioTouched =
        Object.prototype.hasOwnProperty.call(req.body, 'audio_source') ||
        Object.prototype.hasOwnProperty.call(req.body, 'youtube_url') ||
        Object.prototype.hasOwnProperty.call(req.body, 'audio_external_url') ||
        req.files?.audio?.[0];

      if (audioTouched) {
        const audio = parseAudioPayload(req.body, req.files, existing);
        if (audio.error) return res.status(400).json({ message: audio.error });
        if (audio.audio_file_url && audio.audio_file_url !== existing.audio_file_url) {
          safeUnlinkUploadPath(uploadsAbs, existing.audio_file_url);
        }
        Object.assign(patch, {
          audio_source: audio.audio_source,
          audio_file_url: audio.audio_file_url || '',
          audio_external_url: audio.audio_external_url || '',
          youtube_embed_url: audio.youtube_embed_url || '',
          youtube_video_id: audio.youtube_video_id || '',
        });
      }

      const keys = Object.keys(patch);
      if (keys.length === 0) {
        return res.json(rowToPublicMusic(existing));
      }

      const sets = keys.map((k, i) => `${k}=$${i + 1}`);
      const vals = keys.map((k) => patch[k]);
      vals.push(key.id);

      const upd = await pool.query(
        `UPDATE music_items SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE music_id=$${keys.length + 1}
         RETURNING music_id, kind, title, artist, mood, genre_label, description_short, duration_min,
                   duration_display, icon_name, cover_url, audio_source, audio_file_url, audio_external_url,
                   youtube_embed_url, youtube_video_id, is_featured_pick, target_role, target_gender,
                   created_at, updated_at`,
        vals
      );

      res.json(rowToPublicMusic(upd.rows[0]));
    } catch (e) {
      console.error('PATCH /music', e);
      res.status(500).json({ message: apiErrorMessage(e) });
    }
  }
);

router.delete('/:musicKey', authMiddleware, adminOnly, async (req, res) => {
  try {
    const key = parseMusicPublicId(req.params.musicKey);
    if (!key) return res.status(404).json({ message: 'Трек не найден' });

    const r = await pool.query(
      `DELETE FROM music_items WHERE music_id=$1 RETURNING cover_url, audio_file_url, kind`,
      [key.id]
    );
    if (r.rows.length === 0 || r.rows[0].kind !== key.kind) {
      return res.status(404).json({ message: 'Трек не найден' });
    }

    safeUnlinkUploadPath(uploadsAbs, r.rows[0].cover_url);
    safeUnlinkUploadPath(uploadsAbs, r.rows[0].audio_file_url);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: apiErrorMessage(e) });
  }
});

module.exports = router;

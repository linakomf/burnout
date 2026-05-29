const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../db');
const { authMiddleware, adminOnly, optionalAuthMiddleware } = require('../middleware/auth');
const { pickTargetRole, pickTargetGender, appendAudienceFilter } = require('../utils/audienceTargeting');
const { dbErrorToMessage } = require('../utils/dbErrorToMessage');
const { sanitizeTopics, KINDS, DIFFICULTY, AUDIO_SOURCES } = require('../utils/meditationTopics');
const { parseYoutubeUrl } = require('../utils/youtubeUrl');
const { unlinkMeditationAssets, safeUnlinkUploadPath } = require('../utils/meditationUploadCleanup');
const { resolveMediaUrl } = require('../utils/resolveMediaUrl');
const { publicUploadPath } = require('../utils/mirrorUpload');

const router = express.Router();
const { getUploadsDir } = require('../utils/uploadsDir');
const uploadsAbs = getUploadsDir();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsAbs),
  filename: (req, file, cb) => {
    const ext =
      path.extname(file.originalname) ||
      (file.fieldname === 'audio' ? '.mp3' : String(file.mimetype || '').toLowerCase().startsWith('video/') ? '.mp4' : '.jpg');
    cb(null, `meditation_${Date.now()}_${Math.random().toString(36).slice(2, 10)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 48 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const name = String(file.originalname || '').toLowerCase();
    if (file.fieldname === 'cover') {
      const mime = String(file.mimetype || '').toLowerCase();
      const byExt = /\.(jpe?g|png|gif|webp|avif|bmp|heic|heif|mp4)$/i.test(name);
      const byMime = mime.startsWith('image/') || mime === 'video/mp4';
      if (byMime || byExt) return cb(null, true);
      return cb(new Error('Обложка: изображения или MP4'));
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

function parseMeditationPublicId(param) {
  const m = /^meditation-(\d+)$/.exec(String(param || '').trim());
  return m ? parseInt(m[1], 10) : null;
}

function rowToPublicMeditation(row) {
  const topics = Array.isArray(row.topics) ? row.topics : [];
  const audioSource = row.audio_source || 'youtube';
  let audioUrl = '';
  if (audioSource === 'file') audioUrl = row.audio_file_url || '';
  else if (audioSource === 'url') audioUrl = row.audio_external_url || '';

  return {
    id: `meditation-${row.meditation_id}`,
    meditationDbId: row.meditation_id,
    title: row.title,
    kind: row.kind || 'meditation',
    meditationTopics: topics,
    coverImage: resolveMediaUrl(row.cover_url),
    description: row.description_short || '',
    durationMin: Math.max(1, parseInt(row.duration_min, 10) || 10),
    format: row.practice_focus || '',
    mood: row.practice_focus || '',
    difficultyLevel: row.difficulty_level || 'beginner',
    tipBefore: row.tip_before || '',
    audioSource,
    audioUrl,
    embedUrl: row.youtube_embed_url || '',
    youtubeVideoId: row.youtube_video_id || '',
    category: 'focus',
    playLabel: row.kind === 'sound' ? 'Слушать' : 'Начать',
    hasAudio: Boolean(
      (audioSource === 'file' && row.audio_file_url) ||
        (audioSource === 'url' && row.audio_external_url) ||
        (audioSource === 'youtube' && row.youtube_embed_url)
    ),
    isRemoteMeditation: true,
    target_role: row.target_role || 'all',
    target_gender: row.target_gender || 'all',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function parseDurationMin(raw) {
  const n = parseInt(String(raw || '').trim(), 10);
  if (Number.isFinite(n) && n >= 1 && n <= 180) return n;
  return 10;
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
      out.audio_file_url = publicUploadPath(audioFile);
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
      `SELECT meditation_id, title, kind, topics, cover_url, description_short, duration_min,
              practice_focus, difficulty_level, tip_before, audio_source, audio_file_url,
              audio_external_url, youtube_embed_url, youtube_video_id, target_role, target_gender,
              created_at, updated_at
       FROM meditations WHERE 1=1${aud.sql} ORDER BY meditation_id ASC`,
      aud.params
    );
    res.json({ meditations: r.rows.map(rowToPublicMeditation) });
  } catch (e) {
    res.status(500).json({ message: apiErrorMessage(e) });
  }
});

router.get('/:meditationKey', optionalAuthMiddleware, async (req, res) => {
  try {
    const id = parseMeditationPublicId(req.params.meditationKey);
    if (!id) return res.status(404).json({ message: 'Медитация не найдена' });
    const aud = appendAudienceFilter(req.user, '', 2);
    const r = await pool.query(
      `SELECT meditation_id, title, kind, topics, cover_url, description_short, duration_min,
              practice_focus, difficulty_level, tip_before, audio_source, audio_file_url,
              audio_external_url, youtube_embed_url, youtube_video_id, target_role, target_gender,
              created_at, updated_at
       FROM meditations WHERE meditation_id=$1${aud.sql}`,
      [id, ...aud.params]
    );
    if (r.rows.length === 0) return res.status(404).json({ message: 'Медитация не найдена' });
    res.json(rowToPublicMeditation(r.rows[0]));
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
      if (!coverFile) {
        return res.status(400).json({ message: 'Загрузите обложку' });
      }

      const title = String(req.body.title || '').trim();
      if (!title) return res.status(400).json({ message: 'Укажите название' });

      let kind = String(req.body.kind || 'meditation').trim();
      if (!KINDS.has(kind)) kind = 'meditation';

      const topics = sanitizeTopics(req.body.topics, kind);
      const description_short = String(req.body.description_short ?? '').trim();
      const duration_min = parseDurationMin(req.body.duration_min);
      const practice_focus = String(req.body.practice_focus ?? '').trim().slice(0, 120);

      let difficulty_level = String(req.body.difficulty_level || 'beginner').trim();
      if (!DIFFICULTY.has(difficulty_level)) difficulty_level = 'beginner';

      const tip_before = kind === 'sound' ? String(req.body.tip_before ?? '').trim().slice(0, 2000) : String(req.body.tip_before ?? '').trim().slice(0, 2000);

      const audio = parseAudioPayload(req.body, req.files, null);
      if (audio.error) return res.status(400).json({ message: audio.error });

      const target_role = pickTargetRole(req.body.target_role);
      const target_gender = pickTargetGender(req.body.target_gender);

      const ins = await pool.query(
        `INSERT INTO meditations (
          title, kind, topics, cover_url, description_short, duration_min, practice_focus,
          difficulty_level, tip_before, audio_source, audio_file_url, audio_external_url,
          youtube_embed_url, youtube_video_id, target_role, target_gender
        ) VALUES ($1,$2,$3::jsonb,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        RETURNING meditation_id, title, kind, topics, cover_url, description_short, duration_min,
                  practice_focus, difficulty_level, tip_before, audio_source, audio_file_url,
                  audio_external_url, youtube_embed_url, youtube_video_id, target_role, target_gender,
                  created_at, updated_at`,
        [
          title,
          kind,
          JSON.stringify(topics),
          publicUploadPath(coverFile),
          description_short,
          duration_min,
          practice_focus,
          difficulty_level,
          tip_before,
          audio.audio_source,
          audio.audio_file_url || '',
          audio.audio_external_url || '',
          audio.youtube_embed_url || '',
          audio.youtube_video_id || '',
          target_role,
          target_gender,
        ]
      );

      res.status(201).json(rowToPublicMeditation(ins.rows[0]));
    } catch (e) {
      console.error('POST /meditations', e);
      res.status(500).json({ message: apiErrorMessage(e) });
    }
  }
);

router.patch(
  '/:meditationKey',
  authMiddleware,
  adminOnly,
  withUpload([
    { name: 'cover', maxCount: 1 },
    { name: 'audio', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const id = parseMeditationPublicId(req.params.meditationKey);
      if (!id) return res.status(404).json({ message: 'Медитация не найдена' });

      const cur = await pool.query(
        `SELECT meditation_id, cover_url, audio_file_url, kind, audio_source,
                audio_external_url, youtube_embed_url, youtube_video_id
         FROM meditations WHERE meditation_id=$1`,
        [id]
      );
      if (cur.rows.length === 0) return res.status(404).json({ message: 'Медитация не найдена' });
      const existing = cur.rows[0];
      const patch = {};

      if (Object.prototype.hasOwnProperty.call(req.body, 'title')) {
        const title = String(req.body.title || '').trim();
        if (!title) return res.status(400).json({ message: 'Укажите название' });
        patch.title = title;
      }

      let kind = existing.kind;
      if (Object.prototype.hasOwnProperty.call(req.body, 'kind')) {
        kind = String(req.body.kind || 'meditation').trim();
        if (!KINDS.has(kind)) kind = 'meditation';
        patch.kind = kind;
      }

      if (Object.prototype.hasOwnProperty.call(req.body, 'topics') || Object.prototype.hasOwnProperty.call(req.body, 'kind')) {
        patch.topics = JSON.stringify(sanitizeTopics(req.body.topics, kind));
      }

      if (Object.prototype.hasOwnProperty.call(req.body, 'description_short')) {
        patch.description_short = String(req.body.description_short ?? '').trim();
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'duration_min')) {
        patch.duration_min = parseDurationMin(req.body.duration_min);
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'practice_focus')) {
        patch.practice_focus = String(req.body.practice_focus ?? '').trim().slice(0, 120);
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'difficulty_level')) {
        let difficulty_level = String(req.body.difficulty_level || 'beginner').trim();
        if (!DIFFICULTY.has(difficulty_level)) difficulty_level = 'beginner';
        patch.difficulty_level = difficulty_level;
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'tip_before')) {
        patch.tip_before = String(req.body.tip_before ?? '').trim().slice(0, 2000);
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'target_role')) {
        patch.target_role = pickTargetRole(req.body.target_role);
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'target_gender')) {
        patch.target_gender = pickTargetGender(req.body.target_gender);
      }

      const coverFile = req.files?.cover?.[0];
      if (coverFile) {
        safeUnlinkUploadPath(uploadsAbs, existing.cover_url);
        patch.cover_url = publicUploadPath(coverFile);
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
        const full = await pool.query(
          `SELECT meditation_id, title, kind, topics, cover_url, description_short, duration_min,
                  practice_focus, difficulty_level, tip_before, audio_source, audio_file_url,
                  audio_external_url, youtube_embed_url, youtube_video_id, created_at, updated_at
           FROM meditations WHERE meditation_id=$1`,
          [id]
        );
        return res.json(rowToPublicMeditation(full.rows[0]));
      }

      const sets = keys.map((k, i) => `${k}=$${i + 1}`);
      const vals = keys.map((k) => patch[k]);
      vals.push(id);

      const upd = await pool.query(
        `UPDATE meditations SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE meditation_id=$${keys.length + 1}
         RETURNING meditation_id, title, kind, topics, cover_url, description_short, duration_min,
                   practice_focus, difficulty_level, tip_before, audio_source, audio_file_url,
                   audio_external_url, youtube_embed_url, youtube_video_id, created_at, updated_at`,
        vals
      );

      res.json(rowToPublicMeditation(upd.rows[0]));
    } catch (e) {
      console.error('PATCH /meditations', e);
      res.status(500).json({ message: apiErrorMessage(e) });
    }
  }
);

router.delete('/:meditationKey', authMiddleware, adminOnly, async (req, res) => {
  try {
    const id = parseMeditationPublicId(req.params.meditationKey);
    if (!id) return res.status(404).json({ message: 'Медитация не найдена' });

    const r = await pool.query(
      `DELETE FROM meditations WHERE meditation_id=$1 RETURNING cover_url, audio_file_url`,
      [id]
    );
    if (r.rows.length === 0) return res.status(404).json({ message: 'Медитация не найдена' });

    unlinkMeditationAssets(uploadsAbs, r.rows[0].cover_url, r.rows[0].audio_file_url);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: apiErrorMessage(e) });
  }
});

module.exports = router;

const express = require('express');
const pool = require('../db');
const { authMiddleware, adminOnly, optionalAuthMiddleware } = require('../middleware/auth');
const { pickTargetRole, pickTargetGender, appendAudienceFilter } = require('../utils/audienceTargeting');
const { dbErrorToMessage } = require('../utils/dbErrorToMessage');
const { parseYoutubeUrl } = require('../utils/youtubeUrl');
const { safeUnlinkUploadPath } = require('../utils/meditationUploadCleanup');
const {
  pickTopic,
  formatDurationDisplay,
  parseDurationMin,
  parseBool,
} = require('../utils/podcastTopics');
const {
  normalizePodcastTags,
  parsePodcastTagsField,
  legacyTopicFromTags,
} = require('../utils/podcastTagWhitelist');
const {
  requirePublicImagePath,
  normalizePublicMediaPath,
  getPublicUploadsDir,
} = require('../utils/publicMediaPath');

const router = express.Router();
const uploadsAbs = getPublicUploadsDir();

const AUDIO_SOURCES = new Set(['file', 'youtube', 'url']);

function apiErrorMessage(e) {
  return dbErrorToMessage(e) || e?.message || 'Ошибка сервера';
}

function parsePodcastPublicId(param) {
  const m = /^podcast-(\d+)$/.exec(String(param || '').trim());
  return m ? parseInt(m[1], 10) : null;
}

function rowToPublicPodcast(row) {
  const audioSource = row.audio_source || 'youtube';
  let audioUrl = '';
  if (audioSource === 'file') audioUrl = row.audio_file_url || '';
  else if (audioSource === 'url') audioUrl = row.audio_external_url || '';

  const watchUrl =
    row.youtube_video_id
      ? `https://www.youtube.com/watch?v=${row.youtube_video_id}`
      : row.audio_external_url || '';

  const durationMin = Math.max(1, parseInt(row.duration_min, 10) || 24);
  const durationDisplay = row.duration_display || formatDurationDisplay(durationMin);
  const tags = normalizePodcastTags(row.tags);

  return {
    id: `podcast-${row.podcast_id}`,
    podcastDbId: row.podcast_id,
    title: row.title,
    showName: row.show_name || '',
    descriptionShort: row.description_short || '',
    metaLine: row.meta_line || '',
    topic: row.topic || legacyTopicFromTags(tags) || 'psych',
    tags,
    episodeNum: Math.max(1, parseInt(row.episode_num, 10) || 1),
    durationMin,
    duration: durationDisplay,
    totalDisplay: durationDisplay,
    progressDisplay: '0:00',
    isFeaturedPick: Boolean(row.is_featured_pick),
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
    isRemotePodcast: true,
    target_role: row.target_role || 'all',
    target_gender: row.target_gender || 'all',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function parseAudioPayload(body, existingRow) {
  const source = String(body.audio_source || existingRow?.audio_source || 'youtube').trim();
  if (!AUDIO_SOURCES.has(source)) {
    return { error: 'Некорректный тип аудио' };
  }

  const out = { audio_source: source };

  if (source === 'file') {
    const fromBody = normalizePublicMediaPath(body.audio_file_url);
    if (fromBody) {
      out.audio_file_url = fromBody;
      out.audio_external_url = '';
      out.youtube_embed_url = '';
      out.youtube_video_id = '';
      return out;
    }
    if (existingRow?.audio_file_url) {
      out.audio_file_url = existingRow.audio_file_url;
      out.audio_external_url = '';
      out.youtube_embed_url = '';
      out.youtube_video_id = '';
      return out;
    }
    return { error: 'Укажите путь к аудио /uploads/file.mp3' };
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
      `SELECT podcast_id, title, show_name, description_short, meta_line, topic, tags, episode_num,
              duration_min, duration_display, is_featured_pick, cover_url, audio_source,
              audio_file_url, audio_external_url, youtube_embed_url, youtube_video_id,
              target_role, target_gender, created_at, updated_at
       FROM podcast_episodes WHERE 1=1${aud.sql} ORDER BY podcast_id ASC`,
      aud.params
    );
    res.json({ episodes: r.rows.map(rowToPublicPodcast) });
  } catch (e) {
    res.status(500).json({ message: apiErrorMessage(e) });
  }
});

router.get('/:podcastKey', optionalAuthMiddleware, async (req, res) => {
  try {
    const id = parsePodcastPublicId(req.params.podcastKey);
    if (!id) return res.status(404).json({ message: 'Выпуск не найден' });
    const aud = appendAudienceFilter(req.user, '', 2);
    const r = await pool.query(
      `SELECT podcast_id, title, show_name, description_short, meta_line, topic, tags, episode_num,
              duration_min, duration_display, is_featured_pick, cover_url, audio_source,
              audio_file_url, audio_external_url, youtube_embed_url, youtube_video_id,
              target_role, target_gender, created_at, updated_at
       FROM podcast_episodes WHERE podcast_id=$1${aud.sql}`,
      [id, ...aud.params]
    );
    if (r.rows.length === 0) return res.status(404).json({ message: 'Выпуск не найден' });
    res.json(rowToPublicPodcast(r.rows[0]));
  } catch (e) {
    res.status(500).json({ message: apiErrorMessage(e) });
  }
});

router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const coverImg = requirePublicImagePath(req.body, 'cover_url', {
      required: true,
      label: 'обложку',
    });
    if (coverImg.error) return res.status(400).json({ message: coverImg.error });

    const title = String(req.body.title || '').trim();
    if (!title) return res.status(400).json({ message: 'Укажите название выпуска' });

    const audio = parseAudioPayload(req.body, null);
    if (audio.error) return res.status(400).json({ message: audio.error });

    const duration_min = parseDurationMin(req.body.duration_min);
    const duration_display =
      String(req.body.duration_display || '').trim() || formatDurationDisplay(duration_min);
    const tags = parsePodcastTagsField(req.body.tags);
    const topic = legacyTopicFromTags(tags);
    const target_role = pickTargetRole(req.body.target_role);
    const target_gender = pickTargetGender(req.body.target_gender);

    const ins = await pool.query(
      `INSERT INTO podcast_episodes (
        title, show_name, description_short, meta_line, topic, tags, episode_num, duration_min,
        duration_display, is_featured_pick, cover_url, audio_source, audio_file_url,
        audio_external_url, youtube_embed_url, youtube_video_id, target_role, target_gender
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING podcast_id, title, show_name, description_short, meta_line, topic, tags, episode_num,
                duration_min, duration_display, is_featured_pick, cover_url, audio_source,
                audio_file_url, audio_external_url, youtube_embed_url, youtube_video_id,
                target_role, target_gender, created_at, updated_at`,
      [
        title,
        String(req.body.show_name || '').trim().slice(0, 180),
        String(req.body.description_short ?? '').trim(),
        String(req.body.meta_line ?? '').trim().slice(0, 255),
        pickTopic(topic),
        JSON.stringify(tags),
        Math.max(1, parseInt(req.body.episode_num, 10) || 1),
        duration_min,
        duration_display,
        parseBool(req.body.is_featured_pick),
        coverImg.path,
        audio.audio_source,
        audio.audio_file_url || '',
        audio.audio_external_url || '',
        audio.youtube_embed_url || '',
        audio.youtube_video_id || '',
        target_role,
        target_gender,
      ]
    );

    res.status(201).json(rowToPublicPodcast(ins.rows[0]));
  } catch (e) {
    console.error('POST /podcasts', e);
    res.status(500).json({ message: apiErrorMessage(e) });
  }
});

router.patch('/:podcastKey', authMiddleware, adminOnly, async (req, res) => {
  try {
    const id = parsePodcastPublicId(req.params.podcastKey);
    if (!id) return res.status(404).json({ message: 'Выпуск не найден' });

    const cur = await pool.query(`SELECT * FROM podcast_episodes WHERE podcast_id=$1`, [id]);
    if (cur.rows.length === 0) return res.status(404).json({ message: 'Выпуск не найден' });
    const existing = cur.rows[0];
    const patch = {};

    if (Object.prototype.hasOwnProperty.call(req.body, 'title')) {
      const title = String(req.body.title || '').trim();
      if (!title) return res.status(400).json({ message: 'Укажите название' });
      patch.title = title;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'show_name')) {
      patch.show_name = String(req.body.show_name ?? '').trim().slice(0, 180);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'description_short')) {
      patch.description_short = String(req.body.description_short ?? '').trim();
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'meta_line')) {
      patch.meta_line = String(req.body.meta_line ?? '').trim().slice(0, 255);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'tags')) {
      const tags = parsePodcastTagsField(req.body.tags);
      patch.tags = JSON.stringify(tags);
      patch.topic = pickTopic(legacyTopicFromTags(tags), existing.topic);
    } else if (Object.prototype.hasOwnProperty.call(req.body, 'topic')) {
      patch.topic = pickTopic(req.body.topic, existing.topic);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'target_role')) {
      patch.target_role = pickTargetRole(req.body.target_role);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'target_gender')) {
      patch.target_gender = pickTargetGender(req.body.target_gender);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'episode_num')) {
      patch.episode_num = Math.max(1, parseInt(req.body.episode_num, 10) || 1);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'duration_min')) {
      const duration_min = parseDurationMin(req.body.duration_min);
      patch.duration_min = duration_min;
      patch.duration_display = formatDurationDisplay(duration_min);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'is_featured_pick')) {
      patch.is_featured_pick = parseBool(req.body.is_featured_pick);
    }

    const coverImg = requirePublicImagePath(req.body, 'cover_url', { label: 'обложку' });
    if (coverImg.error) return res.status(400).json({ message: coverImg.error });
    if (coverImg.path) {
      safeUnlinkUploadPath(uploadsAbs, existing.cover_url);
      patch.cover_url = coverImg.path;
    }

    const audioTouched =
      Object.prototype.hasOwnProperty.call(req.body, 'audio_source') ||
      Object.prototype.hasOwnProperty.call(req.body, 'youtube_url') ||
      Object.prototype.hasOwnProperty.call(req.body, 'audio_external_url') ||
      Object.prototype.hasOwnProperty.call(req.body, 'audio_file_url');

    if (audioTouched) {
      const audio = parseAudioPayload(req.body, existing);
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
      return res.json(rowToPublicPodcast(existing));
    }

    const sets = keys.map((k, i) => `${k}=$${i + 1}`);
    const vals = keys.map((k) => patch[k]);
    vals.push(id);

    const upd = await pool.query(
      `UPDATE podcast_episodes SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE podcast_id=$${keys.length + 1}
       RETURNING podcast_id, title, show_name, description_short, meta_line, topic, tags, episode_num,
                 duration_min, duration_display, is_featured_pick, cover_url, audio_source,
                 audio_file_url, audio_external_url, youtube_embed_url, youtube_video_id,
                 created_at, updated_at`,
      vals
    );

    res.json(rowToPublicPodcast(upd.rows[0]));
  } catch (e) {
    console.error('PATCH /podcasts', e);
    res.status(500).json({ message: apiErrorMessage(e) });
  }
});

router.delete('/:podcastKey', authMiddleware, adminOnly, async (req, res) => {
  try {
    const id = parsePodcastPublicId(req.params.podcastKey);
    if (!id) return res.status(404).json({ message: 'Выпуск не найден' });

    const r = await pool.query(
      `DELETE FROM podcast_episodes WHERE podcast_id=$1 RETURNING cover_url, audio_file_url`,
      [id]
    );
    if (r.rows.length === 0) return res.status(404).json({ message: 'Выпуск не найден' });

    safeUnlinkUploadPath(uploadsAbs, r.rows[0].cover_url);
    safeUnlinkUploadPath(uploadsAbs, r.rows[0].audio_file_url);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: apiErrorMessage(e) });
  }
});

module.exports = router;

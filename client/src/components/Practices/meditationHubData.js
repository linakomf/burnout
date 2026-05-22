import { backendPublicUrl } from '../../utils/assetUrl';

/** Как MEDITATION_FILTERS в Practices.jsx (без «all»). */
export const MEDITATION_TOPIC_OPTIONS = [
  { id: 'anxiety', labelKey: 'meditationFilterAnxiety' },
  { id: 'sleep', labelKey: 'meditationFilterSleep' },
  { id: 'recovery', labelKey: 'meditationFilterRecovery' },
  { id: 'focus', labelKey: 'meditationFilterFocus' },
  { id: 'sounds', labelKey: 'meditationFilterSounds' },
];

export const MEDITATION_TOPIC_IDS = MEDITATION_TOPIC_OPTIONS.map((o) => o.id);

export const MEDITATION_KIND_OPTIONS = [
  { id: 'meditation', label: 'Медитация' },
  { id: 'sound', label: 'Звук' },
];

export const MEDITATION_DIFFICULTY_OPTIONS = [
  { id: 'beginner', labelKey: 'meditationModalLevelBeginner' },
  { id: 'intermediate', labelKey: 'meditationModalLevelIntermediate' },
  { id: 'advanced', labelKey: 'meditationModalLevelAdvanced' },
];

export const MEDITATION_AUDIO_SOURCE_OPTIONS = [
  { id: 'file', label: 'Аудиофайл' },
  { id: 'youtube', label: 'YouTube (только звук)' },
  { id: 'url', label: 'Ссылка на аудио' },
];

export const MEDITATION_LEVEL_LABEL_KEYS = {
  beginner: 'meditationModalLevelBeginner',
  intermediate: 'meditationModalLevelIntermediate',
  advanced: 'meditationModalLevelAdvanced',
};

export function practiceHasPlayableAudio(practice) {
  if (!practice) return false;
  if (practice.embedUrl || practice.audioUrl) return true;
  if (practice.audioSource === 'youtube' && practice.youtubeVideoId) return true;
  return Boolean(practice.hasAudio);
}

export function mapRemoteMeditationPayload(row) {
  const audioUrlRaw = row.audioUrl || '';
  const cover = backendPublicUrl(row.coverImage || row.cover_url || '');
  const audioUrl =
    row.audioSource === 'file' ? backendPublicUrl(audioUrlRaw) : audioUrlRaw;

  return {
    ...row,
    coverImage: cover,
    audioUrl,
    steps: row.steps || [],
    hasAudio: practiceHasPlayableAudio({ ...row, audioUrl, coverImage: cover }),
  };
}



const KINDS = new Set(['track', 'quick']);

const MOODS = new Set([
  'tired',
  'calm_down',
  'distract',
  'concentration',
  'rest',
  'anxious',
  'recovery',
  'motivation',
  'evening',
  'morning',
  
  'calm',
  'focus',
  'sleep',
  'mood',
]);

const QUICK_ICONS = new Set([
  'CloudRain',
  'Waves',
  'Trees',
  'Wind',
  'Radio',
  'Music',
  'Flame',
  'Bird',
]);
const MAX_TRACK_DURATION_MIN = 1440;

function pickMood(raw, fallback = 'calm_down') {
  const v = String(raw || '').trim();
  return MOODS.has(v) ? v : fallback;
}

function pickKind(raw, existing) {
  const v = String(raw || existing?.kind || 'track').trim();
  return KINDS.has(v) ? v : 'track';
}

function pickIcon(raw) {
  const v = String(raw || '').trim();
  return QUICK_ICONS.has(v) ? v : 'Music2';
}

function formatDurationDisplay(minutes) {
  const m = Math.max(1, Math.min(MAX_TRACK_DURATION_MIN, parseInt(minutes, 10) || 3));
  return `${m}:00`;
}

module.exports = {
  KINDS,
  MOODS,
  QUICK_ICONS,
  pickMood,
  pickKind,
  pickIcon,
  formatDurationDisplay,
};

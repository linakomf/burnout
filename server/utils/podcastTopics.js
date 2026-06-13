

const TOPICS = new Set(['psych', 'mind', 'relations', 'growth', 'mental', 'motiv']);

function pickTopic(raw, fallback = 'psych') {
  const v = String(raw || '').trim();
  return TOPICS.has(v) ? v : fallback;
}

function formatDurationDisplay(minutes) {
  const m = Math.max(1, Math.min(180, parseInt(minutes, 10) || 24));
  return `${m}:00`;
}

function parseDurationMin(raw) {
  const n = parseInt(String(raw || '').trim(), 10);
  if (Number.isFinite(n) && n >= 1 && n <= 180) return n;
  return 24;
}

function parseBool(raw) {
  const v = String(raw ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

module.exports = {
  TOPICS,
  pickTopic,
  formatDurationDisplay,
  parseDurationMin,
  parseBool,
};

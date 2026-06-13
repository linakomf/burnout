
const TOPIC_IDS = new Set(['anxiety', 'sleep', 'recovery', 'focus', 'sounds']);

const KINDS = new Set(['meditation', 'sound']);

const DIFFICULTY = new Set(['beginner', 'intermediate', 'advanced']);

const AUDIO_SOURCES = new Set(['file', 'youtube', 'url']);

function sanitizeTopics(raw, kind) {
  if (kind === 'sound') return ['sounds'];
  let arr = [];
  if (typeof raw === 'string' && raw.trim()) {
    try {
      arr = JSON.parse(raw);
    } catch {
      arr = [];
    }
  } else if (Array.isArray(raw)) {
    arr = raw;
  }
  const out = [];
  const seen = new Set();
  for (const item of arr) {
    const id = String(item || '').trim();
    if (!id || id === 'sounds' || seen.has(id) || !TOPIC_IDS.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= 8) break;
  }
  if (out.length === 0) out.push('recovery');
  return out;
}

module.exports = {
  TOPIC_IDS,
  KINDS,
  DIFFICULTY,
  AUDIO_SOURCES,
  sanitizeTopics,
};

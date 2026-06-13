

function parseMusicPublicId(param) {
  const s = String(param || '').trim();
  const track = /^music-(\d+)$/.exec(s);
  if (track) return { id: parseInt(track[1], 10), kind: 'track' };
  return null;
}

function slugifyTitle(title, suffix) {
  const base = String(title || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04ff]+/gi, '-')
    .replace(/^-+|-+$/g, '');
  const safe = base.slice(0, 40) || 'podborka';
  return suffix ? `${safe}-${suffix}` : safe;
}



function parsePublicTrackIds(raw) {
  if (raw == null || raw === '') return [];
  let arr = raw;
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (t.startsWith('[')) {
      try {
        arr = JSON.parse(t);
      } catch {
        arr = t.split(',');
      }
    } else {
      arr = t.split(',');
    }
  }
  if (!Array.isArray(arr)) return [];
  const out = [];
  const seen = new Set();
  for (const item of arr) {
    const id = String(item || '').trim();
    if (!id || seen.has(id)) continue;
    const key = parseMusicPublicId(id);
    if (!key || key.kind !== 'track') continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

module.exports = {
  parseMusicPublicId,
  slugifyTitle,
  parsePublicTrackIds,
};

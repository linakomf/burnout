function parseFilmPublicId(param) {
  const m = /^film-(\d+)$/.exec(String(param || '').trim());
  return m ? parseInt(m[1], 10) : null;
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

function parsePublicFilmIds(raw) {
  if (raw == null || raw === '') return [];
  let arr = raw;
  if (typeof raw === 'string') {
    const text = raw.trim();
    if (text.startsWith('[')) {
      try {
        arr = JSON.parse(text);
      } catch {
        arr = text.split(',');
      }
    } else {
      arr = text.split(',');
    }
  }
  if (!Array.isArray(arr)) return [];

  const out = [];
  const seen = new Set();
  for (const item of arr) {
    const id = String(item || '').trim();
    if (!id || seen.has(id)) continue;
    if (parseFilmPublicId(id) == null) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

module.exports = {
  parseFilmPublicId,
  parsePublicFilmIds,
  slugifyTitle,
};

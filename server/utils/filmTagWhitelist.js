/** Совпадает с client/src/components/Practices/filmsHubFilters.js (без опции «Любое» id:null). */

const MOOD_IDS = new Set([
  'relax',
  'lift',
  'distract',
  'cozy',
  'anxiety',
  'inspire',
  'tired',
]);

const GENRE_IDS = new Set([
  'comedy',
  'romance_romcom',
  'drama',
  'family',
  'fantasy',
  'animation',
  'slice',
]);

const TYPE_IDS = new Set(['feature', 'cartoon', 'anime', 'doc']);

const ATMOS_IDS = new Set([
  'cozy_a',
  'calm',
  'light',
  'warm',
  'nostalgia',
  'inspiring',
  'aesthetic',
]);

function sanitizeStringIds(raw, allowedSet, maxLen = 24) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seen = new Set();
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const id = item.trim();
    if (!id || id.length > maxLen || seen.has(id)) continue;
    if (!allowedSet.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= 32) break;
  }
  return out;
}

/**
 * @param {unknown} raw
 * @returns {{ mood: string[], genre: string[], type: string[], atmosphere: string[] }}
 */
function normalizeFilmTags(raw) {
  let obj = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      obj = {};
    }
  }
  if (!obj || typeof obj !== 'object') {
    return { mood: [], genre: [], type: [], atmosphere: [] };
  }
  return {
    mood: sanitizeStringIds(obj.mood, MOOD_IDS),
    genre: sanitizeStringIds(obj.genre, GENRE_IDS),
    type: sanitizeStringIds(obj.type, TYPE_IDS),
    atmosphere: sanitizeStringIds(obj.atmosphere, ATMOS_IDS),
  };
}

module.exports = {
  normalizeFilmTags,
  MOOD_IDS,
  GENRE_IDS,
  TYPE_IDS,
  ATMOS_IDS,
};

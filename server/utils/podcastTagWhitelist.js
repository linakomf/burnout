/** Совпадает с client/src/components/Practices/podcastHubFilters.js */

const THEME_IDS = new Set([
  'psychology',
  'self_growth',
  'burnout',
  'anxiety_stress',
  'mindfulness',
  'motivation',
  'life_balance',
  'support',
]);

const SITUATION_IDS = new Set([
  'anxious',
  'tired',
  'no_motiv',
  'distract',
  'calm',
  'burnout_feel',
  'need_support',
]);

const FORMAT_IDS = new Set(['short', 'medium', 'long']);

const THEME_TO_LEGACY_TOPIC = {
  psychology: 'psych',
  self_growth: 'growth',
  burnout: 'mental',
  anxiety_stress: 'mental',
  mindfulness: 'mind',
  motivation: 'motiv',
  life_balance: 'mind',
  support: 'relations',
};

function sanitizeStringIds(raw, allowedSet, maxLen = 32) {
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
    if (out.length >= 16) break;
  }
  return out;
}

/**
 * @param {unknown} raw
 * @returns {{ theme: string[], situation: string[], format: string[] }}
 */
function normalizePodcastTags(raw) {
  let obj = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      obj = {};
    }
  }
  if (!obj || typeof obj !== 'object') {
    return { theme: [], situation: [], format: [] };
  }
  return {
    theme: sanitizeStringIds(obj.theme, THEME_IDS),
    situation: sanitizeStringIds(obj.situation, SITUATION_IDS),
    format: sanitizeStringIds(obj.format, FORMAT_IDS),
  };
}

function legacyTopicFromTags(tags) {
  const first = tags.theme?.[0];
  if (first && THEME_TO_LEGACY_TOPIC[first]) return THEME_TO_LEGACY_TOPIC[first];
  return 'psych';
}

function parsePodcastTagsField(raw) {
  if (raw == null || raw === '') return normalizePodcastTags({});
  if (typeof raw === 'object') return normalizePodcastTags(raw);
  try {
    return normalizePodcastTags(JSON.parse(String(raw)));
  } catch {
    return normalizePodcastTags({});
  }
}

module.exports = {
  normalizePodcastTags,
  parsePodcastTagsField,
  legacyTopicFromTags,
  THEME_IDS,
  SITUATION_IDS,
  FORMAT_IDS,
};

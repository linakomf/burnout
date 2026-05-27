/** Совпадает с EventsPracticeHub.jsx */

const KINDS = new Set(['solo', 'group']);

const FILTER_CATS = new Set([
  'concerts',
  'cinema',
  'exhibitions',
  'theater',
  'workshops',
  'lectures',
  'other',
]);

const PRICE_KEYS = new Set([
  'eventsEvPriceFree',
  'eventsEvPriceFrom1000',
  'eventsEvPriceFrom1500',
  'eventsEvPriceFrom2000',
  'eventsEvPriceFrom3000',
  'eventsEvPriceFrom4000',
  'eventsEvPriceFrom5000',
]);

const TF_LOC = new Set(['almaty']);
const TF_DATE = new Set(['today', 'weekend', 'this_month']);
const TF_TIME = new Set(['morning', 'afternoon', 'evening']);
const TF_MOOD = new Set(['calm', 'energy', 'social', 'creative', 'active', 'curious']);

const TAG_KINDS = new Set(['map', 'clock', 'building', 'users', 'globe']);

function pickTf(raw, allowed, fallback) {
  const v = String(raw || '').trim();
  return allowed.has(v) ? v : fallback;
}

function normalizePriceKey(raw, existing) {
  const value = String(raw ?? existing ?? '').trim().slice(0, 80);
  return value || 'от 2000 ₸';
}

function buildCardTags(body, kind) {
  const tags = [];
  const loc = String(body.location_text || '').trim();
  if (loc) tags.push({ kind: 'map', text: loc });
  const when = String(body.when_text || '').trim();
  if (when) tags.push({ kind: 'clock', text: when });
  const offline = String(body.is_offline ?? '1').trim();
  if (offline === '1' || offline === 'true') {
    tags.push({ kind: 'building', text: String(body.offline_label || 'Офлайн').trim() || 'Офлайн' });
  } else {
    const onlineLabel = String(body.online_label || 'Онлайн').trim();
    if (onlineLabel) tags.push({ kind: 'globe', text: onlineLabel });
  }
  if (kind === 'group') {
    tags.push({ kind: 'users', text: String(body.in_company_label || 'В компании').trim() || 'В компании' });
  }
  return tags;
}

function parseJsonArray(raw, max = 12) {
  let arr = [];
  if (typeof raw === 'string' && raw.trim()) {
    try {
      arr = JSON.parse(raw);
    } catch {
      arr = [];
    }
  } else if (Array.isArray(raw)) arr = raw;
  if (!Array.isArray(arr)) return [];
  const out = [];
  for (const item of arr) {
    if (typeof item !== 'string') continue;
    const s = item.trim();
    if (!s) continue;
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

function parseTagsField(raw, kind) {
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((t) => t && typeof t === 'object' && TAG_KINDS.has(t.kind) && String(t.text || '').trim())
          .map((t) => ({ kind: t.kind, text: String(t.text).trim().slice(0, 120) }));
      }
    } catch {
      /* fallback */
    }
  }
  return buildCardTags({}, kind);
}

module.exports = {
  KINDS,
  FILTER_CATS,
  PRICE_KEYS,
  normalizePriceKey,
  buildCardTags,
  parseTagsField,
  parseJsonArray,
  pickTf,
  pickTfLoc: (v) => pickTf(v, TF_LOC, 'almaty'),
  pickTfDate: (v) => pickTf(v, TF_DATE, 'this_month'),
  pickTfTime: (v) => pickTf(v, TF_TIME, 'evening'),
  pickTfMood: (v) => pickTf(v, TF_MOOD, 'calm'),
};

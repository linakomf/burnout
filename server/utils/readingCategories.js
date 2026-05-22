/** Категории фильтров — как на ArticlesPracticeHub */

const KINDS = new Set(['article', 'book']);

const ARTICLE_CATEGORIES = new Set([
  'burnout',
  'stress',
  'anxiety',
  'motivation',
  'rest',
  'balance',
  'emotions',
  'communication',
]);

const BOOK_CATEGORIES = new Set([
  'psychology',
  'selfgrowth',
  'readsmotive',
  'lightread',
  'restreads',
  'fiction',
  'biography',
  'inspire',
]);

function pickCategory(kind, raw, fallback) {
  const v = String(raw || '').trim();
  const allowed = kind === 'book' ? BOOK_CATEGORIES : ARTICLE_CATEGORIES;
  if (allowed.has(v)) return v;
  return fallback;
}

function pickKind(raw, existing) {
  const v = String(raw || existing?.kind || 'article').trim();
  return KINDS.has(v) ? v : 'article';
}

module.exports = {
  KINDS,
  ARTICLE_CATEGORIES,
  BOOK_CATEGORIES,
  pickCategory,
  pickKind,
};

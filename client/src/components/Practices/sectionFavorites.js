export const FAVORITES_CHANGED_EVENT = 'burnout:favorites-changed';

export const FAVORITES_KEYS = {
  films: 'burnout:film-favorites',
  reading: 'burnout:reading-favorites',
  music: 'burnout:music-favorites',
  podcasts: 'burnout:podcast-favorites',
};

export function loadSectionFavorites(storageKey) {
  if (typeof window === 'undefined') return new Set();

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.filter((id) => typeof id === 'string')) : new Set();
  } catch {
    return new Set();
  }
}

export function saveSectionFavorites(storageKey, favorites) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey, JSON.stringify([...favorites]));
  window.dispatchEvent(new Event(FAVORITES_CHANGED_EVENT));
}

export function loadAllSectionFavoriteSets() {
  return {
    films: loadSectionFavorites(FAVORITES_KEYS.films),
    reading: loadSectionFavorites(FAVORITES_KEYS.reading),
    music: loadSectionFavorites(FAVORITES_KEYS.music),
    podcasts: loadSectionFavorites(FAVORITES_KEYS.podcasts),
  };
}

export function toggleInFavoriteSet(set, id) {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

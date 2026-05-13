export const MEDITATION_FAVORITES_STORAGE_KEY = 'burnout:meditation-favorites';

export function loadMeditationFavorites() {
  if (typeof window === 'undefined') return new Set();

  try {
    const raw = window.localStorage.getItem(MEDITATION_FAVORITES_STORAGE_KEY);
    if (!raw) return new Set();

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.filter((id) => typeof id === 'string')) : new Set();
  } catch {
    return new Set();
  }
}

export function saveMeditationFavorites(favorites) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(MEDITATION_FAVORITES_STORAGE_KEY, JSON.stringify([...favorites]));
}

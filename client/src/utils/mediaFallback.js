import { natureAt } from '../components/Practices/spaceNatureImagery';

export function seedFromMediaId(id) {
  const m = String(id || '').match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

/** Плейсхолдер, если обложка пустая или /uploads недоступны на хостинге. */
export function coverWithFallback(url, seed = 0) {
  const u = String(url || '').trim();
  if (u) return u;
  return natureAt(Math.abs(Number(seed) || 0) % 12);
}

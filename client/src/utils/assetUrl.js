/**
 * Статические пути из client/public: /uploads/..., /images/..., /avatars/...
 * Возвращает относительный путь для CRA (тот же origin, что и фронт).
 */
export function backendPublicUrl(path) {
  if (path == null || path === '') return '';
  const raw = String(path).trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return raw.startsWith('/') ? raw : `/${raw}`;
}

export function isStaticPublicAssetPath(path) {
  const p = backendPublicUrl(path);
  return Boolean(p);
}

/** Parse textarea: one path per line or comma-separated. */
export function parseMediaPathsText(text) {
  return String(text || '')
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function mediaPathsToText(paths) {
  if (!Array.isArray(paths) || !paths.length) return '';
  return paths.join('\n');
}

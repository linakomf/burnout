/**
 * URL для публичных файлов бэкенда (например /uploads/...).
 * В разработке без REACT_APP_API_ORIGIN используем относительный путь - его проксирует dev-server (setupProxy.js).
 * В проде при отдельном хосте API задайте REACT_APP_API_ORIGIN=https://api.example.com
 */
export function backendPublicUrl(path) {
  if (path == null || path === '') return '';
  const raw = String(path).trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  const p = raw.startsWith('/') ? raw : `/${raw}`;
  const legacyOrigin = (process.env.REACT_APP_LEGACY_UPLOADS_ORIGIN || '').replace(/\/$/, '');
  if (legacyOrigin && (p.startsWith('/uploads/') || p.startsWith('/images/'))) {
    return `${legacyOrigin}${p}`;
  }
  const origin = (process.env.REACT_APP_API_ORIGIN || '').replace(/\/$/, '');
  return origin ? `${origin}${p}` : p;
}

/**
 * URL для публичных файлов бэкенда (например /uploads/...).
 * В разработке без REACT_APP_API_ORIGIN используем относительный путь — его проксирует dev-server (setupProxy.js).
 * В проде при отдельном хосте API задайте REACT_APP_API_ORIGIN=https://api.example.com
 */
export function backendPublicUrl(path) {
  if (path == null || path === '') return '';
  const p = String(path).startsWith('/') ? String(path) : `/${path}`;
  const origin = (process.env.REACT_APP_API_ORIGIN || '').replace(/\/$/, '');
  return origin ? `${origin}${p}` : p;
}

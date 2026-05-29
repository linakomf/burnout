/**
 * URL для публичных файлов бэкенда (например /uploads/...).
 * В разработке без REACT_APP_API_ORIGIN используем относительный путь - его проксирует dev-server (setupProxy.js).
 * В проде при отдельном хосте API задайте REACT_APP_API_ORIGIN=https://api.example.com
 */
import { getApiOrigin } from './api';

export function backendPublicUrl(path) {
  if (path == null || path === '') return '';

  const s = String(path).trim();
  if (!s) return '';

  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('//')) return `https:${s}`;

  let p = s;
  if (!p.startsWith('/')) {
    if (p.startsWith('uploads/')) p = `/${p}`;
    else p = `/${p}`;
  }

  const origin = getApiOrigin();
  return origin ? `${origin.replace(/\/$/, '')}${p}` : p;
}

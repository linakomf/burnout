/**
 * Гибридные URL медиа:
 * - https://res.cloudinary.com/... — как есть;
 * - /images/..., /avatars/... и др. статика CRA — относительный путь (client/public);
 * - /uploads/... из админки (server/uploads) — через API (REACT_APP_API_ORIGIN) или legacy-origin.
 */

function isAbsoluteHttpUrl(path) {
  return /^https?:\/\//i.test(String(path || '').trim());
}

function isCloudinaryUrl(path) {
  return /^https?:\/\/res\.cloudinary\.com\//i.test(String(path || '').trim());
}

/** Статические файлы из client/public (не server/uploads). */
export function isStaticPublicAssetPath(path) {
  const raw = String(path || '').trim();
  if (!raw || isAbsoluteHttpUrl(raw)) return false;
  const p = raw.startsWith('/') ? raw : `/${raw}`;
  if (p.startsWith('/uploads/')) return false;
  return (
    p.startsWith('/images/') ||
    p.startsWith('/avatars/') ||
    p.startsWith('/media/') ||
    p.startsWith('/films/') ||
    p.startsWith('/music/') ||
    p.startsWith('/meditation/') ||
    p.startsWith('/articles/') ||
    p.startsWith('/space/') ||
    p.startsWith('/photos/') ||
    p.startsWith('/videos/') ||
    p === '/burnout-logo.png' ||
    p === '/mindtrack-logo.png' ||
    p === '/dashboard-bg-sakura.png'
  );
}

export function isLegacyServerUploadPath(path) {
  const raw = String(path || '').trim();
  if (!raw || isCloudinaryUrl(raw) || isAbsoluteHttpUrl(raw)) return false;
  return raw.startsWith('/uploads/') || raw.startsWith('uploads/');
}

/**
 * URL для медиа из API (обложки, галереи, аватары админки).
 */
export function backendPublicUrl(path) {
  if (path == null || path === '') return '';
  const raw = String(path).trim();
  if (!raw) return '';
  if (isCloudinaryUrl(raw) || isAbsoluteHttpUrl(raw)) return raw;

  const p = raw.startsWith('/') ? raw : `/${raw}`;

  if (isStaticPublicAssetPath(p)) return p;

  if (isLegacyServerUploadPath(p)) {
    const legacyOrigin = (process.env.REACT_APP_LEGACY_UPLOADS_ORIGIN || '').replace(/\/$/, '');
    if (legacyOrigin) return `${legacyOrigin}${p}`;
    const apiOrigin = (process.env.REACT_APP_API_ORIGIN || '').replace(/\/$/, '');
    return apiOrigin ? `${apiOrigin}${p}` : p;
  }

  return p;
}

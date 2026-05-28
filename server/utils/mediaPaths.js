const path = require('path');

const LEGACY_UPLOAD_PREFIX = '/uploads/';

function isCloudinaryUrl(url) {
  const s = String(url || '').trim();
  return /^https?:\/\/res\.cloudinary\.com\//i.test(s);
}

function isAbsoluteHttpUrl(url) {
  return /^https?:\/\//i.test(String(url || '').trim());
}

function isLegacyServerUploadPath(url) {
  const s = String(url || '').trim();
  if (!s || isCloudinaryUrl(s) || isAbsoluteHttpUrl(s)) return false;
  return s.startsWith('/uploads/') || s.startsWith('uploads/');
}

function normalizeLegacyUploadPath(url) {
  const s = String(url || '').trim();
  if (!s) return '';
  if (s.startsWith(LEGACY_UPLOAD_PREFIX)) return s;
  if (s.startsWith('uploads/')) return `/${s}`;
  return s;
}

/** Пути к статике CRA (client/public), не трогаем при резолве URL. */
function isStaticPublicAssetPath(url) {
  const raw = String(url || '').trim();
  if (!raw || isAbsoluteHttpUrl(raw)) return false;
  const p = raw.startsWith('/') ? raw : `/${raw}`;
  if (p.startsWith(LEGACY_UPLOAD_PREFIX)) return false;
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

function resolveLocalUploadFile(uploadPath, uploadsDir) {
  const normalized = normalizeLegacyUploadPath(uploadPath);
  if (!normalized.startsWith(LEGACY_UPLOAD_PREFIX)) return null;
  const rel = normalized.slice(LEGACY_UPLOAD_PREFIX.length);
  const candidates = [
    path.join(uploadsDir, rel),
    path.join(uploadsDir, path.basename(rel)),
  ];
  const fs = require('fs');
  for (const abs of candidates) {
    try {
      if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return abs;
    } catch {
      /* ignore */
    }
  }
  return null;
}

const UPLOAD_PATH_RE = /\/uploads\/[a-zA-Z0-9._-]+/g;

function extractLegacyUploadPathsFromText(text) {
  const found = new Set();
  const raw = String(text || '');
  if (!raw) return [];
  let m;
  const re = new RegExp(UPLOAD_PATH_RE.source, 'g');
  while ((m = re.exec(raw)) !== null) {
    found.add(m[0]);
  }
  return [...found];
}

function extractLegacyUploadPathsFromJsonArray(value) {
  let arr = value;
  if (typeof arr === 'string') {
    try {
      arr = JSON.parse(arr);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  const out = new Set();
  for (const item of arr) {
    if (isLegacyServerUploadPath(item)) out.add(normalizeLegacyUploadPath(item));
  }
  return [...out];
}

function replaceLegacyPathsInScalar(value, pathMap) {
  const key = normalizeLegacyUploadPath(value);
  if (!key || !pathMap.has(key)) return value;
  return pathMap.get(key);
}

function replaceLegacyPathsInJsonArray(value, pathMap) {
  let arr = value;
  if (typeof arr === 'string') {
    try {
      arr = JSON.parse(arr);
    } catch {
      return value;
    }
  }
  if (!Array.isArray(arr)) return value;
  let changed = false;
  const next = arr.map((item) => {
    const key = normalizeLegacyUploadPath(item);
    if (!key || !pathMap.has(key)) return item;
    changed = true;
    return pathMap.get(key);
  });
  return changed ? next : value;
}

function replaceLegacyPathsInHtml(text, pathMap) {
  let out = String(text || '');
  if (!out) return out;
  for (const [from, to] of pathMap.entries()) {
    if (!from || from === to) continue;
    out = out.split(from).join(to);
  }
  return out;
}

function guessCloudinaryResourceType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'].includes(ext)) return 'video';
  return 'auto';
}

module.exports = {
  LEGACY_UPLOAD_PREFIX,
  isCloudinaryUrl,
  isLegacyServerUploadPath,
  isStaticPublicAssetPath,
  normalizeLegacyUploadPath,
  resolveLocalUploadFile,
  extractLegacyUploadPathsFromText,
  extractLegacyUploadPathsFromJsonArray,
  replaceLegacyPathsInScalar,
  replaceLegacyPathsInJsonArray,
  replaceLegacyPathsInHtml,
  guessCloudinaryResourceType,
};

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '../..');
const PUBLIC_UPLOADS_DIR = path.join(REPO_ROOT, 'client/public/uploads');
const PUBLIC_IMAGES_DIR = path.join(REPO_ROOT, 'client/public/images');

function isCloudinaryUrl(url) {
  return /^https?:\/\/res\.cloudinary\.com\//i.test(String(url || '').trim());
}

function basenameFromUrl(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] || '';
  } catch {
    const s = String(url || '');
    const i = s.lastIndexOf('/');
    return i >= 0 ? s.slice(i + 1).split('?')[0] : s;
  }
}

function cloudinaryUrlToLocalPath(url) {
  const name = basenameFromUrl(url);
  if (!name) return '';
  const candidate = `/uploads/${name}`;
  if (fileExistsForPublicPath(candidate)) return candidate;
  return '';
}

function normalizePublicMediaPath(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  if (isCloudinaryUrl(s)) {
    return cloudinaryUrlToLocalPath(s) || '';
  }
  if (/^https?:\/\//i.test(s)) return '';
  let p = s.startsWith('/') ? s : `/${s}`;
  if (!p.startsWith('/uploads/') && !p.startsWith('/images/')) return '';
  if (p.includes('..')) return '';
  return p;
}

function resolvePublicFileAbs(publicPath) {
  const p = normalizePublicMediaPath(publicPath);
  if (!p) return null;
  const root = p.startsWith('/images/') ? PUBLIC_IMAGES_DIR : PUBLIC_UPLOADS_DIR;
  const rel = p.replace(/^\/(uploads|images)\//, '');
  if (!rel || rel.includes('..')) return null;
  const abs = path.resolve(root, rel);
  const rootResolved = path.resolve(root);
  if (!abs.startsWith(rootResolved + path.sep) && abs !== rootResolved) return null;
  return abs;
}

function fileExistsForPublicPath(publicPath) {
  const abs = resolvePublicFileAbs(publicPath);
  if (!abs) return false;
  try {
    return fs.existsSync(abs) && fs.statSync(abs).isFile();
  } catch {
    return false;
  }
}

function getPublicUploadsDir() {
  return PUBLIC_UPLOADS_DIR;
}

function listFilesInDir(dirAbs, urlPrefix, limit = 500) {
  if (!fs.existsSync(dirAbs)) return [];
  const out = [];
  const walk = (relDir) => {
    if (out.length >= limit) return;
    const abs = path.join(dirAbs, relDir);
    let entries;
    try {
      entries = fs.readdirSync(abs, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (out.length >= limit) return;
      const rel = relDir ? `${relDir}/${ent.name}` : ent.name;
      if (ent.isDirectory()) walk(rel);
      else if (ent.isFile()) out.push(`${urlPrefix}/${rel.replace(/\\/g, '/')}`);
    }
  };
  walk('');
  return out.sort();
}

function listPublicMediaPaths() {
  return {
    uploads: listFilesInDir(PUBLIC_UPLOADS_DIR, '/uploads'),
    images: listFilesInDir(PUBLIC_IMAGES_DIR, '/images'),
  };
}

function parseGalleryUrlsField(raw) {
  if (raw == null || raw === '') return [];
  let arr = raw;
  if (typeof arr === 'string') {
    const t = arr.trim();
    if (!t) return [];
    try {
      arr = JSON.parse(t);
    } catch {
      arr = t.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    }
  }
  if (!Array.isArray(arr)) return [];
  const out = [];
  for (const item of arr) {
    const p = normalizePublicMediaPath(item);
    if (p) out.push(p);
  }
  return out.slice(0, 12);
}

function requirePublicImagePath(body, field, { required = false, label } = {}) {
  const name = label || field;
  if (!Object.prototype.hasOwnProperty.call(body, field)) {
    if (required) return { error: `Укажите ${name} (/uploads/... или /images/...)` };
    return { skip: true };
  }
  const p = normalizePublicMediaPath(body[field]);
  if (!p) {
    if (required) return { error: `Некорректный путь ${name}. Пример: /uploads/cover.jpg` };
    return { skip: true };
  }
  return { path: p };
}

module.exports = {
  PUBLIC_UPLOADS_DIR,
  PUBLIC_IMAGES_DIR,
  isCloudinaryUrl,
  cloudinaryUrlToLocalPath,
  normalizePublicMediaPath,
  fileExistsForPublicPath,
  getPublicUploadsDir,
  listPublicMediaPaths,
  parseGalleryUrlsField,
  requirePublicImagePath,
};

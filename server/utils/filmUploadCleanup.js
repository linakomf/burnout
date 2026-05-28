const fs = require('fs');
const path = require('path');
const { getPublicUploadsDir } = require('./publicMediaPath');

function safeUnlinkUploadPath(uploadsAbs, urlPath) {
  const root = uploadsAbs || getPublicUploadsDir();
  if (!urlPath || typeof urlPath !== 'string') return;
  const trimmed = urlPath.trim();
  if (!trimmed.startsWith('/uploads/')) return;
  const rel = trimmed.slice('/uploads/'.length);
  if (!rel || rel.includes('..')) return;
  const abs = path.resolve(root, rel);
  const rootResolved = path.resolve(root);
  if (!abs.startsWith(rootResolved + path.sep) && abs !== rootResolved) return;
  fs.unlink(abs, () => {});
}

function unlinkFilmAssets(uploadsAbs, posterUrl, galleryUrls) {
  safeUnlinkUploadPath(uploadsAbs, posterUrl);
  if (Array.isArray(galleryUrls)) {
    for (const u of galleryUrls) safeUnlinkUploadPath(uploadsAbs, u);
  }
}

module.exports = { safeUnlinkUploadPath, unlinkFilmAssets };

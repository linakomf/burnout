const fs = require('fs');
const path = require('path');

function safeUnlinkUploadPath(uploadsAbs, urlPath) {
  if (!urlPath || typeof urlPath !== 'string') return;
  const trimmed = urlPath.trim();
  if (!trimmed.startsWith('/uploads/')) return;
  const rel = trimmed.slice('/uploads/'.length);
  if (!rel || rel.includes('..')) return;
  const abs = path.resolve(uploadsAbs, rel);
  const root = path.resolve(uploadsAbs);
  if (!abs.startsWith(root)) return;
  try {
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch {
    /* ignore */
  }
}

function unlinkEventAssets(uploadsAbs, coverUrl, heroUrl, venueUrl, galleryUrls) {
  safeUnlinkUploadPath(uploadsAbs, coverUrl);
  safeUnlinkUploadPath(uploadsAbs, heroUrl);
  safeUnlinkUploadPath(uploadsAbs, venueUrl);
  if (Array.isArray(galleryUrls)) {
    for (const u of galleryUrls) safeUnlinkUploadPath(uploadsAbs, u);
  }
}

module.exports = { safeUnlinkUploadPath, unlinkEventAssets };

const { safeUnlinkUploadPath } = require('./eventUploadCleanup');

function unlinkReadingCover(uploadsAbs, coverUrl) {
  safeUnlinkUploadPath(uploadsAbs, coverUrl);
}

module.exports = { unlinkReadingCover };

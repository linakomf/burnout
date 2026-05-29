const fs = require('fs');
const path = require('path');
const { getUploadsDir } = require('./uploadsDir');

const PUBLIC_UPLOADS_DIR = path.join(__dirname, '../../client/public/uploads');

/** Дублирует файл в client/public/uploads — CRA отдаёт /uploads без прокси. */
function mirrorUploadToPublic(filename) {
  const name = path.basename(String(filename || ''));
  if (!name) return;

  const src = path.join(getUploadsDir(), name);
  if (!fs.existsSync(src)) return;

  try {
    fs.mkdirSync(PUBLIC_UPLOADS_DIR, { recursive: true });
    const dest = path.join(PUBLIC_UPLOADS_DIR, name);
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
    }
  } catch (err) {
    console.warn('[mirrorUpload]', err.message);
  }
}

/** Путь для БД после multer + зеркало в public. */
function publicUploadPath(file) {
  if (!file?.filename) return '';
  mirrorUploadToPublic(file.filename);
  return `/uploads/${file.filename}`;
}

module.exports = {
  mirrorUploadToPublic,
  publicUploadPath,
};

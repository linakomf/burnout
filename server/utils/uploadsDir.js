const path = require('path');
const fs = require('fs');

/** Локально — server/uploads; на Vercel — /tmp (эфемерно, только для приёма файлов). */
function getUploadsDir() {
  const dir = process.env.VERCEL
    ? path.join('/tmp', 'burnout-uploads')
    : path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

module.exports = { getUploadsDir };

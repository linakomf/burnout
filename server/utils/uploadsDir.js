const path = require('path');
const fs = require('fs');


function getUploadsDir() {
  const dir = process.env.VERCEL
    ? path.join('/tmp', 'burnout-uploads')
    : path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

module.exports = { getUploadsDir };

import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import ytDlpWrapPkg from 'yt-dlp-wrap';

const YTDlpWrap = ytDlpWrapPkg.default;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'client', 'public', 'media');
const outBase = path.join(outDir, 'landing-glass-calm-music');

fs.mkdirSync(outDir, { recursive: true });

const binPath = path.join(__dirname, 'bin', os.platform() === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
fs.mkdirSync(path.dirname(binPath), { recursive: true });

if (!fs.existsSync(binPath)) {
  console.log('Fetching yt-dlp binary…');
  await YTDlpWrap.downloadFromGithub(binPath);
}

const yt = new YTDlpWrap(binPath);
/** Calm music for landing glass card — https://youtu.be/gc7SIKLHhuY */
const url = 'https://www.youtube.com/watch?v=gc7SIKLHhuY';

const browsers = (process.env.YTDLP_BROWSER || 'edge,chrome,firefox,brave')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const baseArgs = [
  url,
  '-f',
  'ba[ext=m4a]/bestaudio[filesize<12M]/bestaudio',
  '-x',
  '--audio-format',
  'mp3',
  '--audio-quality',
  '5',
  '-o',
  `${outBase}.%(ext)s`,
  '--no-playlist',
  '--force-overwrites',
  '--no-warnings',
  '--embed-metadata',
];

let lastError = null;

for (const browser of browsers) {
  console.log(`Downloading calm music (cookies: ${browser})…`);
  try {
    await yt.execPromise([...baseArgs, '--cookies-from-browser', browser]);
    lastError = null;
    break;
  } catch (err) {
    lastError = err;
    console.warn(`  ${browser} failed: ${err.message?.split('\n')[0] || err}`);
  }
}

if (lastError) {
  console.log('Retrying without browser cookies…');
  try {
    await yt.execPromise(baseArgs);
    lastError = null;
  } catch (err) {
    lastError = err;
  }
}

const mp3Path = path.join(outDir, 'landing-glass-calm-music.mp3');
const webmPath = path.join(outDir, 'landing-glass-calm-music.webm');

if (!fs.existsSync(webmPath) && !fs.existsSync(mp3Path)) {
  const downloaded = fs
    .readdirSync(outDir)
    .find((f) => f.startsWith('landing-glass-calm-music.'));
  if (downloaded) {
    const from = path.join(outDir, downloaded);
    const ext = path.extname(downloaded).toLowerCase();
    const target = ext === '.mp3' ? mp3Path : webmPath;
    if (from !== target) fs.copyFileSync(from, target);
  }
}

const saved = [webmPath, mp3Path].filter((p) => fs.existsSync(p));
if (!saved.length) {
  console.error(
    'No landing-glass-calm-music output.\n' +
      'YouTube may require login: run with YTDLP_BROWSER=chrome (browser must be closed) or place cookies.txt in scripts/.\n' +
      'Track: https://youtu.be/gc7SIKLHhuY'
  );
  process.exit(1);
}

saved.forEach((p) => console.log(`Saved ${p} (${Math.round(fs.statSync(p).size / 1024)} KB)`));

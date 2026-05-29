import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import ytDlpWrapPkg from 'yt-dlp-wrap';

const YTDlpWrap = ytDlpWrapPkg.default;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'client', 'public', 'media');
const outBase = path.join(outDir, 'landing-glass-voice');

fs.mkdirSync(outDir, { recursive: true });

const binPath = path.join(__dirname, 'bin', os.platform() === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
fs.mkdirSync(path.dirname(binPath), { recursive: true });

if (!fs.existsSync(binPath)) {
  console.log('Fetching yt-dlp binary…');
  await YTDlpWrap.downloadFromGithub(binPath);
}

const yt = new YTDlpWrap(binPath);
const url = 'https://www.youtube.com/watch?v=TUyawG7GBlM';

console.log('Downloading audio…');
await yt.execPromise([
  url,
  '-f',
  'ba[ext=m4a]/bestaudio',
  '-o',
  `${outBase}.%(ext)s`,
  '--no-playlist',
  '--no-warnings',
]);

const files = fs.readdirSync(outDir).filter((f) => f.startsWith('landing-glass-voice.'));
if (!files.length) {
  console.error('No output file found');
  process.exit(1);
}

const downloaded = path.join(outDir, files[0]);
const mp3Path = path.join(outDir, 'landing-glass-voice.mp3');

if (files[0].endsWith('.mp3')) {
  if (downloaded !== mp3Path) fs.renameSync(downloaded, mp3Path);
} else {
  const m4aPath = path.join(outDir, 'landing-glass-voice.m4a');
  if (downloaded !== m4aPath && !fs.existsSync(m4aPath)) {
    fs.renameSync(downloaded, m4aPath);
  }
  console.log(`Saved ${path.basename(m4aPath)} (use as audio source; mp3 conversion needs ffmpeg)`);
  process.exit(0);
}

console.log(`Saved ${mp3Path}`);

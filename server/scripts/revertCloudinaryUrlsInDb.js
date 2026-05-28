/**
 * Заменяет https://res.cloudinary.com/... на /uploads/<filename>,
 * если файл есть в client/public/uploads.
 *
 * node scripts/revertCloudinaryUrlsInDb.js
 * node scripts/revertCloudinaryUrlsInDb.js --dry-run
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const pool = require('../db');
const {
  isCloudinaryUrl,
  cloudinaryUrlToLocalPath,
  normalizePublicMediaPath,
} = require('../utils/publicMediaPath');

const DRY_RUN = process.argv.includes('--dry-run');

const SPECS = [
  { table: 'films', id: 'film_id', cols: [{ name: 'poster_url', kind: 'scalar' }, { name: 'gallery_urls', kind: 'json' }] },
  { table: 'film_collections', id: 'collection_id', cols: [{ name: 'cover_url', kind: 'scalar' }] },
  { table: 'music_items', id: 'music_id', cols: [{ name: 'cover_url', kind: 'scalar' }, { name: 'audio_file_url', kind: 'scalar' }] },
  { table: 'music_collections', id: 'collection_id', cols: [{ name: 'cover_url', kind: 'scalar' }] },
  { table: 'meditations', id: 'meditation_id', cols: [{ name: 'cover_url', kind: 'scalar' }, { name: 'audio_file_url', kind: 'scalar' }] },
  { table: 'podcast_episodes', id: 'podcast_id', cols: [{ name: 'cover_url', kind: 'scalar' }, { name: 'audio_file_url', kind: 'scalar' }] },
  { table: 'reading_items', id: 'reading_id', cols: [{ name: 'cover_url', kind: 'scalar' }, { name: 'body_full', kind: 'html' }] },
  { table: 'events', id: 'event_id', cols: [
    { name: 'cover_url', kind: 'scalar' },
    { name: 'hero_url', kind: 'scalar' },
    { name: 'venue_image_url', kind: 'scalar' },
    { name: 'gallery_urls', kind: 'json' },
  ] },
  { table: 'users', id: 'user_id', cols: [{ name: 'avatar', kind: 'scalar' }] },
  { table: 'psychologist_documents', id: 'document_id', cols: [{ name: 'file_path', kind: 'scalar' }] },
];

function mapScalar(val) {
  if (!isCloudinaryUrl(val)) return val;
  const local = cloudinaryUrlToLocalPath(val);
  return local || val;
}

function mapJsonArray(val) {
  let arr = val;
  if (typeof arr === 'string') {
    try { arr = JSON.parse(arr); } catch { return val; }
  }
  if (!Array.isArray(arr)) return val;
  let changed = false;
  const next = arr.map((item) => {
    if (!isCloudinaryUrl(item)) return item;
    const local = cloudinaryUrlToLocalPath(item);
    if (local && local !== item) { changed = true; return local; }
    return item;
  });
  return changed ? next : val;
}

function mapHtml(val) {
  let out = String(val || '');
  if (!out.includes('res.cloudinary.com')) return val;
  const re = /https?:\/\/res\.cloudinary\.com\/[^\s"'<>]+/gi;
  let changed = false;
  out = out.replace(re, (url) => {
    const local = cloudinaryUrlToLocalPath(url);
    if (local) { changed = true; return local; }
    return url;
  });
  return changed ? out : val;
}

async function main() {
  let updated = 0;
  for (const spec of SPECS) {
    const cols = spec.cols.map((c) => c.name).join(', ');
    const { rows } = await pool.query(`SELECT ${spec.id}, ${cols} FROM ${spec.table}`);
    for (const row of rows) {
      const patch = {};
      for (const col of spec.cols) {
        const v = row[col.name];
        if (v == null || v === '') continue;
        if (col.kind === 'scalar') {
          const next = mapScalar(v);
          if (next !== v) patch[col.name] = next;
        } else if (col.kind === 'json') {
          const next = mapJsonArray(v);
          if (next !== v) patch[col.name] = next;
        } else if (col.kind === 'html') {
          const next = mapHtml(v);
          if (next !== v) patch[col.name] = next;
        }
      }
      const keys = Object.keys(patch);
      if (!keys.length) continue;
      if (DRY_RUN) {
        console.log(`[dry-run] ${spec.table}#${row[spec.id]}`, keys.join(', '));
        updated += 1;
        continue;
      }
      const sets = keys.map((k, i) => {
        const kind = spec.cols.find((c) => c.name === k).kind;
        return kind === 'json' ? `${k} = $${i + 2}::jsonb` : `${k} = $${i + 2}`;
      }).join(', ');
      const values = [row[spec.id], ...keys.map((k) => {
        const kind = spec.cols.find((c) => c.name === k).kind;
        const v = patch[k];
        return kind === 'json' ? JSON.stringify(v) : v;
      })];
      await pool.query(`UPDATE ${spec.table} SET ${sets} WHERE ${spec.id} = $1`, values);
      updated += 1;
    }
  }
  console.log(DRY_RUN ? `Строк к обновлению: ${updated}` : `Обновлено строк: ${updated}`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  pool.end().finally(() => process.exit(1));
});

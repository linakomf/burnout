/**
 * Одноразовая миграция: server/uploads → Cloudinary, обновление путей в PostgreSQL.
 *
 * Статика client/public/images и client/public/uploads не затрагивается.
 * Пути /images/... в БД не меняются.
 * Повторный запуск: пропускает https://res.cloudinary.com/...; повторно не грузит
 * файлы, уже записанные в .migrate-uploads-map.json (если upload прошёл, а UPDATE упал).
 *
 * Запуск (из server/):
 *   node scripts/migrateLocalUploadsToCloudinary.js
 *   node scripts/migrateLocalUploadsToCloudinary.js --dry-run
 *   node scripts/migrateLocalUploadsToCloudinary.js --update-only
 *     (только UPDATE из .migrate-uploads-map.json, без повторной загрузки)
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const pool = require('../db');
const { isCloudinaryConfigured, uploadLocalFile } = require('../utils/cloudinaryUpload');
const {
  isCloudinaryUrl,
  isLegacyServerUploadPath,
  normalizeLegacyUploadPath,
  resolveLocalUploadFile,
  extractLegacyUploadPathsFromText,
  extractLegacyUploadPathsFromJsonArray,
  replaceLegacyPathsInScalar,
  replaceLegacyPathsInJsonArray,
  replaceLegacyPathsInHtml,
} = require('../utils/mediaPaths');

const UPLOADS_DIR = path.join(__dirname, '../uploads');
const UPLOAD_CACHE_PATH = path.join(__dirname, '.migrate-uploads-map.json');
const DRY_RUN = process.argv.includes('--dry-run');
const UPDATE_ONLY = process.argv.includes('--update-only');

const TABLE_SPECS = [
  {
    table: 'films',
    idCol: 'film_id',
    columns: [
      { col: 'poster_url', kind: 'scalar' },
      { col: 'gallery_urls', kind: 'json_array', pgCast: 'jsonb' },
    ],
  },
  {
    table: 'film_collections',
    idCol: 'collection_id',
    columns: [{ col: 'cover_url', kind: 'scalar' }],
  },
  {
    table: 'music_items',
    idCol: 'music_id',
    columns: [
      { col: 'cover_url', kind: 'scalar' },
      { col: 'audio_file_url', kind: 'scalar' },
    ],
  },
  {
    table: 'music_collections',
    idCol: 'collection_id',
    columns: [{ col: 'cover_url', kind: 'scalar' }],
  },
  {
    table: 'meditations',
    idCol: 'meditation_id',
    columns: [
      { col: 'cover_url', kind: 'scalar' },
      { col: 'audio_file_url', kind: 'scalar' },
    ],
  },
  {
    table: 'podcast_episodes',
    idCol: 'podcast_id',
    columns: [
      { col: 'cover_url', kind: 'scalar' },
      { col: 'audio_file_url', kind: 'scalar' },
    ],
  },
  {
    table: 'reading_items',
    idCol: 'reading_id',
    columns: [
      { col: 'cover_url', kind: 'scalar' },
      { col: 'body_full', kind: 'html' },
    ],
  },
  {
    table: 'events',
    idCol: 'event_id',
    columns: [
      { col: 'cover_url', kind: 'scalar' },
      { col: 'hero_url', kind: 'scalar' },
      { col: 'venue_image_url', kind: 'scalar' },
      { col: 'gallery_urls', kind: 'json_array', pgCast: 'jsonb' },
    ],
  },
  {
    table: 'users',
    idCol: 'user_id',
    columns: [{ col: 'avatar', kind: 'scalar' }],
  },
  {
    table: 'psychologist_documents',
    idCol: 'document_id',
    columns: [{ col: 'file_path', kind: 'scalar' }],
  },
];

function columnSpecFor(spec, colName) {
  return spec.columns.find((c) => c.col === colName);
}

function loadUploadCache() {
  try {
    const raw = fs.readFileSync(UPLOAD_CACHE_PATH, 'utf8');
    const obj = JSON.parse(raw);
    return new Map(Object.entries(obj));
  } catch {
    return new Map();
  }
}

function saveUploadCache(pathMap) {
  if (DRY_RUN) return;
  const obj = Object.fromEntries(pathMap);
  fs.writeFileSync(UPLOAD_CACHE_PATH, `${JSON.stringify(obj, null, 2)}\n`, 'utf8');
}

/**
 * node-pg передаёт JS-массив в PG как ARRAY {a,b}, а не JSON ["a","b"].
 * Для JSONB нужна JSON-строка + ::jsonb в SQL.
 */
function serializeValueForPg(colSpec, value) {
  if (colSpec.kind === 'json_array') {
    const arr = Array.isArray(value) ? value : value;
    return JSON.stringify(arr);
  }
  if (colSpec.kind === 'html' || colSpec.kind === 'scalar') {
    return value == null ? '' : String(value);
  }
  return value;
}

function logUpdateValue(table, column, id, value) {
  const preview =
    typeof value === 'string' && value.length > 120
      ? `${value.slice(0, 120)}…`
      : value;
  console.log(
    `[update] table=${table} column=${column} id=${id} typeof=${typeof value} isArray=${Array.isArray(value)} preview=${JSON.stringify(preview)}`
  );
}

function collectPathsFromRow(row, spec) {
  const paths = new Set();
  for (const col of spec.columns) {
    const val = row[col.col];
    if (val == null || val === '') continue;
    if (col.kind === 'scalar' && isLegacyServerUploadPath(val)) {
      paths.add(normalizeLegacyUploadPath(val));
    } else if (col.kind === 'json_array') {
      for (const p of extractLegacyUploadPathsFromJsonArray(val)) paths.add(p);
    } else if (col.kind === 'html') {
      for (const p of extractLegacyUploadPathsFromText(val)) {
        if (isLegacyServerUploadPath(p)) paths.add(normalizeLegacyUploadPath(p));
      }
    }
  }
  return paths;
}

function applyPathMapToRow(row, spec, pathMap) {
  const patch = {};
  for (const col of spec.columns) {
    const val = row[col.col];
    if (val == null || val === '') continue;
    if (col.kind === 'scalar') {
      if (isCloudinaryUrl(val)) continue;
      const next = replaceLegacyPathsInScalar(val, pathMap);
      if (next !== val) patch[col.col] = next;
    } else if (col.kind === 'json_array') {
      const next = replaceLegacyPathsInJsonArray(val, pathMap);
      const before =
        typeof val === 'string' ? val : JSON.stringify(val ?? []);
      const after =
        next === val ? before : JSON.stringify(Array.isArray(next) ? next : next);
      if (after !== before) patch[col.col] = Array.isArray(next) ? next : next;
    } else if (col.kind === 'html') {
      const next = replaceLegacyPathsInHtml(val, pathMap);
      if (next !== val) patch[col.col] = next;
    }
  }
  return patch;
}

async function loadAllLegacyPaths() {
  const all = new Set();
  for (const spec of TABLE_SPECS) {
    const cols = spec.columns.map((c) => c.col).join(', ');
    const { rows } = await pool.query(
      `SELECT ${spec.idCol}, ${cols} FROM ${spec.table}`
    );
    for (const row of rows) {
      for (const p of collectPathsFromRow(row, spec)) all.add(p);
    }
  }
  return [...all];
}

async function buildUploadMap(legacyPaths) {
  const pathMap = loadUploadCache();
  const missing = [];
  let uploaded = 0;
  let cacheHits = 0;

  for (const legacyPath of legacyPaths) {
    if (pathMap.has(legacyPath)) {
      cacheHits += 1;
      continue;
    }

    const abs = resolveLocalUploadFile(legacyPath, UPLOADS_DIR);
    if (!abs) {
      missing.push(legacyPath);
      continue;
    }
    if (DRY_RUN) {
      pathMap.set(legacyPath, `https://res.cloudinary.com/DRY_RUN/${path.basename(abs)}`);
      continue;
    }
    const publicId = path.basename(abs, path.extname(abs));
    const secureUrl = await uploadLocalFile(abs, {
      folder: 'burnout/legacy',
      public_id: publicId,
    });
    if (!secureUrl) {
      missing.push(legacyPath);
      continue;
    }
    pathMap.set(legacyPath, secureUrl);
    uploaded += 1;
    saveUploadCache(pathMap);
    console.log(`  OK ${legacyPath} → ${secureUrl}`);
  }

  if (!DRY_RUN && pathMap.size) saveUploadCache(pathMap);
  console.log(
    `Кэш загрузок: ${cacheHits} из кэша, ${uploaded} новых загрузок, всего в map: ${pathMap.size}`
  );

  return { pathMap, missing };
}

async function updateDatabase(pathMap) {
  let updatedRows = 0;
  for (const spec of TABLE_SPECS) {
    const cols = spec.columns.map((c) => c.col).join(', ');
    const { rows } = await pool.query(
      `SELECT ${spec.idCol}, ${cols} FROM ${spec.table}`
    );
    for (const row of rows) {
      const patch = applyPathMapToRow(row, spec, pathMap);
      const keys = Object.keys(patch);
      if (!keys.length) continue;

      if (DRY_RUN) {
        for (const k of keys) {
          const colSpec = columnSpecFor(spec, k);
          logUpdateValue(
            spec.table,
            k,
            row[spec.idCol],
            serializeValueForPg(colSpec, patch[k])
          );
        }
        console.log(`[dry-run] ${spec.table}#${row[spec.idCol]}: ${keys.join(', ')}`);
        updatedRows += 1;
        continue;
      }

      const id = row[spec.idCol];
      const sets = keys
        .map((k, i) => {
          const colSpec = columnSpecFor(spec, k);
          const cast = colSpec?.pgCast ? `::${colSpec.pgCast}` : '';
          return `${k} = $${i + 2}${cast}`;
        })
        .join(', ');
      const values = [
        id,
        ...keys.map((k) => {
          const colSpec = columnSpecFor(spec, k);
          return serializeValueForPg(colSpec, patch[k]);
        }),
      ];

      for (const k of keys) {
        const colSpec = columnSpecFor(spec, k);
        logUpdateValue(spec.table, k, id, patch[k]);
      }

      await pool.query(
        `UPDATE ${spec.table} SET ${sets} WHERE ${spec.idCol} = $1`,
        values
      );
      updatedRows += 1;
    }
  }
  return updatedRows;
}

async function main() {
  if (!isCloudinaryConfigured && !DRY_RUN) {
    console.error(
      'Cloudinary не настроен. Задайте CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET в server/.env'
    );
    process.exit(1);
  }

  console.log(`Папка загрузок: ${UPLOADS_DIR}`);
  console.log(DRY_RUN ? 'Режим: --dry-run (без загрузки и UPDATE)' : 'Режим: миграция');

  const legacyPaths = await loadAllLegacyPaths();
  console.log(`Уникальных путей /uploads/... в БД: ${legacyPaths.length}`);
  if (!legacyPaths.length) {
    console.log('Нечего мигрировать (все пути уже Cloudinary или статика).');
    await pool.end();
    return;
  }

  let pathMap;
  let missing = [];
  if (UPDATE_ONLY) {
    pathMap = loadUploadCache();
    if (!pathMap.size) {
      console.error(
        'Кэш пуст (server/scripts/.migrate-uploads-map.json). Запустите полную миграцию без --update-only.'
      );
      process.exit(1);
    }
    console.log(`--update-only: используем кэш (${pathMap.size} URL), загрузка в Cloudinary пропущена`);
  } else {
    ({ pathMap, missing } = await buildUploadMap(legacyPaths));
  }
  console.log(`Записей в pathMap: ${pathMap.size}`);
  console.log(`Файл не найден (путь в БД сохранён): ${missing.length}`);

  if (missing.length) {
    console.log('\nОтсутствующие файлы:');
    for (const p of missing.sort()) console.log(`  ${p}`);
  }

  const updatedRows = await updateDatabase(pathMap);
  console.log(`\nОбновлено записей в БД: ${updatedRows}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  pool.end().finally(() => process.exit(1));
});

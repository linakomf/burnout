const pool = require('./db');

const TABLES = [
  'films',
  'meditations',
  'music_items',
  'reading_items',
  'events',
  'podcast_episodes',
  'tests',
];

async function addAudienceColumns(table) {
  await pool.query(`
    ALTER TABLE ${table}
    ADD COLUMN IF NOT EXISTS target_role VARCHAR(16) NOT NULL DEFAULT 'all';
  `);
  await pool.query(`
    ALTER TABLE ${table}
    ADD COLUMN IF NOT EXISTS target_gender VARCHAR(16) NOT NULL DEFAULT 'all';
  `);
}

async function ensureAudienceSchema() {
  for (const table of TABLES) {
    await addAudienceColumns(table);
  }
  await pool.query(`
    ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS target_gender VARCHAR(16) NOT NULL DEFAULT 'all';
  `);
}

module.exports = { ensureAudienceSchema };

const pool = require('./db');

async function ensureReadingSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reading_items (
      reading_id SERIAL PRIMARY KEY,
      kind VARCHAR(16) NOT NULL DEFAULT 'article',
      title VARCHAR(255) NOT NULL,
      category VARCHAR(32) NOT NULL DEFAULT 'burnout',
      cover_url TEXT NOT NULL DEFAULT '',
      description_short TEXT NOT NULL DEFAULT '',
      body_full TEXT NOT NULL DEFAULT '',
      read_url TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS reading_items_kind_idx ON reading_items (kind);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS reading_items_category_idx ON reading_items (category);
  `);
}

module.exports = { ensureReadingSchema };

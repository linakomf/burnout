const pool = require('./db');

async function ensureFilmsSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS films (
      film_id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description_short TEXT NOT NULL DEFAULT '',
      description_full TEXT NOT NULL DEFAULT '',
      watch_url TEXT NOT NULL,
      poster_url TEXT NOT NULL DEFAULT '',
      gallery_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
      tags JSONB NOT NULL DEFAULT '{}'::jsonb,
      source VARCHAR(180) DEFAULT '',
      duration VARCHAR(32) DEFAULT '',
      year VARCHAR(16) DEFAULT '',
      rating VARCHAR(16) DEFAULT '',
      category_id VARCHAR(40) DEFAULT 'burnout',
      psych_tag VARCHAR(48) DEFAULT 'light',
      genres_display VARCHAR(255) DEFAULT '',
      embed_url TEXT DEFAULT '',
      director VARCHAR(255) DEFAULT '',
      screenwriter VARCHAR(255) DEFAULT '',
      country VARCHAR(255) DEFAULT '',
      quote TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS films_created_at_idx ON films (created_at DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS film_collections (
      collection_id SERIAL PRIMARY KEY,
      slug VARCHAR(64) UNIQUE NOT NULL,
      title VARCHAR(120) NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      cover_url TEXT NOT NULL DEFAULT '',
      sort_order INT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS film_collection_items (
      collection_id INT NOT NULL REFERENCES film_collections(collection_id) ON DELETE CASCADE,
      film_id INT NOT NULL REFERENCES films(film_id) ON DELETE CASCADE,
      sort_order INT NOT NULL DEFAULT 0,
      PRIMARY KEY (collection_id, film_id)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS film_collection_items_coll_idx
    ON film_collection_items (collection_id, sort_order);
  `);
}

module.exports = { ensureFilmsSchema };

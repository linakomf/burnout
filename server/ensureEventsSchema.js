const pool = require('./db');

async function ensureEventsSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      event_id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      kind VARCHAR(16) NOT NULL DEFAULT 'solo',
      filter_cat VARCHAR(32) NOT NULL DEFAULT 'other',
      category_label VARCHAR(120) NOT NULL DEFAULT '',
      price_key VARCHAR(48) NOT NULL DEFAULT 'eventsEvPriceFrom2000',
      tf_loc VARCHAR(24) NOT NULL DEFAULT 'almaty',
      tf_date VARCHAR(24) NOT NULL DEFAULT 'this_month',
      tf_time VARCHAR(24) NOT NULL DEFAULT 'evening',
      tf_mood VARCHAR(24) NOT NULL DEFAULT 'calm',
      card_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      cover_url TEXT NOT NULL DEFAULT '',
      hero_url TEXT NOT NULL DEFAULT '',
      ticket_url TEXT NOT NULL DEFAULT '',
      venue_line TEXT NOT NULL DEFAULT '',
      teaser TEXT NOT NULL DEFAULT '',
      about_text TEXT NOT NULL DEFAULT '',
      duration_label VARCHAR(64) NOT NULL DEFAULT '',
      age_label VARCHAR(64) NOT NULL DEFAULT '',
      genre_label VARCHAR(120) NOT NULL DEFAULT '',
      refund_label VARCHAR(120) NOT NULL DEFAULT '',
      venue_image_url TEXT NOT NULL DEFAULT '',
      venue_pin_text TEXT NOT NULL DEFAULT '',
      organizer_name VARCHAR(180) NOT NULL DEFAULT '',
      organizer_desc TEXT NOT NULL DEFAULT '',
      suit_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      important_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
      gallery_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS events_kind_idx ON events (kind);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS events_created_at_idx ON events (created_at DESC);
  `);

  await pool.query(`
    ALTER TABLE events
      ALTER COLUMN price_key TYPE VARCHAR(80);
  `);
}

module.exports = { ensureEventsSchema };

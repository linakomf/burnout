const pool = require('./db');
const { DEFAULT_MUSIC_COLLECTIONS } = require('./utils/musicCollectionsDefaults');

async function ensureMusicSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS music_items (
      music_id SERIAL PRIMARY KEY,
      kind VARCHAR(16) NOT NULL DEFAULT 'track',
      title VARCHAR(255) NOT NULL,
      artist VARCHAR(180) NOT NULL DEFAULT '',
      mood VARCHAR(32) NOT NULL DEFAULT 'calm',
      genre_label VARCHAR(120) NOT NULL DEFAULT '',
      description_short TEXT NOT NULL DEFAULT '',
      duration_min INT NOT NULL DEFAULT 3,
      duration_display VARCHAR(16) NOT NULL DEFAULT '3:00',
      icon_name VARCHAR(32) NOT NULL DEFAULT 'Music2',
      cover_url TEXT NOT NULL DEFAULT '',
      audio_source VARCHAR(16) NOT NULL DEFAULT 'youtube',
      audio_file_url TEXT NOT NULL DEFAULT '',
      audio_external_url TEXT NOT NULL DEFAULT '',
      youtube_embed_url TEXT NOT NULL DEFAULT '',
      youtube_video_id VARCHAR(48) NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS music_items_kind_idx ON music_items (kind);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS music_items_mood_idx ON music_items (mood);
  `);

  await pool.query(`
    ALTER TABLE music_items
    ADD COLUMN IF NOT EXISTS is_featured_pick BOOLEAN NOT NULL DEFAULT false;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS music_collections (
      collection_id SERIAL PRIMARY KEY,
      slug VARCHAR(64) UNIQUE NOT NULL,
      title VARCHAR(120) NOT NULL DEFAULT '',
      label_key VARCHAR(64) NOT NULL DEFAULT '',
      mood VARCHAR(32) NOT NULL DEFAULT 'calm_down',
      cover_url TEXT NOT NULL DEFAULT '',
      sort_order INT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    ALTER TABLE music_collections
    ADD COLUMN IF NOT EXISTS title VARCHAR(120) NOT NULL DEFAULT '';
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS music_collection_tracks (
      collection_id INT NOT NULL REFERENCES music_collections(collection_id) ON DELETE CASCADE,
      music_id INT NOT NULL REFERENCES music_items(music_id) ON DELETE CASCADE,
      sort_order INT NOT NULL DEFAULT 0,
      PRIMARY KEY (collection_id, music_id)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS music_collection_tracks_coll_idx
    ON music_collection_tracks (collection_id, sort_order);
  `);

  const labelTitles = {
    musicMoodCalm: 'Спокойствие',
    musicMoodFocus: 'Фокус',
    musicMoodMorning: 'Доброе утро',
    musicMoodSleep: 'Сон',
    musicMoodEnergy: 'Энергия',
    musicMoodNature: 'Природа',
  };

  for (const col of DEFAULT_MUSIC_COLLECTIONS) {
    const title = labelTitles[col.label_key] || col.label_key;
    await pool.query(
      `INSERT INTO music_collections (slug, title, label_key, mood, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT (slug) DO NOTHING`,
      [col.slug, title, col.label_key, col.mood, col.sort_order]
    );
  }

  await pool.query(`
    UPDATE music_collections
    SET title = CASE label_key
      WHEN 'musicMoodCalm' THEN 'Спокойствие'
      WHEN 'musicMoodFocus' THEN 'Фокус'
      WHEN 'musicMoodMorning' THEN 'Доброе утро'
      WHEN 'musicMoodSleep' THEN 'Сон'
      WHEN 'musicMoodEnergy' THEN 'Энергия'
      WHEN 'musicMoodNature' THEN 'Природа'
      ELSE COALESCE(NULLIF(title, ''), label_key)
    END
    WHERE title = '' OR title IS NULL
  `);
}

module.exports = { ensureMusicSchema };

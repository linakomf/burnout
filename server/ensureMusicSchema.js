const pool = require('./db');

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
}

module.exports = { ensureMusicSchema };

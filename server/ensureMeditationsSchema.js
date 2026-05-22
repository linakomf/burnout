const pool = require('./db');

async function ensureMeditationsSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS meditations (
      meditation_id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      kind VARCHAR(16) NOT NULL DEFAULT 'meditation',
      topics JSONB NOT NULL DEFAULT '[]'::jsonb,
      cover_url TEXT NOT NULL DEFAULT '',
      description_short TEXT NOT NULL DEFAULT '',
      duration_min INT NOT NULL DEFAULT 10,
      practice_focus VARCHAR(120) NOT NULL DEFAULT '',
      difficulty_level VARCHAR(32) NOT NULL DEFAULT 'beginner',
      tip_before TEXT NOT NULL DEFAULT '',
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
    CREATE INDEX IF NOT EXISTS meditations_kind_idx ON meditations (kind);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS meditations_created_at_idx ON meditations (created_at DESC);
  `);
}

module.exports = { ensureMeditationsSchema };

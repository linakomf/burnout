const pool = require('./db');

async function ensurePodcastsSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS podcast_episodes (
      podcast_id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      show_name VARCHAR(180) NOT NULL DEFAULT '',
      description_short TEXT NOT NULL DEFAULT '',
      meta_line VARCHAR(255) NOT NULL DEFAULT '',
      topic VARCHAR(32) NOT NULL DEFAULT 'psych',
      episode_num INT NOT NULL DEFAULT 1,
      duration_min INT NOT NULL DEFAULT 24,
      duration_display VARCHAR(16) NOT NULL DEFAULT '24:00',
      is_featured_pick BOOLEAN NOT NULL DEFAULT false,
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
    CREATE INDEX IF NOT EXISTS podcast_episodes_topic_idx ON podcast_episodes (topic);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS podcast_episodes_pick_idx ON podcast_episodes (is_featured_pick);
  `);
}

module.exports = { ensurePodcastsSchema };

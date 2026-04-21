const pool = require('./db');

async function ensurePracticeSchema() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS practice_sessions (
        session_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        practice_key VARCHAR(64) NOT NULL,
        duration_seconds INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS practice_favorites (
        user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        practice_key VARCHAR(64) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, practice_key)
      );
    `);
    console.log('✅ practice_sessions / practice_favorites готовы');
  } catch (err) {
    console.warn('⚠️ ensurePracticeSchema:', err.message);
  }
}

module.exports = { ensurePracticeSchema };

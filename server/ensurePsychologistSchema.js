const pool = require('./db');

/** Создаёт таблицу заявок к психологу */
async function ensurePsychologistSchema() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS psychologist_requests (
        request_id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        contact_method VARCHAR(20) NOT NULL,
        contact_value VARCHAR(160) NOT NULL,
        preferred_time VARCHAR(120),
        message TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ psychologist_requests готовы');
  } catch (err) {
    console.warn('⚠️ ensurePsychologistSchema:', err.message);
  }
}

module.exports = { ensurePsychologistSchema };

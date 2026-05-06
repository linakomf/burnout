const pool = require('./db');

async function ensureSupportRequestsSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS support_requests (
      request_id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      display_name VARCHAR(120) NOT NULL,
      contact VARCHAR(254) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_support_requests_created_at
      ON support_requests (created_at DESC);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_support_requests_user_id
      ON support_requests (user_id);
  `);
  console.log('✅ Таблица support_requests готова');
}

module.exports = { ensureSupportRequestsSchema };

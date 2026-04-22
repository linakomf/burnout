const pool = require('./db');

async function ensureDefaultAdmin() {
  if (String(process.env.SKIP_DEFAULT_ADMIN || '').trim() === '1') {
    return;
  }

  const email = String(process.env.DEFAULT_ADMIN_EMAIL || 'admin@com').trim().toLowerCase();
  const password = String(process.env.DEFAULT_ADMIN_PASSWORD || '123').trim();
  const name = String(process.env.DEFAULT_ADMIN_NAME || 'Администратор').trim();

  try {
    const found = await pool.query(
      `SELECT user_id FROM users WHERE LOWER(TRIM(email)) = $1`,
      [email]
    );
    if (found.rows.length === 0) {
      await pool.query(
        `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'admin')`,
        [name, email, password]
      );
    } else {
      await pool.query(
        `UPDATE users SET password = $1, role = 'admin', name = $2, email = $3 WHERE user_id = $4`,
        [password, name, email, found.rows[0].user_id]
      );
    }
    console.log(`✅ Администратор: ${email} (вход → /admin-dashboard)`);
  } catch (err) {
    console.error('❌ ensureDefaultAdmin:', err.message);
  }
}

module.exports = { ensureDefaultAdmin };
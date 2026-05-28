const pool = require('./db');

/**
 * Быстрая проверка: схема уже развёрнута (прод Neon).
 * На Vercel пропускаем тяжёлый bootstrap при холодном старте.
 */
async function isDatabaseInitialized() {
  try {
    await pool.query('SELECT user_id FROM users LIMIT 1');
    return true;
  } catch (err) {
    if (err.code === '42P01') return false;
    if (err.code === 'DB_NOT_CONFIGURED') throw err;
    throw err;
  }
}

module.exports = { isDatabaseInitialized };

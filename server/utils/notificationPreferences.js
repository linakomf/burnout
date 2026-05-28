const pool = require('../db');

async function isUserNotificationsEnabled(userId, dbOrPool) {
  const db = dbOrPool && typeof dbOrPool.query === 'function' ? dbOrPool : pool;
  const id = parseInt(userId, 10);
  if (!Number.isFinite(id)) return true;
  const result = await db.query(
    `SELECT COALESCE(notifications_enabled, TRUE) AS notifications_enabled
     FROM users WHERE user_id = $1`,
    [id]
  );
  if (!result.rows.length) return true;
  return Boolean(result.rows[0].notifications_enabled);
}

module.exports = { isUserNotificationsEnabled };

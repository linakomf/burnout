const pool = require('../db');
const { isUserNotificationsEnabled } = require('./notificationPreferences');

function mapUserNotificationRow(row) {
  if (!row) return null;
  const userConfirmed =
    row.user_confirmed === true ? true : row.user_confirmed === false ? false : null;
  return {
    notification_id: row.notification_id,
    user_id: row.user_id,
    type: row.type || 'system',
    title: row.title || '',
    body: row.body || '',
    payload: row.payload || null,
    is_read: Boolean(row.is_read),
    read_at: row.read_at || null,
    created_at: row.created_at || null,
    confirmation_id: row.confirmation_id ?? row.payload?.confirmation_id ?? null,
    user_confirmed: userConfirmed,
    responded_at: row.responded_at || null
  };
}

async function createUserNotification(dbOrPool, { userId, type = 'system', title, body, payload = null }) {
  const db = dbOrPool && typeof dbOrPool.query === 'function' ? dbOrPool : pool;
  const enabled = await isUserNotificationsEnabled(userId, db);
  if (!enabled) return null;
  const result = await db.query(
    `INSERT INTO user_notifications (user_id, type, title, body, payload)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING notification_id, user_id, type, title, body, payload, is_read, read_at, created_at`,
    [userId, type, String(title || '').trim(), String(body || '').trim(), payload]
  );
  return mapUserNotificationRow(result.rows[0]);
}

module.exports = {
  mapUserNotificationRow,
  createUserNotification
};

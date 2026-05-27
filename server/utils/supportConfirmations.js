const pool = require('../db');
const { createUserNotification } = require('./userNotifications');

const VERIFY_MILESTONES = ['contacted', 'online_consultation'];

const MILESTONE_NOTIFICATION = {
  contacted: {
    type: 'support_verify_contacted',
    title: 'Психолог связался с вами',
    body: (psychName) =>
      `Психолог ${psychName} отметил, что связался с вами. Подтвердите, пожалуйста: это так?`
  },
  online_consultation: {
    type: 'support_verify_online_consultation',
    title: 'Онлайн-консультация',
    body: (psychName) =>
      `Психолог ${psychName} отметил, что с вами провели онлайн-консультацию. Это соответствует действительности?`
  }
};

async function fetchConfirmationsByRequestIds(requestIds) {
  if (!requestIds?.length) return new Map();
  const result = await pool.query(
    `SELECT confirmation_id, request_id, milestone, psychologist_id,
            user_confirmed, responded_at, created_at
     FROM support_request_confirmations
     WHERE request_id = ANY($1::int[])
     ORDER BY created_at ASC`,
    [requestIds]
  );
  const map = new Map();
  for (const row of result.rows) {
    const list = map.get(row.request_id) || [];
    list.push({
      confirmation_id: row.confirmation_id,
      milestone: row.milestone,
      psychologist_id: row.psychologist_id,
      user_confirmed: row.user_confirmed,
      responded_at: row.responded_at,
      created_at: row.created_at
    });
    map.set(row.request_id, list);
  }
  return map;
}

async function requestUserVerification(db, {
  requestId,
  userId,
  psychologistId,
  psychologistName,
  milestone
}) {
  if (!VERIFY_MILESTONES.includes(milestone)) return null;

  const meta = MILESTONE_NOTIFICATION[milestone];
  const psychLabel = String(psychologistName || '').trim() || 'ваш психолог';

  const upsert = await db.query(
    `INSERT INTO support_request_confirmations
       (request_id, milestone, psychologist_id, user_confirmed, responded_at, notification_id)
     VALUES ($1, $2, $3, NULL, NULL, NULL)
     ON CONFLICT (request_id, milestone)
     DO UPDATE SET
       psychologist_id = EXCLUDED.psychologist_id,
       user_confirmed = NULL,
       responded_at = NULL,
       notification_id = NULL,
       created_at = CURRENT_TIMESTAMP
     RETURNING confirmation_id`,
    [requestId, milestone, psychologistId]
  );

  const confirmationId = upsert.rows[0]?.confirmation_id;
  if (!confirmationId) return null;

  const notification = await createUserNotification(db, {
    userId,
    type: meta.type,
    title: meta.title,
    body: meta.body(psychLabel),
    payload: {
      confirmation_id: confirmationId,
      request_id: requestId,
      milestone
    }
  });

  if (notification?.notification_id) {
    await db.query(
      `UPDATE support_request_confirmations
       SET notification_id = $1
       WHERE confirmation_id = $2`,
      [notification.notification_id, confirmationId]
    );
  }

  return { confirmation_id: confirmationId, notification };
}

async function maybeNotifyStatusVerification(db, {
  requestId,
  userId,
  psychologistId,
  psychologistName,
  previousStatus,
  newStatus
}) {
  if (!newStatus || newStatus === previousStatus) return null;
  if (!VERIFY_MILESTONES.includes(newStatus)) return null;

  return requestUserVerification(db, {
    requestId,
    userId,
    psychologistId,
    psychologistName,
    milestone: newStatus
  });
}

module.exports = {
  VERIFY_MILESTONES,
  MILESTONE_NOTIFICATION,
  fetchConfirmationsByRequestIds,
  requestUserVerification,
  maybeNotifyStatusVerification
};

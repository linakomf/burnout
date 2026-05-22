/**
 * Отправка приглашения психологу.
 * Если SMTP не настроен — ссылка возвращается в API для копирования админом.
 */
function buildInviteUrl(token) {
  const base = (
    process.env.PUBLIC_APP_URL ||
    process.env.CLIENT_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
  return `${base}/psychologist/invite/${encodeURIComponent(token)}`;
}

async function sendPsychologistInviteEmail({ to, inviteName, inviteUrl, organization }) {
  const payload = {
    to,
    inviteName,
    inviteUrl,
    organization: organization || ''
  };

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    console.warn(
      '[invite-email] SMTP_* заданы, но nodemailer не подключён — отправка в лог. Ссылка:',
      inviteUrl
    );
  } else {
    console.log('[psychologist-invite]', JSON.stringify(payload, null, 2));
  }

  return { sent: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER), inviteUrl };
}

module.exports = { buildInviteUrl, sendPsychologistInviteEmail };

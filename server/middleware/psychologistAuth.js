const pool = require('../db');

async function refreshUserRole(req) {
  const userId = req.user?.user_id;
  if (!userId) return null;
  const r = await pool.query(
    `SELECT u.role, pp.account_status
     FROM users u
     LEFT JOIN psychologist_profiles pp ON pp.user_id = u.user_id
     WHERE u.user_id = $1`,
    [userId]
  );
  return r.rows[0] || null;
}

const psychologistOnly = async (req, res, next) => {
  try {
    const row = await refreshUserRole(req);
    if (!row || row.role !== 'psychologist') {
      return res.status(403).json({ message: 'Доступ только для психологов' });
    }
    req.user.role = 'psychologist';
    req.psychologistStatus = row.account_status;
    return next();
  } catch (err) {
    console.error('psychologistOnly', err);
    return res.status(500).json({ message: 'Ошибка проверки прав доступа' });
  }
};

/** Психолог с подтверждённым аккаунтом */
const approvedPsychologistOnly = async (req, res, next) => {
  try {
    const row = await refreshUserRole(req);
    if (!row || row.role !== 'psychologist') {
      return res.status(403).json({ message: 'Доступ только для психологов' });
    }
    req.user.role = 'psychologist';
    req.psychologistStatus = row.account_status;
    if (row.account_status === 'blocked') {
      return res.status(403).json({ message: 'Аккаунт заблокирован' });
    }
    if (row.account_status !== 'approved') {
      return res.status(403).json({
        message: 'Аккаунт на проверке. Дождитесь подтверждения администратора.',
        account_status: row.account_status
      });
    }
    return next();
  } catch (err) {
    console.error('approvedPsychologistOnly', err);
    return res.status(500).json({ message: 'Ошибка проверки прав доступа' });
  }
};

module.exports = { psychologistOnly, approvedPsychologistOnly, refreshUserRole };

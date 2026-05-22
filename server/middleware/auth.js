const jwt = require('jsonwebtoken');
const pool = require('../db');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Токен не предоставлен' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Недействительный или просроченный токен. Войдите снова.' });
  }
};

/** Роль в JWT может устареть — сверяем с БД. */
const adminOnly = async (req, res, next) => {
  if (req.user?.role === 'admin') return next();

  const userId = req.user?.user_id;
  if (!userId) {
    return res.status(403).json({ message: 'Доступ только для администраторов' });
  }

  try {
    const r = await pool.query('SELECT role FROM users WHERE user_id = $1', [userId]);
    const role = r.rows[0]?.role;
    if (role === 'admin') {
      req.user.role = 'admin';
      return next();
    }
    return res.status(403).json({ message: 'Доступ только для администраторов' });
  } catch (err) {
    console.error('adminOnly', err);
    return res.status(500).json({ message: 'Ошибка проверки прав доступа' });
  }
};

module.exports = { authMiddleware, adminOnly };
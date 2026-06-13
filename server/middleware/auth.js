const jwt = require('jsonwebtoken');
const pool = require('../db');


async function enrichUserFromDb(decoded) {
  if (!decoded?.user_id) return decoded;
  try {
    const r = await pool.query('SELECT role, gender FROM users WHERE user_id = $1', [decoded.user_id]);
    if (!r.rows.length) return decoded;
    return {
      ...decoded,
      role: r.rows[0].role || decoded.role,
      gender: r.rows[0].gender ?? null
    };
  } catch (err) {
    console.warn('enrichUserFromDb:', err.message);
    return decoded;
  }
}

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Токен не предоставлен' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await enrichUserFromDb(decoded);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Недействительный или просроченный токен. Войдите снова.' });
  }
};


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


const optionalAuthMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await enrichUserFromDb(decoded);
    next();
  } catch {
    req.user = null;
    next();
  }
};

module.exports = { authMiddleware, adminOnly, optionalAuthMiddleware, enrichUserFromDb };

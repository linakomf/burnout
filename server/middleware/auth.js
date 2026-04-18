const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Токен не предоставлен' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const rawId = decoded.user_id ?? decoded.sub ?? decoded.id;
    const user_id = parseInt(String(rawId), 10);
    if (!Number.isFinite(user_id)) {
      return res.status(403).json({ message: 'Недействительный токен' });
    }
    req.user = { ...decoded, user_id };
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Недействительный токен' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Доступ только для администраторов' });
  }
  next();
};

module.exports = { authMiddleware, adminOnly };

const jwt = require('jsonwebtoken');

function portalAdminMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Требуется вход' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.portal_admin) {
      return res.status(403).json({ message: 'Нет доступа к панели' });
    }
    req.portalAdmin = true;
    next();
  } catch {
    return res.status(403).json({ message: 'Сессия недействительна' });
  }
}

module.exports = { portalAdminMiddleware };
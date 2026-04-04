const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const uploadsAbs = path.join(__dirname, '..', 'uploads');

// Multer setup for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsAbs),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${req.user.user_id}_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Только изображения'));
  },
});

// GET /api/users/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT user_id, name, email, role, avatar, age, created_at FROM users WHERE user_id = $1',
      [req.user.user_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Пользователь не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// PUT /api/users/me - update profile
router.put('/me', authMiddleware, async (req, res) => {
  const { name, email, age, currentPassword, newPassword } = req.body;
  const userId = req.user.user_id;

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId]);
    const user = userResult.rows[0];

    let updatedPassword = user.password;

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ message: 'Введите текущий пароль' });
      if (currentPassword !== user.password) return res.status(401).json({ message: 'Неверный текущий пароль' });
      updatedPassword = newPassword;
    }

    const result = await pool.query(
      'UPDATE users SET name=$1, email=$2, age=$3, password=$4 WHERE user_id=$5 RETURNING user_id, name, email, role, avatar, age',
      [name || user.name, email || user.email, age || user.age, updatedPassword, userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// POST /api/users/avatar
router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Файл не загружен' });
  const avatarUrl = `/uploads/${req.file.filename}`;
  await pool.query('UPDATE users SET avatar=$1 WHERE user_id=$2', [avatarUrl, req.user.user_id]);
  res.json({ avatar: avatarUrl });
});

// GET /api/users/all (admin only)
router.get('/all', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Нет доступа' });
  const result = await pool.query(
    'SELECT user_id, name, email, role, avatar, age, created_at FROM users ORDER BY created_at DESC'
  );
  res.json(result.rows);
});

// DELETE /api/users/:id (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Нет доступа' });
  await pool.query('DELETE FROM users WHERE user_id=$1', [req.params.id]);
  res.json({ message: 'Пользователь удалён' });
});

module.exports = router;
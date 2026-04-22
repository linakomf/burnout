const express = require('express');
const router = express.Router();
const pool = require('../db');
const { runOnboardingMigration } = require('../ensureOnboardingSchema');
const { authMiddleware } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const uploadsAbs = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsAbs),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${req.user.user_id}_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);else
    cb(new Error('Только изображения'));
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT user_id, name, email, role, avatar, age, created_at,
        COALESCE(onboarding_burnout_completed, false) AS onboarding_burnout_completed,
        onboarding_burnout_percent,
        onboarding_burnout_completed_at
       FROM users WHERE user_id = $1`,
      [req.user.user_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Пользователь не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

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
      `UPDATE users SET name=$1, email=$2, age=$3, password=$4 WHERE user_id=$5
       RETURNING user_id, name, email, role, avatar, age,
         COALESCE(onboarding_burnout_completed, false) AS onboarding_burnout_completed,
         onboarding_burnout_percent,
         onboarding_burnout_completed_at`,
      [name || user.name, email || user.email, age || user.age, updatedPassword, userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.post('/onboarding-burnout', authMiddleware, async (req, res) => {
  if (req.user.role === 'admin') {
    return res.status(400).json({ message: 'Для администратора не требуется' });
  }
  const userId = parseInt(req.user.user_id, 10);
  if (!Number.isFinite(userId)) {
    return res.status(400).json({ message: 'Некорректная сессия — войдите снова' });
  }

  const { answers } = req.body;
  if (!Array.isArray(answers) || answers.length !== 10) {
    return res.status(400).json({ message: 'Нужно ответить на 10 вопросов' });
  }
  const nums = answers.map((a) => parseInt(a, 10));
  if (nums.some((n) => Number.isNaN(n) || n < 0 || n > 3)) {
    return res.status(400).json({ message: 'Каждый ответ — число от 0 до 3' });
  }
  const sum = nums.reduce((s, n) => s + n, 0);
  const percent = Math.min(100, Math.max(0, Math.round(sum / 30 * 100)));
  try {
    await runOnboardingMigration();
    const result = await pool.query(
      `UPDATE users SET
        onboarding_burnout_completed = TRUE,
        onboarding_burnout_percent = $1,
        onboarding_burnout_completed_at = CURRENT_TIMESTAMP
       WHERE user_id = $2
       RETURNING user_id, name, email, role, avatar, age,
         COALESCE(onboarding_burnout_completed, false) AS onboarding_burnout_completed,
         onboarding_burnout_percent,
         onboarding_burnout_completed_at`,
      [percent, userId]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    res.json({ percent, rawScore: sum, user: result.rows[0] });
  } catch (err) {
    console.error('[onboarding-burnout]', err);
    res.status(500).json({
      message: err.code === '42703' || /column/i.test(err.message) ?
      'База не обновлена. Перезапустите сервер приложения.' :
      'Ошибка сервера при сохранении'
    });
  }
});

router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Файл не загружен' });
  const avatarUrl = `/uploads/${req.file.filename}`;
  await pool.query('UPDATE users SET avatar=$1 WHERE user_id=$2', [avatarUrl, req.user.user_id]);
  res.json({ avatar: avatarUrl });
});

router.get('/all', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Нет доступа' });
  const result = await pool.query(
    'SELECT user_id, name, email, role, avatar, age, created_at FROM users ORDER BY created_at DESC'
  );
  res.json(result.rows);
});

router.delete('/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Нет доступа' });
  await pool.query('DELETE FROM users WHERE user_id=$1', [req.params.id]);
  res.json({ message: 'Пользователь удалён' });
});

module.exports = router;
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { runOnboardingMigration } = require('../ensureOnboardingSchema');
const { runPersonalizationMigration } = require('../ensurePersonalizationSchema');
const { normalizeDailyPersonalization } = require('../utils/normalizeDailyPersonalization');
const { dbErrorToMessage } = require('../utils/dbErrorToMessage');
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
    await runPersonalizationMigration();
    const result = await pool.query(
      `SELECT user_id, name, email, role, avatar, age, created_at,
        COALESCE(onboarding_burnout_completed, false) AS onboarding_burnout_completed,
        onboarding_burnout_percent,
        onboarding_burnout_completed_at,
        daily_personalization_json
       FROM users WHERE user_id = $1`,
      [req.user.user_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Пользователь не найден' });
    const row = result.rows[0];
    const daily_personalization = normalizeDailyPersonalization(row.daily_personalization_json);
    delete row.daily_personalization_json;
    res.json({ ...row, daily_personalization });
  } catch (err) {
    const dbMessage = dbErrorToMessage(err);
    if (dbMessage) return res.status(500).json({ message: dbMessage });
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// PUT /api/users/me - update profile
router.put('/me', authMiddleware, async (req, res) => {
  const { name, email, age, currentPassword, newPassword } = req.body;
  const userId = req.user.user_id;

  try {
    await runPersonalizationMigration();
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
         onboarding_burnout_completed_at,
         daily_personalization_json`,
      [name || user.name, email || user.email, age || user.age, updatedPassword, userId]
    );

    const row = result.rows[0];
    const daily_personalization = normalizeDailyPersonalization(row.daily_personalization_json);
    delete row.daily_personalization_json;
    res.json({ ...row, daily_personalization });
  } catch (err) {
    console.error(err);
    const dbMessage = dbErrorToMessage(err);
    if (dbMessage) return res.status(500).json({ message: dbMessage });
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// POST /api/users/onboarding-burnout — первичный тест выгорания (10 вопросов)
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
  const percent = Math.min(100, Math.max(0, Math.round((sum / 30) * 100)));
  try {
    await runOnboardingMigration();
    await runPersonalizationMigration();
    const result = await pool.query(
      `UPDATE users SET
        onboarding_burnout_completed = TRUE,
        onboarding_burnout_percent = $1,
        onboarding_burnout_completed_at = CURRENT_TIMESTAMP
       WHERE user_id = $2
       RETURNING user_id, name, email, role, avatar, age,
         COALESCE(onboarding_burnout_completed, false) AS onboarding_burnout_completed,
         onboarding_burnout_percent,
         onboarding_burnout_completed_at,
         daily_personalization_json`,
      [percent, userId]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    const row = result.rows[0];
    const daily_personalization = normalizeDailyPersonalization(row.daily_personalization_json);
    delete row.daily_personalization_json;
    res.json({ percent, rawScore: sum, user: { ...row, daily_personalization } });
  } catch (err) {
    console.error('[onboarding-burnout]', err);
    res.status(500).json({
      message: err.code === '42703' || /column/i.test(err.message)
        ? 'База не обновлена. Перезапустите сервер приложения.'
        : 'Ошибка сервера при сохранении',
    });
  }
});

/** Предпочтения для советов и рекомендаций на главной (мини-тест «что вам помогает») */
router.post('/daily-personalization', authMiddleware, async (req, res) => {
  const rawId = req.user.user_id ?? req.user.sub ?? req.user.id;
  const userId = parseInt(String(rawId), 10);
  if (!Number.isFinite(userId)) {
    return res.status(400).json({ message: 'Некорректная сессия — войдите снова' });
  }

  const ALLOWED = new Set([
    'breathing',
    'movement',
    'quiet',
    'music',
    'creative',
    'social',
    'nature',
    'structure',
  ]);
  const { likes } = req.body;
  if (!Array.isArray(likes) || likes.length === 0) {
    return res.status(400).json({ message: 'Выберите хотя бы один вариант' });
  }
  if (likes.length > 8 || new Set(likes).size !== likes.length) {
    return res.status(400).json({ message: 'Некорректный набор отметок' });
  }
  if (!likes.every((id) => ALLOWED.has(String(id)))) {
    return res.status(400).json({ message: 'Неизвестный вариант' });
  }

  try {
    await runPersonalizationMigration();
    const payload = { likes, updatedAt: new Date().toISOString() };
    /* node-pg: строка JSON надёжнее объекта для ::jsonb (избегаем ошибок привязки типов) */
    const result = await pool.query(
      `UPDATE users SET daily_personalization_json = $1::jsonb
       WHERE user_id = $2
       RETURNING user_id, name, email, role, avatar, age,
         COALESCE(onboarding_burnout_completed, false) AS onboarding_burnout_completed,
         onboarding_burnout_percent,
         onboarding_burnout_completed_at,
         daily_personalization_json`,
      [JSON.stringify(payload), userId]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Пользователь не найден' });
    const row = result.rows[0];
    const daily_personalization = normalizeDailyPersonalization(row.daily_personalization_json);
    delete row.daily_personalization_json;
    res.json({ user: { ...row, daily_personalization } });
  } catch (err) {
    console.error('[daily-personalization]', err.code, err.message);
    res.status(500).json({
      message:
        err.code === '42703' || /column/i.test(err.message)
          ? 'База не обновлена. Перезапустите сервер приложения.'
          : 'Ошибка сервера при сохранении',
    });
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

// GET /api/users/with-results — админ: пользователи и результаты (эквивалент GET /api/users-with-results)
router.use('/with-results', require('./usersWithResults'));

// DELETE /api/users/:id (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Нет доступа' });
  const targetId = parseInt(req.params.id, 10);
  if (!Number.isFinite(targetId)) {
    return res.status(400).json({ message: 'Некорректный ID пользователя' });
  }
  if (targetId === Number(req.user.user_id)) {
    return res.status(400).json({ message: 'Нельзя удалить текущего администратора' });
  }
  try {
    const result = await pool.query('DELETE FROM users WHERE user_id=$1 RETURNING user_id', [targetId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    res.json({ message: 'Пользователь удалён' });
  } catch (err) {
    const dbMessage = dbErrorToMessage(err);
    if (dbMessage) return res.status(500).json({ message: dbMessage });
    console.error(err);
    res.status(500).json({ message: 'Ошибка удаления пользователя' });
  }
});

module.exports = router;
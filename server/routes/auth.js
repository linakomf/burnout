const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { normalizeDailyPersonalization } = require('../utils/normalizeDailyPersonalization');
const { dbErrorToMessage } = require('../utils/dbErrorToMessage');

function normalizeEmail(e) {
  return String(e || '').trim().toLowerCase();
}

function publicUser(u) {
  return {
    user_id: u.user_id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatar: u.avatar,
    age: u.age,
    onboarding_burnout_completed: Boolean(u.onboarding_burnout_completed),
    onboarding_burnout_percent: u.onboarding_burnout_percent ?? null,
    onboarding_burnout_completed_at: u.onboarding_burnout_completed_at ?? null,
    daily_personalization: normalizeDailyPersonalization(u.daily_personalization_json),
  };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, password, role, age } = req.body;
  const email = normalizeEmail(req.body.email);

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Заполните все обязательные поля' });
  }

  if (!['student', 'teacher'].includes(role)) {
    return res.status(400).json({ message: 'Недопустимая роль' });
  }

  try {
    const existing = await pool.query('SELECT * FROM users WHERE LOWER(TRIM(email)) = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Пользователь с таким email уже существует' });
    }

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, age)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id, name, email, role, avatar, age,
         COALESCE(onboarding_burnout_completed, false) AS onboarding_burnout_completed,
         onboarding_burnout_percent,
         onboarding_burnout_completed_at,
         daily_personalization_json`,
      [name, email, password, role, age || null]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: publicUser(user),
    });
  } catch (err) {
    console.error(err);
    const dbMessage = dbErrorToMessage(err);
    if (dbMessage) return res.status(500).json({ message: dbMessage });
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password ?? '').trim();

  if (!email || !password) {
    return res.status(400).json({ message: 'Введите email и пароль' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: 'Сервер не настроен: укажите JWT_SECRET в server/.env' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE LOWER(TRIM(email)) = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    const user = result.rows[0];
    const match = password === String(user.password ?? '').trim();
    if (!match) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: publicUser(user),
    });
  } catch (err) {
    console.error(err);
    const dbMessage = dbErrorToMessage(err);
    if (dbMessage) return res.status(500).json({ message: dbMessage });
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;
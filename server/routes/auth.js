const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, role, age } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Заполните все обязательные поля' });
  }

  if (!['student', 'teacher'].includes(role)) {
    return res.status(400).json({ message: 'Недопустимая роль' });
  }

  try {
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Пользователь с таким email уже существует' });
    }

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, age)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id, name, email, role, avatar, age,
         COALESCE(onboarding_burnout_completed, false) AS onboarding_burnout_completed,
         onboarding_burnout_percent,
         onboarding_burnout_completed_at`,
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
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        age: user.age,
        onboarding_burnout_completed: Boolean(user.onboarding_burnout_completed),
        onboarding_burnout_percent: user.onboarding_burnout_percent ?? null,
        onboarding_burnout_completed_at: user.onboarding_burnout_completed_at ?? null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Введите email и пароль' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    const user = result.rows[0];
    const match = password === user.password;
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
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        age: user.age,
        onboarding_burnout_completed: Boolean(user.onboarding_burnout_completed),
        onboarding_burnout_percent: user.onboarding_burnout_percent ?? null,
        onboarding_burnout_completed_at: user.onboarding_burnout_completed_at ?? null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;
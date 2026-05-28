const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { dbErrorToMessage } = require('../utils/dbErrorToMessage');

function normalizeEmail(raw) {
  return String(raw ?? '')
    .trim()
    .toLowerCase();
}

router.post('/register', async (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const name = String(
    body.firstName ?? body.first_name ?? body.name ?? ''
  ).trim();
  const lastName = String(body.lastName ?? body.last_name ?? '').trim();
  const email = normalizeEmail(body.email);
  const password =
    body.password != null && body.password !== '' ? String(body.password) : '';
  const age = body.age;
  let ageVal = null;
  if (age !== undefined && age !== null && age !== '') {
    const n = parseInt(String(age), 10);
    ageVal = Number.isFinite(n) ? n : null;
  }

  let insertRole = 'student';
  const roleRaw = String(body.role ?? '').trim().toLowerCase();
  if (roleRaw === 'teacher') insertRole = 'teacher';
  else if (roleRaw === 'student') insertRole = 'student';

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Заполните все обязательные поля' });
  }

  try {
    const existing = await pool.query('SELECT 1 FROM users WHERE LOWER(TRIM(email)) = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Пользователь с таким email уже существует' });
    }

    const result = await pool.query(
      `INSERT INTO users (name, last_name, email, password, role, age, gender, avatar)
       VALUES ($1, $2, $3, $4, $5, $6, NULL, NULL)
       RETURNING user_id, name, last_name, email, role, avatar, age, gender,
         COALESCE(onboarding_burnout_completed, false) AS onboarding_burnout_completed,
         onboarding_burnout_percent,
         onboarding_burnout_completed_at,
         space_preferences,
         COALESCE(has_completed_space_onboarding, false) AS has_completed_space_onboarding,
         COALESCE(notifications_enabled, true) AS notifications_enabled`,
      [name, lastName || null, email, password, insertRole, ageVal]
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
        last_name: user.last_name ?? null,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        age: user.age,
        gender: user.gender ?? null,
        onboarding_burnout_completed: Boolean(user.onboarding_burnout_completed),
        onboarding_burnout_percent: user.onboarding_burnout_percent ?? null,
        onboarding_burnout_completed_at: user.onboarding_burnout_completed_at ?? null,
        space_preferences: user.space_preferences ?? null,
        has_completed_space_onboarding: Boolean(user.has_completed_space_onboarding),
        notifications_enabled: user.notifications_enabled !== false
      }
    });
  } catch (err) {
    console.error('POST /register', err);
    const hint = dbErrorToMessage(err);
    if (hint) return res.status(503).json({ message: hint });
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Пользователь с таким email уже существует' });
    }
    if (err.code === '22001') {
      return res.status(400).json({ message: 'Слишком длинное имя, email или пароль' });
    }
    const devMsg = process.env.NODE_ENV !== 'production' ? String(err.message || '') : '';
    res.status(500).json({
      message: devMsg ? `Ошибка сервера: ${devMsg}` : 'Ошибка сервера'
    });
  }
});

router.post('/login', async (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const email = normalizeEmail(body.email);
  const password = body.password != null && body.password !== '' ? String(body.password) : '';

  if (!email || !password) {
    return res.status(400).json({ message: 'Введите email и пароль' });
  }

  try {
    const result = await pool.query(
      `SELECT u.*, pp.account_status AS psychologist_account_status
       FROM users u
       LEFT JOIN psychologist_profiles pp ON pp.user_id = u.user_id
       WHERE LOWER(TRIM(u.email)) = $1`,
      [email]
    );
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
        last_name: user.last_name ?? null,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        age: user.age,
        gender: user.gender ?? null,
        onboarding_burnout_completed:
          user.role === 'psychologist' ?
          true :
          Boolean(user.onboarding_burnout_completed),
        onboarding_burnout_percent: user.onboarding_burnout_percent ?? null,
        onboarding_burnout_completed_at: user.onboarding_burnout_completed_at ?? null,
        space_preferences: user.space_preferences ?? null,
        has_completed_space_onboarding: Boolean(user.has_completed_space_onboarding),
        psychologist_account_status: user.psychologist_account_status ?? null,
        notifications_enabled: user.notifications_enabled !== false
      }
    });
  } catch (err) {
    console.error('POST /login', err);
    const hint = dbErrorToMessage(err);
    if (hint) return res.status(503).json({ message: hint });
    const devMsg = process.env.NODE_ENV !== 'production' ? String(err.message || '') : '';
    res.status(500).json({
      message: devMsg ? `Ошибка сервера: ${devMsg}` : 'Ошибка сервера'
    });
  }
});

module.exports = router;
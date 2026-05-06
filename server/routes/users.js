const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const pool = require('../db');
const { runOnboardingMigration } = require('../ensureOnboardingSchema');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { computeTestResult } = require('../scoring');
const { bucketFromPercent, normalizeRiskLevel } = require('../utils/burnoutRisk');
const { dbErrorToMessage } = require('../utils/dbErrorToMessage');
const { normalizeRegisterAvatar, normalizeGender } = require('../utils/registerProfile');
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
      `SELECT user_id, name, email, role, avatar, age, gender, created_at,
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
  const { name, email, age, currentPassword, newPassword, role, gender, avatar } = req.body;
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

    let nextRole = user.role;
    let roleChanged = false;
    if (user.role !== 'admin' && Object.prototype.hasOwnProperty.call(req.body, 'role')) {
      const raw = role;
      if (raw !== null && raw !== undefined && String(raw).trim() !== '') {
        const r = String(raw).trim().toLowerCase();
        if (!['student', 'teacher'].includes(r)) {
          return res.status(400).json({ message: 'Выберите роль: студент или преподаватель' });
        }
        nextRole = r;
        roleChanged = nextRole !== user.role;
      }
    }

    if (user.role !== 'admin' && (!nextRole || !['student', 'teacher'].includes(nextRole))) {
      nextRole = 'student';
    }

    let nextGender = user.gender;
    if (Object.prototype.hasOwnProperty.call(req.body, 'gender')) {
      const g = normalizeGender(gender);
      if (!g) {
        return res.status(400).json({ message: 'Укажите пол: мальчик или девочка' });
      }
      nextGender = g;
    }

    let nextAvatar = user.avatar;
    if (Object.prototype.hasOwnProperty.call(req.body, 'avatar')) {
      const av = normalizeRegisterAvatar(avatar);
      if (!av) {
        return res.status(400).json({ message: 'Выберите аватар из предложенных или загрузите в профиле' });
      }
      nextAvatar = av;
    }

    const result = await pool.query(
      `UPDATE users SET name=$1, email=$2, age=$3, password=$4, role=$5, gender=$6, avatar=$7 WHERE user_id=$8
       RETURNING user_id, name, email, role, avatar, age, gender,
         COALESCE(onboarding_burnout_completed, false) AS onboarding_burnout_completed,
         onboarding_burnout_percent,
         onboarding_burnout_completed_at`,
      [
        name || user.name,
        email || user.email,
        age !== undefined && age !== null && age !== '' ? age : user.age,
        updatedPassword,
        nextRole,
        nextGender,
        nextAvatar,
        userId
      ]
    );

    const updated = result.rows[0];
    const payload = { ...updated };
    if (roleChanged && updated.role !== 'admin') {
      payload.token = jwt.sign(
        {
          user_id: updated.user_id,
          email: updated.email,
          role: updated.role,
          name: updated.name
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
    }
    res.json(payload);
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
  if (!Array.isArray(answers) || answers.length !== 9) {
    return res.status(400).json({ message: 'Нужно ответить на 9 вопросов' });
  }
  const nums = answers.map((a) => parseInt(a, 10));
  if (nums.some((n) => Number.isNaN(n) || n < 0 || n > 4)) {
    return res.status(400).json({ message: 'Каждый ответ — число от 0 до 4' });
  }
  const sum = nums.reduce((s, n) => s + n, 0);
  const percent = Math.min(100, Math.max(0, Math.round(sum / 36 * 100)));
  try {
    await runOnboardingMigration();
    const result = await pool.query(
      `UPDATE users SET
        onboarding_burnout_completed = TRUE,
        onboarding_burnout_percent = $1,
        onboarding_burnout_completed_at = CURRENT_TIMESTAMP
       WHERE user_id = $2
       RETURNING user_id, name, email, role, avatar, age, gender,
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

router.use('/with-results', require('./usersWithResults'));

router.post('/support-request', authMiddleware, async (req, res) => {
  if (req.user.role === 'admin') {
    return res.status(400).json({ message: 'Для учётной записи администратора заявка не требуется' });
  }
  const userId = parseInt(req.user.user_id, 10);
  if (!Number.isFinite(userId)) {
    return res.status(400).json({ message: 'Некорректная сессия — войдите снова' });
  }
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const displayName = String(body.name ?? '').trim().slice(0, 120);
  const contact = String(body.contact ?? '').trim().slice(0, 254);
  const message = String(body.message ?? '').trim().slice(0, 8000);
  if (!displayName || !contact || !message) {
    return res.status(400).json({ message: 'Заполните имя, контакт и сообщение' });
  }
  try {
    const ins = await pool.query(
      `INSERT INTO support_requests (user_id, display_name, contact, message)
       VALUES ($1, $2, $3, $4)
       RETURNING request_id, created_at`,
      [userId, displayName, contact, message]
    );
    res.status(201).json({ ok: true, request_id: ins.rows[0].request_id, created_at: ins.rows[0].created_at });
  } catch (err) {
    console.error('[support-request]', err);
    const hint = dbErrorToMessage(err);
    if (hint) return res.status(503).json({ message: hint });
    if (err.code === '42P01') {
      return res.status(503).json({ message: 'Таблица заявок не создана. Перезапустите сервер.' });
    }
    res.status(500).json({ message: 'Не удалось сохранить заявку' });
  }
});

router.get('/support-requests', authMiddleware, adminOnly, async (req, res) => {
  try {
    const q = await pool.query(`
      SELECT
        sr.request_id,
        sr.user_id,
        sr.display_name,
        sr.contact,
        sr.message,
        sr.created_at,
        u.email AS account_email,
        u.name AS account_name,
        u.onboarding_burnout_percent,
        u.onboarding_burnout_completed,
        u.onboarding_burnout_completed_at,
        burn.result_id AS burn_result_id,
        burn.level AS burn_level_stored,
        burn.created_at AS burn_test_at,
        burn.test_title,
        burn.scoring_type,
        burn.answers,
        burn.test_id
      FROM support_requests sr
      INNER JOIN users u ON u.user_id = sr.user_id
      LEFT JOIN LATERAL (
        SELECT tr.result_id, tr.level, tr.created_at, tr.answers, tr.test_id,
          t.title AS test_title, t.scoring_type
        FROM test_results tr
        INNER JOIN tests t ON t.test_id = tr.test_id
        WHERE tr.user_id = sr.user_id
          AND (
            t.scoring_type IN ('mbi_student', 'daily5')
            OR (t.scoring_type = 'likert_sum' AND t.title ILIKE '%выгоран%')
          )
        ORDER BY tr.created_at DESC
        LIMIT 1
      ) burn ON true
      ORDER BY sr.created_at DESC
      LIMIT 200
    `);

    const questionsCache = new Map();
    async function getQuestions(tid) {
      if (questionsCache.has(tid)) return questionsCache.get(tid);
      const r = await pool.query(
        'SELECT * FROM questions WHERE test_id = $1 ORDER BY order_num, question_id',
        [tid]
      );
      questionsCache.set(tid, r.rows);
      return r.rows;
    }

    const rows = [];
    for (const row of q.rows) {
      let catalogBurnout = null;
      if (row.burn_result_id && row.test_id) {
        try {
          const questions = await getQuestions(row.test_id);
          const testRow = { scoring_type: row.scoring_type };
          const answersObj = typeof row.answers === 'string' ? JSON.parse(row.answers || '{}') : row.answers || {};
          const computed = computeTestResult(testRow, questions, answersObj);
          const percent = computed.percentage != null ? Number(computed.percentage) : null;
          const riskLevel =
            normalizeRiskLevel(computed.level, row.scoring_type) ||
            normalizeRiskLevel(row.burn_level_stored, row.scoring_type) ||
            bucketFromPercent(percent, true);
          catalogBurnout = {
            test_title: row.test_title,
            test_date: row.burn_test_at,
            level: riskLevel,
            percent,
            scoring_type: row.scoring_type
          };
        } catch (e) {
          console.warn('[support-requests] burn compute', row.request_id, e.message);
          catalogBurnout = {
            test_title: row.test_title,
            test_date: row.burn_test_at,
            level:
              normalizeRiskLevel(row.burn_level_stored, row.scoring_type) || 'unknown',
            percent: null,
            scoring_type: row.scoring_type
          };
        }
      }

      const onboardingPercent =
        row.onboarding_burnout_percent != null ? Number(row.onboarding_burnout_percent) : null;
      const onboardingCompleted = Boolean(row.onboarding_burnout_completed);

      rows.push({
        request_id: row.request_id,
        user_id: row.user_id,
        display_name: row.display_name,
        contact: row.contact,
        message: row.message,
        created_at: row.created_at,
        account_email: row.account_email,
        account_name: row.account_name,
        onboarding: {
          completed: onboardingCompleted,
          percent: onboardingPercent,
          completed_at: row.onboarding_burnout_completed_at,
          level: bucketFromPercent(onboardingPercent, onboardingCompleted)
        },
        catalog_burnout_test: catalogBurnout
      });
    }

    res.json({ rows });
  } catch (err) {
    console.error('[support-requests]', err);
    const hint = dbErrorToMessage(err);
    if (hint) return res.status(500).json({ message: hint });
    res.status(500).json({ message: 'Не удалось загрузить обращения' });
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
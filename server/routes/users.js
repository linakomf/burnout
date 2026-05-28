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
const { mapUserNotificationRow } = require('../utils/userNotifications');
const { fetchConfirmationsByRequestIds } = require('../utils/supportConfirmations');
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
      `SELECT u.user_id, u.name, u.last_name, u.email, u.role, u.avatar, u.age, u.gender, u.created_at,
        COALESCE(u.onboarding_burnout_completed, false) AS onboarding_burnout_completed,
        u.onboarding_burnout_percent,
        u.onboarding_burnout_completed_at,
        u.space_preferences,
        COALESCE(u.has_completed_space_onboarding, false) AS has_completed_space_onboarding,
        COALESCE(u.notifications_enabled, true) AS notifications_enabled,
        pp.account_status AS psychologist_account_status,
        pp.organization AS psychologist_organization,
        pp.specialist_level AS psychologist_specialist_level
       FROM users u
       LEFT JOIN psychologist_profiles pp ON pp.user_id = u.user_id
       WHERE u.user_id = $1`,
      [req.user.user_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Пользователь не найден' });
    const row = result.rows[0];
    if (row.role === 'psychologist') {
      row.onboarding_burnout_completed = true;
    }
    if (row.space_preferences && typeof row.space_preferences === 'string') {
      try {
        row.space_preferences = JSON.parse(row.space_preferences);
      } catch {
        row.space_preferences = null;
      }
    }
    res.json(row);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.put('/me', authMiddleware, async (req, res) => {
  const { name, last_name, lastName, email, age, currentPassword, newPassword, role, gender, avatar } =
    req.body;
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
    if (user.role !== 'admin' && user.role !== 'psychologist' && Object.prototype.hasOwnProperty.call(req.body, 'role')) {
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

    if (user.role === 'psychologist') {
      nextRole = 'psychologist';
    } else if (user.role !== 'admin' && (!nextRole || !['student', 'teacher'].includes(nextRole))) {
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

    const nextLastName = Object.prototype.hasOwnProperty.call(req.body, 'last_name')
      ? String(last_name ?? lastName ?? '').trim().slice(0, 120)
      : user.last_name;

    const result = await pool.query(
      `UPDATE users SET name=$1, last_name=$2, email=$3, age=$4, password=$5, role=$6, gender=$7, avatar=$8 WHERE user_id=$9
       RETURNING user_id, name, last_name, email, role, avatar, age, gender,
         COALESCE(onboarding_burnout_completed, false) AS onboarding_burnout_completed,
         onboarding_burnout_percent,
         onboarding_burnout_completed_at,
         COALESCE(notifications_enabled, true) AS notifications_enabled`,
      [
        name || user.name,
        nextLastName || null,
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

/** Подбор пространства (не психодиагностика) — предпочтения для рекомендаций на главной. */
router.put('/me/space-preferences', authMiddleware, async (req, res) => {
  const userId = req.user.user_id;
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const prefs = body.spacePreferences != null ? body.spacePreferences : body.space_preferences;
  const completedRaw = body.hasCompletedSpaceOnboarding ?? body.has_completed_space_onboarding;

  if (!prefs || typeof prefs !== 'object' || Array.isArray(prefs)) {
    return res.status(400).json({ message: 'Укажите объект spacePreferences' });
  }

  const completed =
    completedRaw === true || completedRaw === 'true' || completedRaw === 1 || completedRaw === '1';

  try {
    const result = await pool.query(
      `UPDATE users
       SET space_preferences = $1::jsonb,
           has_completed_space_onboarding = has_completed_space_onboarding OR $2::boolean
       WHERE user_id = $3
       RETURNING user_id, name, email, role, avatar, age, gender,
         COALESCE(onboarding_burnout_completed, false) AS onboarding_burnout_completed,
         onboarding_burnout_percent,
         onboarding_burnout_completed_at,
         space_preferences,
         COALESCE(has_completed_space_onboarding, false) AS has_completed_space_onboarding`,
      [JSON.stringify(prefs), completed, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Пользователь не найден' });
    const row = result.rows[0];
    if (row.space_preferences && typeof row.space_preferences === 'string') {
      try {
        row.space_preferences = JSON.parse(row.space_preferences);
      } catch {
        row.space_preferences = null;
      }
    }
    res.json(row);
  } catch (err) {
    console.error('[PUT /me/space-preferences]', err);
    const hint = dbErrorToMessage(err);
    if (hint) return res.status(503).json({ message: hint });
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.put('/me/notifications-enabled', authMiddleware, async (req, res) => {
  const userId = parseInt(req.user.user_id, 10);
  const enabledRaw = req.body?.enabled ?? req.body?.notifications_enabled;

  if (!Number.isFinite(userId)) {
    return res.status(400).json({ message: 'Некорректная сессия - войдите снова' });
  }
  if (typeof enabledRaw !== 'boolean') {
    return res.status(400).json({ message: 'Укажите enabled: true или false' });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET notifications_enabled = $1::boolean
       WHERE user_id = $2
       RETURNING user_id, COALESCE(notifications_enabled, TRUE) AS notifications_enabled`,
      [enabledRaw, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Пользователь не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[PUT /me/notifications-enabled]', err);
    const hint = dbErrorToMessage(err);
    if (hint) return res.status(503).json({ message: hint });
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/notifications', authMiddleware, async (req, res) => {
  const userId = parseInt(req.user.user_id, 10);
  const rawLimit = parseInt(req.query?.limit, 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 50;

  if (!Number.isFinite(userId)) {
    return res.status(400).json({ message: 'Некорректная сессия - войдите снова' });
  }

  try {
    const pref = await pool.query(
      `SELECT COALESCE(notifications_enabled, TRUE) AS notifications_enabled FROM users WHERE user_id = $1`,
      [userId]
    );
    if (!pref.rows.length) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    if (!pref.rows[0].notifications_enabled) {
      return res.json({ rows: [], unread_count: 0, notifications_enabled: false });
    }

    const result = await pool.query(
      `SELECT n.notification_id, n.user_id, n.type, n.title, n.body, n.payload,
              n.is_read, n.read_at, n.created_at,
              c.confirmation_id, c.user_confirmed, c.responded_at
       FROM user_notifications n
       LEFT JOIN support_request_confirmations c ON c.notification_id = n.notification_id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    const rows = result.rows.map(mapUserNotificationRow);
    res.json({
      rows,
      unread_count: rows.reduce((sum, row) => sum + (row.is_read ? 0 : 1), 0),
      notifications_enabled: true
    });
  } catch (err) {
    console.error('[notifications list]', err);
    res.status(500).json({ message: 'Не удалось загрузить уведомления' });
  }
});

router.post('/support-confirmations/:confirmationId/respond', authMiddleware, async (req, res) => {
  const userId = parseInt(req.user.user_id, 10);
  const confirmationId = parseInt(req.params.confirmationId, 10);
  const confirmed = req.body?.confirmed;

  if (!Number.isFinite(userId)) {
    return res.status(400).json({ message: 'Некорректная сессия - войдите снова' });
  }
  if (!Number.isFinite(confirmationId)) {
    return res.status(400).json({ message: 'Некорректный id подтверждения' });
  }
  if (confirmed !== true && confirmed !== false) {
    return res.status(400).json({ message: 'Укажите confirmed: true или false' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query(
      `SELECT c.confirmation_id, c.user_confirmed, sr.user_id
       FROM support_request_confirmations c
       INNER JOIN support_requests sr ON sr.request_id = c.request_id
       WHERE c.confirmation_id = $1`,
      [confirmationId]
    );
    if (!found.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Подтверждение не найдено' });
    }
    const row = found.rows[0];
    if (row.user_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'Нет доступа' });
    }
    if (row.user_confirmed !== null) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Вы уже ответили на этот вопрос' });
    }

    await client.query(
      `UPDATE support_request_confirmations
       SET user_confirmed = $1,
           responded_at = CURRENT_TIMESTAMP
       WHERE confirmation_id = $2`,
      [confirmed, confirmationId]
    );
    await client.query(
      `UPDATE user_notifications
       SET is_read = TRUE,
           read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
       WHERE notification_id IN (
         SELECT notification_id FROM support_request_confirmations WHERE confirmation_id = $1
       )`,
      [confirmationId]
    );
    await client.query('COMMIT');
    res.json({ ok: true, user_confirmed: confirmed });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[support-confirmation respond]', err);
    const hint = dbErrorToMessage(err);
    if (hint) return res.status(503).json({ message: hint });
    res.status(500).json({ message: 'Не удалось сохранить ответ' });
  } finally {
    client.release();
  }
});

router.patch('/notifications/read-all', authMiddleware, async (req, res) => {
  const userId = parseInt(req.user.user_id, 10);
  if (!Number.isFinite(userId)) {
    return res.status(400).json({ message: 'Некорректная сессия - войдите снова' });
  }

  try {
    const result = await pool.query(
      `UPDATE user_notifications
       SET is_read = TRUE,
           read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );
    res.json({ ok: true, updated: result.rowCount || 0 });
  } catch (err) {
    console.error('[notifications read-all]', err);
    res.status(500).json({ message: 'Не удалось обновить уведомления' });
  }
});

router.post('/onboarding-burnout', authMiddleware, async (req, res) => {
  if (req.user.role === 'admin' || req.user.role === 'psychologist') {
    return res.status(400).json({ message: 'Для этой учётной записи не требуется' });
  }
  const userId = parseInt(req.user.user_id, 10);
  if (!Number.isFinite(userId)) {
    return res.status(400).json({ message: 'Некорректная сессия - войдите снова' });
  }

  const { answers } = req.body;
  if (!Array.isArray(answers) || answers.length !== 9) {
    return res.status(400).json({ message: 'Нужно ответить на 9 вопросов' });
  }
  const nums = answers.map((a) => parseInt(a, 10));
  if (nums.some((n) => Number.isNaN(n) || n < 0 || n > 4)) {
    return res.status(400).json({ message: 'Каждый ответ - число от 0 до 4' });
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
  if (req.user.role === 'admin' || req.user.role === 'psychologist') {
    return res.status(400).json({ message: 'Для этой учётной записи заявка не требуется' });
  }
  const userId = parseInt(req.user.user_id, 10);
  if (!Number.isFinite(userId)) {
    return res.status(400).json({ message: 'Некорректная сессия - войдите снова' });
  }
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const displayName = String(body.name ?? '').trim().slice(0, 120);
  const contact = String(body.contact ?? '').trim().slice(0, 254);
  const whatsappRaw = String(body.whatsapp ?? '').trim();
  const whatsapp = whatsappRaw ? whatsappRaw.slice(0, 40) : null;
  const message = String(body.message ?? '').trim().slice(0, 8000);
  if (!displayName || !contact || !message) {
    return res.status(400).json({ message: 'Заполните имя, контакт и сообщение' });
  }
  try {
    const ins = await pool.query(
      `INSERT INTO support_requests (user_id, display_name, contact, whatsapp, message, status)
       VALUES ($1, $2, $3, $4, $5, 'new')
       RETURNING request_id, created_at`,
      [userId, displayName, contact, whatsapp, message]
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
        sr.whatsapp,
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

    const confirmationsMap = await fetchConfirmationsByRequestIds(
      q.rows.map((r) => r.request_id)
    );

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
        whatsapp: row.whatsapp ?? null,
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
        catalog_burnout_test: catalogBurnout,
        confirmations: confirmationsMap.get(row.request_id) || []
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
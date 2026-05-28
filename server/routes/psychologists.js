const express = require('express');
const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { approvedPsychologistOnly, psychologistOnly } = require('../middleware/psychologistAuth');
const { dbErrorToMessage } = require('../utils/dbErrorToMessage');
const { buildInviteUrl, sendPsychologistInviteEmail } = require('../utils/sendInviteEmail');
const {
  SUPPORT_SELECT_CORE,
  SUPPORT_FROM_JOIN,
  enrichSupportRows,
  fetchUserTestHistory,
  fetchRecentCheckins
} = require('../utils/enrichSupportRequest');
const { createUserNotification } = require('../utils/userNotifications');
const { maybeNotifyStatusVerification } = require('../utils/supportConfirmations');

const router = express.Router();
const uploadsAbs = path.join(__dirname, '..', 'uploads');

const REQUEST_STATUSES = ['new', 'contacted', 'online_consultation', 'in_progress', 'completed'];
const ACCOUNT_STATUSES = ['pending_review', 'approved', 'rejected', 'blocked'];

const inviteStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsAbs),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const kind = file.fieldname === 'avatar' ? 'psych_avatar' : 'psych_doc';
    cb(null, `${kind}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`);
  }
});

const inviteUpload = multer({
  storage: inviteStorage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'avatar') {
      if (file.mimetype.startsWith('image/')) return cb(null, true);
      return cb(new Error('Аватар: только изображения'));
    }
    const ok =
      file.mimetype.startsWith('image/') ||
      file.mimetype === 'application/pdf' ||
      file.mimetype.startsWith('application/');
    if (ok) return cb(null, true);
    cb(new Error('Документы: изображения или PDF'));
  }
});

const profileUpload = multer({
  storage: inviteStorage,
  limits: { fileSize: 12 * 1024 * 1024 }
});

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function getPsychologistProfile(userId) {
  const r = await pool.query(
    `SELECT pp.*, u.name, u.email, u.avatar, u.created_at AS user_created_at
     FROM psychologist_profiles pp
     INNER JOIN users u ON u.user_id = pp.user_id
     WHERE pp.user_id = $1`,
    [userId]
  );
  return r.rows[0] || null;
}

async function getPsychologistDocuments(userId) {
  const r = await pool.query(
    `SELECT document_id, file_path, original_name, created_at
     FROM psychologist_documents WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return r.rows;
}

// —— Public: приглашение ——
router.get('/invitations/:token', async (req, res) => {
  try {
    const token = String(req.params.token || '').trim();
    const r = await pool.query(
      `SELECT invitation_id, email, invite_name, work_phone, organization, specialist_level,
              expires_at, used_at
       FROM psychologist_invitations WHERE token = $1`,
      [token]
    );
    if (!r.rows.length) return res.status(404).json({ message: 'Приглашение не найдено' });
    const inv = r.rows[0];
    if (inv.used_at) return res.status(410).json({ message: 'Приглашение уже использовано' });
    if (new Date(inv.expires_at) < new Date()) {
      return res.status(410).json({ message: 'Срок приглашения истёк' });
    }
    res.json({
      email: inv.email,
      invite_name: inv.invite_name,
      work_phone: inv.work_phone,
      organization: inv.organization,
      specialist_level: inv.specialist_level,
      expires_at: inv.expires_at
    });
  } catch (err) {
    console.error('[invitation preview]', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.post(
  '/complete-invite',
  inviteUpload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'documents', maxCount: 10 }
  ]),
  async (req, res) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const token = String(body.token || '').trim();
    const name = String(body.name || '').trim().slice(0, 120);
    const password = String(body.password || '');
    const education = String(body.education || '').trim().slice(0, 2000);
    const specialization = String(body.specialization || '').trim().slice(0, 200);
    const experienceYears = parseInt(body.experience_years, 10);
    const bio = String(body.bio || '').trim().slice(0, 4000);
    const whatsapp = String(body.whatsapp || '').trim().slice(0, 40);

    if (!token || !name || password.length < 6) {
      return res.status(400).json({ message: 'Укажите ФИО и пароль (минимум 6 символов)' });
    }
    if (!education || !specialization) {
      return res.status(400).json({ message: 'Укажите образование и специализацию' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const invQ = await client.query(
        `SELECT * FROM psychologist_invitations WHERE token = $1 FOR UPDATE`,
        [token]
      );
      if (!invQ.rows.length) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Приглашение не найдено' });
      }
      const inv = invQ.rows[0];
      if (inv.used_at) {
        await client.query('ROLLBACK');
        return res.status(410).json({ message: 'Приглашение уже использовано' });
      }
      if (new Date(inv.expires_at) < new Date()) {
        await client.query('ROLLBACK');
        return res.status(410).json({ message: 'Срок приглашения истёк' });
      }

      const email = normalizeEmail(inv.email);
      const exists = await client.query('SELECT user_id FROM users WHERE LOWER(email) = $1', [email]);
      if (exists.rows.length) {
        await client.query('ROLLBACK');
        return res.status(409).json({ message: 'Пользователь с таким email уже зарегистрирован' });
      }

      const avatarFile = req.files?.avatar?.[0];
      const avatarPath = avatarFile ? `/uploads/${avatarFile.filename}` : null;

      const userIns = await client.query(
        `INSERT INTO users (name, email, password, role, avatar)
         VALUES ($1, $2, $3, 'psychologist', $4)
         RETURNING user_id, name, email, role, avatar`,
        [name, email, password, avatarPath]
      );
      const user = userIns.rows[0];

      await client.query(
        `INSERT INTO psychologist_profiles (
          user_id, account_status, organization, specialist_level, work_phone, whatsapp,
          education, specialization, experience_years, bio, invited_by, invitation_id
        ) VALUES ($1, 'pending_review', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          user.user_id,
          inv.organization,
          inv.specialist_level,
          inv.work_phone,
          whatsapp || inv.work_phone,
          education,
          specialization,
          Number.isFinite(experienceYears) ? experienceYears : null,
          bio,
          inv.invited_by,
          inv.invitation_id
        ]
      );

      const docs = req.files?.documents || [];
      for (const f of docs) {
        await client.query(
          `INSERT INTO psychologist_documents (user_id, file_path, original_name)
           VALUES ($1, $2, $3)`,
          [user.user_id, `/uploads/${f.filename}`, f.originalname]
        );
      }

      await client.query(
        `UPDATE psychologist_invitations
         SET used_at = CURRENT_TIMESTAMP, used_by_user_id = $1
         WHERE invitation_id = $2`,
        [user.user_id, inv.invitation_id]
      );

      await client.query('COMMIT');

      const jwtToken = jwt.sign(
        { user_id: user.user_id, email: user.email, role: user.role, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        token: jwtToken,
        user: {
          ...user,
          account_status: 'pending_review',
          onboarding_burnout_completed: true
        }
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[complete-invite]', err);
      const hint = dbErrorToMessage(err);
      if (hint) return res.status(503).json({ message: hint });
      res.status(500).json({ message: 'Не удалось завершить регистрацию' });
    } finally {
      client.release();
    }
  }
);

// —— Admin ——
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const q = await pool.query(`
      SELECT
        u.user_id, u.name, u.email, u.avatar, u.created_at,
        pp.account_status, pp.organization, pp.specialist_level, pp.work_phone,
        pp.whatsapp, pp.reviewed_at,
        (SELECT COUNT(*)::int FROM support_requests sr
         WHERE sr.assigned_psychologist_id = u.user_id) AS assigned_count,
        (SELECT COUNT(*)::int FROM support_requests sr
         WHERE sr.assigned_psychologist_id = u.user_id AND sr.status NOT IN ('completed')) AS active_requests,
        (SELECT COUNT(*)::int FROM psychologist_documents d WHERE d.user_id = u.user_id) AS documents_count
      FROM users u
      INNER JOIN psychologist_profiles pp ON pp.user_id = u.user_id
      WHERE u.role = 'psychologist'
      ORDER BY u.created_at DESC
    `);
    res.json({ psychologists: q.rows });
  } catch (err) {
    console.error('[psychologists list]', err);
    res.status(500).json({ message: 'Не удалось загрузить список' });
  }
});

router.get('/stats/overview', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [psych, requests] = await Promise.all([
      pool.query(`
        SELECT account_status, COUNT(*)::int AS n
        FROM psychologist_profiles GROUP BY account_status
      `),
      pool.query(`
        SELECT status, COUNT(*)::int AS n
        FROM support_requests GROUP BY status
      `)
    ]);
    res.json({
      psychologists_by_status: psych.rows,
      requests_by_status: requests.rows
    });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка статистики' });
  }
});

router.post('/invitations', authMiddleware, adminOnly, async (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const inviteName = String(body.name || '').trim().slice(0, 120);
  const email = normalizeEmail(body.email);
  const workPhone = String(body.work_phone || '').trim().slice(0, 40);
  const organization = String(body.organization || '').trim().slice(0, 200);
  const specialistLevel = String(body.specialist_level || '').trim().slice(0, 120);

  if (!inviteName || !email) {
    return res.status(400).json({ message: 'Укажите имя и email' });
  }

  try {
    const pending = await pool.query(
      `SELECT invitation_id FROM psychologist_invitations
       WHERE LOWER(email) = $1 AND used_at IS NULL AND expires_at > NOW()`,
      [email]
    );
    if (pending.rows.length) {
      return res.status(409).json({ message: 'Активное приглашение для этого email уже есть' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const ins = await pool.query(
      `INSERT INTO psychologist_invitations (
        token, email, invite_name, work_phone, organization, specialist_level, invited_by, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING invitation_id, expires_at`,
      [
        token,
        email,
        inviteName,
        workPhone || null,
        organization || null,
        specialistLevel || null,
        req.user.user_id,
        expiresAt
      ]
    );

    const inviteUrl = buildInviteUrl(token);
    const mail = await sendPsychologistInviteEmail({
      to: email,
      inviteName,
      inviteUrl,
      organization
    });

    res.status(201).json({
      invitation_id: ins.rows[0].invitation_id,
      expires_at: ins.rows[0].expires_at,
      invite_url: inviteUrl,
      email_sent: mail.sent
    });
  } catch (err) {
    console.error('[invite psychologist]', err);
    res.status(500).json({ message: 'Не удалось создать приглашение' });
  }
});

// Обращения для админа (маршруты до /:userId, чтобы не перехватывались параметром)
router.get('/support-requests/all', authMiddleware, adminOnly, async (req, res) => {
  try {
    const q = await pool.query(
      `SELECT ${SUPPORT_SELECT_CORE} ${SUPPORT_FROM_JOIN}
       ORDER BY sr.created_at DESC LIMIT 200`
    );
    const rows = await enrichSupportRows(q.rows);
    res.json({ rows });
  } catch (err) {
    console.error('[admin support requests]', err);
    res.status(500).json({ message: 'Не удалось загрузить обращения' });
  }
});

router.patch('/support-requests/:requestId/assign', authMiddleware, adminOnly, async (req, res) => {
  const requestId = parseInt(req.params.requestId, 10);
  const rawPsychId = req.body?.psychologist_id;
  const psychologistId =
    rawPsychId === null || rawPsychId === undefined || rawPsychId === '' ?
    null :
    parseInt(rawPsychId, 10);
  const adminId = parseInt(req.user.user_id, 10);

  if (!Number.isFinite(requestId)) {
    return res.status(400).json({ message: 'Некорректный id обращения' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const requestQ = await client.query(
      `SELECT request_id, user_id, assigned_psychologist_id
       FROM support_requests
       WHERE request_id = $1
       FOR UPDATE`,
      [requestId]
    );
    if (!requestQ.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Обращение не найдено' });
    }

    const currentRequest = requestQ.rows[0];
    let assignedPsychologistName = null;

    if (psychologistId != null) {
      if (!Number.isFinite(psychologistId)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Некорректный id психолога' });
      }
      const p = await client.query(
        `SELECT u.user_id, u.name FROM users u
         INNER JOIN psychologist_profiles pp ON pp.user_id = u.user_id
         WHERE u.user_id = $1 AND u.role = 'psychologist' AND pp.account_status = 'approved'`,
        [psychologistId]
      );
      if (!p.rows.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: 'Психолог не найден или не подтверждён. Сначала подтвердите аккаунт во вкладке «Список психологов».'
        });
      }
      assignedPsychologistName = p.rows[0].name || 'назначенный психолог';
    }

    let r;
    if (psychologistId != null && Number.isFinite(psychologistId)) {
      if (!Number.isFinite(adminId)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Некорректная сессия администратора' });
      }
      r = await client.query(
        `UPDATE support_requests SET
          assigned_psychologist_id = $1,
          assigned_at = CURRENT_TIMESTAMP,
          assigned_by = $2
         WHERE request_id = $3
         RETURNING request_id, assigned_psychologist_id, assigned_at`,
        [psychologistId, adminId, requestId]
      );

      if (currentRequest.assigned_psychologist_id !== psychologistId) {
        await createUserNotification(client, {
          userId: currentRequest.user_id,
          type: 'psychologist_assigned',
          title: 'Заявка принята',
          body: `Мы получили вашу заявку и назначили психолога ${assignedPsychologistName}. Он свяжется с вами в ближайшее время.`,
          payload: {
            request_id: requestId,
            psychologist_id: psychologistId,
            psychologist_name: assignedPsychologistName
          }
        });
      }
    } else {
      r = await client.query(
        `UPDATE support_requests SET
          assigned_psychologist_id = NULL,
          assigned_at = NULL,
          assigned_by = NULL
         WHERE request_id = $1
         RETURNING request_id, assigned_psychologist_id, assigned_at`,
        [requestId]
      );
    }

    if (!r.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Обращение не найдено' });
    }
    await client.query('COMMIT');
    res.json(r.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[assign support-request]', err);
    const hint = dbErrorToMessage(err);
    res.status(500).json({ message: hint || 'Не удалось назначить' });
  } finally {
    client.release();
  }
});

router.patch('/:userId/status', authMiddleware, adminOnly, async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const status = String(req.body?.status || '').trim();
  const reviewNote = String(req.body?.review_note || '').trim().slice(0, 500);

  if (!Number.isFinite(userId) || !ACCOUNT_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Некорректный статус' });
  }

  try {
    const r = await pool.query(
      `UPDATE psychologist_profiles SET
        account_status = $1,
        reviewed_by = $2,
        reviewed_at = CURRENT_TIMESTAMP,
        review_note = COALESCE(NULLIF($3, ''), review_note),
        updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $4
       RETURNING user_id, account_status`,
      [status, req.user.user_id, reviewNote, userId]
    );
    if (!r.rows.length) return res.status(404).json({ message: 'Психолог не найден' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Не удалось обновить статус' });
  }
});

router.delete('/:userId', authMiddleware, adminOnly, async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (!Number.isFinite(userId)) return res.status(400).json({ message: 'Некорректный id' });
  try {
    await pool.query('DELETE FROM users WHERE user_id = $1 AND role = $2', [userId, 'psychologist']);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Не удалось удалить' });
  }
});

router.put('/:userId', authMiddleware, adminOnly, async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  if (!Number.isFinite(userId)) return res.status(400).json({ message: 'Некорректный id' });

  try {
    await pool.query(
      `UPDATE users SET name = COALESCE(NULLIF($1, ''), name), email = COALESCE(NULLIF($2, ''), email)
       WHERE user_id = $3 AND role = 'psychologist'`,
      [String(body.name || '').trim(), normalizeEmail(body.email), userId]
    );
    await pool.query(
      `UPDATE psychologist_profiles SET
        organization = COALESCE(NULLIF($1, ''), organization),
        specialist_level = COALESCE(NULLIF($2, ''), specialist_level),
        work_phone = COALESCE(NULLIF($3, ''), work_phone),
        updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $4`,
      [
        String(body.organization || '').trim(),
        String(body.specialist_level || '').trim(),
        String(body.work_phone || '').trim(),
        userId
      ]
    );
    const profile = await getPsychologistProfile(userId);
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Не удалось сохранить' });
  }
});

router.get('/:userId/documents', authMiddleware, adminOnly, async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  try {
    const docs = await getPsychologistDocuments(userId);
    res.json({ documents: docs });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка загрузки документов' });
  }
});

// —— Psychologist cabinet ——
router.get('/me/status', authMiddleware, psychologistOnly, async (req, res) => {
  const profile = await getPsychologistProfile(req.user.user_id);
  if (!profile) return res.status(404).json({ message: 'Профиль не найден' });
  res.json({
    account_status: profile.account_status,
    name: profile.name,
    email: profile.email
  });
});

router.get('/me/requests', authMiddleware, approvedPsychologistOnly, async (req, res) => {
  const psychId = req.user.user_id;
  try {
    const q = await pool.query(
      `SELECT ${SUPPORT_SELECT_CORE} ${SUPPORT_FROM_JOIN}
       WHERE sr.assigned_psychologist_id = $1
       ORDER BY sr.created_at DESC`,
      [psychId]
    );
    const rows = await enrichSupportRows(q.rows);

    const notesQ = await pool.query(
      `SELECT note_id, request_id, body, created_at, updated_at
       FROM support_request_notes
       WHERE psychologist_id = $1
       ORDER BY created_at DESC`,
      [psychId]
    );
    const notesByRequest = {};
    for (const n of notesQ.rows) {
      if (!notesByRequest[n.request_id]) notesByRequest[n.request_id] = [];
      notesByRequest[n.request_id].push(n);
    }

    const statsQ = await pool.query(
      `SELECT status, COUNT(*)::int AS n
       FROM support_requests WHERE assigned_psychologist_id = $1
       GROUP BY status`,
      [psychId]
    );

    res.json({
      rows: rows.map((r) => ({ ...r, notes: notesByRequest[r.request_id] || [] })),
      stats_by_status: statsQ.rows
    });
  } catch (err) {
    console.error('[psych requests]', err);
    res.status(500).json({ message: 'Не удалось загрузить обращения' });
  }
});

router.get('/me/requests/:requestId', authMiddleware, approvedPsychologistOnly, async (req, res) => {
  const psychId = req.user.user_id;
  const requestId = parseInt(req.params.requestId, 10);
  try {
    const q = await pool.query(
      `SELECT ${SUPPORT_SELECT_CORE} ${SUPPORT_FROM_JOIN}
       WHERE sr.request_id = $1 AND sr.assigned_psychologist_id = $2`,
      [requestId, psychId]
    );
    if (!q.rows.length) return res.status(404).json({ message: 'Обращение не найдено' });
    const [row] = await enrichSupportRows(q.rows);
    const testHistory = await fetchUserTestHistory(row.user_id, 10);
    const checkins = await fetchRecentCheckins(row.user_id, 5);
    const notesQ = await pool.query(
      `SELECT note_id, body, created_at, updated_at
       FROM support_request_notes
       WHERE request_id = $1 AND psychologist_id = $2
       ORDER BY created_at DESC`,
      [requestId, psychId]
    );
    res.json({ ...row, test_history: testHistory, recent_checkins: checkins, notes: notesQ.rows });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка загрузки' });
  }
});

router.patch('/me/requests/:requestId', authMiddleware, approvedPsychologistOnly, async (req, res) => {
  const psychId = req.user.user_id;
  const requestId = parseInt(req.params.requestId, 10);
  const status = req.body?.status != null ? String(req.body.status).trim() : null;
  const noteBody = req.body?.note != null ? String(req.body.note).trim() : null;

  if (status && !REQUEST_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Некорректный статус' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const own = await client.query(
      `SELECT request_id, user_id, status AS previous_status
       FROM support_requests
       WHERE request_id = $1 AND assigned_psychologist_id = $2`,
      [requestId, psychId]
    );
    if (!own.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Обращение не найдено' });
    }

    const row = own.rows[0];
    if (status) {
      await client.query(`UPDATE support_requests SET status = $1 WHERE request_id = $2`, [
        status,
        requestId
      ]);
      await maybeNotifyStatusVerification(client, {
        requestId,
        userId: row.user_id,
        psychologistId: psychId,
        psychologistName: req.user.name,
        previousStatus: row.previous_status,
        newStatus: status
      });
    }

    if (noteBody) {
      await client.query(
        `INSERT INTO support_request_notes (request_id, psychologist_id, body)
         VALUES ($1, $2, $3)`,
        [requestId, psychId, noteBody.slice(0, 8000)]
      );
    }

    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[psych update request]', err);
    res.status(500).json({ message: 'Не удалось сохранить' });
  } finally {
    client.release();
  }
});

router.get('/me/profile', authMiddleware, psychologistOnly, async (req, res) => {
  const profile = await getPsychologistProfile(req.user.user_id);
  if (!profile) return res.status(404).json({ message: 'Профиль не найден' });
  const documents = await getPsychologistDocuments(req.user.user_id);
  res.json({ profile, documents });
});

router.put(
  '/me/profile',
  authMiddleware,
  psychologistOnly,
  profileUpload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'documents', maxCount: 10 }
  ]),
  async (req, res) => {
    const userId = req.user.user_id;
    const body = req.body && typeof req.body === 'object' ? req.body : {};

    try {
      const avatarFile = req.files?.avatar?.[0];
      if (avatarFile) {
        await pool.query(`UPDATE users SET avatar = $1 WHERE user_id = $2`, [
          `/uploads/${avatarFile.filename}`,
          userId
        ]);
      }

      if (body.name) {
        await pool.query(`UPDATE users SET name = $1 WHERE user_id = $2`, [
          String(body.name).trim().slice(0, 120),
          userId
        ]);
      }

      await pool.query(
        `UPDATE psychologist_profiles SET
          whatsapp = COALESCE(NULLIF($1, ''), whatsapp),
          education = COALESCE(NULLIF($2, ''), education),
          specialization = COALESCE(NULLIF($3, ''), specialization),
          experience_years = COALESCE($4, experience_years),
          bio = COALESCE(NULLIF($5, ''), bio),
          work_phone = COALESCE(NULLIF($6, ''), work_phone),
          updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $7`,
        [
          String(body.whatsapp || '').trim(),
          String(body.education || '').trim(),
          String(body.specialization || '').trim(),
          body.experience_years !== undefined && body.experience_years !== ''
            ? parseInt(body.experience_years, 10)
            : null,
          String(body.bio || '').trim(),
          String(body.work_phone || '').trim(),
          userId
        ]
      );

      const docs = req.files?.documents || [];
      for (const f of docs) {
        await pool.query(
          `INSERT INTO psychologist_documents (user_id, file_path, original_name)
           VALUES ($1, $2, $3)`,
          [userId, `/uploads/${f.filename}`, f.originalname]
        );
      }

      const profile = await getPsychologistProfile(userId);
      const documents = await getPsychologistDocuments(userId);
      res.json({ profile, documents });
    } catch (err) {
      res.status(500).json({ message: 'Не удалось обновить профиль' });
    }
  }
);

module.exports = router;

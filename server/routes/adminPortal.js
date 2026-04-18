const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { portalAdminMiddleware } = require('../middleware/portalAdmin');

const router = express.Router();

function portalCredentials() {
  return {
    login: String(process.env.ADMIN_PORTAL_LOGIN ?? '123').trim(),
    password: String(process.env.ADMIN_PORTAL_PASSWORD ?? '123').trim(),
  };
}

// POST /api/admin-portal/login  { login, password }
router.post('/login', (req, res) => {
  const body = req.body || {};
  const login = body.login == null ? '' : String(body.login).trim();
  const password = body.password == null ? '' : String(body.password).trim();
  const expected = portalCredentials();
  if (login !== expected.login || password !== expected.password) {
    return res.status(401).json({ message: 'Неверный логин или пароль' });
  }
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: 'Сервер не настроен (JWT_SECRET)' });
  }
  const token = jwt.sign({ portal_admin: true }, process.env.JWT_SECRET, { expiresIn: '12h' });
  res.json({ token });
});

// GET /api/admin-portal/stats
router.get('/stats', portalAdminMiddleware, async (req, res) => {
  try {
    const [
      usersTotal,
      usersByRole,
      onboardingRow,
      testsCount,
      categoriesCount,
      questionsCount,
      testResultsTotal,
      testResultsUsers,
      diaryTotal,
      diaryLast7,
      diaryAvgMood,
      practiceSessions,
      practiceFavorites,
      timeline,
      topTests,
      recentUsers,
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS n FROM users`),
      pool.query(`SELECT role, COUNT(*)::int AS n FROM users GROUP BY role ORDER BY role`),
      pool
        .query(
          `SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE COALESCE(onboarding_burnout_completed, false))::int AS onboarding_done
           FROM users`
        )
        .catch(() => ({ rows: [{ total: 0, onboarding_done: 0 }] })),
      pool.query(`SELECT COUNT(*)::int AS n FROM tests`),
      pool.query(`SELECT COUNT(*)::int AS n FROM categories`),
      pool.query(`SELECT COUNT(*)::int AS n FROM questions`),
      pool.query(`SELECT COUNT(*)::int AS n FROM test_results`),
      pool.query(`SELECT COUNT(DISTINCT user_id)::int AS n FROM test_results`),
      pool.query(`SELECT COUNT(*)::int AS n FROM diary_entries`),
      pool
        .query(
          `SELECT COUNT(*)::int AS n FROM diary_entries WHERE created_at >= NOW() - INTERVAL '7 days'`
        )
        .catch(() => ({ rows: [{ n: 0 }] })),
      pool
        .query(`SELECT ROUND(AVG(mood_score)::numeric, 2) AS avg FROM diary_entries WHERE mood_score IS NOT NULL`)
        .catch(() => ({ rows: [{ avg: null }] })),
      pool
        .query(`SELECT COUNT(*)::int AS n FROM practice_sessions`)
        .catch(() => ({ rows: [{ n: 0 }] })),
      pool
        .query(`SELECT COUNT(*)::int AS n FROM practice_favorites`)
        .catch(() => ({ rows: [{ n: 0 }] })),
      pool.query(`
        WITH days AS (
          SELECT generate_series(
            (CURRENT_DATE - INTERVAL '13 days')::date,
            CURRENT_DATE::date,
            '1 day'::interval
          )::date AS day
        )
        SELECT
          days.day,
          COALESCE(u.c, 0)::int AS new_users,
          COALESCE(t.c, 0)::int AS test_completions
        FROM days
        LEFT JOIN (
          SELECT created_at::date AS d, COUNT(*)::int AS c
          FROM users
          GROUP BY created_at::date
        ) u ON u.d = days.day
        LEFT JOIN (
          SELECT created_at::date AS d, COUNT(*)::int AS c
          FROM test_results
          GROUP BY created_at::date
        ) t ON t.d = days.day
        ORDER BY days.day
      `),
      pool.query(`
        SELECT t.test_id, t.title, COUNT(tr.result_id)::int AS completions
        FROM tests t
        LEFT JOIN test_results tr ON tr.test_id = t.test_id
        GROUP BY t.test_id, t.title
        ORDER BY completions DESC, t.title
        LIMIT 12
      `),
      pool.query(`
        SELECT user_id, name, email, role, created_at,
          COALESCE(onboarding_burnout_completed, false) AS onboarding_burnout_completed,
          onboarding_burnout_percent
        FROM users
        ORDER BY created_at DESC
        LIMIT 40
      `),
    ]);

    const roleMap = {};
    for (const row of usersByRole.rows) {
      roleMap[row.role] = row.n;
    }

    res.json({
      generatedAt: new Date().toISOString(),
      users: {
        total: usersTotal.rows[0]?.n ?? 0,
        byRole: roleMap,
        onboardingCompleted: onboardingRow.rows[0]?.onboarding_done ?? 0,
        onboardingTotal: onboardingRow.rows[0]?.total ?? 0,
      },
      content: {
        tests: testsCount.rows[0]?.n ?? 0,
        categories: categoriesCount.rows[0]?.n ?? 0,
        questions: questionsCount.rows[0]?.n ?? 0,
      },
      activity: {
        testResultsTotal: testResultsTotal.rows[0]?.n ?? 0,
        usersWithTestResults: testResultsUsers.rows[0]?.n ?? 0,
        diaryEntriesTotal: diaryTotal.rows[0]?.n ?? 0,
        diaryEntriesLast7Days: diaryLast7.rows[0]?.n ?? 0,
        diaryAvgMoodScore: diaryAvgMood.rows[0]?.avg != null ? Number(diaryAvgMood.rows[0].avg) : null,
        practiceSessionsTotal: practiceSessions.rows[0]?.n ?? 0,
        practiceFavoritesTotal: practiceFavorites.rows[0]?.n ?? 0,
      },
      timeline: timeline.rows.map((r) => ({
        day: r.day,
        newUsers: r.new_users,
        testCompletions: r.test_completions,
      })),
      topTests: topTests.rows,
      recentUsers: recentUsers.rows,
    });
  } catch (err) {
    console.error('[admin-portal/stats]', err);
    res.status(500).json({ message: 'Не удалось собрать статистику' });
  }
});

module.exports = router;

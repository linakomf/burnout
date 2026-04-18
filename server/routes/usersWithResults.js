const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { computeTestResult } = require('../scoring');
const { dbErrorToMessage } = require('../utils/dbErrorToMessage');

function bucketFromPercent(p, completed) {
  if (!completed || p == null || Number.isNaN(Number(p))) return 'unknown';
  const n = Number(p);
  if (n < 40) return 'low';
  if (n < 70) return 'medium';
  return 'high';
}

function normalizeRiskLevel(levelStr, scoringType) {
  const s = String(levelStr || '').trim();
  if (!s) return null;
  const st = scoringType || 'likert_sum';
  const maps = {
    mbi_student: {
      'Нет признаков выгорания': 'low',
      'Риск выгорания': 'medium',
      'Выраженное выгорание': 'high',
    },
    daily5: {
      'Состояние стабильное': 'low',
      'Повышенная нагрузка': 'medium',
      'Нужен отдых и поддержка': 'high',
    },
    gad7: {
      'Низкая тревожность': 'low',
      'Средняя тревожность': 'medium',
      'Высокая тревожность': 'high',
    },
  };
  if (maps[st]?.[s]) return maps[st][s];
  if (s === 'Низкий') return 'low';
  if (s === 'Средний') return 'medium';
  if (s === 'Высокий') return 'high';
  return null;
}

function pgDateToKey(d) {
  if (!d) return null;
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  const str = String(d);
  return str.length >= 10 ? str.slice(0, 10) : str;
}

// GET /api/users-with-results
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const testRowsRes = await pool.query(`
      SELECT tr.result_id, tr.user_id, tr.test_id, tr.score, tr.level, tr.created_at, tr.answers,
        u.email, u.name, u.role,
        t.scoring_type, t.title AS test_title
      FROM test_results tr
      INNER JOIN users u ON u.user_id = tr.user_id
      INNER JOIN tests t ON t.test_id = tr.test_id
      WHERE u.role IN ('student', 'teacher')
      ORDER BY tr.created_at DESC NULLS LAST
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

    const userRows = [];

    for (const tr of testRowsRes.rows) {
      let percent = null;
      let riskLevel = 'unknown';
      try {
        const questions = await getQuestions(tr.test_id);
        const testRow = { scoring_type: tr.scoring_type };
        const ans = tr.answers;
        const answersObj = typeof ans === 'string' ? JSON.parse(ans || '{}') : ans || {};
        const computed = computeTestResult(testRow, questions, answersObj);
        percent = computed.percentage != null ? Number(computed.percentage) : null;
        riskLevel =
          normalizeRiskLevel(computed.level, tr.scoring_type) ||
          normalizeRiskLevel(tr.level, tr.scoring_type) ||
          bucketFromPercent(percent, true);
      } catch (e) {
        console.warn('[users-with-results] compute row', tr.result_id, e.message);
        riskLevel = normalizeRiskLevel(tr.level, tr.scoring_type) || 'unknown';
      }

      const rawDate = tr.created_at;
      userRows.push({
        rowKey: `tr-${tr.result_id}`,
        user_id: tr.user_id,
        email: tr.email,
        name: tr.name,
        testDate: rawDate ? new Date(rawDate).toISOString().slice(0, 10) : null,
        level: riskLevel,
        percent,
        result_id: tr.result_id,
        source: 'test',
        test_title: tr.test_title,
      });
    }

    const onboardRes = await pool.query(`
      SELECT u.user_id, u.email, u.name, u.onboarding_burnout_percent,
        u.onboarding_burnout_completed_at
      FROM users u
      WHERE u.role IN ('student', 'teacher')
        AND COALESCE(u.onboarding_burnout_completed, false) = true
    `);

    for (const u of onboardRes.rows) {
      const p = u.onboarding_burnout_percent != null ? Number(u.onboarding_burnout_percent) : null;
      const rawDate = u.onboarding_burnout_completed_at;
      const ts = rawDate ? new Date(rawDate).getTime() : 0;
      userRows.push({
        rowKey: `onb-${u.user_id}-${ts}`,
        user_id: u.user_id,
        email: u.email,
        name: u.name,
        testDate: rawDate ? new Date(rawDate).toISOString().slice(0, 10) : null,
        level: bucketFromPercent(p, true),
        percent: p,
        result_id: null,
        source: 'onboarding',
        test_title: 'Первичный скрининг выгорания',
      });
    }

    userRows.sort((a, b) => {
      const da = a.testDate || '';
      const db = b.testDate || '';
      if (db !== da) return db.localeCompare(da);
      return String(b.rowKey).localeCompare(String(a.rowKey));
    });

    const dist = { low: 0, medium: 0, high: 0, unknown: 0 };
    for (const r of userRows) {
      const k = r.level && Object.prototype.hasOwnProperty.call(dist, r.level) ? r.level : 'unknown';
      dist[k]++;
    }

    const platformUsers = await pool.query(
      `SELECT COUNT(*)::int AS n FROM users WHERE role IN ('student', 'teacher')`
    );
    const newUsersWeek = await pool.query(
      `SELECT COUNT(*)::int AS n FROM users WHERE role IN ('student', 'teacher') AND created_at >= NOW() - INTERVAL '7 days'`
    );

    const testsTodayRes = await pool.query(
      `SELECT COUNT(*)::int AS n FROM test_results tr
       JOIN users u ON u.user_id = tr.user_id
       WHERE u.role IN ('student', 'teacher') AND tr.created_at::date = CURRENT_DATE`
    );
    const onboardTodayRes = await pool.query(
      `SELECT COUNT(*)::int AS n FROM users u
       WHERE u.role IN ('student', 'teacher')
         AND COALESCE(u.onboarding_burnout_completed, false)
         AND u.onboarding_burnout_completed_at::date = CURRENT_DATE`
    );
    const testsToday = (testsTodayRes.rows[0]?.n ?? 0) + (onboardTodayRes.rows[0]?.n ?? 0);

    const testsWeekRes = await pool.query(
      `SELECT COUNT(*)::int AS n FROM test_results tr
       JOIN users u ON u.user_id = tr.user_id
       WHERE u.role IN ('student', 'teacher') AND tr.created_at >= NOW() - INTERVAL '7 days'`
    );
    const onboardWeekRes = await pool.query(
      `SELECT COUNT(*)::int AS n FROM users u
       WHERE u.role IN ('student', 'teacher')
         AND COALESCE(u.onboarding_burnout_completed, false)
         AND u.onboarding_burnout_completed_at >= NOW() - INTERVAL '7 days'`
    );
    const testsWeek = (testsWeekRes.rows[0]?.n ?? 0) + (onboardWeekRes.rows[0]?.n ?? 0);

    const dayMap = new Map();
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    for (let i = 13; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const label = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
      dayMap.set(key, { key, label, visits: 0 });
    }

    const trByDay = await pool.query(
      `SELECT tr.created_at::date AS d, COUNT(*)::int AS c
       FROM test_results tr
       JOIN users u ON u.user_id = tr.user_id
       WHERE u.role IN ('student', 'teacher')
         AND tr.created_at >= CURRENT_DATE - INTERVAL '14 days'
       GROUP BY tr.created_at::date`
    );
    for (const r of trByDay.rows) {
      const key = pgDateToKey(r.d);
      if (key && dayMap.has(key)) dayMap.get(key).visits += r.c;
    }

    const onbByDay = await pool.query(
      `SELECT u.onboarding_burnout_completed_at::date AS d, COUNT(*)::int AS c
       FROM users u
       WHERE u.role IN ('student', 'teacher')
         AND COALESCE(u.onboarding_burnout_completed, false)
         AND u.onboarding_burnout_completed_at >= CURRENT_DATE - INTERVAL '14 days'
       GROUP BY u.onboarding_burnout_completed_at::date`
    );
    for (const r of onbByDay.rows) {
      const key = pgDateToKey(r.d);
      if (key && dayMap.has(key)) dayMap.get(key).visits += r.c;
    }

    const activityByDay = [...dayMap.values()];

    res.json({
      rows: userRows,
      burnoutDistribution: dist,
      kpis: {
        totalUsers: platformUsers.rows[0]?.n ?? 0,
        testsToday,
        testsWeek,
        newUsersWeek: newUsersWeek.rows[0]?.n ?? 0,
      },
      activityByDay,
    });
  } catch (err) {
    console.error('[users-with-results]', err);
    const dbMessage = dbErrorToMessage(err);
    if (dbMessage) return res.status(500).json({ message: dbMessage });
    res.status(500).json({ message: 'Ошибка загрузки данных' });
  }
});

module.exports = router;

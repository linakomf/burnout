const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { PRACTICES, CATEGORY_LABELS, rankPracticesForUser } = require('../practicesCatalog');
const { titleForTestId } = require('../testCanonical');

function staticPracticesPayload() {
  return {
    practices: PRACTICES.map((p) => ({ ...p, isFavorite: false })),
    categories: CATEGORY_LABELS,
    stats: { available: PRACTICES.length, favorites: 0, minutesTotal: 0 },
    personalizedHint: null,
  };
}

/** Список практик + персональный порядок + статистика */
router.get('/', authMiddleware, async (req, res) => {
  const userId = req.user.user_id;
  try {
    const recent = await pool.query(
      `SELECT tr.level, t.test_id, t.title, tr.created_at
       FROM test_results tr
       JOIN tests t ON tr.test_id = t.test_id
       WHERE tr.user_id = $1
       ORDER BY tr.created_at DESC
       LIMIT 8`,
      [userId]
    );
    recent.rows = recent.rows.map((r) => ({
      ...r,
      title: titleForTestId(r.test_id) || r.title,
    }));
    const levels = recent.rows.map((r) => r.level);
    const ordered = rankPracticesForUser(levels);

    let stats = { available: PRACTICES.length, favorites: 0, minutesTotal: 0 };
    try {
      const fav = await pool.query(
        'SELECT COUNT(*)::int AS c FROM practice_favorites WHERE user_id = $1',
        [userId]
      );
      stats.favorites = fav.rows[0]?.c || 0;

      const mins = await pool.query(
        `SELECT COALESCE(SUM(duration_seconds), 0)::int AS s FROM practice_sessions WHERE user_id = $1`,
        [userId]
      );
      stats.minutesTotal = Math.round((mins.rows[0]?.s || 0) / 60);
    } catch {
      /* таблицы ещё не созданы */
    }

    const favKeys = new Set();
    try {
      const fk = await pool.query(
        'SELECT practice_key FROM practice_favorites WHERE user_id = $1',
        [userId]
      );
      fk.rows.forEach((r) => favKeys.add(r.practice_key));
    } catch {
      /* нет таблицы */
    }

    res.json({
      practices: ordered.map((p) => ({ ...p, isFavorite: favKeys.has(p.key) })),
      categories: CATEGORY_LABELS,
      stats,
      personalizedHint:
        levels.length === 0
          ? 'Пройдите тест тревожности или выгорания — мы подсветим практики под ваше состояние.'
          : null,
    });
  } catch (err) {
    console.error('[practices GET]', err);
    /* Всегда отдаём рабочий каталог, чтобы страница не «висела» */
    const payload = staticPracticesPayload();
    payload.personalizedHint =
      'Не удалось загрузить персонализацию. Практики доступны; при следующем входе статистика обновится.';
    res.json(payload);
  }
});

router.post('/session', authMiddleware, async (req, res) => {
  const userId = req.user.user_id;
  const { practiceKey, durationSeconds } = req.body;
  if (!practiceKey) return res.status(400).json({ message: 'Укажите practiceKey' });
  const sec = Math.min(7200, Math.max(0, parseInt(durationSeconds, 10) || 0));
  try {
    await pool.query(
      'INSERT INTO practice_sessions (user_id, practice_key, duration_seconds) VALUES ($1,$2,$3)',
      [userId, String(practiceKey).slice(0, 64), sec]
    );
    res.json({ ok: true });
  } catch (err) {
    if (err.code === '42P01') {
      return res.status(503).json({ message: 'Выполните миграцию БД (practice_sessions)' });
    }
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.post('/favorite', authMiddleware, async (req, res) => {
  const userId = req.user.user_id;
  const { practiceKey } = req.body;
  if (!practiceKey) return res.status(400).json({ message: 'Укажите practiceKey' });
  const key = String(practiceKey).slice(0, 64);
  try {
    const ex = await pool.query(
      'SELECT 1 FROM practice_favorites WHERE user_id=$1 AND practice_key=$2',
      [userId, key]
    );
    if (ex.rows.length) {
      await pool.query(
        'DELETE FROM practice_favorites WHERE user_id=$1 AND practice_key=$2',
        [userId, key]
      );
      return res.json({ favorite: false });
    }
    await pool.query(
      'INSERT INTO practice_favorites (user_id, practice_key) VALUES ($1,$2)',
      [userId, key]
    );
    res.json({ favorite: true });
  } catch (err) {
    if (err.code === '42P01') {
      return res.status(503).json({ message: 'Выполните миграцию БД' });
    }
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;

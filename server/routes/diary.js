const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware } = require('../middleware/auth');

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseSessionDate(raw) {
  const s = String(raw || '').trim();
  if (DATE_KEY_RE.test(s)) return s;
  return new Date().toISOString().slice(0, 10);
}

function normalizeChatMessages(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({
      role: m.role,
      content: m.content.trim().slice(0, 8000),
      time: typeof m.time === 'string' ? m.time.slice(0, 8) : undefined,
      cards: Array.isArray(m.cards)
        ? m.cards.slice(0, 6).map((c) => ({
            type: c.type,
            title: c.title,
            subtitle: c.subtitle,
            description: c.description,
            image: c.image,
            path: c.path,
          }))
        : undefined,
    }))
    .filter((m) => m.content.length > 0)
    .slice(-80);
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM diary_entries WHERE user_id=$1 ORDER BY created_at DESC',
      [req.user.user_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/date/:date', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM diary_entries WHERE user_id=$1 AND DATE(created_at) = $2 ORDER BY created_at DESC`,
      [req.user.user_id, req.params.date]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/mood-stats', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DATE(created_at) as date, AVG(mood_score) as avg_mood, COUNT(*) as count
       FROM diary_entries 
       WHERE user_id=$1
         AND created_at >= NOW() - INTERVAL '30 days'
         AND chat_messages IS NULL
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [req.user.user_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/chat-session', authMiddleware, async (req, res) => {
  try {
    const sessionDate = parseSessionDate(req.query.date);
    const result = await pool.query(
      `SELECT entry_id, session_date, chat_messages, mood, mood_score, created_at
       FROM diary_entries
       WHERE user_id=$1 AND session_date=$2::date AND chat_messages IS NOT NULL
       LIMIT 1`,
      [req.user.user_id, sessionDate]
    );
    if (!result.rows.length) {
      return res.json({ entry_id: null, session_date: sessionDate, messages: [] });
    }
    const row = result.rows[0];
    res.json({
      entry_id: row.entry_id,
      session_date: row.session_date,
      messages: row.chat_messages || [],
      mood: row.mood,
      mood_score: row.mood_score,
      created_at: row.created_at,
    });
  } catch (err) {
    console.error('[diary] chat-session GET:', err.message);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.put('/chat-session', authMiddleware, async (req, res) => {
  const sessionDate = parseSessionDate(req.body?.date);
  const messages = normalizeChatMessages(req.body?.messages);
  if (!messages.length) {
    return res.status(400).json({ message: 'Нет сообщений для сохранения.' });
  }

  const mood = typeof req.body?.mood === 'string' ? req.body.mood.slice(0, 45) : 'neutral';
  const moodScoreRaw = Number(req.body?.mood_score);
  const moodScore =
    Number.isFinite(moodScoreRaw) && moodScoreRaw >= 1 && moodScoreRaw <= 10 ?
      Math.round(moodScoreRaw) :
      4;

  try {
    const existing = await pool.query(
      `SELECT entry_id FROM diary_entries
       WHERE user_id=$1 AND session_date=$2::date AND chat_messages IS NOT NULL
       LIMIT 1`,
      [req.user.user_id, sessionDate]
    );

    let row;
    if (existing.rows.length) {
      const updated = await pool.query(
        `UPDATE diary_entries
         SET chat_messages=$1::jsonb, mood=$2, mood_score=$3
         WHERE entry_id=$4 AND user_id=$5
         RETURNING *`,
        [JSON.stringify(messages), mood, moodScore, existing.rows[0].entry_id, req.user.user_id]
      );
      row = updated.rows[0];
    } else {
      const inserted = await pool.query(
        `INSERT INTO diary_entries (user_id, mood, mood_score, note, chat_messages, session_date)
         VALUES ($1,$2,$3,$4,$5::jsonb,$6::date)
         RETURNING *`,
        [req.user.user_id, mood, moodScore, null, JSON.stringify(messages), sessionDate]
      );
      row = inserted.rows[0];
    }

    res.json({
      entry_id: row.entry_id,
      session_date: row.session_date,
      messages: row.chat_messages || [],
      mood: row.mood,
      mood_score: row.mood_score,
      created_at: row.created_at,
    });
  } catch (err) {
    console.error('[diary] chat-session PUT:', err.message);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { mood, mood_score, note } = req.body;
  if (!mood_score) return res.status(400).json({ message: 'Укажите уровень настроения' });

  try {
    const result = await pool.query(
      'INSERT INTO diary_entries (user_id, mood, mood_score, note) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.user.user_id, mood, mood_score, note]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  const { mood, mood_score, note } = req.body;
  try {
    const result = await pool.query(
      'UPDATE diary_entries SET mood=$1, mood_score=$2, note=$3 WHERE entry_id=$4 AND user_id=$5 RETURNING *',
      [mood, mood_score, note, req.params.id, req.user.user_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Запись не найдена' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  await pool.query('DELETE FROM diary_entries WHERE entry_id=$1 AND user_id=$2', [req.params.id, req.user.user_id]);
  res.json({ message: 'Запись удалена' });
});

module.exports = router;
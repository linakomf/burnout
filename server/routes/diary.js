const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware } = require('../middleware/auth');

// GET /api/diary - get user's diary entries
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

// GET /api/diary/date/:date - get entries by date
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

// GET /api/diary/mood-stats - mood data for chart (last 30 days)
router.get('/mood-stats', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DATE(created_at) as date, AVG(mood_score) as avg_mood, COUNT(*) as count
       FROM diary_entries 
       WHERE user_id=$1 AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [req.user.user_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// POST /api/diary - create entry
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

// PUT /api/diary/:id - update entry
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

// DELETE /api/diary/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  await pool.query('DELETE FROM diary_entries WHERE entry_id=$1 AND user_id=$2', [req.params.id, req.user.user_id]);
  res.json({ message: 'Запись удалена' });
});

module.exports = router;

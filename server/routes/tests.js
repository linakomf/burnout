const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// GET /api/tests - get tests relevant to user role
router.get('/', authMiddleware, async (req, res) => {
  const role = req.user.role;
  try {
    const result = await pool.query(
      `SELECT t.*, c.name as category_name, c.target_role 
       FROM tests t 
       LEFT JOIN categories c ON t.category_id = c.category_id
       WHERE c.target_role = 'all' OR c.target_role = $1
       ORDER BY t.created_at DESC`,
      [role]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Статический путь должен быть ДО /:id, иначе Express принимает "results" за id
router.get('/results/my', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT tr.*, t.title, t.description, c.name as category_name
       FROM test_results tr
       JOIN tests t ON tr.test_id = t.test_id
       LEFT JOIN categories c ON t.category_id = c.category_id
       WHERE tr.user_id = $1
       ORDER BY tr.created_at DESC`,
      [req.user.user_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// GET /api/tests/:id - get test with questions
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const testResult = await pool.query(
      `SELECT t.*, c.name as category_name FROM tests t 
       LEFT JOIN categories c ON t.category_id = c.category_id
       WHERE t.test_id = $1`,
      [req.params.id]
    );
    if (testResult.rows.length === 0) return res.status(404).json({ message: 'Тест не найден' });

    const questionsResult = await pool.query(
      'SELECT * FROM questions WHERE test_id = $1 ORDER BY order_num',
      [req.params.id]
    );

    res.json({ ...testResult.rows[0], questions: questionsResult.rows });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// POST /api/tests/:id/submit - submit test answers
router.post('/:id/submit', authMiddleware, async (req, res) => {
  const { answers } = req.body; // { questionId: answerIndex }
  const userId = req.user.user_id;
  const testId = req.params.id;

  try {
    const questions = await pool.query('SELECT * FROM questions WHERE test_id=$1', [testId]);
    const total = questions.rows.length;
    let score = 0;

    Object.values(answers).forEach((val) => {
      score += Number(val);
    });

    const maxScore = total * 4;
    const percentage = Math.round((score / maxScore) * 100);

    let level;
    if (percentage <= 30) level = 'Низкий';
    else if (percentage <= 60) level = 'Средний';
    else level = 'Высокий';

    const result = await pool.query(
      'INSERT INTO test_results (user_id, test_id, score, level, answers) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [userId, testId, score, level, JSON.stringify(answers)]
    );

    res.json({ result: result.rows[0], percentage, level });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ========= ADMIN ROUTES =========

// POST /api/tests - create test (admin)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  const { title, description, category_id, questions } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const testResult = await client.query(
      'INSERT INTO tests (title, description, category_id) VALUES ($1,$2,$3) RETURNING *',
      [title, description, category_id]
    );
    const testId = testResult.rows[0].test_id;

    if (questions && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await client.query(
          'INSERT INTO questions (test_id, question_text, options, order_num) VALUES ($1,$2,$3,$4)',
          [testId, q.question_text, JSON.stringify(q.options), i + 1]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json(testResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Ошибка сервера' });
  } finally {
    client.release();
  }
});

// PUT /api/tests/:id (admin)
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  const { title, description, category_id } = req.body;
  const result = await pool.query(
    'UPDATE tests SET title=$1, description=$2, category_id=$3 WHERE test_id=$4 RETURNING *',
    [title, description, category_id, req.params.id]
  );
  res.json(result.rows[0]);
});

// DELETE /api/tests/:id (admin)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  await pool.query('DELETE FROM tests WHERE test_id=$1', [req.params.id]);
  res.json({ message: 'Тест удалён' });
});

module.exports = router;

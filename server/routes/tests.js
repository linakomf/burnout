const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { computeTestResult } = require('../scoring');
const { applyCanonicalToTestRow, applyCanonicalToTestRows } = require('../testCanonical');

router.get('/', authMiddleware, async (req, res) => {
  const role = req.user.role;
  try {
    const result = await pool.query(
      `SELECT t.*, c.name as category_name, c.target_role,
       (SELECT COUNT(*)::int FROM questions q WHERE q.test_id = t.test_id) AS question_count
       FROM tests t 
       LEFT JOIN categories c ON t.category_id = c.category_id
       WHERE t.test_id <> 1
         AND (c.target_role = 'all' OR c.target_role = $1)
       ORDER BY t.created_at DESC`,
      [role]
    );
    res.json(applyCanonicalToTestRows(result.rows));
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

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
    res.json(
      result.rows.map((row) => {
        const fixed = applyCanonicalToTestRow({
          test_id: row.test_id,
          title: row.title,
          description: row.description,
        });
        return { ...row, title: fixed.title, description: fixed.description };
      })
    );
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  const tid = parseInt(req.params.id, 10);
  if (Number.isFinite(tid) && tid === 1) {
    return res.status(404).json({ message: 'Тест не найден' });
  }
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

    res.json({
      ...applyCanonicalToTestRow(testResult.rows[0]),
      questions: questionsResult.rows,
    });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.post('/:id/submit', authMiddleware, async (req, res) => {
  const { answers } = req.body;
  const userId = req.user.user_id;
  const testId = req.params.id;
  const tid = parseInt(testId, 10);
  if (Number.isFinite(tid) && tid === 1) {
    return res.status(404).json({ message: 'Тест не найден' });
  }

  try {
    const testRow = await pool.query('SELECT * FROM tests WHERE test_id=$1', [testId]);
    if (testRow.rows.length === 0) return res.status(404).json({ message: 'Тест не найден' });

    const questions = await pool.query(
      'SELECT * FROM questions WHERE test_id=$1 ORDER BY order_num',
      [testId]
    );
    if (questions.rows.length === 0) {
      return res.status(400).json({ message: 'В тесте нет вопросов' });
    }

    const computed = computeTestResult(testRow.rows[0], questions.rows, answers || {});

    const result = await pool.query(
      'INSERT INTO test_results (user_id, test_id, score, level, answers) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [userId, testId, computed.score, computed.level, JSON.stringify(answers)]
    );

    res.json({
      result: result.rows[0],
      percentage: computed.percentage,
      level: computed.level,
      scale: computed.scale,
      interpretation: computed.interpretation,
      maxScore: computed.maxScore,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

function normalizeCategoryId(category_id) {
  if (category_id === '' || category_id === undefined || category_id === null) return null;
  const n = parseInt(String(category_id), 10);
  return Number.isFinite(n) ? n : null;
}

function normalizeQuestionPayload(q) {
  const text = (q.question_text || '').trim();
  let options = q.options;
  if (typeof options === 'string') {
    try {
      options = JSON.parse(options);
    } catch {
      options = [];
    }
  }
  if (!Array.isArray(options)) options = [];
  const filtered = options.map((o) => (o == null ? '' : String(o).trim())).filter(Boolean);
  return { question_text: text, options: filtered };
}

router.post('/', authMiddleware, adminOnly, async (req, res) => {
  const { title, description, category_id, questions, scoring_type } = req.body;
  const catId = normalizeCategoryId(category_id);
  const scoring = typeof scoring_type === 'string' && scoring_type.trim() ? scoring_type.trim() : 'likert_sum';

  if (!title || !String(title).trim()) {
    return res.status(400).json({ message: 'Укажите название теста' });
  }
  if (catId == null) {
    return res.status(400).json({ message: 'Выберите категорию' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const testResult = await client.query(
      'INSERT INTO tests (title, description, category_id, scoring_type) VALUES ($1,$2,$3,$4) RETURNING *',
      [String(title).trim(), description != null ? String(description).trim() : '', catId, scoring]
    );
    const testId = testResult.rows[0].test_id;

    let inserted = 0;
    if (questions && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = normalizeQuestionPayload(questions[i]);
        if (!q.question_text) continue;
        if (q.options.length === 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ message: `Вопрос ${i + 1}: добавьте хотя бы один вариант ответа` });
        }
        await client.query(
          'INSERT INTO questions (test_id, question_text, options, order_num) VALUES ($1,$2,$3,$4)',
          [testId, q.question_text, JSON.stringify(q.options), inserted + 1]
        );
        inserted += 1;
      }
    }
    if (inserted === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Добавьте хотя бы один вопрос с текстом и вариантами' });
    }

    await client.query('COMMIT');
    res.status(201).json(testResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  } finally {
    client.release();
  }
});

router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  const testId = parseInt(req.params.id, 10);
  if (!Number.isFinite(testId)) {
    return res.status(400).json({ message: 'Некорректный id теста' });
  }

  const { title, description, category_id, questions, scoring_type } = req.body;
  const catId = normalizeCategoryId(category_id);

  if (!title || !String(title).trim()) {
    return res.status(400).json({ message: 'Укажите название теста' });
  }
  if (catId == null) {
    return res.status(400).json({ message: 'Выберите категорию' });
  }

  const scoring =
    typeof scoring_type === 'string' && scoring_type.trim() ? scoring_type.trim() : 'likert_sum';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT test_id FROM tests WHERE test_id=$1', [testId]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Тест не найден' });
    }

    await client.query(
      'UPDATE tests SET title=$1, description=$2, category_id=$3, scoring_type=$4 WHERE test_id=$5',
      [String(title).trim(), description != null ? String(description).trim() : '', catId, scoring, testId]
    );

    if (Array.isArray(questions)) {
      const normalized = [];
      for (let i = 0; i < questions.length; i++) {
        const q = normalizeQuestionPayload(questions[i]);
        if (!q.question_text) continue;
        if (q.options.length === 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ message: `Вопрос ${i + 1}: добавьте хотя бы один вариант ответа` });
        }
        normalized.push(q);
      }
      if (normalized.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Добавьте хотя бы один вопрос с текстом и вариантами' });
      }

      await client.query('DELETE FROM questions WHERE test_id=$1', [testId]);
      for (let i = 0; i < normalized.length; i++) {
        const q = normalized[i];
        await client.query(
          'INSERT INTO questions (test_id, question_text, options, order_num) VALUES ($1,$2,$3,$4)',
          [testId, q.question_text, JSON.stringify(q.options), i + 1]
        );
      }
    }

    await client.query('COMMIT');

    const testResult = await pool.query(
      `SELECT t.*, c.name as category_name FROM tests t 
       LEFT JOIN categories c ON t.category_id = c.category_id
       WHERE t.test_id = $1`,
      [testId]
    );
    const questionsResult = await pool.query(
      'SELECT * FROM questions WHERE test_id = $1 ORDER BY order_num',
      [testId]
    );
    res.json({
      ...applyCanonicalToTestRow(testResult.rows[0]),
      questions: questionsResult.rows,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  } finally {
    client.release();
  }
});

router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  await pool.query('DELETE FROM tests WHERE test_id=$1', [req.params.id]);
  res.json({ message: 'Тест удалён' });
});

module.exports = router;

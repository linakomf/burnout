const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  const result = await pool.query('SELECT * FROM categories ORDER BY category_id');
  res.json(result.rows);
});

router.post('/', authMiddleware, adminOnly, async (req, res) => {
  const { name, description, target_role } = req.body;
  const result = await pool.query(
    'INSERT INTO categories (name, description, target_role) VALUES ($1,$2,$3) RETURNING *',
    [name, description, target_role || 'all']
  );
  res.status(201).json(result.rows[0]);
});

router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  const { name, description, target_role } = req.body;
  const result = await pool.query(
    'UPDATE categories SET name=$1, description=$2, target_role=$3 WHERE category_id=$4 RETURNING *',
    [name, description, target_role, req.params.id]
  );
  res.json(result.rows[0]);
});

router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  await pool.query('DELETE FROM categories WHERE category_id=$1', [req.params.id]);
  res.json({ message: 'Категория удалена' });
});

module.exports = router;

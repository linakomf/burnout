const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { pickTargetRole, pickTargetGender } = require('../utils/audienceTargeting');

router.get('/', authMiddleware, async (req, res) => {
  const result = await pool.query('SELECT * FROM categories ORDER BY category_id');
  res.json(result.rows);
});

router.post('/', authMiddleware, adminOnly, async (req, res) => {
  const { name, description, target_role, target_gender } = req.body;
  const result = await pool.query(
    'INSERT INTO categories (name, description, target_role, target_gender) VALUES ($1,$2,$3,$4) RETURNING *',
    [name, description, pickTargetRole(target_role), pickTargetGender(target_gender)]
  );
  res.status(201).json(result.rows[0]);
});

router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  const { name, description, target_role, target_gender } = req.body;
  const result = await pool.query(
    'UPDATE categories SET name=$1, description=$2, target_role=$3, target_gender=$4 WHERE category_id=$5 RETURNING *',
    [name, description, pickTargetRole(target_role), pickTargetGender(target_gender), req.params.id]
  );
  res.json(result.rows[0]);
});

router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  await pool.query('DELETE FROM categories WHERE category_id=$1', [req.params.id]);
  res.json({ message: 'Категория удалена' });
});

module.exports = router;
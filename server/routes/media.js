const express = require('express');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { listPublicMediaPaths } = require('../utils/publicMediaPath');

const router = express.Router();

router.get('/paths', authMiddleware, adminOnly, (req, res) => {
  try {
    res.json(listPublicMediaPaths());
  } catch (e) {
    res.status(500).json({ message: e?.message || 'Ошибка чтения файлов' });
  }
});

module.exports = router;

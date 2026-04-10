const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const { ensurePracticeSchema } = require('./ensurePracticeSchema');
const { ensureOnboardingSchema } = require('./ensureOnboardingSchema');
const { ensureTestSchema } = require('./ensureTestSchema');
const { ensureTestCatalog } = require('./ensureTestCatalog');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use('/api', (req, res, next) => {
  const sendJson = res.json.bind(res);
  res.json = (body) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return sendJson(body);
  };
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/diary', require('./routes/diary'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/practices', require('./routes/practices'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

Promise.resolve()
  .then(() => ensurePracticeSchema())
  .then(() => ensureOnboardingSchema())
  .then(() => ensureTestSchema())
  .then(() => ensureTestCatalog())
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  });

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { ensurePracticeSchema } = require('./ensurePracticeSchema');
const { ensureOnboardingSchema } = require('./ensureOnboardingSchema');
const { ensurePersonalizationSchema } = require('./ensurePersonalizationSchema');
const { ensureTestSchema } = require('./ensureTestSchema');
const { ensureTestCatalog } = require('./ensureTestCatalog');
const { ensureDefaultAdmin } = require('./ensureDefaultAdmin');
const pool = require('./db');
const { dbErrorToMessage } = require('./utils/dbErrorToMessage');

const app = express();
const PORT = process.env.PORT || 5000;

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


const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin-portal', require('./routes/adminPortal'));
app.use('/api/users-with-results', require('./routes/usersWithResults'));
app.use('/api/users', require('./routes/users'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/diary', require('./routes/diary'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/practices', require('./routes/practices'));
app.use('/api/ai', require('./routes/ai'));


app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

Promise.resolve()
  .then(() => pool.query('SELECT 1'))
  .then(() => ensurePracticeSchema())
  .then(() => ensureOnboardingSchema())
  .then(() => ensurePersonalizationSchema())
  .then(() => ensureTestSchema())
  .then(() => ensureTestCatalog())
  .then(() => ensureDefaultAdmin())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log('   API: GET /api/users-with-results и GET /api/users/with-results (админ, JWT)');
    });
  })
  .catch((err) => {
    const dbMessage = dbErrorToMessage(err);
    if (dbMessage) {
      console.error(`❌ ${dbMessage}`);
    } else {
      console.error('❌ Ошибка при запуске сервера:', err?.message || err);
    }
    process.exit(1);
  });

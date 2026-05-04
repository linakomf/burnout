const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '.env') });
const { ensureCoreSchema } = require('./ensureCoreSchema');
const { ensureDefaultAdmin } = require('./ensureDefaultAdmin');
const { ensurePracticeSchema } = require('./ensurePracticeSchema');
const { ensureOnboardingSchema } = require('./ensureOnboardingSchema');
const { ensureTestSchema } = require('./ensureTestSchema');
const { ensureTestCatalog } = require('./ensureTestCatalog');

if (!process.env.JWT_SECRET?.trim()) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: задайте JWT_SECRET в server/.env');
    process.exit(1);
  }
  process.env.JWT_SECRET = 'dev-insecure-burnout-jwt';
  console.warn('⚠️ JWT_SECRET не задан — для локального запуска используется временный ключ.');
}

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const corsOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://[::1]:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://[::1]:3001'
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (corsOrigins.includes(origin)) return cb(null, true);
      if (process.env.CORS_ORIGIN && origin === process.env.CORS_ORIGIN) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);
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

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/diary', require('./routes/diary'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/practices', require('./routes/practices'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/admin-portal', require('./routes/adminPortal'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

async function bootstrap() {
  await ensureCoreSchema();
  await ensureDefaultAdmin();
  await ensurePracticeSchema();
  await ensureOnboardingSchema();
  await ensureTestSchema();
  await ensureTestCatalog();
}

bootstrap()
  .then(() => {
    app.listen(PORT, HOST, () => {
      console.log(`🚀 Server running at http://127.0.0.1:${PORT} (bind ${HOST})`);
    });
  })
  .catch((err) => {
    console.error('❌ Сервер не запущен:', err.message);
    console.error(
      'Проверьте DATABASE_URL в server/.env и что PostgreSQL запущен (например: из корня проекта выполните docker compose up -d).'
    );
    process.exit(1);
  });

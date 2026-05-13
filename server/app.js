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
const { ensureSupportRequestsSchema } = require('./ensureSupportRequestsSchema');

if (!process.env.JWT_SECRET?.trim()) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: задайте JWT_SECRET в server/.env');
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

const corsExtra = String(process.env.CORS_EXTRA_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function isVercelPreviewOrigin(origin) {
  try {
    const { hostname, protocol } = new URL(origin);
    return protocol === 'https:' && hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (corsOrigins.includes(origin)) return cb(null, true);
      if (corsExtra.includes(origin)) return cb(null, true);
      if (process.env.CORS_ORIGIN && origin === process.env.CORS_ORIGIN) return cb(null, true);
      if (isVercelPreviewOrigin(origin)) return cb(null, true);
      if (process.env.NODE_ENV !== 'production') {
        try {
          const { hostname } = new URL(origin);
          if (hostname === 'localhost' || hostname === '127.0.0.1') return cb(null, true);
          if (/^192\.168\.\d+\.\d+$/.test(hostname) || /^10\.\d+\.\d+\.\d+$/.test(hostname)) {
            return cb(null, true);
          }
        } catch {
          /* ignore */
        }
      }
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
  await ensureSupportRequestsSchema();
}

let bootstrapPromise = null;

function ensureBootstrap() {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrap().catch((err) => {
      bootstrapPromise = null;
      throw err;
    });
  }
  return bootstrapPromise;
}

async function startServer() {
  await ensureBootstrap();
  app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running at http://127.0.0.1:${PORT} (bind ${HOST})`);
  });
}

module.exports = { app, ensureBootstrap, startServer };

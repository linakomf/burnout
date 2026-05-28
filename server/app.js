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
const { ensurePsychologistSchema } = require('./ensurePsychologistSchema');
const { ensureFilmsSchema } = require('./ensureFilmsSchema');
const { ensureMeditationsSchema } = require('./ensureMeditationsSchema');
const { ensureEventsSchema } = require('./ensureEventsSchema');
const { ensureReadingSchema } = require('./ensureReadingSchema');
const { ensureMusicSchema } = require('./ensureMusicSchema');
const { ensurePodcastsSchema } = require('./ensurePodcastsSchema');
const { ensureAudienceSchema } = require('./ensureAudienceSchema');
const { isDatabaseInitialized } = require('./dbReady');

if (!process.env.JWT_SECRET?.trim()) {
  const strictProd = process.env.NODE_ENV === 'production' && !process.env.VERCEL;
  if (strictProd) {
    throw new Error('FATAL: задайте JWT_SECRET в server/.env');
  }
  process.env.JWT_SECRET = 'dev-insecure-burnout-jwt';
  const hint = process.env.VERCEL
    ? 'задайте JWT_SECRET в Environment Variables на Vercel'
    : 'для локального запуска используется временный ключ';
  console.warn(`⚠️ JWT_SECRET не задан - ${hint}.`);
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

const { getUploadsDir } = require('./utils/uploadsDir');
const uploadsDir = getUploadsDir();
app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/psychologists', require('./routes/psychologists'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/diary', require('./routes/diary'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/practices', require('./routes/practices'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/admin-portal', require('./routes/adminPortal'));
app.use('/api/films', require('./routes/films'));
console.log('✅ Films API: GET/POST /api/films');
app.use('/api/meditations', require('./routes/meditations'));
console.log('✅ Meditations API: GET/POST /api/meditations');
app.use('/api/events', require('./routes/events'));
console.log('✅ Events API: GET/POST /api/events');
app.use('/api/reading', require('./routes/reading'));
console.log('✅ Reading API: GET/POST /api/reading');
app.use('/api/music', require('./routes/music'));
console.log('✅ Music API: GET/POST /api/music');
app.use('/api/podcasts', require('./routes/podcasts'));
console.log('✅ Podcasts API: GET/POST /api/podcasts');

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

/** Схемы БД — нужны до любого API-запроса. */
async function bootstrapCritical() {
  await ensureCoreSchema();
  await ensureDefaultAdmin();
  await ensurePracticeSchema();
  await ensureOnboardingSchema();
  await ensureTestSchema();
  await ensureSupportRequestsSchema();
  await ensurePsychologistSchema();
  await ensureFilmsSchema();
  await ensureMeditationsSchema();
  await ensureEventsSchema();
  await ensureReadingSchema();
  await ensureMusicSchema();
  await ensurePodcastsSchema();
  await ensureAudienceSchema();
}

/** Синхронизация каталога тестов — тяжёлая, на Vercel не блокирует ответ. */
async function bootstrapDeferred() {
  await ensureTestCatalog();
}

async function bootstrap() {
  await bootstrapCritical();
  await bootstrapDeferred();
}

let bootstrapPromise = null;
let deferredBootstrapStarted = false;

function startDeferredBootstrap() {
  if (deferredBootstrapStarted) return;
  deferredBootstrapStarted = true;
  bootstrapDeferred().catch((err) => {
    deferredBootstrapStarted = false;
    console.warn('⚠️ Deferred bootstrap (test catalog):', err.message);
  });
}

function ensureBootstrap() {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      if (process.env.VERCEL) {
        try {
          if (await isDatabaseInitialized()) {
            console.log('✅ Vercel: схема БД уже есть — быстрый старт');
            startDeferredBootstrap();
            return;
          }
        } catch (err) {
          if (err.code === 'DB_NOT_CONFIGURED') throw err;
          console.warn('⚠️ Vercel db check:', err.message);
        }
      }
      await bootstrapCritical();
      if (process.env.VERCEL) {
        startDeferredBootstrap();
      } else {
        await bootstrapDeferred();
      }
    })().catch((err) => {
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

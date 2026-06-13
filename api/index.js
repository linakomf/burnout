const { app, ensureBootstrap } = require('../server/app');
const { ensureCoreSchema } = require('../server/ensureCoreSchema');
const { ensureOnboardingSchema } = require('../server/ensureOnboardingSchema');
const { ensureSerialSequences } = require('../server/ensureSerialSequences');
const { isDatabaseInitialized } = require('../server/dbReady');

let bootstrapDone = false;
let bootstrapPromise = null;
let authSchemaReady = false;

function runBootstrap() {
  if (!bootstrapPromise) {
    bootstrapPromise = ensureBootstrap()
      .then(() => {
        bootstrapDone = true;
      })
      .catch((err) => {
        bootstrapPromise = null;
        throw err;
      });
  }
  return bootstrapPromise;
}

async function ensureReady() {
  if (!bootstrapDone) {
    await runBootstrap();
  }
}

function requestPath(req) {
  const direct = String(req.url || '').split('?')[0];
  if (direct.startsWith('/api/') || direct === '/api') return direct;

  const forwarded =
    req.headers['x-vercel-original-url'] ||
    req.headers['x-invoke-path'] ||
    req.headers['x-forwarded-uri'] ||
    '';
  const fromHeader = String(forwarded).split('?')[0];
  if (fromHeader.startsWith('/api/') || fromHeader === '/api') {
    const qs = String(req.url || '').includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    req.url = fromHeader + qs;
    return fromHeader;
  }
  return direct;
}

function isHealthRequest(req) {
  const url = requestPath(req);
  return req.method === 'GET' && (url === '/api/health' || url.startsWith('/api/health?'));
}

function isWarmRequest(req) {
  const url = requestPath(req);
  return req.method === 'GET' && (url === '/api/warm' || url.startsWith('/api/warm?'));
}

function isAuthPost(req) {
  if (req.method !== 'POST') return false;
  const url = requestPath(req);
  return url === '/api/auth/register' || url === '/api/auth/login';
}


async function ensureAuthReady() {
  const pool = require('../server/db');
  await pool.query('SELECT 1');
  if (authSchemaReady) {
    if (!bootstrapDone) runBootstrap().catch(() => {});
    return;
  }
  let hasUsers = false;
  try {
    hasUsers = await isDatabaseInitialized();
  } catch (err) {
    if (err.code === 'DB_NOT_CONFIGURED') throw err;
    console.warn('Auth schema check:', err.message);
  }
  if (!hasUsers) {
    await ensureCoreSchema();
    await ensureOnboardingSchema();
  }
  await ensureSerialSequences();
  authSchemaReady = true;
  if (!bootstrapDone) runBootstrap().catch(() => {});
}

async function buildHealthPayload() {
  const hasUrl = Boolean(process.env.DATABASE_URL?.trim());
  const hasJwt = Boolean(process.env.JWT_SECRET?.trim());
  let database = 'missing';
  if (hasUrl) {
    try {
      const pool = require('../server/db');
      await pool.query('SELECT 1');
      database = 'connected';
    } catch (err) {
      console.warn('Health DB ping failed:', err.message);
      database = 'error';
    }
  }
  return {
    status: database === 'connected' ? 'OK' : 'degraded',
    timestamp: new Date().toISOString(),
    database,
    jwt: hasJwt ? 'configured' : 'missing',
    ready: bootstrapDone,
    vercel: Boolean(process.env.VERCEL)
  };
}

if (process.env.VERCEL && process.env.DATABASE_URL?.trim()) {
  runBootstrap().catch((err) => console.warn('Background bootstrap:', err.message));
}


module.exports = async (req, res) => {
  try {
    requestPath(req);

    if (isWarmRequest(req)) {
      try {
        await ensureAuthReady();
      } catch (err) {
        console.warn('Warm ping:', err.message);
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ status: 'ready', ready: authSchemaReady || bootstrapDone }));
      return;
    }

    if (isHealthRequest(req)) {
      if (!bootstrapDone && process.env.DATABASE_URL?.trim()) {
        runBootstrap().catch(() => {});
      }
      const payload = await buildHealthPayload();
      res.statusCode = payload.database === 'connected' ? 200 : 503;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(payload));
      return;
    }

    if (isAuthPost(req)) {
      await ensureAuthReady();
      return app(req, res);
    }

    await ensureReady();
    return app(req, res);
  } catch (err) {
    console.error('API handler error:', err);
    if (res.headersSent) return;
    const status = err.code === 'DB_NOT_CONFIGURED' ? 503 : 500;
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        message:
          err.code === 'DB_NOT_CONFIGURED'
            ? 'Сервер не подключён к базе данных. Задайте DATABASE_URL в Vercel (Production) и сделайте Redeploy.'
            : err.message || 'Ошибка сервера'
      })
    );
  }
};

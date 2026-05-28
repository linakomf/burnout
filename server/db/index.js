const { Pool } = require('pg');
const { parse } = require('pg-connection-string');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

let pool = null;

function resolveSsl(connectionString) {
  if (process.env.PGSSLMODE === 'disable') return false;

  const host = String(parse(connectionString).host || '').toLowerCase();
  const needsSsl =
    host.includes('neon.tech') ||
    host.includes('supabase.co') ||
    host.endsWith('.render.com') ||
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.VERCEL);

  return needsSsl ? { rejectUnauthorized: false } : undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    const err = new Error(
      'DATABASE_URL не задан. Для Vercel добавьте облачный PostgreSQL (Neon, Render Postgres) в Environment Variables.'
    );
    err.code = 'DB_NOT_CONFIGURED';
    throw err;
  }

  const serverless = Boolean(process.env.VERCEL);
  const nextPool = new Pool({
    connectionString,
    ssl: resolveSsl(connectionString),
    max: serverless ? 1 : 10,
    idleTimeoutMillis: serverless ? 5000 : 30000,
    connectionTimeoutMillis: serverless ? 15000 : 10000
  });

  let pgLogOnce = false;
  nextPool.on('connect', () => {
    if (!pgLogOnce) {
      pgLogOnce = true;
      console.log('✅ Connected to PostgreSQL database');
    }
  });

  nextPool.on('error', (err) => {
    console.error('❌ Database connection error:', err);
  });

  return nextPool;
}

function getPool() {
  if (!pool) pool = createPool();
  return pool;
}

module.exports = {
  query(...args) {
    return getPool().query(...args);
  },
  connect(...args) {
    return getPool().connect(...args);
  },
  end(...args) {
    if (!pool) return Promise.resolve();
    const current = pool;
    pool = null;
    return current.end(...args);
  }
};

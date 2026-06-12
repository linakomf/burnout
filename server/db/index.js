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

/** Neon pooler (PgBouncer) не держит search_path из startup options — задаём на каждом клиенте. */
async function prepareClient(client) {
  await client.query('SET search_path TO public');
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
  nextPool.on('connect', (client) => {
    if (!pgLogOnce) {
      pgLogOnce = true;
      console.log('✅ Connected to PostgreSQL database');
    }
    prepareClient(client).catch((err) => {
      console.error('Failed to set search_path on connect:', err.message);
    });
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
  async query(text, params) {
    const client = await getPool().connect();
    try {
      await prepareClient(client);
      return await client.query(text, params);
    } finally {
      client.release();
    }
  },
  async connect() {
    const client = await getPool().connect();
    try {
      await prepareClient(client);
      return client;
    } catch (err) {
      client.release();
      throw err;
    }
  },
  end(...args) {
    if (!pool) return Promise.resolve();
    const current = pool;
    pool = null;
    return current.end(...args);
  }
};

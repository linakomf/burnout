const { Pool } = require('pg');
const { parse } = require('pg-connection-string');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

let pool = null;

function createPool() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    const err = new Error(
      'DATABASE_URL не задан. Для Vercel добавьте облачный PostgreSQL (Neon, Render Postgres) в Environment Variables.'
    );
    err.code = 'DB_NOT_CONFIGURED';
    throw err;
  }

  const parsed = parse(connectionString);
  const ssl =
    process.env.PGSSLMODE === 'disable'
      ? false
      : parsed.ssl || process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : undefined;

  const nextPool = new Pool({
    ...parsed,
    password: String(parsed.password ?? process.env.PGPASSWORD ?? ''),
    ssl
  });

  let pgLogOnce = false;
  nextPool.on('connect', (client) => {
    client.query("SET client_encoding TO 'UTF8'").catch(() => {});
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

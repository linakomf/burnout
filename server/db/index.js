const { Pool } = require('pg');
const { parse } = require('pg-connection-string');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  console.error(
    'FATAL: DATABASE_URL не задан или пуст. Скопируйте server/.env.example в server/.env и укажите строку подключения PostgreSQL, например:\n' +
      '  DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/burnout_db'
  );
  process.exit(1);
}

const parsed = parse(connectionString);
const pool = new Pool({
  ...parsed,
  password: String(parsed.password ?? process.env.PGPASSWORD ?? ''),
});

let pgLogOnce = false;
pool.on('connect', (client) => {
  client.query("SET client_encoding TO 'UTF8'").catch(() => {});
  if (!pgLogOnce) {
    pgLogOnce = true;
    console.log('✅ Connected to PostgreSQL database');
  }
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

module.exports = pool;

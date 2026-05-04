const { Pool } = require('pg');
const { parse } = require('pg-connection-string');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  console.error(
    'FATAL: DATABASE_URL не задан или пуст.\n' +
    '  1) Выполните из корня проекта: npm run setup (создаст server/.env из примера)\n' +
    '  2) Поднимите PostgreSQL, например: docker compose up -d\n' +
    '     или установите Postgres локально и пропишите строку в server/.env\n' +
    '  Пример: DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/burnout_db'
  );
  process.exit(1);
}

const parsed = parse(connectionString);
const pool = new Pool({
  ...parsed,
  password: String(parsed.password ?? process.env.PGPASSWORD ?? '')
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
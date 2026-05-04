/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const envExample = path.join(root, 'server', '.env.example');
const envPath = path.join(root, 'server', '.env');

if (!fs.existsSync(envExample)) {
  console.error('Не найден server/.env.example');
  process.exit(1);
}

if (!fs.existsSync(envPath)) {
  fs.copyFileSync(envExample, envPath);
  console.log('Создан файл server/.env (копия .env.example).');
} else {
  console.log('server/.env уже существует — не перезаписываем.');
}

console.log(`
Дальше (из корня проекта):
  1) Запустите PostgreSQL.
     С Docker:  npm.cmd run db:up   (или: docker compose up -d)
     Без Docker: установите PostgreSQL, БД burnout_db, DATABASE_URL в server/.env
  2) Запуск без ошибки PowerShell «выполнение сценариев отключено»:
     • Дважды щёлкните start-dev.cmd  ИЛИ
     • В PowerShell:  npm.cmd run dev  ИЛИ
     • В CMD:  npm run dev
  3) Браузер: http://127.0.0.1:3000

Админ: server/.env → DEFAULT_ADMIN_EMAIL / DEFAULT_ADMIN_PASSWORD
`);

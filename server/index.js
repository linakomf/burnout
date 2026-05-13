const { startServer } = require('./app');

startServer().catch((err) => {
  console.error('❌ Сервер не запущен:', err.message);
  console.error(
    'Проверьте DATABASE_URL в server/.env и что PostgreSQL запущен (например: из корня проекта выполните docker compose up -d).'
  );
  process.exit(1);
});

const serverless = require('serverless-http');
const { app, ensureBootstrap } = require('../server/app');

let handler;

module.exports = async (req, res) => {
  try {
    await ensureBootstrap();
    if (!handler) handler = serverless(app);
    return await handler(req, res);
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
            ? 'Сервер не подключён к базе данных. Задайте DATABASE_URL в настройках Vercel.'
            : 'Ошибка сервера'
      })
    );
  }
};

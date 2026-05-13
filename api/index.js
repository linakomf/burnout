const serverless = require('serverless-http');
const { app, ensureBootstrap } = require('../server/app');

let handler;

function isHealthRequest(req) {
  const url = String(req.url || '');
  return req.method === 'GET' && (url === '/api/health' || url.startsWith('/api/health?'));
}

module.exports = async (req, res) => {
  try {
    if (isHealthRequest(req)) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          status: 'OK',
          timestamp: new Date().toISOString(),
          database: process.env.DATABASE_URL?.trim() ? 'configured' : 'missing'
        })
      );
      return;
    }

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

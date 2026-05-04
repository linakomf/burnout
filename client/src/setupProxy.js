const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function setupProxy(app) {
  const target = process.env.REACT_APP_DEV_PROXY_TARGET || 'http://127.0.0.1:5000';
  const common = { target, changeOrigin: true };
  app.use('/api', createProxyMiddleware(common));
  app.use('/uploads', createProxyMiddleware(common));
};

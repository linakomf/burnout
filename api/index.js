const serverless = require('serverless-http');
const { app, ensureBootstrap } = require('../server/app');

let handler;

module.exports = async (req, res) => {
  await ensureBootstrap();
  if (!handler) handler = serverless(app);
  return handler(req, res);
};

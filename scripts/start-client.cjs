const path = require('path');
const { spawnSync } = require('child_process');

const clientDir = path.join(__dirname, '..', 'client');
const rs = path.join(clientDir, 'node_modules', 'react-scripts', 'bin', 'react-scripts.js');

const r = spawnSync(process.execPath, [rs, 'start'], {
  cwd: clientDir,
  stdio: 'inherit',
  env: process.env
});

process.exit(r.status === null ? 1 : r.status);

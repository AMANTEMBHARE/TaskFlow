// PM2 process definition for the TaskFlow API.
//   pm2 start deploy/pm2/ecosystem.config.cjs
//   pm2 save && pm2 startup     (restart automatically after a reboot)
//
// Secrets are NOT stored here. The app reads them from backend/.env (chmod 600 on the server).
const path = require('path');

module.exports = {
  apps: [
    {
      name: 'taskflow-api',
      cwd: path.resolve(__dirname, '../../backend'),
      script: 'src/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production' },
      autorestart: true,
      max_memory_restart: '300M', // restart on memory leaks (small EC2 instances have little RAM)
      kill_timeout: 10000, // time the app gets to shut down gracefully before PM2 sends SIGKILL
      min_uptime: '10s',
      max_restarts: 10,
      time: true, // prefix log lines with timestamps
    },
  ],
};

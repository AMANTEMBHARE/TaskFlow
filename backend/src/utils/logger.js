const config = require('../config/env');

// Minimal logger: JSON lines in production (easy for PM2 / Docker / CloudWatch to
// collect), readable single lines in development. Everything goes to stdout/stderr.
function write(level, message, meta) {
  const time = new Date().toISOString();
  const stream = level === 'error' ? process.stderr : process.stdout;

  if (config.isProduction) {
    stream.write(`${JSON.stringify({ time, level, message, ...meta })}\n`);
  } else {
    const extra = meta ? ` ${JSON.stringify(meta)}` : '';
    stream.write(`${time} ${level.toUpperCase().padEnd(5)} ${message}${extra}\n`);
  }
}

module.exports = {
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta),
};

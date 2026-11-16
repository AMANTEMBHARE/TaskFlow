const mongoose = require('mongoose');
const config = require('./config/env');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const app = require('./app');

let server;
let shuttingDown = false;

async function start() {
  await connectDB(config.mongodbUri);

  server = app.listen(config.port, config.host, () => {
    logger.info('TaskFlow API listening', {
      host: config.host,
      port: config.port,
      env: config.nodeEnv,
    });
  });
}

// Graceful shutdown: stop accepting connections, let in-flight requests finish,
// close the database connection, then exit. PM2 sends SIGINT, Docker/systemd SIGTERM.
function shutdown(signal, exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${signal} received, shutting down gracefully`);

  const forceTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 10000);
  forceTimer.unref();

  const closeDatabase = async () => {
    try {
      await mongoose.connection.close();
    } finally {
      process.exit(exitCode);
    }
  };

  if (server) server.close(closeDatabase);
  else closeDatabase();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: String(reason) });
  shutdown('unhandledRejection', 1);
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  shutdown('uncaughtException', 1);
});

start().catch((err) => {
  logger.error('Failed to start server', { error: err.message });
  process.exit(1);
});

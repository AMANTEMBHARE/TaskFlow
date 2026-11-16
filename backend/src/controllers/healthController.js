const mongoose = require('mongoose');

// Used by Nginx/PM2 checks today, and by Docker HEALTHCHECK and CI/CD deploy
// verification later. Returns 503 when the database is not connected.
const health = (req, res) => {
  const dbUp = mongoose.connection.readyState === 1;

  res.status(dbUp ? 200 : 503).json({
    success: dbUp,
    data: {
      status: dbUp ? 'ok' : 'degraded',
      database: dbUp ? 'connected' : 'disconnected',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
};

module.exports = { health };

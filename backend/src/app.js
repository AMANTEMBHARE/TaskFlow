const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const config = require('./config/env');
const sanitize = require('./middleware/sanitize');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// app.js only builds the Express app (no listen, no database), so it can be
// imported by tools and tests. server.js starts it.
const app = express();

app.disable('x-powered-by');
if (config.trustProxy > 0) {
  // Behind Nginx: trust X-Forwarded-* so rate limiting sees real client IPs.
  app.set('trust proxy', config.trustProxy);
}

app.use(helmet());
app.use(
  cors({
    // Unknown origins simply get no CORS headers, so browsers block cross-origin reads.
    // Same-origin requests (production behind Nginx) are not affected by CORS at all.
    origin: (origin, callback) => callback(null, !origin || config.allowedOrigins.includes(origin)),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Requested-With'],
    maxAge: 600,
  })
);
app.use(morgan(config.isProduction ? 'combined' : 'dev'));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(sanitize);

app.use('/api/v1', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

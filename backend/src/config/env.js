const path = require('path');
const dotenv = require('dotenv');
const { toMs } = require('../utils/duration');

// Loads backend/.env if present. In production (PM2, Docker) real environment
// variables take precedence because dotenv never overrides existing ones.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function fail(message) {
  console.error(`[config] ${message}`);
  process.exit(1);
}

const missing = ['MONGODB_URI', 'JWT_SECRET'].filter((key) => !process.env[key]);
if (missing.length > 0) {
  fail(
    `Missing required environment variables: ${missing.join(', ')}. ` +
      'Copy backend/.env.example to backend/.env and fill it in.'
  );
}
if (process.env.JWT_SECRET.length < 32) {
  fail('JWT_SECRET must be at least 32 characters long.');
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1d';

let cookieMaxAgeMs;
try {
  cookieMaxAgeMs = toMs(jwtExpiresIn);
} catch (err) {
  fail(`JWT_EXPIRES_IN: ${err.message}`);
}

module.exports = Object.freeze({
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT) || 5000,
  host: process.env.HOST || '0.0.0.0',
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn,
  cookieMaxAgeMs,
  cookieSecure: String(process.env.COOKIE_SECURE ?? isProduction).toLowerCase() === 'true',
  allowedOrigins: (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean),
  trustProxy: Number(process.env.TRUST_PROXY ?? (isProduction ? 1 : 0)),
});

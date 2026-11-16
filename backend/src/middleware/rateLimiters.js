const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/ApiError');

function build({ windowMs, limit, message }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res, next) => next(new ApiError(429, message)),
  });
}

// Strict limit for login/register to slow down credential stuffing and brute force.
const authLimiter = build({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: 'Too many attempts. Please try again in a few minutes.',
});

// Generous limit for the rest of the API.
const apiLimiter = build({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  message: 'Too many requests. Please slow down.',
});

module.exports = { authLimiter, apiLimiter };

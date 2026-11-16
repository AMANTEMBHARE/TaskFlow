const mongoose = require('mongoose');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// Express recognises error middleware by its 4 arguments, so the unused `_next` must stay.
function errorHandler(err, req, res, _next) {
  let status = 500;
  let message = 'Internal server error';
  let errors;

  if (err instanceof ApiError) {
    status = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err && err.code === 11000) {
    status = 409;
    message = 'Duplicate value';
  } else if (err && err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body is not valid JSON';
  } else if (err && err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large';
  }

  if (status >= 500) {
    logger.error('Unhandled error', {
      method: req.method,
      url: req.originalUrl,
      error: err && err.message,
      stack: err && err.stack,
    });
  }

  const body = { success: false, message };
  if (errors) body.errors = errors;

  // Never leak internals in production; helpful details only in development.
  if (status === 500 && !config.isProduction) {
    body.message = err.message || message;
    body.stack = err.stack;
  }

  res.status(status).json(body);
}

module.exports = { notFound, errorHandler };

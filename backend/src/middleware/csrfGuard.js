const ApiError = require('../utils/ApiError');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF protection for cookie-based auth:
 *  1. The auth cookie is SameSite=Lax, so browsers do not send it on cross-site
 *     POST/PATCH/DELETE requests.
 *  2. State-changing requests must also carry a custom header. A cross-site page
 *     cannot add custom headers without a CORS preflight, which our CORS allow-list
 *     rejects. The frontend axios instance adds this header to every request.
 */
module.exports = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();
  if (req.get('X-Requested-With') !== 'XMLHttpRequest') {
    return next(ApiError.forbidden('Missing or invalid CSRF header'));
  }
  return next();
};

const config = require('../config/env');

const COOKIE_NAME = 'taskflow_token';

function baseOptions() {
  return {
    httpOnly: true, // not readable from JavaScript, so XSS cannot steal the token
    secure: config.cookieSecure, // HTTPS only when COOKIE_SECURE=true
    sameSite: 'lax', // not sent on cross-site POST/PATCH/DELETE
    path: '/',
  };
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, { ...baseOptions(), maxAge: config.cookieMaxAgeMs });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, baseOptions());
}

module.exports = { COOKIE_NAME, setAuthCookie, clearAuthCookie };

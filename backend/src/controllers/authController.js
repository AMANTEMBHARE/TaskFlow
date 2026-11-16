const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { setAuthCookie, clearAuthCookie } = require('../utils/cookies');

const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.register(req.body);
  setAuthCookie(res, token);
  sendSuccess(res, { user }, 201);
});

const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body);
  setAuthCookie(res, token);
  sendSuccess(res, { user });
});

const logout = (req, res) => {
  clearAuthCookie(res);
  sendSuccess(res, { message: 'Logged out' });
};

const me = (req, res) => {
  sendSuccess(res, { user: req.user });
};

module.exports = { register, login, logout, me };

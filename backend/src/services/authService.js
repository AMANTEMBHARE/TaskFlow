const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const BCRYPT_ROUNDS = 12;

// Compared against when the email is unknown, so "no such user" and "wrong password"
// take about the same time (prevents account enumeration through timing).
const DUMMY_HASH = bcrypt.hashSync('taskflow-timing-equaliser', BCRYPT_ROUNDS);

function signToken(user) {
  return jwt.sign({ sub: user.id }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: config.jwtExpiresIn,
  });
}

async function register({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  try {
    const user = await User.create({ name, email, passwordHash });
    return { user, token: signToken(user) };
  } catch (err) {
    // The unique index on email is the source of truth for duplicates (race-safe).
    if (err && err.code === 11000) {
      throw ApiError.conflict('An account with this email already exists');
    }
    throw err;
  }
}

async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash');
  const hash = user ? user.passwordHash : DUMMY_HASH;
  const matches = await bcrypt.compare(password, hash);

  if (!user || !matches) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  return { user, token: signToken(user) };
}

module.exports = { register, login };

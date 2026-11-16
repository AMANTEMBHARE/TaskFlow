const express = require('express');
const controller = require('../controllers/authController');
const validate = require('../middleware/validate');
const requireAuth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiters');
const validators = require('../validators/authValidators');

const router = express.Router();

router.post('/register', authLimiter, validate(validators.register), controller.register);
router.post('/login', authLimiter, validate(validators.login), controller.login);
// Logout only clears the cookie, so it works even if the session already expired.
router.post('/logout', controller.logout);
router.get('/me', requireAuth, controller.me);

module.exports = router;

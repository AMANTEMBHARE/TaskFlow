const express = require('express');
const csrfGuard = require('../middleware/csrfGuard');
const { apiLimiter } = require('../middleware/rateLimiters');
const { health } = require('../controllers/healthController');
const authRoutes = require('./auth');
const taskRoutes = require('./tasks');
const dashboardRoutes = require('./dashboard');

const router = express.Router();

// Health check stays outside the limiter/CSRF guard so monitors can always reach it.
router.get('/health', health);

router.use(apiLimiter);
router.use(csrfGuard);

router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;

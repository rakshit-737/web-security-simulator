const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const { strictLimiter } = require('../middleware/rateLimiter');

router.post('/login', strictLimiter, login);
router.get('/me', authenticate, getMe);

module.exports = router;

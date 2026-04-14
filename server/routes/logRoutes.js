const express = require('express');
const router = express.Router();
const { getLogs, getAlerts } = require('../controllers/logController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/', authenticate, authorize('admin', 'analyst'), getLogs);
router.get('/alerts', authenticate, authorize('admin', 'analyst'), getAlerts);

module.exports = router;

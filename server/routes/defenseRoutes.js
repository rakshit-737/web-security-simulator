const express = require('express');
const router = express.Router();
const { getDefenses, updateDefenses } = require('../controllers/defenseController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/', authenticate, getDefenses);
router.put('/', authenticate, authorize('admin'), updateDefenses);

module.exports = router;

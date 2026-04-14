const express = require('express');
const router = express.Router();
const {
  simulateAttack,
  getAttackTypes,
  getAttackHistory,
} = require('../controllers/attackController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/types', getAttackTypes);
router.post('/simulate', authenticate, authorize('attacker', 'admin'), simulateAttack);
router.get('/history', authenticate, authorize('attacker', 'admin', 'analyst'), getAttackHistory);

module.exports = router;

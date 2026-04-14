const Attack = require('../models/Attack');
const { simulateAttack } = require('../services/attackEngine');
const { createAlert } = require('../services/alertService');
const { getDefenseConfig } = require('../config/security');

const ATTACK_TYPES = [
  {
    type: 'sqli',
    label: 'SQL Injection',
    description: 'Attempts to manipulate SQL queries via unsanitized user input.',
    payloadExample: "' OR 1=1 --",
  },
  {
    type: 'xss',
    label: 'Cross-Site Scripting (XSS)',
    description: 'Injects malicious scripts into web pages viewed by other users.',
    payloadExample: '<script>alert("XSS")</script>',
  },
  {
    type: 'brute-force',
    label: 'Brute Force',
    description: 'Repeatedly attempts credentials to gain unauthorised access.',
    payloadExample: null,
  },
  {
    type: 'csrf',
    label: 'Cross-Site Request Forgery (CSRF)',
    description: 'Tricks authenticated users into submitting unintended requests.',
    payloadExample: null,
  },
];

const VALID_TYPES = ATTACK_TYPES.map((a) => a.type);

async function simulateAttackHandler(req, res) {
  const { type, payload, options } = req.body;

  if (!type || !VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: `Invalid attack type. Valid types: ${VALID_TYPES.join(', ')}` });
  }

  try {
    const config = getDefenseConfig();
    const result = simulateAttack({ type, payload, options: options || {} }, config);

    const attack = await Attack.create({
      type,
      payload: payload || null,
      options: options || {},
      result,
      userId:   req.user._id,
      username: req.user.username,
    });

    if (result.detected) {
      const io = req.app.get('io');
      const level = result.blocked ? 'critical' : 'warning';
      createAlert(io, {
        level,
        message: result.message,
        type,
        userId: req.user._id,
      }).catch(() => {});
    }

    return res.json({ attackId: attack._id, type, result });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Simulation error' });
  }
}

function getAttackTypes(req, res) {
  return res.json(ATTACK_TYPES);
}

async function getAttackHistory(req, res) {
  try {
    const filter = req.user.role === 'attacker'
      ? { userId: req.user._id }
      : {};

    const attacks = await Attack.find(filter)
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    return res.json(attacks);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve attack history' });
  }
}

module.exports = { simulateAttack: simulateAttackHandler, getAttackTypes, getAttackHistory };

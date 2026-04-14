const xss = require('xss');
const { defenseConfig } = require('../config/security');

function sanitizeValue(val) {
  if (typeof val === 'string') return xss(val);
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    const sanitized = {};
    for (const [k, v] of Object.entries(val)) {
      sanitized[k] = sanitizeValue(v);
    }
    return sanitized;
  }
  if (Array.isArray(val)) return val.map(sanitizeValue);
  return val;
}

function inputSanitizer(req, res, next) {
  if (defenseConfig.inputSanitization && req.body) {
    req.body = sanitizeValue(req.body);
  }
  next();
}

module.exports = inputSanitizer;

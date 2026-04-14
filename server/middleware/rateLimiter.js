const rateLimit = require('express-rate-limit');
const { defenseConfig } = require('../config/security');

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' },
});

function conditionalLimiter(req, res, next) {
  if (defenseConfig.rateLimiting) {
    return limiter(req, res, next);
  }
  next();
}

module.exports = { conditionalLimiter, strictLimiter, limiter };

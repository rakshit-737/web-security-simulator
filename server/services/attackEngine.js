const xss = require('xss');

const SQL_DEMO_DATA = [
  { id: 1, username: 'alice', email: 'alice@example.com' },
  { id: 2, username: 'bob',   email: 'bob@example.com' },
  { id: 3, username: 'carol', email: 'carol@example.com' },
];

const SQL_PATTERNS = [
  /SELECT\s+/i, /DROP\s+/i, /INSERT\s+INTO/i,
  /UPDATE\s+\w+\s+SET/i, /DELETE\s+FROM/i,
  /--/, /UNION\s+(ALL\s+)?SELECT/i,
  /OR\s+1\s*=\s*1/i, /OR\s+'[^']*'\s*=\s*'[^']*'/i,
  /xp_cmdshell/i, /EXEC\s*\(/i,
];

const XSS_PATTERNS = [
  /<script[\s>]/i, /onerror\s*=/i, /onload\s*=/i,
  /onclick\s*=/i, /onmouseover\s*=/i, /javascript\s*:/i,
  /<iframe/i, /document\.cookie/i, /eval\s*\(/i,
];

function isSQLInjection(payload) {
  return SQL_PATTERNS.some((p) => p.test(payload));
}

function isXSS(payload) {
  return XSS_PATTERNS.some((p) => p.test(payload));
}

function simulateSQLi(payload, config) {
  const rawPayload = payload || '';
  const sanitizedPayload = config.inputSanitization
    ? rawPayload.replace(/['";<>]/g, '')
    : rawPayload;

  const payloadToCheck = config.inputSanitization ? sanitizedPayload : rawPayload;
  const detected = isSQLInjection(rawPayload);
  const blockedByWAF = config.wafEnabled && isSQLInjection(payloadToCheck);
  const sanitized = config.inputSanitization && detected;

  let demoQueryResult = null;
  let message = '';

  if (blockedByWAF) {
    message = 'WAF blocked the SQL injection attempt.';
  } else if (sanitized) {
    demoQueryResult = SQL_DEMO_DATA.filter(
      (u) => u.username === sanitizedPayload
    );
    message = 'Input sanitized; query executed safely with no injection effect.';
  } else if (detected) {
    demoQueryResult = SQL_DEMO_DATA;
    message = 'SQL injection succeeded — all records exposed (demo only).';
  } else {
    demoQueryResult = SQL_DEMO_DATA.filter((u) => u.username === rawPayload);
    message = 'Query executed normally; no injection detected.';
  }

  return {
    detected,
    blocked: blockedByWAF,
    sanitized,
    rawPayload,
    sanitizedPayload: config.inputSanitization ? sanitizedPayload : null,
    demoQueryResult,
    message,
  };
}

function simulateXSS(payload, config) {
  const rawPayload = payload || '';
  const sanitizedPayload = config.inputSanitization ? xss(rawPayload) : rawPayload;
  const payloadToCheck = config.inputSanitization ? sanitizedPayload : rawPayload;
  const detected = isXSS(rawPayload);
  const blockedByCSP = config.cspEnabled && isXSS(payloadToCheck);
  const blockedByWAF = config.wafEnabled && isXSS(payloadToCheck);
  const blocked = blockedByCSP || blockedByWAF;
  const sanitized = config.inputSanitization && detected;

  let renderedOutput = '';
  let message = '';

  if (blocked) {
    renderedOutput = config.inputSanitization ? sanitizedPayload : rawPayload;
    message = blockedByCSP
      ? 'CSP blocked inline script execution.'
      : 'WAF blocked the XSS attempt.';
  } else if (sanitized) {
    renderedOutput = sanitizedPayload;
    message = 'XSS payload sanitized; rendered as safe text.';
  } else if (detected) {
    renderedOutput = rawPayload;
    message = 'XSS injection succeeded — script would execute in browser (demo only).';
  } else {
    renderedOutput = rawPayload;
    message = 'Input rendered normally; no XSS detected.';
  }

  return {
    detected,
    blocked,
    sanitized,
    rawPayload,
    sanitizedPayload: config.inputSanitization ? sanitizedPayload : null,
    renderedOutput,
    message,
  };
}

function simulateBruteForce(options, config) {
  const attempts = Math.min(parseInt(options.attempts, 10) || 1, 100);
  const username = options.username || 'admin';
  const rateLimitHit = config.rateLimiting && attempts > 5;
  const attemptsBlocked = rateLimitHit ? attempts - 5 : 0;
  const detected = attempts > 3;
  const blocked = rateLimitHit;

  let message = '';
  if (blocked) {
    message = `Rate limiting triggered after 5 attempts. ${attemptsBlocked} requests blocked for user "${username}".`;
  } else if (detected) {
    message = `Brute-force pattern detected for user "${username}" after ${attempts} attempts. No rate limit active.`;
  } else {
    message = `${attempts} login attempt(s) for user "${username}" — below detection threshold.`;
  }

  return { detected, blocked, attemptsBlocked, rateLimitHit, attempts, username, message };
}

function simulateCSRF(options, config) {
  const csrfProtection = options.csrfProtection !== undefined
    ? options.csrfProtection
    : config.csrfEnabled || false;

  const detected = true;
  const blocked = csrfProtection;
  const tokenRequired = csrfProtection;

  const message = blocked
    ? 'CSRF protection active — token validation required; request blocked.'
    : 'No CSRF protection detected — forged request would succeed (demo only).';

  return { detected, blocked, tokenRequired, message };
}

function simulateAttack({ type, payload, options = {} }, config) {
  switch (type) {
    case 'sqli':        return simulateSQLi(payload, config);
    case 'xss':         return simulateXSS(payload, config);
    case 'brute-force': return simulateBruteForce(options, config);
    case 'csrf':        return simulateCSRF(options, config);
    default:            throw new Error(`Unknown attack type: ${type}`);
  }
}

module.exports = { simulateAttack };

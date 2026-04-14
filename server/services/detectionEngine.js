const { defenseConfig } = require('../config/security');

const SQL_PATTERNS = [
  /SELECT\s+/i,
  /DROP\s+/i,
  /INSERT\s+INTO/i,
  /UPDATE\s+\w+\s+SET/i,
  /DELETE\s+FROM/i,
  /--/,
  /;\s*(SELECT|DROP|INSERT|UPDATE|DELETE)/i,
  /OR\s+1\s*=\s*1/i,
  /OR\s+'[^']*'\s*=\s*'[^']*'/i,
  /UNION\s+(ALL\s+)?SELECT/i,
  /\/\*/,
  /xp_cmdshell/i,
  /EXEC\s*\(/i,
];

const XSS_PATTERNS = [
  /<script[\s>]/i,
  /onerror\s*=/i,
  /onload\s*=/i,
  /onclick\s*=/i,
  /onmouseover\s*=/i,
  /javascript\s*:/i,
  /<iframe/i,
  /<img\b[^>]{0,200}src\s{0,10}=\s{0,10}["']?\s{0,10}javascript:/i,
  /document\.cookie/i,
  /eval\s*\(/i,
  /alert\s*\(/i,
];

function analyzeLog(logData) {
  const flags = [];
  const targets = [logData.payload || '', logData.path || ''].join(' ');

  for (const pattern of SQL_PATTERNS) {
    if (pattern.test(targets)) {
      if (!flags.includes('sqli_attempt')) flags.push('sqli_attempt');
    }
  }

  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(targets)) {
      if (!flags.includes('xss_attempt')) flags.push('xss_attempt');
    }
  }

  let level = 'info';
  if (flags.length > 0) level = 'warning';
  if (flags.length > 1) level = 'critical';

  const blocked = defenseConfig.wafEnabled && flags.length > 0;

  return { flags, level, blocked };
}

module.exports = { analyzeLog };

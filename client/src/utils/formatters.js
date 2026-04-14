export function formatTimestamp(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function getLevelColor(level) {
  switch (level?.toLowerCase()) {
    case 'critical':
      return 'badge-critical';
    case 'warning':
      return 'badge-warning';
    case 'info':
    default:
      return 'badge-info';
  }
}

export function getAttackTypeLabel(type) {
  const labels = {
    sqli: 'SQL Injection',
    xss: 'XSS',
    'brute-force': 'Brute Force',
    csrf: 'CSRF',
  };
  return labels[type] || type;
}

export function getResultBadge(result) {
  if (!result) return { cls: 'badge-neutral', text: 'Unknown' };
  if (result.detected && result.blocked) {
    return { cls: 'badge-critical', text: 'Blocked' };
  }
  if (result.detected && !result.blocked) {
    return { cls: 'badge-warning', text: 'Detected' };
  }
  return { cls: 'badge-success', text: 'Clean' };
}

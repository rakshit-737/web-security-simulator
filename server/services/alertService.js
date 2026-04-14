const Log = require('../models/Log');

async function createAlert(io, { level, message, type, userId }) {
  const alertLog = new Log({
    level:          level || 'warning',
    source:         'alert-service',
    method:         'ALERT',
    path:           `/alert/${type || 'general'}`,
    payload:        message,
    userId:         userId || undefined,
    detectionFlags: [type || 'alert'],
    blocked:        false,
  });

  await alertLog.save();

  if (io) {
    io.emit('new_alert', {
      id:        alertLog._id,
      level:     alertLog.level,
      message,
      type:      type || 'general',
      timestamp: alertLog.timestamp,
    });
  }

  return alertLog;
}

module.exports = { createAlert };

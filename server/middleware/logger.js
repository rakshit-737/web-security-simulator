const Log = require('../models/Log');
const { analyzeLog } = require('../services/detectionEngine');

function requestLogger(req, res, next) {
  res.on('finish', () => {
    const logData = {
      method:   req.method,
      path:     req.path,
      source:   req.ip,
      payload:  req.body && Object.keys(req.body).length ? JSON.stringify(req.body) : undefined,
      userId:   req.user ? req.user._id : undefined,
      username: req.user ? req.user.username : undefined,
    };

    const analysis = analyzeLog(logData);

    const logEntry = new Log({
      ...logData,
      level:          analysis.level,
      detectionFlags: analysis.flags,
      blocked:        analysis.blocked,
    });

    logEntry.save().then(() => {
      const io = req.app.get('io');
      if (io) {
        io.emit('new_log', logEntry.toObject());
      }
    }).catch(() => {});
  });

  next();
}

module.exports = requestLogger;

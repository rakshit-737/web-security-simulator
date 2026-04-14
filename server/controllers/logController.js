const Log = require('../models/Log');

async function getLogs(req, res) {
  try {
    const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip  = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      Log.find().sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
      Log.countDocuments(),
    ]);

    return res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve logs' });
  }
}

async function getAlerts(req, res) {
  try {
    const alerts = await Log.find({ level: { $in: ['warning', 'critical'] } })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    return res.json(alerts);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve alerts' });
  }
}

module.exports = { getLogs, getAlerts };

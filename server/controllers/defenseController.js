const { getDefenseConfig, updateDefenseConfig } = require('../config/security');

function getDefenses(req, res) {
  return res.json(getDefenseConfig());
}

async function updateDefenses(req, res) {
  const updates = req.body;

  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    return res.status(400).json({ error: 'Request body must be a JSON object of defense settings' });
  }

  try {
    const updated = await updateDefenseConfig(updates);
    return res.json({ message: 'Defense configuration updated', config: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update defense configuration' });
  }
}

module.exports = { getDefenses, updateDefenses };

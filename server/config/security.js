const Defense = require('../models/Defense');

const defenseConfig = {
  rateLimiting: true,
  inputSanitization: true,
  cspEnabled: true,
  wafEnabled: true,
  wafKeywords: [
    'SELECT', 'DROP', 'INSERT', 'UPDATE', 'DELETE', '--', ';',
    '<script', 'onerror', 'onload', 'javascript:'
  ],
};

async function syncFromDB() {
  try {
    const records = await Defense.find({});
    for (const record of records) {
      if (Object.prototype.hasOwnProperty.call(defenseConfig, record.key)) {
        defenseConfig[record.key] = record.value;
      }
    }
  } catch (_err) {
    // DB may not be ready yet; defaults remain in effect
  }
}

function getDefenseConfig() {
  return { ...defenseConfig };
}

async function updateDefenseConfig(updates) {
  for (const [key, value] of Object.entries(updates)) {
    if (Object.prototype.hasOwnProperty.call(defenseConfig, key)) {
      defenseConfig[key] = value;
      await Defense.findOneAndUpdate(
        { key },
        { key, value, updatedAt: new Date() },
        { upsert: true, new: true }
      );
    }
  }
  return getDefenseConfig();
}

module.exports = { defenseConfig, getDefenseConfig, updateDefenseConfig, syncFromDB };

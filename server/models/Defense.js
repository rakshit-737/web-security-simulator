const mongoose = require('mongoose');

const defenseSchema = new mongoose.Schema({
  key:       { type: String, required: true, unique: true },
  value:     { type: mongoose.Schema.Types.Mixed },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Defense', defenseSchema);

const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  timestamp:      { type: Date, default: Date.now },
  level:          { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
  source:         { type: String },
  method:         { type: String },
  path:           { type: String },
  payload:        { type: String },
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username:       { type: String },
  detectionFlags: { type: [String], default: [] },
  blocked:        { type: Boolean, default: false },
});

module.exports = mongoose.model('Log', logSchema);

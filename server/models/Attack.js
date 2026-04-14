const mongoose = require('mongoose');

const attackSchema = new mongoose.Schema({
  type:      { type: String, enum: ['sqli', 'xss', 'brute-force', 'csrf'], required: true },
  payload:   { type: String },
  options:   { type: mongoose.Schema.Types.Mixed },
  result:    { type: mongoose.Schema.Types.Mixed },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username:  { type: String },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Attack', attackSchema);

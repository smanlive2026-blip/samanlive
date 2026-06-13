const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  type: { type: String, enum: ['ad', 'video', 'campaign'] },
  title: String,
  description: String,
  buttonText: String,
  buttonLink: String,
  color: String,
  url: String,
  priority: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'hidden'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Content', contentSchema);
const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, default: 'banner' }, // banner, video, offer
  area: { type: String, default: 'all' },
  status: { type: String, default: 'active' }, // active, inactive
  image: { type: String, default: '' },
  video: { type: String, default: '' },
  description: { type: String, default: '' },
  priority: { type: Number, default: 0 },
  link: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Content', contentSchema);
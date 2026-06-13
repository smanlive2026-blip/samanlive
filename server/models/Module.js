const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  id: String,
  name: String,
  icon: String,
  color: String,
  group: String,
  status: Boolean,
  areas: [{
    areaId: String,
    status: Boolean
  }]
});

const moduleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: String,
  color: String,
  link: String,
  desc: String,
  priority: { type: Number, default: 0 },
  status: { type: Boolean, default: true },
  categories: [categorySchema],
  areas: [{
    areaId: String,
    status: Boolean
  }]
}, { timestamps: true });

module.exports = mongoose.model('Module', moduleSchema);
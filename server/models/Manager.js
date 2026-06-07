const mongoose = require('mongoose');

const managerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  area: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  loginToken: { type: String, default: '' },
  status: { type: String, default: 'active' }, // active, inactive
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Manager', managerSchema);
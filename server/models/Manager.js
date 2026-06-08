const mongoose = require('mongoose');

const managerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  area: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },

  serviceCharge: { type: Number, default: 5 },
  documents: {
    aadhar: { type: String, default: '' },
    pan: { type: String, default: '' },
    photo: { type: String, default: '' },
    addressProof: { type: String, default: '' }
  },

  moduleAccess: {
    type: [String],
    default: [],
    required: true
  },

  loginToken: { type: String, default: '', unique: true, sparse: true },
  tempPassword: { type: String, default: '' },
  status: { type: Boolean, default: true },
  lastLogin: { type: Date },

  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

managerSchema.index({ loginToken: 1 });
managerSchema.index({ area: 1, status: 1 });
managerSchema.index({ moduleAccess: 1 });

module.exports = mongoose.model('Manager', managerSchema);
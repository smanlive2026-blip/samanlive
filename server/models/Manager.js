const mongoose = require('mongoose');

const managerSchema = new mongoose.Schema({
  name: String,
  area: String,
  email: String,
  phone: String,
  serviceCharge: Number,
  status: { type: Boolean, default: true },
  moduleAccess: [String],
  loginToken: String,
  tempPassword: String,
  documents: {
    photo: String,
    aadhar: String,
    pan: String,
    addressProof: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Manager', managerSchema);
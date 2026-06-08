const mongoose = require('mongoose');

const managerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  area: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  
  // NAYA ADD - Service Charge & Documents
  serviceCharge: { type: Number, default: 5 }, // % me, default 5%
  documents: {
    aadhar: { type: String, default: '' }, // Aadhar card image URL
    pan: { type: String, default: '' },    // PAN card image URL
    photo: { type: String, default: '' },  // Manager photo URL
    addressProof: { type: String, default: '' } // Address proof URL
  },
  
  loginToken: { type: String, default: '' }, // Unique link ke liye
  status: { type: Boolean, default: true }, // true = active, false = inactive
  lastLogin: { type: Date }, // NAYA - Last login track karne ke liye
  
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Manager', managerSchema);
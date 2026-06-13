const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const managerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  area: { type: String, required: true },
  serviceCharge: { type: Number, default: 5 },
  moduleAccess: [String], // Category IDs jo ye manager handle karega
  loginToken: { type: String, unique: true },
  tempPassword: String,
  status: { type: Boolean, default: true },
  documents: {
    photo: String,
    aadhar: String,
    pan: String,
    addressProof: String
  }
}, { timestamps: true });

// Password hash karne se pehle
managerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Password check method
managerSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Manager', managerSchema);
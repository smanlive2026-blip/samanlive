const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const managerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: { type: String, required: true, minlength: 6 },
  phone: { type: String, trim: true },
  area: { type: String, required: true, trim: true },
  serviceCharge: { type: Number, default: 5, min: 0, max: 100 },
  moduleAccess: [{ type: String }], // Category IDs jo ye manager handle karega
  loginToken: { type: String, unique: true, sparse: true }, // sparse add kiya
  tempPassword: { type: String },
  status: { type: Boolean, default: true },
  documents: {
    photo: { type: String, default: '' },
    aadhar: { type: String, default: '' },
    pan: { type: String, default: '' },
    addressProof: { type: String, default: '' }
  },
  lastLogin: { type: Date }, // Naya add kiya
  totalShopsCreated: { type: Number, default: 0 } // Naya add kiya
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for fast queries
// managerSchema.index({ email: 1 }); // ← HATA DIYA: unique: true already index banata hai
managerSchema.index({ area: 1 });
managerSchema.index({ status: 1 });
// managerSchema.index({ loginToken: 1 }); // ← HATA DIYA: unique: true already index banata hai
managerSchema.index({ createdAt: -1 });

// Password hash karne se pehle
managerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (err) {
    next(err);
  }
});

// Password check method
managerSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Generate unique login link
managerSchema.methods.generateLoginToken = function() {
  const crypto = require('crypto');
  this.loginToken = crypto.randomBytes(32).toString('hex');
  return this.loginToken;
};

// Virtual for documents count
managerSchema.virtual('documentsUploaded').get(function() {
  if (!this.documents) return 0;
  return Object.values(this.documents).filter(doc => doc && doc.length > 0).length;
});

module.exports = mongoose.models.Manager || mongoose.model('Manager', managerSchema);
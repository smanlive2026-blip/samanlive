const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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
  
  // ========== AREA SYSTEM FIELDS ==========
  area: { type: String, required: true, trim: true }, // Display name - "Surat 50km Zone"
  areaCode: { type: String, required: true, trim: true, uppercase: true }, // "SURAT" - For filtering
  areaName: { type: String, required: true, trim: true }, // "Surat 50km Zone" - Full name
  bucket: { type: String, required: true, trim: true }, // "Grocery", "Fresh", "Food", etc
  managerCode: { type: String, required: true, unique: true, uppercase: true }, // "SURAT-GROCERY" - Auto generated
  // ========== AREA SYSTEM FIELDS END ==========
  
  serviceCharge: { type: Number, default: 5, min: 0, max: 100 },
  moduleAccess: [{ type: String }], // Category IDs jo ye manager handle karega
  loginToken: { type: String, unique: true, sparse: true },
  tempPassword: { type: String },
  status: { type: Boolean, default: true },
  documents: {
    photo: { type: String, default: '' },
    aadhar: { type: String, default: '' },
    pan: { type: String, default: '' },
    addressProof: { type: String, default: '' }
  },
  lastLogin: { type: Date },
  totalShopsCreated: { type: Number, default: 0 }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ========== INDEXES ==========
// Email already indexed due to unique: true
// loginToken already indexed due to unique: true

// Area system indexes
managerSchema.index({ areaCode: 1 }); // Area filter ke liye
managerSchema.index({ bucket: 1 }); // Bucket filter ke liye
managerSchema.index({ areaCode: 1, bucket: 1 }, { unique: true }); // Ek area me ek bucket ka ek hi manager
managerSchema.index({ managerCode: 1 }); // Manager code search
managerSchema.index({ area: 1 });
managerSchema.index({ status: 1 });
managerSchema.index({ createdAt: -1 });

// ========== MIDDLEWARE ==========
// Auto generate managerCode before save
managerSchema.pre('save', function(next) {
  if (this.areaCode && this.bucket && !this.managerCode) {
    this.managerCode = `${this.areaCode}-${this.bucket}`.toUpperCase();
  }
  next();
});

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

// ========== METHODS ==========
// Password check method
managerSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Generate unique login link
managerSchema.methods.generateLoginToken = function() {
  this.loginToken = crypto.randomBytes(32).toString('hex');
  return this.loginToken;
};

// Generate temp password
managerSchema.methods.generateTempPassword = function() {
  const tempPass = Math.random().toString(36).slice(-8);
  this.tempPassword = tempPass;
  this.password = tempPass; // Will be hashed by pre-save hook
  return tempPass;
};

// ========== VIRTUALS ==========
// Virtual for documents count
managerSchema.virtual('documentsUploaded').get(function() {
  if (!this.documents) return 0;
  return Object.values(this.documents).filter(doc => doc && doc.length > 0).length;
});

// Virtual for full manager identifier
managerSchema.virtual('identifier').get(function() {
  return `${this.areaCode}-${this.bucket} (${this.name})`;
});

module.exports = mongoose.models.Manager || mongoose.model('Manager', managerSchema);
// LOCATION: server/models/Executive.js - EXECUTIVE MODEL - V23 UNIFIED PROFILE - KINGMAKER
// CHANGE: photo + avatar + profilePic add kiya - pehle koi field hi nahi tha, isliye photo save nahi hoti thi
// FLOW: Executive dashboard -> UnifiedProfile (common/profile/profile-core.js) -> /api/common/profile/upload-avatar -> Cloudinary -> Executive.photo me URL

const mongoose = require('mongoose');

const ExecutiveSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  password: { type: String, select: false },

  // ===== PROFILE PHOTO - V23 NEW - CLOUDINARY URL HI AAYEGA, BASE64 NAHI =====
  photo: { type: String, default: '', trim: true }, // Main photo - UnifiedProfile isi me save karega
  avatar: { type: String, default: '', trim: true }, // Backup - photo ke barabar rakhenge taaki purana code na tute
  profilePic: { type: String, default: '', trim: true }, // Customer wale se match karne ke liye - 3 field ek hi URL rakhenge

  // ===== EXTRA PROFILE INFO - Dashboard me dikhane ke liye =====
  city: { type: String, trim: true, default: '' },
  area: { type: String, trim: true, default: '' },
  address: { type: String, trim: true, default: '' },
  pincode: { type: String, trim: true, default: '' },
  gender: { type: String, enum: ['male', 'female', 'other', ''], default: '' },
  dob: { type: Date, default: null },

  assignedAreas: [{ type: String, trim: true }], // ['Naliya','Bhuj'] empty = all India
  assignedShopTypes: [{ type: String, trim: true }], // ['kirana','patanjali'] empty = all types
  canApprove: { type: Boolean, default: true },
  canAssign: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  walletBalance: { type: Number, default: 0 },
  totalEarning: { type: Number, default: 0 },
  totalAssigned: { type: Number, default: 0 },
  role: { type: String, default: 'executive', immutable: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// ===== INDEX =====
ExecutiveSchema.index({ phone: 1 });

// ===== PRE SAVE - photo / avatar / profilePic teeno ko sync rakho =====
// Taaki kahin bhi photo maango - photo, avatar ya profilePic - teeno me same URL mile
ExecutiveSchema.pre('save', function(next){
  const pic = this.photo || this.avatar || this.profilePic || '';
  if(pic){
    this.photo = pic;
    this.avatar = pic;
    this.profilePic = pic;
  }
  next();
});

module.exports = mongoose.model('Executive', ExecutiveSchema);
// LOCATION: server/models/ProductManager.js - PRODUCT MANAGER MODEL - V23 UNIFIED PROFILE
// CHANGE: photo + avatar + profilePic + companyLogo add kiya - pehle koi photo field hi nahi tha
// FLOW: Product Manager dashboard -> UnifiedProfile (common/profile/profile-core.js) -> /api/common/profile/upload-avatar -> Cloudinary -> ProductManager.photo / companyLogo me URL

const mongoose = require('mongoose');

const ProductManagerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  password: { type: String, select: false },

  // ===== PROFILE PHOTO - V23 NEW - CLOUDINARY URL HI AAYEGA, BASE64 NAHI =====
  photo: { type: String, default: '', trim: true }, // Apni khud ki photo - UnifiedProfile isi me save karega
  avatar: { type: String, default: '', trim: true }, // Backup - photo ke barabar rakhenge taaki purana code na tute
  profilePic: { type: String, default: '', trim: true }, // Customer / Executive se match karne ke liye

  // ===== COMPANY LOGO - V23 NEW - Alag se chahiye tha =====
  companyLogo: { type: String, default: '', trim: true }, // Company / Brand ka logo - dashboard me alag se dikhega
  companyCover: { type: String, default: '', trim: true }, // Company ka cover / banner - optional

  // ===== EXTRA PROFILE INFO - Dashboard me dikhane ke liye =====
  address: { type: String, trim: true, default: '' },
  state: { type: String, trim: true, default: '' },
  gender: { type: String, enum: ['male', 'female', 'other', ''], default: '' },
  dob: { type: Date, default: null },

  type: { 
    type: String, 
    enum: ['kisan','manufacturer','marketing_employee','contractor','wholesaler','artisan','distributor','shg','startup','importer','fisherman','nursery','pansari','medical','service','other'], 
    required: true, default: 'other' 
  },
  companyName: { type: String, trim: true },
  gst: { type: String, trim: true },
  area: { type: String, required: true, trim: true },
  city: { type: String, trim: true },
  pincode: { type: String, trim: true },
  location: { lat: Number, lng: Number },
  documents: [{ url: String, type: { type: String }, name: String }],
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  walletBalance: { type: Number, default: 0 },
  totalEarning: { type: Number, default: 0 },
  totalProducts: { type: Number, default: 0 },
  role: { type: String, default: 'product_manager', immutable: true },
  createdByExecutive: { type: mongoose.Schema.Types.ObjectId, ref: 'Executive' },
  createdByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// ===== INDEX =====
ProductManagerSchema.index({ phone: 1 });
ProductManagerSchema.index({ area: 1, city: 1 });
ProductManagerSchema.index({ type: 1 });

// ===== PRE SAVE - photo / avatar / profilePic teeno ko sync rakho =====
// Taaki kahin bhi photo maango - photo, avatar ya profilePic - teeno me same URL mile
ProductManagerSchema.pre('save', function(next){
  const pic = this.photo || this.avatar || this.profilePic || '';
  if(pic){
    this.photo = pic;
    this.avatar = pic;
    this.profilePic = pic;
  }
  next();
});

module.exports = mongoose.model('ProductManager', ProductManagerSchema);
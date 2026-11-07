// LOCATION: server/models/ProductManager.js - PRODUCT MANAGER MODEL - V27 FINAL
// CHANGE V27: 1) phone hamesha 10 digit (setter) 2) email / gender hamesha chhota (setter) 3) coverPhoto add kiya - apni cover photo ke liye 4) INDEX SAFAI - phone pe unique 1 baar, dobara mat likho 5) pre-save me normalize + gst uppercase
// FLOW: Product Manager dashboard -> UnifiedProfile (common/profile/profile-core.js) -> /api/common/profile/upload-avatar -> Cloudinary -> ProductManager.photo / companyLogo me URL
// RULE: Pehchan = Phone (10 digit). Email kabhi unique nahi hai.

const mongoose = require('mongoose');

// V27: Phone normalize - +91 8384800729 -> 8384800729
function normPhoneSetter(v) {
    if (v === undefined || v === null) return v;
    const d = String(v).replace(/\D/g, '');
    if (!d) return v;
    return d.length > 10 ? d.slice(-10) : d;
}
function normEmailSetter(v) {
    if (v === undefined || v === null) return '';
    return String(v).toLowerCase().trim();
}
function normGenderSetter(v) {
    if (v === undefined || v === null) return '';
    return String(v).toLowerCase().trim();
}

const ProductManagerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true, set: normPhoneSetter },
  email: { type: String, trim: true, lowercase: true, default: '', set: normEmailSetter },
  password: { type: String, select: false, default: '' },

  // ===== PROFILE PHOTO - V27 UNIFIED - CLOUDINARY URL HI AAYEGA, BASE64 NAHI =====
  photo: { type: String, default: '', trim: true }, // Apni khud ki photo - UnifiedProfile isi me save karega
  avatar: { type: String, default: '', trim: true }, // Backup - photo ke barabar rakhenge taaki purana code na tute
  profilePic: { type: String, default: '', trim: true }, // Customer / Executive se match karne ke liye
  coverPhoto: { type: String, default: '', trim: true }, // V27 ADD - apni khud ki cover photo

  // ===== COMPANY LOGO - V23 NEW - Alag se chahiye tha =====
  companyLogo: { type: String, default: '', trim: true }, // Company / Brand ka logo - dashboard me alag se dikhega
  companyCover: { type: String, default: '', trim: true }, // Company ka cover / banner - optional

  // ===== EXTRA PROFILE INFO - Dashboard me dikhane ke liye =====
  address: { type: String, trim: true, default: '' },
  state: { type: String, trim: true, default: '' },
  gender: { type: String, enum: ['male', 'female', 'other', ''], default: '', set: normGenderSetter },
  dob: { type: Date, default: null },

  type: {
    type: String,
    enum: ['kisan','manufacturer','marketing_employee','contractor','wholesaler','artisan','distributor','shg','startup','importer','fisherman','nursery','pansari','medical','service','other'],
    required: true, default: 'other'
  },
  companyName: { type: String, trim: true },
  gst: { type: String, trim: true, uppercase: true },
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

// ===== INDEX - V27 FINAL =====
// phone pe unique upar wale unique:true se ban jayega, yahan dobara mat likhna
ProductManagerSchema.index({ email: 1 });
ProductManagerSchema.index({ area: 1, city: 1 });
ProductManagerSchema.index({ type: 1 });
ProductManagerSchema.index({ createdAt: -1 });

// ===== PRE SAVE - photo / avatar / profilePic teeno ko sync rakho + normalize =====
// Taaki kahin bhi photo maango - photo, avatar ya profilePic - teeno me same URL mile
ProductManagerSchema.pre('save', function(next){
  try {
    if (this.phone) this.phone = normPhoneSetter(this.phone);
    if (this.email) this.email = normEmailSetter(this.email);
    if (this.gender) this.gender = normGenderSetter(this.gender);
    if (this.gst) this.gst = String(this.gst).toUpperCase().trim();
    if (this.dob === '') this.dob = null;
    const pic = this.photo || this.avatar || this.profilePic || '';
    if (pic) {
        this.photo = pic;
        this.avatar = pic;
        this.profilePic = pic;
    }
  } catch (e) {}
  next();
});

module.exports = mongoose.models.ProductManager || mongoose.model('ProductManager', ProductManagerSchema);
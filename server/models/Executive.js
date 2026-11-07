// LOCATION: server/models/Executive.js - EXECUTIVE MODEL - V27 FINAL - KINGMAKER
// CHANGE V27: 1) phone hamesha 10 digit (setter) 2) email / gender hamesha chhota (setter) 3) companyName + type + state + coverPhoto add kiya - publicExecutive ye maangta tha, Model me tha hi nahi 4) INDEX SAFAI - phone pe unique 1 baar, dobara index mat likho 5) pre-save me normalize
// FLOW: Executive dashboard -> UnifiedProfile (common/profile/profile-core.js) -> /api/common/profile/upload-avatar -> Cloudinary -> Executive.photo me URL
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

const ExecutiveSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true, set: normPhoneSetter },
  email: { type: String, trim: true, lowercase: true, default: '', set: normEmailSetter },
  password: { type: String, select: false, default: '' },

  // ===== PROFILE PHOTO - V27 UNIFIED - CLOUDINARY URL HI AAYEGA, BASE64 NAHI =====
  photo: { type: String, default: '', trim: true }, // Main photo - UnifiedProfile isi me save karega
  avatar: { type: String, default: '', trim: true }, // Backup - photo ke barabar rakhenge taaki purana code na tute
  profilePic: { type: String, default: '', trim: true }, // Customer wale se match karne ke liye - 3 field ek hi URL rakhenge
  coverPhoto: { type: String, default: '', trim: true }, // V27 ADD - pehle field hi nahi tha, isliye cover save hi nahi hota tha

  // ===== EXTRA PROFILE INFO - Dashboard me dikhane ke liye =====
  city: { type: String, trim: true, default: '' },
  area: { type: String, trim: true, default: '' },
  state: { type: String, trim: true, default: '' }, // V27 ADD - publicExecutive state maangta tha, Model me nahi tha
  address: { type: String, trim: true, default: '' },
  pincode: { type: String, trim: true, default: '' },
  gender: { type: String, enum: ['male', 'female', 'other', ''], default: '', set: normGenderSetter },
  dob: { type: Date, default: null },

  // ===== COMPANY - V27 ADD - publicExecutive companyName / type maangta tha, Model me nahi tha =====
  companyName: { type: String, trim: true, default: '' },
  type: { type: String, trim: true, default: '' },

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

// ===== INDEX - V27 FINAL =====
// phone pe unique upar wale unique:true se ban jayega, yahan dobara mat likhna
ExecutiveSchema.index({ email: 1 });
ExecutiveSchema.index({ city: 1 });
ExecutiveSchema.index({ createdAt: -1 });

// ===== PRE SAVE - photo / avatar / profilePic teeno ko sync rakho + normalize =====
// Taaki kahin bhi photo maango - photo, avatar ya profilePic - teeno me same URL mile
ExecutiveSchema.pre('save', function(next){
  try {
    if (this.phone) this.phone = normPhoneSetter(this.phone);
    if (this.email) this.email = normEmailSetter(this.email);
    if (this.gender) this.gender = normGenderSetter(this.gender);
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

module.exports = mongoose.models.Executive || mongoose.model('Executive', ExecutiveSchema);
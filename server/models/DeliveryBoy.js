// LOCATION: server/models/DeliveryBoy.js - DELIVERY BOY MODEL - V27 FINAL
// CHANGE V27: 1) phone hamesha 10 digit (setter) 2) email / gender hamesha chhota (setter) 3) loginToken khali ho toh undefined - '' wala token 100 logo ka same nahi hoga, sparse unique banega 4) INDEX SAFAI - phone pe unique 1 baar, dobara mat likho 5) pre-save me normalize + vehicleNumber uppercase
// FLOW: Delivery Boy dashboard -> UnifiedProfile -> /api/common/profile/upload-avatar (role: delivery_boy) -> Cloudinary -> DeliveryBoy.photo / avatar / profilePic me URL
// RULE: DB me kabhi base64 nahi jayega, sirf Cloudinary URL. Pehchan = Phone (10 digit). Manager + DeliveryBoy same phone se ho sakta hai - alag collection hai, isliye takrayega nahi.

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
function normTokenSetter(v) {
    if (v === undefined || v === null) return undefined;
    const s = String(v).trim();
    if (!s) return undefined;
    return s;
}

const deliveryBoySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true, set: normPhoneSetter },
  email: { type: String, trim: true, lowercase: true, default: '', set: normEmailSetter },
  password: { type: String, select: false, default: '' },

  // ===== PROFILE PHOTO - V27 UNIFIED =====
  photo: { type: String, default: '', trim: true },
  avatar: { type: String, default: '', trim: true },
  profilePic: { type: String, default: '', trim: true },
  coverPhoto: { type: String, default: '', trim: true },

  // ===== AREA LINK - Delivery Boy kis Area Manager ke under hai =====
  areaCode: { type: String, trim: true, uppercase: true, default: '', index: true },
  areaName: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: '' },
  state: { type: String, trim: true, default: '' },
  pincode: { type: String, trim: true, default: '' },
  address: { type: String, trim: true, default: '' },
  gender: { type: String, enum: ['male', 'female', 'other', ''], default: '', set: normGenderSetter },
  dob: { type: Date, default: null },

  // ===== MANAGER LINK =====
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager', default: null },
  managerCode: { type: String, trim: true, default: '' },
  parentManager: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager', default: null },

  // ===== VEHICLE + DOCUMENTS =====
  vehicleType: { type: String, enum: ['bike', 'cycle', 'auto', 'foot', ''], default: 'bike' },
  vehicleNumber: { type: String, trim: true, uppercase: true, default: '' },
  drivingLicense: { type: String, trim: true, default: '' },
  licensePhoto: { type: String, default: '', trim: true },
  aadhaarNumber: { type: String, trim: true, default: '' },
  aadhaarPhoto: { type: String, default: '', trim: true },

  // ===== STATUS + WALLET =====
  role: { type: String, default: 'delivery_boy', immutable: true },
  status: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  isOnline: { type: Boolean, default: false },

  walletBalance: { type: Number, default: 0 },
  totalEarning: { type: Number, default: 0 },
  totalDeliveries: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0 },

  // V27: Khali token ko undefined rakho, '' mat rakho - warna 100 logo ka token '' ho jayega
  loginToken: { type: String, trim: true, default: undefined, set: normTokenSetter },

  currentLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  lastLocationUpdate: { type: Date, default: null },

}, { timestamps: true });

// ===== INDEX - V27 FINAL =====
// phone pe unique upar wale unique:true se ban jayega, yahan dobara mat likhna
// loginToken pe sparse unique - khali token wale skip honge, bhara hua token dobara nahi aayega
deliveryBoySchema.index({ loginToken: 1 }, { unique: true, sparse: true });
deliveryBoySchema.index({ email: 1 });
deliveryBoySchema.index({ areaCode: 1 });
deliveryBoySchema.index({ managerId: 1 });
deliveryBoySchema.index({ status: 1 });
deliveryBoySchema.index({ createdAt: -1 });
deliveryBoySchema.index({ 'currentLocation': '2dsphere' });

// ===== PRE SAVE - photo sync + normalize =====
deliveryBoySchema.pre('save', function(next){
  try {
    if (this.phone) this.phone = normPhoneSetter(this.phone);
    if (this.email) this.email = normEmailSetter(this.email);
    if (this.gender) this.gender = normGenderSetter(this.gender);
    if (this.vehicleNumber) this.vehicleNumber = String(this.vehicleNumber).toUpperCase().trim();
    if (this.areaCode) this.areaCode = String(this.areaCode).toUpperCase().trim();
    if (this.dob === '') this.dob = null;
    if (this.loginToken === '') this.loginToken = undefined;
    const pic = this.photo || this.avatar || this.profilePic || '';
    if (pic) {
        this.photo = pic;
        this.avatar = pic;
        this.profilePic = pic;
    }
    if (this.status !== undefined) this.isActive = !!this.status;
  } catch (e) {}
  next();
});

module.exports = mongoose.models.DeliveryBoy || mongoose.model('DeliveryBoy', deliveryBoySchema);
// LOCATION: server/models/DeliveryBoy.js - DELIVERY BOY MODEL - V23 UNIFIED PROFILE - NEW FILE
// CHANGE: Naya file - pehle Delivery Boy ko Manager.js me ghusa diya tha, isliye areaCode required hone se Delivery Boy create hi nahi hota tha
// FLOW: Delivery Boy dashboard -> UnifiedProfile -> /api/common/profile/upload-avatar (role: delivery_boy) -> Cloudinary -> DeliveryBoy.photo / avatar / profilePic me URL
// RULE: DB me kabhi base64 nahi jayega, sirf Cloudinary URL

const mongoose = require('mongoose');

const deliveryBoySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  email: { type: String, trim: true, lowercase: true, default: '' },
  password: { type: String, select: false, default: '' },

  // ===== PROFILE PHOTO - V23 UNIFIED =====
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
  gender: { type: String, enum: ['male', 'female', 'other', ''], default: '' },
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

  loginToken: { type: String, trim: true, default: '', index: true },

  currentLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  lastLocationUpdate: { type: Date, default: null },

}, { timestamps: true });

deliveryBoySchema.index({ phone: 1 });
deliveryBoySchema.index({ areaCode: 1 });
deliveryBoySchema.index({ managerId: 1 });
deliveryBoySchema.index({ 'currentLocation': '2dsphere' });

// ===== PRE SAVE - photo sync =====
deliveryBoySchema.pre('save', function(next){
  const pic = this.photo || this.avatar || this.profilePic || '';
  if(pic){
    this.photo = pic;
    this.avatar = pic;
    this.profilePic = pic;
  }
  if(this.status !== undefined) this.isActive = !!this.status;
  next();
});

module.exports = mongoose.models.DeliveryBoy || mongoose.model('DeliveryBoy', deliveryBoySchema);
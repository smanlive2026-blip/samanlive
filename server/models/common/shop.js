// LOCATION: server/models/common/shop.js
// SAMANLIVE - COMMON SHOP MODEL - PROFILE + TIMING + VERIFICATION + GALLERY - FULL
const mongoose = require('mongoose');

const GallerySchema = new mongoose.Schema({
  url: { type: String, default: '' },
  category: { type: String, default: 'shop' }, // shop | products | team
  type: { type: String, default: 'image' }, // image | video
  views: { type: Number, default: 0 },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: true });

const HolidaySchema = new mongoose.Schema({
  date: { type: String, default: '' },
  reason: { type: String, default: 'Holiday' }
}, { _id: true });

const TimingSchema = new mongoose.Schema({
  openingTime: { type: String, default: '09:00' },
  closingTime: { type: String, default: '21:00' },
  breakStart: { type: String, default: '' },
  breakEnd: { type: String, default: '' },
  isOpen: { type: Boolean, default: true },
  is24Hours: { type: Boolean, default: false },
  weeklySchedule: { type: Object, default: {} }, // { Monday:{open:true,openingTime,closingTime},... }
  holidays: { type: [HolidaySchema], default: [] }
}, { _id: false });

const VerificationSchema = new mongoose.Schema({
  documents: { type: Object, default: {} }, // { shop_license, gst_certificate, fssai_license, aadhaar, pan_card, owner_photo, shop_front, shop_inside }
  status: { type: String, enum: ['not_submitted','pending','verified','rejected'], default: 'not_submitted' },
  submittedAt: { type: Date },
  reviewedAt: { type: Date },
  rejectReason: { type: String, default: '' }
}, { _id: false });

const CommonShopSchema = new mongoose.Schema({
  // Link to main Shop (server/models/Shop.js) - same _id use hoga to dashboard se turant jud jayega
  shopId: { type: String, index: true, default: '' }, // main shop ki id string me bhi rakhi hai backup ke liye

  // Basic Info (profile.html + shop-info.html)
  name: { type: String, default: '', trim: true },
  shopName: { type: String, default: '', trim: true },
  category: { type: String, default: '', trim: true },
  shopType: { type: String, default: '', trim: true },
  description: { type: String, default: '' },
  tagline: { type: String, default: '', maxlength: 60 },

  // Owner / Contact (shop-info.html)
  ownerName: { type: String, default: '', trim: true },
  owner: { type: String, default: '' },
  phone: { type: String, default: '', trim: true },
  mobile: { type: String, default: '' },
  altPhone: { type: String, default: '' },
  email: { type: String, default: '', trim: true, lowercase: true },
  whatsapp: { type: String, default: '' },

  // Address (shop-info.html)
  address: { type: String, default: '' },
  area: { type: String, default: '' },
  city: { type: String, default: 'Surat' },
  pincode: { type: String, default: '' },
  landmark: { type: String, default: '' },
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },

  // Extra (shop-info.html)
  gst: { type: String, default: '', uppercase: true },
  fssai: { type: String, default: '' },
  estYear: { type: String, default: '' },
  staffCount: { type: String, default: '1' },

  // Images (profile.html)
  avatar: { type: String, default: '' },
  shopImage: { type: String, default: '' },
  logo: { type: String, default: '' },
  image: { type: String, default: '' },
  cover: { type: String, default: '' },
  banner: { type: String, default: '' },

  // Timing (shop-timing.html) - top level bhi rakha hai dashboard toggle ke liye
  isOpen: { type: Boolean, default: true },
  openingTime: { type: String, default: '09:00' },
  closingTime: { type: String, default: '21:00' },
  breakStart: { type: String, default: '' },
  breakEnd: { type: String, default: '' },
  is24Hours: { type: Boolean, default: false },
  weeklySchedule: { type: Object, default: {} },
  holidays: { type: [HolidaySchema], default: [] },
  timing: { type: TimingSchema, default: () => ({}) },

  // Gallery (shop-gallery.html)
  gallery: { type: [GallerySchema], default: [] },

  // Verification (shop-verification.html)
  verified: { type: Boolean, default: false },
  verification: { type: VerificationSchema, default: () => ({}) },

  // Stats (profile.html me dikhta hai)
  rating: { type: Number, default: 4.5 },
  reviews: { type: Number, default: 0 },
  orders: { type: Number, default: 0 },
  products: { type: Number, default: 0 },
  customers: { type: Number, default: 0 },

  // Products purane dashboard ke liye safe rakha hai, khali rahega to koi dikkat nahi
  productsList: { type: Array, default: [] }

}, { timestamps: true, strict: false });

// name <-> shopName hamesha sync rakho, dashboard wala jhanjhat khatam
CommonShopSchema.pre('save', function(next){
  if(this.name &&!this.shopName) this.shopName = this.name;
  if(this.shopName &&!this.name) this.name = this.shopName;
  if(this.avatar &&!this.shopImage) this.shopImage = this.avatar;
  if(this.shopImage &&!this.avatar) this.avatar = this.shopImage;
  if(this.cover &&!this.banner) this.banner = this.cover;
  if(this.banner &&!this.cover) this.cover = this.banner;
  // timing top-level se sync
  if(this.timing){
    if(this.openingTime) this.timing.openingTime = this.openingTime;
    if(this.closingTime) this.timing.closingTime = this.closingTime;
    if(this.isOpen!== undefined) this.timing.isOpen = this.isOpen;
  }
  next();
});

// OverwriteModelError se bachne ke liye
module.exports = mongoose.models.CommonShop || mongoose.model('CommonShop', CommonShopSchema, 'commonshops');
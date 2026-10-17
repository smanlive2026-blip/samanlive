// LOCATION: server/models/ProductManager.js - PRODUCT MANAGER MODEL - V14 FINAL - NO MODIFY NEEDED
const mongoose = require('mongoose');
const ProductManagerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
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
ProductManagerSchema.index({ phone: 1 });
ProductManagerSchema.index({ area: 1, city: 1 });
ProductManagerSchema.index({ type: 1 });
module.exports = mongoose.model('ProductManager', ProductManagerSchema);
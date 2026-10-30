// LOCATION: server/models/WorldProduct.js - V21 - 50 MODES - NO ENUM - FULL CODE - WORLD MASTER
const mongoose = require('mongoose');

const worldProductSchema = new mongoose.Schema({
  shopId: { type: String, required: true, index: true },
  shopType: { type: String, required: true, lowercase: true, trim: true, index: true },
  businessMode: { 
    type: String, 
    lowercase: true, 
    trim: true,
    default: 'retail',
    enum: ['retail','fashion','food','service','healthcare','rental','bulk','mandi','education','csc'],
    index: true
  },
  name: { type: String, required: true, trim: true, index: true },
  category: { type: String, default: 'General', trim: true, index: true },
  brand: { type: String, default: 'Local', trim: true, index: true },
  price: { type: Number, required: true, min: 0 },
  mrp: { type: Number, min: 0 },
  stock: { type: Number, default: 50, min: 0 },
  lowStockAlert: { type: Number, default: 10, min: 1 },
  unit: { type: String, default: 'piece', lowercase: true, trim: true },
  weight: { type: String, default: '', trim: true },
  thumbnail: { type: String, default: '' },
  images: [{
    url: String,
    public_id: String
  }],
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true, index: true },
  extraData: { type: mongoose.Schema.Types.Mixed, default: {} },
  areaId: { type: String, default: '', index: true },
  cityId: { type: String, default: '', index: true },
  areaCode: { type: String, default: '', index: true },
  bucket: { type: String, default: '', index: true },
  originalProductId: { type: String, default: '' },
  isBulk: { type: Boolean, default: false },
  isQuickAdd: { type: Boolean, default: false },
  createdBy: { type: String, default: '' },
  worldEnabled: { type: Boolean, default: true }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

worldProductSchema.index({ shopId: 1, shopType: 1, isActive: 1 });
worldProductSchema.index({ shopType: 1, businessMode: 1, isActive: 1 });
worldProductSchema.index({ areaId: 1, shopType: 1 });
worldProductSchema.index({ name: 'text', category: 'text', brand: 'text' });

worldProductSchema.virtual('isLowStock').get(function() {
  return (this.stock || 0) <= (this.lowStockAlert || 10);
});

worldProductSchema.virtual('discount').get(function() {
  if(!this.mrp || this.mrp <= this.price) return 0;
  return Math.round(((this.mrp - this.price) / this.mrp) * 100);
});

worldProductSchema.pre('save', function(next) {
  if(this.shopType) this.shopType = this.shopType.toLowerCase().trim();
  if(this.businessMode) this.businessMode = this.businessMode.toLowerCase().trim();
  if(this.unit) this.unit = this.unit.toLowerCase().trim();
  next();
});

const WorldProduct = mongoose.model('WorldProduct', worldProductSchema);

module.exports = WorldProduct;
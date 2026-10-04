// LOCATION: server/models/WorldProduct.js - 1 MODEL FOR 70 SHOPS - WORLD CLASS
const mongoose = require('mongoose');
const WorldProductSchema = new mongoose.Schema({
  shopId: { type: String, required: true, index: true },
  shopType: { type: String, required: true, index: true }, // kirana, cloth, mobile... 70 types
  name: { type: String, required: true },
  category: String,
  brand: String,
  price: { type: Number, required: true },
  mrp: Number,
  stock: { type: Number, default: 0 },
  lowStockAlert: { type: Number, default: 10 },
  unit: { type: String, default: 'piece' }, // piece, packet, kg, gram, litre, ml, bottle etc
  weight: String, // 10kg, 55g, 1L etc
  thumbnail: String,
  images: [{ url: String }],
  description: String,
  isActive: { type: Boolean, default: true },
  isPerishable: Boolean,
  expiryDays: Number,
  extraData: { type: mongoose.Schema.Types.Mixed }, // cloth ke liye size,color | mobile ke liye ram,storage | kirana ke liye weight,unit
  // Role based visibility
  areaId: String,
  cityId: String,
  createdBy: String,
}, { timestamps: true });

WorldProductSchema.index({ shopId:1, shopType:1 });
WorldProductSchema.index({ shopType:1, isActive:1 });

module.exports = mongoose.model('WorldProduct', WorldProductSchema);
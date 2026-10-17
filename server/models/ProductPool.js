// LOCATION: server/models/ProductPool.js - PRODUCT POOL MODEL - V14 FINAL - INVISIBLE POOL
const mongoose = require('mongoose');
const ProductPoolSchema = new mongoose.Schema({
  productManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductManager', required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: { type: String, required: true, trim: true, index: true },
  images: [{ type: String }],
  thumbnail: { type: String },
  basePrice: { type: Number, required: true }, // PM's price
  suggestedPrice: { type: Number },
  stock: { type: Number, required: true, default: 1 },
  unit: { type: String, default: 'piece', trim: true }, // kg, piece, liter, bag
  areaTags: [{ type: String, trim: true, index: true }], // where PM wants to sell
  status: { type: String, enum: ['pending','approved','assigned','rejected','sold_out'], default: 'pending', index: true },
  executiveNote: { type: String, trim: true },
  finalPrice: { type: Number }, // Executive sets
  assignedTo: {
    areaManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Area' },
    areaName: { type: String, trim: true },
    shopType: { type: String, trim: true },
  },
  commission: {
    pmPercent: { type: Number, default: 70 },
    executivePercent: { type: Number, default: 5 },
    adminPercent: { type: Number, default: 5 },
    shopPercent: { type: Number, default: 20 },
  },
  worldProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorldProduct' },
  rejectionReason: { type: String },
}, { timestamps: true });
ProductPoolSchema.index({ status: 1, category: 1 });
ProductPoolSchema.index({ areaTags: 1 });
module.exports = mongoose.model('ProductPool', ProductPoolSchema);
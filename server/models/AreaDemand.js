// LOCATION: server/models/AreaDemand.js - AREA DEMAND MODEL - V14 FINAL
const mongoose = require('mongoose');
const AreaDemandSchema = new mongoose.Schema({
  areaManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Area', required: true, index: true },
  areaName: { type: String, required: true, trim: true, index: true },
  productCategory: { type: String, trim: true },
  productName: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true },
  notes: { type: String, trim: true },
  priority: { type: String, enum: ['low','medium','high'], default: 'medium' },
  status: { type: String, enum: ['open','fulfilled','cancelled'], default: 'open', index: true },
  fulfilledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductPool' },
  fulfilledByExecutive: { type: mongoose.Schema.Types.ObjectId, ref: 'Executive' },
}, { timestamps: true });
module.exports = mongoose.model('AreaDemand', AreaDemandSchema);
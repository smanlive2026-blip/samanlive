// LOCATION: server/models/ProductAssignment.js - ASSIGNMENT LOG MODEL - V14 FINAL
const mongoose = require('mongoose');
const ProductAssignmentSchema = new mongoose.Schema({
  productPoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductPool', required: true },
  productManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductManager', required: true },
  executiveId: { type: mongoose.Schema.Types.ObjectId, ref: 'Executive', required: true },
  areaManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Area' },
  areaName: String,
  shopType: String,
  basePrice: Number,
  finalPrice: Number,
  profit: Number,
  commissionSnapshot: Object,
  worldProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorldProduct' },
}, { timestamps: true });
module.exports = mongoose.model('ProductAssignment', ProductAssignmentSchema);
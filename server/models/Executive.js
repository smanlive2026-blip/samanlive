// LOCATION: server/models/Executive.js - EXECUTIVE MODEL - V14 FINAL - KINGMAKER
const mongoose = require('mongoose');
const ExecutiveSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  password: { type: String, select: false },
  assignedAreas: [{ type: String, trim: true }], // ['Naliya','Bhuj'] empty = all India
  assignedShopTypes: [{ type: String, trim: true }], // ['kirana','patanjali'] empty = all types
  canApprove: { type: Boolean, default: true },
  canAssign: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  walletBalance: { type: Number, default: 0 },
  totalEarning: { type: Number, default: 0 },
  totalAssigned: { type: Number, default: 0 },
  role: { type: String, default: 'executive', immutable: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
ExecutiveSchema.index({ phone: 1 });
module.exports = mongoose.model('Executive', ExecutiveSchema);
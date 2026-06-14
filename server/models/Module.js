const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  icon: { type: String, default: '' },
  color: { type: String, default: '#6366f1' },
  group: { type: String, default: '' },
  status: { type: Boolean, default: true },
  areas: [{
    areaId: { type: String, required: true },
    status: { type: Boolean, default: true }
  }]
}, { _id: false });

const moduleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  icon: { type: String, default: '🛍️' },
  color: { type: String, default: '#6366f1' },
  link: { type: String, default: '' },
  desc: { type: String, default: '' },
  priority: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'hidden'], default: 'active' },
  categories: [{ type: String }],
  categoryDetails: [categorySchema],
  areas: [{
    areaId: { type: String, required: true },
    status: { type: Boolean, default: true }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster queries
moduleSchema.index({ name: 1 });
moduleSchema.index({ status: 1 });
moduleSchema.index({ 'categoryDetails.id': 1 });
moduleSchema.index({ 'categoryDetails.name': 1 });
moduleSchema.index({ 'areas.areaId': 1 });

// Virtual for total categories count
moduleSchema.virtual('totalCategories').get(function() {
  return this.categoryDetails? this.categoryDetails.length : 0;
});

// Virtual for active categories count
moduleSchema.virtual('activeCategories').get(function() {
  if (!this.categoryDetails) return 0;
  return this.categoryDetails.filter(cat => cat.status === true).length;
});

module.exports = mongoose.model('Module', moduleSchema);
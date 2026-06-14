const mongoose = require('mongoose');

// Category Schema - ye same rahega
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

// NAYA: Area Schema - Multiple areas with polygon/circle support
const areaSchema = new mongoose.Schema({
  name: { type: String, required: true }, // "Delhi NCR", "Mumbai West"
  type: { type: String, enum: ['circle', 'polygon'], required: true },
  status: { type: Boolean, default: true },

  // Circle ke liye
  center: {
    lat: { type: Number },
    lng: { type: Number }
  },
  radius: { type: Number }, // meters me

  // Polygon ke liye
  coordinates: [{
    lat: { type: Number },
    lng: { type: Number }
  }]
}, { _id: true }); // _id rakha hai taaki har area ko individually delete kar sake

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

  // UPDATED: Ab direct area data store hoga, areaId nahi
  areas: [areaSchema]
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
moduleSchema.index({ 'areas.name': 1 }); // areaId ki jagah name
moduleSchema.index({ 'areas.status': 1 });

// Virtual for total categories count
moduleSchema.virtual('totalCategories').get(function() {
  return this.categoryDetails? this.categoryDetails.length : 0;
});

// Virtual for active categories count
moduleSchema.virtual('activeCategories').get(function() {
  if (!this.categoryDetails) return 0;
  return this.categoryDetails.filter(cat => cat.status === true).length;
});

// Virtual for total areas count
moduleSchema.virtual('totalAreas').get(function() {
  return this.areas? this.areas.length : 0;
});

module.exports = mongoose.model('Module', moduleSchema);
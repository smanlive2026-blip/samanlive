const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true }
}, { _id: false });

const settingSchema = new mongoose.Schema({

  // App Settings
  appName: {
    type: String,
    default: 'SAMAN LIVE',
    trim: true
  },

  // ============ HEADER LOGO + BANNER ============
  headerLogoUrl: {
    type: String,
    default: ''
  },
  headerBannerUrl: {
    type: String,
    default: ''
  },
  headerBannerType: { // <-- NAYA ADD KIYA
    type: String,
    default: 'image',
    enum: ['image', 'video']
  },
  headerBannerHeight: {
    type: Number,
    default: 200
  },
  // ============ KHATAM ============

  // Color Settings
  headerColor: {
    type: String,
    default: '#ffffff'
  },
  footerColor: {
    type: String,
    default: '#1f2937'
  },
  primaryColor: {
    type: String,
    default: '#3b82f6'
  },
  accentColor: {
    type: String,
    default: '#8b5cf6'
  },

  // Footer Settings
  footerText: {
    type: String,
    default: '© 2026 SAMAN LIVE. All rights reserved.',
    trim: true
  },
  footerAbout: {
    type: String,
    default: 'Best deals platform in your city',
    trim: true
  },
  footerLinks: [linkSchema],

  // Social Media Links
  facebook: { type: String, default: '', trim: true },
  instagram: { type: String, default: '', trim: true },
  twitter: { type: String, default: '', trim: true },
  youtube: { type: String, default: '', trim: true },
  linkedin: { type: String, default: '', trim: true },
  whatsapp: { type: String, default: '', trim: true },

  supportEmail: {
    type: String,
    default: 'support@samanlive.com',
    trim: true,
    lowercase: true
  },
  supportPhone: {
    type: String,
    default: '',
    trim: true
  },

  // Maintenance Mode
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  maintenanceMessage: {
    type: String,
    default: 'Site under maintenance. Please check back later.',
    trim: true
  },

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Ensure only one document exists
settingSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.models.Setting || mongoose.model('Setting', settingSchema);
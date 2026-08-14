const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true }
}, { _id: false });

const settingSchema = new mongoose.Schema({
  // Logo Settings
  logoText: {
    type: String,
    default: 'Deal24Hrs',
    trim: true
  },
  logoUrl: {
    type: String,
    default: ''
  },

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
    default: '© 2026 Deal24Hrs. All rights reserved.',
    trim: true
  },
  footerAbout: {
    type: String,
    default: 'Best deals platform in your city',
    trim: true
  },
  footerLinks: [linkSchema],

  // Social Media Links
  facebook: {
    type: String,
    default: '',
    trim: true
  },
  instagram: {
    type: String,
    default: '',
    trim: true
  },
  twitter: {
    type: String,
    default: '',
    trim: true
  },
  youtube: {
    type: String,
    default: '',
    trim: true
  },
  linkedin: {
    type: String,
    default: '',
    trim: true
  },
  whatsapp: {
    type: String,
    default: '',
    trim: true
  },

  // App Settings
  appName: {
    type: String,
    default: 'Deal24Hrs',
    trim: true
  },
  supportEmail: {
    type: String,
    default: 'support@deal24hrs.com',
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

  // ============ NAYA: HEADER BANNER SETTINGS ============
  headerBannerUrl: {
    type: String,
    default: '/assets/images/default-banner.jpg'
  },
  headerBannerHeight: {
    type: Number,
    default: 200
  }
  // ============ KHATAM ============

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

// Prevent creating multiple documents
settingSchema.pre('save', async function(next) {
  const count = await mongoose.model('Setting').countDocuments();
  if (count > 0 && this.isNew) {
    throw new Error('Only one settings document can exist');
  }
  next();
});

module.exports = mongoose.models.Setting || mongoose.model('Setting', settingSchema);
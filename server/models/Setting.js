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
  }, // ← Naya add kiya
  accentColor: {
    type: String,
    default: '#8b5cf6'
  }, // ← Naya add kiya

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
  }, // ← Naya add kiya
  whatsapp: {
    type: String,
    default: '',
    trim: true
  }, // ← Naya add kiya

  // App Settings
  appName: {
    type: String,
    default: 'Deal24Hrs',
    trim: true
  }, // ← Naya add kiya
  supportEmail: {
    type: String,
    default: 'support@deal24hrs.com',
    trim: true,
    lowercase: true
  }, // ← Naya add kiya
  supportPhone: {
    type: String,
    default: '',
    trim: true
  }, // ← Naya add kiya

  // Maintenance Mode
  maintenanceMode: {
    type: Boolean,
    default: false
  }, // ← Naya add kiya
  maintenanceMessage: {
    type: String,
    default: 'Site under maintenance. Please check back later.',
    trim: true
  } // ← Naya add kiya

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
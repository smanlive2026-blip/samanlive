const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  logoText: { type: String, default: 'SAMANLIVE' },
  logoUrl: { type: String, default: '' },
  headerColor: { type: String, default: '#1e40af' },
  footerColor: { type: String, default: '#1e293b' },
  footerText: { type: String, default: '© 2026 SAMANLIVE' },
  footerAbout: { type: String, default: 'Best services in your city' },
  footerLinks: { type: Array, default: [] },
  facebook: { type: String, default: '' },
  instagram: { type: String, default: '' },
  twitter: { type: String, default: '' },
  youtube: { type: String, default: '' }
});

module.exports = mongoose.model('Setting', settingSchema);
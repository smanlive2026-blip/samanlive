const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  logoText: String,
  logoUrl: String,
  headerColor: String,
  footerColor: String,
  footerText: String,
  footerAbout: String,
  footerLinks: [{ text: String, url: String }],
  facebook: String,
  instagram: String,
  twitter: String,
  youtube: String
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
// LOCATION: server/models/Setting.js - V10 ULTIMATE WORLD CLASS - MAIN APP FULL CONTROL - LOGO BANNER PRODUCT FOOTER NAV EVERYTHING
const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true },
  icon: { type: String, default: '' },
  visible: { type: Boolean, default: true }
}, { _id: false });

const settingSchema = new mongoose.Schema({

  // ============ APP BASIC ============
  appName: { type: String, default: 'SAMAN LIVE', trim: true },
  appTagline: { type: String, default: 'Best deals in your city', trim: true },
  appVersion: { type: String, default: '1.0' },

  // ============ HEADER LOGO + TOP HEADER ============
  headerLogoUrl: { type: String, default: '' },
  headerLogoSize: { type: Number, default: 42 }, // 30-80 px
  headerHeight: { type: Number, default: 56 },
  headerColor: { type: String, default: '#ffffff' },
  headerTextColor: { type: String, default: '#0f172a' },
  headerSticky: { type: Boolean, default: true },
  headerShowLogo: { type: Boolean, default: true },
  headerShowSearch: { type: Boolean, default: true },
  headerShowCart: { type: Boolean, default: true },
  headerShowScanner: { type: Boolean, default: true },

  // ============ BANNER ============
  headerBannerUrl: { type: String, default: '' },
  headerBannerType: { type: String, default: 'image', enum: ['image', 'video', 'none'] },
  headerBannerHeight: { type: Number, default: 200 },
  headerBannerImageUrl: { type: String, default: '' },
  headerBannerVideoUrl: { type: String, default: '' },
  headerBannerActive: { type: String, default: 'image', enum: ['image', 'video'] },
  bannerAutoPlay: { type: Boolean, default: true },
  bannerShowOverlay: { type: Boolean, default: true },
  bannerRounded: { type: Number, default: 0 },
  bannerShow: { type: Boolean, default: true },

  // ============ PRODUCT DISPLAY CONTROL - MOST IMPORTANT ============
  productCardStyle: { type: String, default: 'card', enum: ['card', 'list', 'compact', 'amazon', 'flipkart', 'minimal'] },
  productCardSize: { type: String, default: 'medium', enum: ['small', 'medium', 'large', 'xl'] },
  productImageRatio: { type: String, default: '1:1', enum: ['1:1', '4:3', '3:4', '16:9'] },
  productScrollType: { type: String, default: 'horizontal', enum: ['horizontal', 'vertical', 'grid', 'carousel', 'infinite', 'train'] },
  productScrollSpeed: { type: Number, default: 20 }, // seconds for train animation
  productPerRow: { type: Number, default: 2 }, // 1-6
  productGap: { type: Number, default: 10 },
  productShowDiscount: { type: Boolean, default: true },
  productShowShopName: { type: Boolean, default: true },
  productShowRating: { type: Boolean, default: false },
  productShowAddCart: { type: Boolean, default: true },
  productBorderRadius: { type: Number, default: 12 },
  productShadow: { type: String, default: 'medium', enum: ['none', 'small', 'medium', 'large'] },
  productAnimation: { type: String, default: 'none', enum: ['none', 'fade', 'slide', 'zoom', 'bounce'] },

  // ============ CATEGORY SECTION ============
  categoryShow: { type: Boolean, default: true },
  categoryStyle: { type: String, default: 'chip', enum: ['chip', 'circle', 'square', 'icon'] },
  categorySize: { type: Number, default: 70 },
  categoryScroll: { type: String, default: 'horizontal', enum: ['horizontal', 'grid'] },
  categoryPerRow: { type: Number, default: 4 },

  // ============ HISTORY SECTION ============
  historyShow: { type: Boolean, default: true },
  historyTitle: { type: String, default: 'History' },
  historyMaxItems: { type: Number, default: 10 },
  historyCardSize: { type: Number, default: 100 },

  // ============ AD SECTION ============
  adShow: { type: Boolean, default: true },
  adTitle: { type: String, default: 'Advertisement' },
  adCardStyle: { type: String, default: 'card', enum: ['card', 'banner', 'compact'] },
  adAutoScroll: { type: Boolean, default: false },

  // ============ NEARBY PRODUCT SECTION ============
  nearbyShow: { type: Boolean, default: true },
  nearbyTitle: { type: String, default: 'Nearby Product' },
  nearbyLayout: { type: String, default: 'list', enum: ['list', 'grid', 'train'] },

  // ============ BOTTOM NAV - 5 BUTTON CONTROL ============
  bottomNavShow: { type: Boolean, default: true },
  bottomNavColor: { type: String, default: '#ffffff' },
  bottomNavActiveColor: { type: String, default: '#10b981' },
  bottomNavTextColor: { type: String, default: '#6b7280' },
  bottomNavHeight: { type: Number, default: 70 },
  bottomNavRounded: { type: Boolean, default: false },
  bottomNavCenterStyle: { type: String, default: 'hex', enum: ['hex', 'circle', 'square', 'elevated'] },
  bottomNavButtons: {
    type: [
      {
        id: String,
        label: String,
        icon: String,
        type: { type: String, enum: ['profile', 'delivery', 'localmarket', 'service', 'track', 'custom'] },
        url: String,
        visible: { type: Boolean, default: true },
        order: Number
      }
    ],
    default: [
      { id: 'profile', label: 'Profile', icon: '👤', type: 'profile', url: '/profile.html', visible: true, order: 1 },
      { id: 'delivery', label: 'Delivery', icon: '🚚', type: 'delivery', url: '/delivery.html', visible: true, order: 2 },
      { id: 'localmarket', label: 'Local Market', icon: '🏪', type: 'localmarket', url: '/nearby-shops.html', visible: true, order: 3 },
      { id: 'service', label: 'Service', icon: '🛍️', type: 'service', url: '#services', visible: true, order: 4 },
      { id: 'track', label: 'Track', icon: '📍', type: 'track', url: '#track', visible: true, order: 5 }
    ]
  },

  // ============ FOOTER - FULL CONTROL ============
  footerShow: { type: Boolean, default: true },
  footerStyle: { type: String, default: 'modern', enum: ['modern', 'simple', 'compact', 'detailed', 'minimal'] },
  footerColor: { type: String, default: '#1f2937' },
  footerTextColor: { type: String, default: '#ffffff' },
  footerText: { type: String, default: '© 2026 SAMAN LIVE. All rights reserved.', trim: true },
  footerAbout: { type: String, default: 'Best deals platform in your city - Nearby shops, fast delivery, best prices', trim: true },
  footerAboutShow: { type: Boolean, default: true },
  footerLinksShow: { type: Boolean, default: true },
  footerSocialShow: { type: Boolean, default: true },
  footerLinks: [linkSchema],
  footerHeight: { type: Number, default: 200 },
  footerColumns: { type: Number, default: 3 },

  // ============ THEME & COLORS ============
  primaryColor: { type: String, default: '#0f172a' },
  secondaryColor: { type: String, default: '#10b981' },
  accentColor: { type: String, default: '#3b82f6' },
  backgroundColor: { type: String, default: '#f5f7fa' },
  cardColor: { type: String, default: '#ffffff' },
  textPrimary: { type: String, default: '#0f172a' },
  textSecondary: { type: String, default: '#64748b' },
  borderRadius: { type: Number, default: 12 },
  fontFamily: { type: String, default: 'Outfit', enum: ['Outfit', 'Inter', 'Poppins', 'Roboto', 'System'] },
  fontSize: { type: String, default: 'medium', enum: ['small', 'medium', 'large'] },

  // ============ LAYOUT ============
  containerMaxWidth: { type: Number, default: 1200 },
  containerPadding: { type: Number, default: 10 },
  sectionGap: { type: Number, default: 12 },
  showVideoBackground: { type: Boolean, default: true },

  // ============ SOCIAL ============
  facebook: { type: String, default: '', trim: true },
  instagram: { type: String, default: '', trim: true },
  twitter: { type: String, default: '', trim: true },
  youtube: { type: String, default: '', trim: true },
  linkedin: { type: String, default: '', trim: true },
  whatsapp: { type: String, default: '', trim: true },

  // ============ SUPPORT ============
  supportEmail: { type: String, default: 'support@samanlive.com', trim: true, lowercase: true },
  supportPhone: { type: String, default: '', trim: true },

  // ============ MAINTENANCE ============
  maintenanceMode: { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: 'Site under maintenance. Please check back later.', trim: true },

  // ============ SEO ============
  metaTitle: { type: String, default: 'SAMAN LIVE - Best Deals In Your City' },
  metaDescription: { type: String, default: 'Nearby shops, fast delivery, best prices' },
  metaKeywords: { type: String, default: 'saman live, nearby shops, delivery' },

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

settingSchema.statics.getSettings = async function() {
  let settings = await this.findOne().sort({ _id: -1 });
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.models.Setting || mongoose.model('Setting', settingSchema);
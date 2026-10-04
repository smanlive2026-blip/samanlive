// server/models/Product.js - WORLD CLASS v999 - ONE MODEL FOR ALL 70+ SHOPS
const mongoose = require('mongoose');

const ALL_SHOP_TYPES = [
  'kirana','store','bakery','mobile','cloth','fruit','sabji','restaurant','medical','electronics','hardware','jewellery',
  'achar-shop','auto','bartan','battery','beauty','brick','chakki','charpai-shop','child-clothes','clinic','dairy',
  'decoration-shop','door-shop','fabric-shop','flower','footwear','furniture','grocery-sweet','halwai','juice','kambal-shop',
  'kids-wear','krishi','mat-shop','mattress-shop','meat','mochi','murti-shop','nursery','optical','paint-shop','painting',
  'pansari','patanjali','photo-studio','pizza','plastic','plumbing','ply-board','puja','purse','rental','salon','sanitary',
  'saree-shop','service','sports','stationery','suit-shop','tea','thela','tiles','toy-shop','tripal-shop','vet-clinic',
  'vet-shop','watch-shop','winter-wear'
];

const productSchema = new mongoose.Schema({
  // ===== CORE - HAR PRODUCT KE LIYE SAME =====
  name: { type: String, required: [true, 'Product name required'], trim: true, index: true },
  slug: { type: String, lowercase: true, index: true },
  description: { type: String, default: '' },

  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  shopType: { type: String, required: true, enum: ALL_SHOP_TYPES, index: true },

  // Pricing
  price: { type: Number, required: true, min: 0 },
  mrp: { type: Number, min: 0 },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  costPrice: { type: Number, min: 0 }, // shop owner ke liye

  // Inventory
  stock: { type: Number, required: true, default: 10, min: 0 },
  unit: { type: String, default: 'pcs', enum: ['pcs','kg','gram','litre','ml','meter','feet','pair','set','plate','packet','bottle','box','jar','dozen','gaddi','service','hour','day'] },
  lowStockAlert: { type: Number, default: 2 },
  barcode: { type: String, sparse: true, index: true },
  sku: { type: String, unique: true, sparse: true },

  // Images
  images: [{ url: String, public_id: String }],
  thumbnail: { type: String },

  // Common flags
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isVeg: { type: Boolean, default: null }, // restaurant / food ke liye
  rating: { type: Number, default: 0 },
  totalSold: { type: Number, default: 0 },

  // ===== WORLD CLASS - SHOP SPECIFIC DATA - YAHAN JADOO HAI =====
  // Har shop ka alag data is Map me jayega, schema strict nahi hai
  extraData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Quick reference fields for filtering - ye extraData se auto fill honge
  brand: { type: String, index: true },
  size: { type: String, index: true },
  color: { type: String, index: true },
  material: { type: String },
  weight: { type: String },
  warranty: { type: String },

  // Medical / Grocery
  expiryDate: { type: Date },
  fssai: { type: String },

  // Cloth
  fabric: { type: String },
  gender: { type: String },

  // Mobile / Electronics
  model: { type: String },
  ram: { type: String },

  // SEO
  metaTitle: String,
  metaDesc: String,

}, { timestamps: true, strict: false }); // strict false taaki koi bhi extra field save ho sake

// ===== INDEXES =====
productSchema.index({ shopId: 1, shopType: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ shopType: 1, brand: 1 });
productSchema.index({ shopType: 1, price: 1 });

// ===== SLUG GENERATE =====
productSchema.pre('save', function(next){
  if(this.isModified('name')){
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);
  }
  // SKU auto generate
  if(!this.sku){
    this.sku = `${this.shopType.slice(0,3).toUpperCase()}-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2,5).toUpperCase()}`;
  }
  // Discount auto calculate
  if(this.mrp && this.mrp > this.price){
    this.discount = Math.round(((this.mrp - this.price) / this.mrp) * 100);
  }
  next();
});

// ===== METHODS =====
productSchema.methods.isLowStock = function(){ return this.stock <= this.lowStockAlert; };
productSchema.methods.isOutOfStock = function(){ return this.stock <= 0; };

// Static method to get fields required for shop type - Frontend form ke liye
productSchema.statics.getSchemaForShopType = function(shopType){
  const schemas = {
    kirana: ['brand','weight','expiryDate','fssai'],
    mobile: ['brand','model','ram','warranty','barcode'],
    cloth: ['brand','size','color','fabric','gender'],
    fruit: ['weight','expiryDate'],
    medical: ['brand','expiryDate','fssai'],
    restaurant: ['isVeg','size','color'],
    bakery: ['weight','expiryDate','isVeg'],
    //... baki sab ke liye default
  };
  return schemas[shopType] || ['brand','size','color'];
};

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
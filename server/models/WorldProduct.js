// LOCATION: server/models/WorldProduct.js - V16 WORLD BOSS - 1 MODEL = 70 SHOPS - common/products/ SE CONNECTED
const mongoose = require('mongoose');

const WorldProductSchema = new mongoose.Schema({
  // === CORE - HAR PRODUCT KE LIYE ===
  shopId: { type: String, required: true, index: true }, // kaunsi shop ka hai
  shopType: { type: String, required: true, index: true, lowercase: true }, // kirana | cloth | mobile | bakery ... 70 types

  name: { type: String, required: true, trim: true, index: 'text' }, // Product name - search ke liye
  category: { type: String, default: 'General', index: true }, // Atta, Shirt, Mobile etc
  brand: { type: String, default: 'Local', index: true }, // Aashirvaad, Nike, Samsung

  // === PRICE & STOCK ===
  price: { type: Number, required: true, min: 0 }, // Selling price
  mrp: { type: Number, min: 0 }, // MRP
  stock: { type: Number, default: 50, min: 0 }, // Kitna bacha hai
  lowStockAlert: { type: Number, default: 10 }, // Kab low dikhana hai

  // === KIRANA TYPE FIELDS - par sab shop use kar sakte hain ===
  unit: { type: String, default: 'piece' }, // piece, packet, kg, gram, litre, ml, bottle, pouch, box
  weight: { type: String, default: '' }, // 10kg, 55g, 1L, 1 piece - kirana ke liye main hai

  // === IMAGES ===
  thumbnail: { type: String, default: '' }, // Main image
  images: [{ 
    url: String, 
    public_id: String // cloudinary ke liye
  }],

  description: { type: String, default: '' },
  
  // === STATUS ===
  isActive: { type: Boolean, default: true, index: true }, // soft delete
  isPerishable: { type: Boolean, default: false },
  expiryDays: { type: Number },

  // === UNIVERSAL EXTRA DATA - YE BOSS HAI ===
  // kirana ke liye: { brand, weight, unit, fssai, isVeg }
  // cloth ke liye: { size, color, fabric, gender }
  // mobile ke liye: { ram, storage, model, warranty }
  // medical ke liye: { expiryDate, salt, company }
  extraData: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  },

  // === ROLE BASED - KAUN DEKH SAKTA HAI ===
  areaId: { type: String, index: true }, // area-manager ke liye
  cityId: { type: String, index: true }, // city filter
  createdBy: { type: String }, // kisne banaya

}, { 
  timestamps: true, // createdAt, updatedAt auto
  strict: false // extra fields bhi allow - future ke liye
});

// === INDEXES - FAST SEARCH KE LIYE ===
// 1. Shop dashboard ke liye - sabse zyada use hoga
WorldProductSchema.index({ shopId: 1, shopType: 1, isActive: 1 });

// 2. ShopType wise - admin ko chahiye
WorldProductSchema.index({ shopType: 1, isActive: 1 });

// 3. Low stock alert ke liye
WorldProductSchema.index({ shopId: 1, stock: 1 });

// 4. Text search - name se search
WorldProductSchema.index({ name: 'text', category: 'text', brand: 'text' });

// 5. Area manager ke liye
WorldProductSchema.index({ areaId: 1, shopType: 1, isActive: 1 });

// Virtual - profit calculate
WorldProductSchema.virtual('profit').get(function(){
  if(this.mrp && this.price) return this.mrp - this.price;
  return 0;
});

module.exports = mongoose.model('WorldProduct', WorldProductSchema);
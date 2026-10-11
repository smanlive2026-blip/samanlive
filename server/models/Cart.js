// LOCATION: server/models/Cart.js - CART MODEL - WORLD CLASS - NO LOCALSTORAGE - SERVER SIDE CART
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  mrp: { type: Number, default: 0 },
  qty: { type: Number, required: true, min: 1, default: 1 },
  image: { type: String, default: '' },
  unit: { type: String, default: '' },
  shopType: { type: String, default: '' }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  userKey: { type: String, required: true, index: true }, // cookie se milega, localStorage nahi
  shopId: { type: String, required: true, index: true },
  shopType: { type: String, default: '' },
  items: [cartItemSchema],
  total: { type: Number, default: 0 },
  itemCount: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Ek user ka ek dukaan pe ek hi cart
cartSchema.index({ userKey: 1, shopId: 1 }, { unique: true });

// Save se pehle total khud gin lega
cartSchema.pre('save', function(next){
  this.total = this.items.reduce((sum, i) => sum + (i.price * i.qty), 0);
  this.itemCount = this.items.reduce((sum, i) => sum + i.qty, 0);
  this.updatedAt = new Date();
  next();
});

// 30 din purana cart khud saaf ho jayega
cartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.models.Cart || mongoose.model('Cart', cartSchema);
// LOCATION: server/models/Cart.js - SERVER CART (MongoDB)
const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, default: '' },
  price: { type: Number, default: 0 },
  mrp: { type: Number, default: 0 },
  thumbnail: { type: String, default: '' },
  image: { type: String, default: '' },
  unit: { type: String, default: '' },
  qty: { type: Number, default: 1 }
}, { _id: false });

const CartSchema = new mongoose.Schema({
  shopId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  items: { type: [CartItemSchema], default: [] },
  total: { type: Number, default: 0 },
  count: { type: Number, default: 0 }
}, { timestamps: true });

CartSchema.index({ shopId: 1, userId: 1 }, { unique: true });

CartSchema.methods.recalc = function(){
  this.count = this.items.reduce((s,i)=> s + (i.qty||1), 0);
  this.total = this.items.reduce((s,i)=> s + ((i.price||0)*(i.qty||1)), 0);
  return this;
};

module.exports = mongoose.models.Cart || mongoose.model('Cart', CartSchema);
// LOCATION: server/models/Cart.js - CART MODEL V3
const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
  userKey: { type: String, required: true, index: true }, // guest_xxx or user_xxx
  shopId: { type: String, required: true, index: true }, // = supplierId
  supplierId: String,
  buyerId: String,
  buyerRole: { type: String, default: 'customer' },
  buyerShopId: String,
  shopType: String,
  items: [{
    productId: String,
    _id: String,
    name: String,
    title: String,
    price: Number,
    mrp: Number,
    image: String,
    unit: String,
    qty: { type: Number, default: 1 },
    quantity: Number,
    shopId: String,
    ownerId: String,
    ownerRole: String,
    shopName: String,
    variant: String
  }],
  total: { type: Number, default: 0 },
  itemCount: { type: Number, default: 0 },
  totalAmount: Number
}, { timestamps: true });

CartSchema.index({ userKey: 1, shopId: 1 }, { unique: true });

module.exports = mongoose.model('Cart', CartSchema);
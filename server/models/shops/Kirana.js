// LOCATION: server/models/shops/Kirana.js
const mongoose = require('mongoose');

const kiranaProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  brand: { type: String, default: '' },
  category: { type: String, default: 'General', index: true },
  price: { type: Number, required: true },
  mrp: { type: Number, default: 0 },
  stock: { type: Number, default: 10 },
  unit: { type: String, default: 'pcs' },
  weight: { type: String, default: '' },
  image: { type: String, default: '' },
  description: { type: String, default: '' },
  lowStockLimit: { type: Number, default: 10 },
  salesCount: { type: Number, default: 0 }
}, { _id: true, timestamps: true });

const kiranaSchema = new mongoose.Schema({
  shopId: { type: String, required: true, unique: true, index: true },
  shopName: { type: String, default: 'Kirana Store' },
  ownerId: { type: String, default: '' },
  products: [kiranaProductSchema],
  settings: {
    isOpen: { type: Boolean, default: true },
    shopName: { type: String, default: 'Kirana Store' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    deliveryCharge: { type: Number, default: 0 },
    minOrder: { type: Number, default: 100 }
  },
  stats: {
    totalOrders: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Kirana', kiranaSchema);
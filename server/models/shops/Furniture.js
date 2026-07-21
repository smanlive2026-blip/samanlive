// server/models/shops/Furniture.js

const mongoose = require('mongoose');

const furnitureSchema = new mongoose.Schema({
  shopId: { type: String, required: true, unique: true },
  
  items: [{
    id: String,
    name: String,
    category: { type: String, default: 'Furniture' },
    price: Number,
    stock: Number,
    image: String,
    specs: {
      material: String,
      dimensions: String,
      color: String,
      warranty: String
    }
  }],

  orders: [{
    orderId: String,
    customerName: String,
    phone: String,
    address: String,
    items: [],
    total: Number,
    status: { type: String, default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
  }],

  offers: [{
    id: String,
    title: String,
    code: String,
    discount: Number,
    validTill: Date,
    isActive: { type: Boolean, default: true }
  }],

  reviews: [{
    id: String,
    customerName: String,
    rating: Number,
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],

  location: {
    lat: Number,
    lng: Number,
    type: { type: String, default: 'fixed' },
    range: Number,
    address: String
  },

  settings: {
    ownerPhotoUrl: String,
    isOpen: { type: Boolean, default: true },
    announcement: String,
    lowStockThreshold: { type: Number, default: 5 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Furniture', furnitureSchema);
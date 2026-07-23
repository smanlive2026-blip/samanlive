// server/models/shops/Furniture.js

const mongoose = require('mongoose');

const furnitureSchema = new mongoose.Schema({
  shopId: { type: String, required: true, unique: true },
  
  bannerPhotoUrl: { type: String, default: '' },
  ownerPhotoUrl: { type: String, default: '' },
  phone: { type: String, default: '' },
  
  items: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, default: 'Furniture' },
    price: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    
    // YE 4 FIELD NAYE ADD KIYE HAI
    unit: { type: String, default: 'Piece' },
    desc: { type: String, default: '' },
    image: { type: String, default: '' },
    img: { type: String, default: '' }, // backup
    available: { type: Boolean, default: true },
    
    specs: {
      material: { type: String, default: '' },
      dimensions: { type: String, default: '' },
      color: { type: String, default: '' },
      warranty: { type: String, default: '' }
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
    ownerPhotoUrl: { type: String, default: '' },
    bannerPhotoUrl: { type: String, default: '' },
    isOpen: { type: Boolean, default: true },
    announcement: { type: String, default: '' },
    lowStockThreshold: { type: Number, default: 5 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Furniture', furnitureSchema);
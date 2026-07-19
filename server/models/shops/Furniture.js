const mongoose = require('mongoose');

const furnitureSchema = new mongoose.Schema({
  shopId: { type: String, required: true, unique: true },
  
  items: [{
    id: String,
    name: String,
    category: { type: String, default: 'Sofa' }, // Sofa, Bed, Table, Chair
    price: Number,
    stock: Number,
    image: String,
    specs: {
      material: String, // Wood, Metal, Fabric
      dimensions: String, // LxWxH
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
    status: { type: String, default: 'Pending' }, // Pending, Delivered, Cancelled
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
    type: { type: String, default: 'fixed' }, // fixed ya dynamic
    range: Number,
    address: String
  },

  settings: {
    ownerPhotoUrl: String,
    isOpen: { type: Boolean, default: true },
    announcement: String,
    lowStockThreshold: { type: Number, default: 5 }
  }
});

module.exports = mongoose.model('Furniture', furnitureSchema);
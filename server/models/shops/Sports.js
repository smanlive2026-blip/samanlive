// LOCATION: server/models/shops/Sports.js
const mongoose = require('mongoose');

const sportsProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  brand: { type: String, default: 'Generic' },
  category: {
    type: String,
    default: 'General',
    index: true,
    enum: ['Cricket','Football','Badminton','Gym','Jersey','Shoes','Accessories','Tennis','Hockey','General','Other']
  },
  price: { type: Number, required: true },
  mrp: { type: Number, default: 0 },
  stock: { type: Number, default: 10 },
  size: { type: String, default: '' }, // S,M,L,XL, 7,8,9,10
  color: { type: String, default: '' },
  material: { type: String, default: '' },
  image: { type: String, default: '' },
  description: { type: String, default: '' },
  lowStockLimit: { type: Number, default: 5 },
  salesCount: { type: Number, default: 0 }
}, { _id: true, timestamps: true });

const sportsSchema = new mongoose.Schema({
  shopId: { type: String, required: true, unique: true, index: true },
  shopName: { type: String, default: 'Sports World' },
  ownerId: { type: String, default: '' },
  products: [sportsProductSchema],
  items: { type: Array, default: [] }, // backward compatibility for old code
  settings: {
    isOpen: { type: Boolean, default: true },
    shopName: { type: String, default: 'Sports World' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    announcement: { type: String, default: 'FREE SHIPPING ABOVE ₹499 • 6 MONTH WARRANTY • GENUINE BRANDS' },
    deliveryCharge: { type: Number, default: 0 },
    minOrder: { type: Number, default: 0 }
  },
  stats: {
    totalOrders: { type: Number, default: 0 },
    todaySale: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    jerseyOrders: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Sports', sportsSchema);
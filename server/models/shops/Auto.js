const mongoose = require('mongoose');
const { Schema } = mongoose;

const serviceJobSchema = new Schema({
  vehicleNo: { type: String, required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String },
  problem: { type: String },
  services: [{ name: String, price: Number }],
  status: { type: String, enum: ['pending', 'service', 'delivered'], default: 'pending' },
  totalAmount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const partSchema = new Schema({
  name: { type: String, required: true },
  sku: { type: String },
  price: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  lowStockLimit: { type: Number, default: 5 },
  image: { type: String }
});

const autoSchema = new Schema({
  shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, unique: true },
  shopName: { type: String },
  parts: [partSchema],
  serviceJobs: [serviceJobSchema],
  services: [{ name: String, price: Number }], // Oil change, Puncture etc
  isOpen: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Auto', autoSchema);
const mongoose = require('mongoose');

const autoPartSchema = new mongoose.Schema({
    id: { type: String, default: () => Date.now().toString() },
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: ['Engine', 'Brake', 'Electrical', 'Body', 'Oil', 'Tyre', 'Battery', 'Other'], default: 'Other' },
    sku: { type: String, default: '' },
    partNo: { type: String, default: '' },
    description: { type: String, default: '' },
    price: { type: Number, required: true, default: 0 },
    mrp: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    lowStockLimit: { type: Number, default: 5 },
    image: { type: String, default: 'https://placehold.co/400/f97316/fff?text=Part' },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
}, { _id: false });

const serviceJobSchema = new mongoose.Schema({
    _id: { type: String, default: () => Date.now().toString() },
    customerName: { type: String, required: true },
    phone: { type: String, default: '' },
    vehicleNo: { type: String, required: true },
    vehicleModel: { type: String, default: '' },
    problem: { type: String, default: '' },
    serviceType: { type: String, default: '' },
    partsUsed: [Object],
    laborCharges: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'service', 'delivered'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    deliveredAt: { type: Date }
}, { _id: false });

const autoSchema = new mongoose.Schema({
    shopId: { type: String, required: true, unique: true, index: true },
    parts: [autoPartSchema],
    serviceJobs: [serviceJobSchema],
    services: { type: [String], default: ['Engine Oil Change', 'Brake Service', 'AC Repair', 'Engine Work', 'Tyre Change', 'Battery Change', 'Car Wash', 'Denting Painting'] },
    settings: {
        isOpen: { type: Boolean, default: true },
        announcement: { type: String, default: '' }
    }
}, { timestamps: true });

module.exports = mongoose.model('Auto', autoSchema);
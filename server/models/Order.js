// LOCATION: server/models/Order.js - ORDER MODEL - FIXED FOR GUEST + WORLD PRODUCTS - WORLD CLASS
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    userKey: { type: String, index: true },
    shopId: { type: String, required: true, index: true },
    shopType: { type: String, default: '' },
    orderId: { type: String, unique: true, index: true },
    items: [{
        productId: { type: String },
        name: String,
        price: Number,
        quantity: Number,
        qty: Number,
        image: String
    }],
    totalAmount: { type: Number, required: true },
    total: { type: Number },
    deliveryAddress: {
        name: String,
        phone: String,
        line1: String,
        line2: String,
        city: String,
        state: String,
        pincode: String
    },
    paymentMethod: { type: String, default: 'cod' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    orderStatus: {
        type: String,
        enum: ['placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
        default: 'placed'
    },
    deliveryDate: Date,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
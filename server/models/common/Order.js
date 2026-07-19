const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    itemId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, default: 1 },
    image: String,
    specs: { type: Object, default: {} } // furniture ka material, size etc
});

const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true }, // ORD_123456
    shopId: { type: String, required: true, index: true },
    shopName: { type: String, required: true }, // 'furniture'
    template: { type: String, required: true }, // dashboard me kaam aayega

    // Customer Details
    customerId: { type: String },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    pincode: String,

    // Order Details
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    deliveryCharge: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },

    // Status Tracking
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'COD', 'Failed'],
        default: 'COD'
    },

    // Timestamps
    createdAt: { type: Date, default: Date.now },
    deliveredAt: Date
});

// Shop ke hisaab se fast search ke liye
orderSchema.index({ shopId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
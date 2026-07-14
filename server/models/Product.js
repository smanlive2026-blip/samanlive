// File: server/models/Order.js
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    orderId: { type: String, unique: true, required: true }, // ORD-20251004-001

    // ========== SHOP SE CONNECT ==========
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true }, // ✅ Shop ka _id yaha aayega
    shopName: { type: String }, // fast load ke liye copy kar lena
    shopPhone: { type: String },

    // ========== PRODUCT SE CONNECT ==========
    // ✅ Aage product array yaha aayega. Abhi itemsCount se kaam chala
    products: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // ✅ Product.js se link
        name: String,
        qty: Number,
        price: Number
    }],
    itemsCount: { type: Number, default: 1 }, // abhi ke liye
    total: { type: Number, default: 0 }, // total bill

    // ========== CUSTOMER DETAILS ==========
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerAddress: { type: String, required: true },

    // ========== DELIVERY BOY SE CONNECT ==========
    assignedTo: { type: String }, // ✅ DM ka managerCode yaha save hoga. Ex: DM-BHARGU-1-1
    assignedAt: { type: Date },
    pickedAt: { type: Date },
    deliveredAt: { type: Date },
    deliveryCharge: { type: Number, default: 30 }, // DM ki earning

    // ========== STATUS ==========
    status: { 
        type: String, 
        enum: ['pending', 'assigned', 'picked', 'delivered', 'cancelled'], 
        default: 'pending' 
    },

    // ========== AREA FOR FILTER ==========
    areaCode: { type: String }, // ✅ Area Manager filter ke liye

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
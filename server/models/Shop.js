const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // NEW: Kis user ne banayi
    shopName: { type: String, required: true },
    ownerName: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
    address: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        pincode: String
    },
    area: { type: String }, // NEW: Jaipur, Delhi etc - user ke profile se aayega
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
    },
    serviceType: { type: String, required: true }, // grocery, pharmacy, etc
    description: String,
    banner: String,
    logo: String,

    // STATUS SYSTEM - NEW
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // NEW: Kis admin ne approve ki
    approvedAt: { type: Date }, // NEW: Kab approve hui

    isVerified: { type: Boolean, default: false }, // Ab ye optional, status use hoga
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 }, // NEW: Admin list me upar niche karne ke liye
    rating: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

shopSchema.index({ location: '2dsphere' });
shopSchema.index({ status: 1 }); // NEW: Pending shops fast search ke liye
shopSchema.index({ area: 1 }); // NEW: Area wise filter ke liye

module.exports = mongoose.models.Shop || mongoose.model('Shop', shopSchema);
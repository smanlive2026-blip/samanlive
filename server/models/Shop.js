const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
    },
    serviceType: { type: String, required: true }, // grocery, pharmacy, etc
    description: String,
    banner: String,
    logo: String,
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    rating: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

shopSchema.index({ location: '2dsphere' });

module.exports = mongoose.models.Shop || mongoose.model('Shop', shopSchema);
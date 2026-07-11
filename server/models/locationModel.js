//  isska location h   server/models/location.js

const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
    },
    coordinates: {
        type: [Number], // [lng, lat]
        required: true
    }
});

// User Location Schema
const userLocationSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    location: locationSchema,
    lastSeen: { type: Date, default: Date.now }
});
userLocationSchema.index({ location: '2dsphere' });

// Shop Location Schema
const shopLocationSchema = new mongoose.Schema({
    shopId: { type: String, required: true, unique: true },
    location: locationSchema,
    locationType: { type: String, enum: ['fixed', 'dynamic'], default: 'fixed' },
    deliveryRange: { type: Number, default: 5 }, // KM
    address: { type: String },
    lastUpdated: { type: Date, default: Date.now }
});
shopLocationSchema.index({ location: '2dsphere' });
shopLocationSchema.index({ locationType: 1, 'shopId': 1 });

module.exports = {
    UserLocation: mongoose.model('UserLocation', userLocationSchema),
    ShopLocation: mongoose.model('ShopLocation', shopLocationSchema)
};
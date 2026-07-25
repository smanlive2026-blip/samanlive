//  isska location h   server/models/location.js

const mongoose = require('mongoose');

// Shop Location Schema
const shopLocationSchema = new mongoose.Schema({
    shopId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Shop', 
        required: true, 
        unique: true 
    },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    locationType: { 
        type: String, 
        enum: ['fixed', 'mobile'], 
        default: 'fixed' 
    },
    deliveryRange: { 
        type: Number, 
        default: 5 // KM me
    },
    address: { type: String }
}, { timestamps: true });

// User Location Schema
const userLocationSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
        unique: true 
    },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
}, { timestamps: true });

// 2D index for geo queries - nearby shop ke kaam aayega
shopLocationSchema.index({ latitude: 1, longitude: 1 });

module.exports = {
    ShopLocation: mongoose.model('ShopLocation', shopLocationSchema),
    UserLocation: mongoose.model('UserLocation', userLocationSchema)
};
//   server/models/ShopLocation.js
const mongoose = require('mongoose');

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
        enum: ['fixed', 'dynamic'], 
        default: 'fixed' 
    },
    deliveryRange: { type: Number, default: 5 }, // KM me
    address: { type: String },
    updatedAt: { type: Date, default: Date.now }
});

// location update hote hi time change ho jaye
shopLocationSchema.pre('save', function(next){
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('ShopLocation', shopLocationSchema);
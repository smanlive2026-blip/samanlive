//    server/models/UserLocation.js

const mongoose = require('mongoose');

const userLocationSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
        unique: true 
    },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    updatedAt: { type: Date, default: Date.now }
});

userLocationSchema.pre('save', function(next){
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('UserLocation', userLocationSchema);
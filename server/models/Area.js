const mongoose = require('mongoose');

const areaSchema = new mongoose.Schema({
    areaCode: { type: String, required: true, unique: true, uppercase: true },
    areaName: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    centerLat: { type: Number, required: true },
    centerLng: { type: Number, required: true },
    radius: { type: Number, default: 50 },
    status: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Area', areaSchema);
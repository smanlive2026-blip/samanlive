const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    id: String,
    title: String,
    image: String,
    link: String,
    type: { type: String, enum: ['admin', 'area'], default: 'admin' },
    areaId: String,
    categoryId: String,
    status: { type: Boolean, default: true },
    priority: Number,
    mongoId: String
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);
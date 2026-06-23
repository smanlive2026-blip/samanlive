const mongoose = require('mongoose');

const shopTypeSchema = new mongoose.Schema({
    slug: {
        type: String,
        required: true,
        unique: true // kirana, cloth, medical, restaurant
    },
    name: {
        type: String,
        required: true // Kirana Store, Cloth Shop
    },
    icon: {
        type: String,
        default: '🏪'
    },
    description: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    fields: {
        type: [String],
        default: [] // ['weight', 'mrp', 'brand'] ya ['size', 'color', 'fabric']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ShopType', shopTypeSchema);
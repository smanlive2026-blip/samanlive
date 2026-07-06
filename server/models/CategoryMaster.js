// ========================================
// FILE: models/CategoryMaster.js
// Kaam: Har shop type ke liye default products store karna
// ========================================
const mongoose = require('mongoose');

const CategoryProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: { // Sub category: Aata, Dal, Oil
        type: String,
        default: 'General'
    },
    price: {
        type: Number,
        required: true,
        default: 0
    },
    stock: {
        type: Number,
        required: true,
        default: 100
    },
    image: {
        type: String,
        default: 'https://via.placeholder.com/150'
    }
}, { _id: true });

const CategoryMasterSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        unique: true, // kirana, medical, cloth etc sirf 1 baar
        lowercase: true,
        trim: true
    },
    products: [CategoryProductSchema] // Is category ke saare products
}, {
    timestamps: true
});

module.exports = mongoose.model('CategoryMaster', CategoryMasterSchema);
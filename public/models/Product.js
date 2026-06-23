const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    shopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    shopType: {
        type: String,
        required: true // kirana, cloth, medical, restaurant
    },
    price: {
        type: Number,
        required: true
    },
    mrp: {
        type: Number,
        default: 0
    },
    stock: {
        type: Number,
        default: 0
    },
    image: {
        type: String,
        default: ''
    },
    // Har shop type ka alag data yaha store hoga
    productData: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    /*
    Kirana Example:
    productData: { weight: "1kg", unit: "kg", brand: "Tata", expiry: "2026-12-31" }

    Cloth Example:
    productData: { size: "L", color: "Red", fabric: "Cotton", category: "men" }

    Medical Example:
    productData: { company: "Cipla", batch: "B123", expiry: "2026-10-15", type: "tablet", prescription: true }

    Restaurant Example:
    productData: { category: "main-course", foodType: "veg", spiceLevel: "medium", available: true, prepTime: "15 mins" }
    */
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

productSchema.index({ shopId: 1, shopType: 1 });
productSchema.index({ name: 'text' }); // Search ke liye

productSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Bas ye line change hai 👇
module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
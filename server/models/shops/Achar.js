const mongoose = require('mongoose');

const acharSchema = new mongoose.Schema({
    shopId: {
        type: String, // <-- Yaha ObjectId hata ke String kar diya
        required: true,
        index: true
    },

    // Basic Info
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    category: {
        type: String,
        enum: ['Aam', 'Nimbu', 'Mix', 'Murabba', 'Gajar', 'Lahsun', 'Mirchi', 'Other'],
        default: 'Aam'
    },
    description: {
        type: String,
        default: '',
        maxlength: 500
    },

    // Pricing - Achar specific
    price500: {
        type: Number,
        required: true,
        min: 0
    },
    price1kg: {
        type: Number,
        required: true,
        min: 0
    },
    price: { // default 1kg price for generic cart
        type: Number,
        required: false,
    },

    // Stock
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: 0 // Kg me
    },
    unit: {
        type: String,
        default: 'Kg'
    },

    // Achar specific fields
    jarType: {
        type: String,
        enum: ['Glass', 'Plastic', 'Ceramic'],
        default: 'Glass'
    },
    spiceLevel: {
        type: String,
        enum: ['Mild', 'Medium', 'Teekha'],
        default: 'Medium'
    },
    isHomemade: {
        type: Boolean,
        default: true
    },
    expiryMonths: {
        type: Number,
        default: 12,
        min: 1
    },

    // Media
    image: {
        type: String,
        default: 'https://placehold.co/400/eab308/fff?text=Achar'
    },
    images: {
        type: [String],
        default: []
    },

    // Status
    isActive: {
        type: Boolean,
        default: true
    },

}, { timestamps: true });

// IMPORTANT: price auto set karne ke liye
acharSchema.pre('save', function(next) {
    this.price = this.price1kg;
    next();
});

acharSchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();
    if(update.price1kg) {
        update.price = update.price1kg;
    }
    next();
});

// Index for fast search
acharSchema.index({ shopId: 1, name: 1, category: 1 });
acharSchema.index({ shopId: 1, isActive: 1 });

module.exports = mongoose.model('Achar', acharSchema);
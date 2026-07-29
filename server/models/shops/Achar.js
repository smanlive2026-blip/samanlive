const mongoose = require('mongoose');

const acharSchema = new mongoose.Schema({
    shopId: {
        type: String,
        required: true,
        index: true
    },
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

    price500: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    price1kg: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    price: {
        type: Number,
        required: false,
        default: 0
    },

    stock: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    unit: {
        type: String,
        default: 'Kg'
    },

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

    image: {
        type: String,
        default: 'https://placehold.co/400/eab308/fff?text=Achar'
    },
    images: {
        type: [String],
        default: []
    },
    isActive: {
        type: Boolean,
        default: true
    },

}, {
    timestamps: true,
    strict: false // purane data ke liye
});



acharSchema.index({ shopId: 1, name: 1, category: 1 });
acharSchema.index({ shopId: 1, isActive: 1 });

module.exports = mongoose.model('Achar', acharSchema);
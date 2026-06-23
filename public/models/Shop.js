const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    shopName: {
        type: String,
        required: true,
        trim: true
    },
    ownerName: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true // kirana, cloth, medical, restaurant etc
    },
    shopType: {
        type: String,
        required: true // same as category, for template loading
    },
    address: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    icon: {
        type: String,
        default: '🏪'
    },
    range: {
        type: Number,
        default: 5000 // Service range in meters, default 5km
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    gst: {
        type: String,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending'],
        default: 'active' // <-- Ab active default hai
    },
    rating: {
        type: Number,
        default: 0
    },
    totalOrders: {
        type: Number,
        default: 0
    },
    isOpen: {
        type: Boolean,
        default: true // Restaurant ke liye open/close
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

// Geo search ke liye index - Nearby shop dhundhne ke kaam aayega
shopSchema.index({ location: '2dsphere' });

// User ke hisaab se index - Ek user ki shop fast dhundne ke liye
shopSchema.index({ createdBy: 1 });

// Update hone pe updatedAt change ho
shopSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

shopSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

// Bas ye line change hai 👇
module.exports = mongoose.models.Shop || mongoose.model('Shop', shopSchema);
const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager' },
    shopName: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: {
        line1: { type: String, default: '' },
        line2: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        pincode: { type: String, default: '' }
    },

    // ========== AREA SYSTEM FIELDS ==========
    area: { type: String, default: '' },
    areaCode: { type: String, required: true, uppercase: true, trim: true },
    areaName: { type: String, default: '' },
    bucket: { type: String, required: true, trim: true },
    // ========== AREA SYSTEM FIELDS END ==========

    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }
    },
    serviceType: { type: String, required: true, trim: true },
    moduleId: { type: String, default: '' },
    categoryId: { type: String, default: '' },
    description: { type: String, default: '' },
    banner: { type: String, default: '' },
    logo: { type: String, default: '' },
    icon: { type: String, default: '🏪' },

    // ========== LOCATION TYPE FIELDS ==========
    locationType: {
        type: String,
        enum: ['fixed', 'dynamic'],
        default: 'fixed'
    },
    lastLocationUpdate: {
        type: Date,
        default: Date.now
    },
    // ========== LOCATION TYPE FIELDS END ==========

    // Banner Approval System
    bannerApproved: { type: Boolean, default: false },
    bannerApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    bannerApprovedAt: { type: Date },

    // Status System
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String, default: '' },

    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },

    // ========== SHOP TYPE & ITEMS - NEW ==========
    shopType: {
        type: String,
        enum: ['product', 'food', 'service', 'rental', 'fashion'],
        default: 'product',
        required: true
    },
    items: [{
        name: { type: String, required: true },
        price: { type: Number, required: true },
        image: { type: String, default: '' },
        unit: { type: String, default: '' }, // kg, piece, hour, day
        desc: { type: String, default: '' },
        // Fashion ke liye extra
        size: { type: String, default: '' },
        color: { type: String, default: '' },
        // Food ke liye extra
        veg: { type: Boolean, default: true },
        // Service/Rental ke liye
        duration: { type: String, default: '' }, // 30min, 1hr, 1day
        available: { type: Boolean, default: true }
    }],
    // ========== SHOP TYPE & ITEMS END ==========

    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalOrders: { type: Number, default: 0 },
    range: { type: Number, default: 5000 },
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ========== INDEXES ==========
shopSchema.index({ location: '2dsphere' });
shopSchema.index({ status: 1 });
shopSchema.index({ area: 1 });
shopSchema.index({ areaCode: 1 });
shopSchema.index({ bucket: 1 });
shopSchema.index({ areaCode: 1, bucket: 1 });
shopSchema.index({ areaCode: 1, status: 1 });
shopSchema.index({ bannerApproved: 1 });
shopSchema.index({ serviceType: 1 });
shopSchema.index({ moduleId: 1 });
shopSchema.index({ categoryId: 1 });
shopSchema.index({ phone: 1 });
shopSchema.index({ managerId: 1 });
shopSchema.index({ createdAt: -1 });
shopSchema.index({ isActive: 1 });
shopSchema.index({ locationType: 1 });
shopSchema.index({ shopType: 1 }); // NEW - Shop type filter

// ========== VIRTUALS ==========
shopSchema.virtual('fullAddress').get(function() {
    const addr = this.address;
    if (!addr.city &&!addr.state) return '';
    return `${addr.line1}, ${addr.city}, ${addr.state} - ${addr.pincode}`.trim().replace(/^,\s*/, '');
});

shopSchema.virtual('latlng').get(function() {
    if (!this.location.coordinates || this.location.coordinates.length!== 2) return null;
    return {
        lat: this.location.coordinates[1],
        lng: this.location.coordinates[0]
    };
});

// ========== METHODS ==========
shopSchema.methods.isInManagerArea = function(managerAreaCode) {
    return this.areaCode === managerAreaCode;
};

shopSchema.methods.matchesManagerBucket = function(managerBucket) {
    return this.bucket === managerBucket;
};

module.exports = mongoose.models.Shop || mongoose.model('Shop', shopSchema);
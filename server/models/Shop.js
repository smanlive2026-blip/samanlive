// ========================================
// Shop Model - shop-create.html, area-manager.html, user-view.html sab ke liye
// ========================================
const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, default: () => new mongoose.Types.ObjectId() },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager' }, // Old single manager - backward compatibility

    // ✅ NAYA: Multiple Area Managers Support
    managerCodes: {
        type: [String], // ["SURAGU-1-DEFAULT", "SURAGU-2-DEFAULT"]
        default: []
        // ❌ index: true hataya - neeche schema.index() use kar rahe hain
    },

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
        coordinates: { type: [Number], default: [0, 0] } // [lng, lat] format
    },
    serviceType: { type: String, required: true, trim: true },
    moduleId: { type: String, default: '' },
    categoryId: { type: String, default: '' },
    description: { type: String, default: '' },
    banner: { type: String, default: '' },
    logo: { type: String, default: '' }, // ✅ Base64 logo
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
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    approvedAt: { type: Date },
    rejectionReason: { type: String, default: '' },

    isVerified: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },

    // ========== SHOP TYPE & ITEMS - NEW ==========
    shopType: {
        type: String,
        enum: ['product', 'food', 'service', 'rental', 'fashion', 'common'],
        default: 'product',
        required: true
    },
    items: [{
        name: { type: String, required: true },
        price: { type: Number, required: true },
        image: { type: String, default: '' },
        unit: { type: String, default: '' },
        desc: { type: String, default: '' },
        size: { type: String, default: '' },
        color: { type: String, default: '' },
        veg: { type: Boolean, default: true },
        duration: { type: String, default: '' },
        available: { type: Boolean, default: true },
        company: { type: String, default: '' },
        batch: { type: String, default: '' },
        expiry: { type: String, default: '' },
        mrp: { type: Number, default: 0 },
        stock: { type: Number, default: 0 }
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
shopSchema.index({ managerCodes: 1 }); // ✅ Yahi rakha, upar se hataya
shopSchema.index({ createdAt: -1 });
shopSchema.index({ isActive: 1 });
shopSchema.index({ locationType: 1 });
shopSchema.index({ shopType: 1 });

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

shopSchema.methods.hasManagerAccess = function(managerCode) {
    return this.managerCodes.includes(managerCode);
};

shopSchema.methods.addManager = function(managerCode) {
    if (!this.managerCodes.includes(managerCode)) {
        this.managerCodes.push(managerCode);
    }
    return this.save();
};

shopSchema.methods.removeManager = function(managerCode) {
    this.managerCodes = this.managerCodes.filter(code => code!== managerCode);
    return this.save();
};

module.exports = mongoose.models.Shop || mongoose.model('Shop', shopSchema);
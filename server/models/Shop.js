// LOCATION: server/models/Shop.js - V20 WORLD - 50 MODES - AREA MANAGER SAFE - FULL CODE - NO ENUM BLOCK
const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, default: () => new mongoose.Types.ObjectId() },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager' },

    managerCodes: {
        type: [String],
        default: []
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

    // ========== AREA SYSTEM FIELDS - AREA MANAGER SAFE ==========
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
    uploadedLogo: { type: String, default: '' },
    icon: { type: String, default: '🏪' },

    template: { type: String, default: 'general' },

    locationType: {
        type: String,
        enum: ['fixed', 'dynamic'],
        default: 'fixed'
    },
    lastLocationUpdate: {
        type: Date,
        default: Date.now
    },

    bannerApproved: { type: Boolean, default: false },
    bannerApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    bannerApprovedAt: { type: Date },

    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'active'],
        default: 'active'
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    approvedAt: { type: Date },
    rejectionReason: { type: String, default: '' },

    isVerified: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },

    // ========== CLAIM SYSTEM FIELDS ==========
    availableForManagers: {
        type: [String],
        default: []
    },
    assignedManagerCode: {
        type: String,
        default: null
    },
    assignedManagerName: {
        type: String,
        default: null
    },
    assignedManagerPhone: {
        type: String,
        default: null
    },
    claimedBy: {
        type: String,
        default: null
    },
    claimedAt: {
        type: Date,
        default: null
    },
    controlledBy: {
        type: String,
        default: null
    },
    // ========== CLAIM SYSTEM FIELDS END ==========

    // ========== V20 WORLD - 50 MODES SUPPORT - NO ENUM BLOCK - AREA MANAGER SAFE ==========
    shopType: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        index: true,
        default: 'kirana'
    },
    businessMode: {
        type: String,
        enum: ['retail','fashion','food','service','healthcare','rental','bulk','mandi','education','csc','fuel','logistics','entertainment','agriculture','handicraft','other'],
        default: 'retail',
        index: true,
        required: false
    },
    modeConfig: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    },
    worldEnabled: {
        type: Boolean,
        default: true
    },
    isWorldShop: {
        type: Boolean,
        default: true
    },
    // ========== V20 END ==========

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

    ownerPhotoUrl: { type: String, default: '' },
    isOpen: { type: Boolean, default: true },
    announcement: { type: String, default: '' },
    shopSettings: {
        openTime: { type: String, default: '08:00' },
        closeTime: { type: String, default: '22:00' }
    },
    products: {
        type: [{
            _id: { type: mongoose.Schema.Types.ObjectId },
            name: { type: String },
            category: { type: String },
            price: { type: Number },
            stock: { type: Number },
            image: { type: String }
        }],
        default: []
    },

    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalOrders: { type: Number, default: 0 },
    range: { type: Number, default: 5000 },
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ========== INDEXES - AREA MANAGER SAFE ==========
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
shopSchema.index({ managerCodes: 1 });
shopSchema.index({ createdAt: -1 });
shopSchema.index({ isActive: 1 });
shopSchema.index({ locationType: 1 });
shopSchema.index({ shopType: 1 });
shopSchema.index({ template: 1 });
shopSchema.index({ businessMode: 1 });
shopSchema.index({ worldEnabled: 1 });
shopSchema.index({ claimedBy: 1 });
shopSchema.index({ controlledBy: 1 });
shopSchema.index({ availableForManagers: 1 });
shopSchema.index({ areaCode: 1, claimedBy: 1, status: 1 });

// ========== VIRTUALS ==========
shopSchema.virtual('fullAddress').get(function() {
    const addr = this.address;
    if (!addr.city && !addr.state) return '';
    return `${addr.line1}, ${addr.city}, ${addr.state} - ${addr.pincode}`.trim().replace(/^,\s*/, '');
});

shopSchema.virtual('latlng').get(function() {
    if (!this.location.coordinates || this.location.coordinates.length !== 2) return null;
    return {
        lat: this.location.coordinates[1],
        lng: this.location.coordinates[0]
    };
});

// ========== METHODS - AREA MANAGER SAFE ==========
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
    this.managerCodes = this.managerCodes.filter(code => code !== managerCode);
    return this.save();
};

shopSchema.methods.isAvailableForClaim = function() {
    return this.claimedBy === null && this.status === 'active';
};

shopSchema.methods.claimBy = function(managerCode) {
    this.claimedBy = managerCode;
    this.claimedAt = new Date();
    this.controlledBy = managerCode;
    this.status = 'active';
    this.isVerified = true;
    return this.save();
};

// V20 NEW METHOD - AUTO DETECT BUSINESS MODE FROM SHOP TYPE
shopSchema.methods.detectBusinessMode = function() {
    const type = (this.shopType || '').toLowerCase();
    const fashionTypes = ['cloth','saree-shop','child-clothes','kids-wear','suit-shop','winter-wear','fabric-shop','footwear','purse','kambal-shop','mat-shop','mattress-shop','watch-shop','jewellery','beauty','saree'];
    const foodTypes = ['restaurant','dhaba','hotel','pizza','bakery','halwai','juice','tea','grocery-sweet','meat','bakery'];
    const serviceTypes = ['auto','mobile','battery','mochi','optical','photo-studio','salon','beauty','plumbing','door-shop','ply-board','puja','painting','service'];
    const healthcareTypes = ['clinic','hospital','medical','vet-clinic','vet-shop','optical','patanjali','lab'];
    const rentalTypes = ['rental','decoration-shop','charpai-shop','tripal-shop'];
    const bulkTypes = ['hardware','brick','tiles','sanitary','paint-shop','furniture','electronics','sports','stationery','toy-shop','plastic'];
    const mandiTypes = ['sabji','fruit','meat','dairy','flower','chakki','krishi','nursery','fish','chicken','achar-shop'];
    const educationTypes = ['stationery','coaching','school','computer','library'];
    const cscTypes = ['csc','cyber-cafe','xerox','banking','insurance','recharge'];

    if (fashionTypes.includes(type)) return 'fashion';
    if (foodTypes.includes(type)) return 'food';
    if (serviceTypes.includes(type)) return 'service';
    if (healthcareTypes.includes(type)) return 'healthcare';
    if (rentalTypes.includes(type)) return 'rental';
    if (bulkTypes.includes(type)) return 'bulk';
    if (mandiTypes.includes(type)) return 'mandi';
    if (educationTypes.includes(type)) return 'education';
    if (cscTypes.includes(type)) return 'csc';
    return 'retail';
};

shopSchema.pre('save', function(next) {
    if (!this.businessMode || this.isModified('shopType')) {
        this.businessMode = this.detectBusinessMode();
    }
    if (!this.serviceType && this.shopType) {
        this.serviceType = this.shopType;
    }
    if (!this.template && this.shopType) {
        this.template = this.shopType;
    }
    next();
});

module.exports = mongoose.models.Shop || mongoose.model('Shop', shopSchema);
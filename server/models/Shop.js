// LOCATION: server/models/Shop.js - V27 FINAL - 50 MODES - AREA MANAGER SAFE - FULL CODE
// CHANGE V27: 1) phone / ownerPhone / whatsapp / altPhone hamesha 10 digit (setter) 2) email chhota, areaCode / gst uppercase 3) INDEX SAFAI - shopType / businessMode pe index 1 baar, dobara mat likho 4) pre-save me normalize
// FLOW: Shop Dashboard -> UnifiedProfile (common/profile/profile-core.js) -> /api/common/profile/upload-avatar -> Cloudinary -> Shop.logo / banner / ownerPhotoUrl me URL
// RULE: DB me kabhi base64 nahi jayega, sirf Cloudinary URL jayega. Pehchan = Phone (10 digit).

const mongoose = require('mongoose');

// V27: Phone normalize - +91 8384800729 -> 8384800729
function normPhoneSetter(v) {
    if (v === undefined || v === null) return v;
    const d = String(v).replace(/\D/g, '');
    if (!d) return v;
    return d.length > 10 ? d.slice(-10) : d;
}
function normEmailSetter(v) {
    if (v === undefined || v === null) return '';
    return String(v).toLowerCase().trim();
}
function normUpperSetter(v) {
    if (v === undefined || v === null) return v;
    return String(v).toUpperCase().trim();
}

const shopSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager' },

    managerCodes: { type: [String], default: [] },

    shopName: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, set: normPhoneSetter },
    ownerPhone: { type: String, trim: true, default: '', set: normPhoneSetter },
    email: { type: String, trim: true, lowercase: true, default: '', set: normEmailSetter },
    address: {
        line1: { type: String, default: '' },
        line2: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        pincode: { type: String, default: '' }
    },

    // ========== AREA SYSTEM FIELDS - AREA MANAGER SAFE ==========
    area: { type: String, default: '' },
    areaCode: { type: String, required: true, uppercase: true, trim: true, set: normUpperSetter },
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

    // ========== PROFILE PHOTO - V27 UNIFIED - CLOUDINARY URL HI AAYEGA, BASE64 NAHI ==========
    logo: { type: String, default: '' },
    shopLogo: { type: String, default: '' },
    uploadedLogo: { type: String, default: '' },
    image: { type: String, default: '' },

    banner: { type: String, default: '' },
    coverPhoto: { type: String, default: '' },
    cover: { type: String, default: '' },

    ownerPhotoUrl: { type: String, default: '' },
    ownerPhoto: { type: String, default: '' },
    ownerAvatar: { type: String, default: '' },

    gallery: [{ type: String, default: [] }],
    shopImages: [{ type: String, default: [] }],

    icon: { type: String, default: '🏪' },
    tagline: { type: String, default: '', trim: true },
    whatsapp: { type: String, trim: true, default: '', set: normPhoneSetter },
    altPhone: { type: String, trim: true, default: '', set: normPhoneSetter },
    gst: { type: String, trim: true, default: '', uppercase: true, set: normUpperSetter },
    fssai: { type: String, trim: true, default: '' },
    estYear: { type: Number, default: null },

    template: { type: String, default: 'general' },

    locationType: { type: String, enum: ['fixed', 'dynamic'], default: 'fixed' },
    lastLocationUpdate: { type: Date, default: Date.now },

    bannerApproved: { type: Boolean, default: false },
    bannerApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    bannerApprovedAt: { type: Date },

    status: { type: String, enum: ['pending', 'approved', 'rejected', 'active'], default: 'active' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    approvedAt: { type: Date },
    rejectionReason: { type: String, default: '' },

    isVerified: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },

    // ========== CLAIM SYSTEM FIELDS ==========
    availableForManagers: { type: [String], default: [] },
    assignedManagerCode: { type: String, default: null },
    assignedManagerName: { type: String, default: null },
    assignedManagerPhone: { type: String, default: null, set: normPhoneSetter },
    claimedBy: { type: String, default: null },
    claimedAt: { type: Date, default: null },
    controlledBy: { type: String, default: null },
    // ========== CLAIM SYSTEM FIELDS END ==========

    // ========== V20 WORLD - 50 MODES SUPPORT - NO ENUM BLOCK - AREA MANAGER SAFE ==========
    shopType: { type: String, required: true, trim: true, lowercase: true, default: 'kirana' },
    businessMode: {
        type: String,
        enum: ['retail','fashion','food','service','healthcare','rental','bulk','mandi','education','csc','fuel','logistics','entertainment','agriculture','handicraft','other'],
        default: 'retail', required: false
    },
    modeConfig: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
    worldEnabled: { type: Boolean, default: true },
    isWorldShop: { type: Boolean, default: true },
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

// ========== INDEXES - V27 - shopType / businessMode pe index 1 baar hi rakha hai ==========
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
shopSchema.index({ ownerPhone: 1 });
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
    return { lat: this.location.coordinates[1], lng: this.location.coordinates[0] };
});
shopSchema.virtual('shopImage').get(function() { return this.logo || this.shopLogo || this.uploadedLogo || this.image || ''; });
shopSchema.virtual('shopAvatar').get(function() { return this.logo || this.shopLogo || this.uploadedLogo || this.image || ''; });

// ========== METHODS - AREA MANAGER SAFE ==========
shopSchema.methods.isInManagerArea = function(managerAreaCode) { return this.areaCode === managerAreaCode; };
shopSchema.methods.matchesManagerBucket = function(managerBucket) { return this.bucket === managerBucket; };
shopSchema.methods.hasManagerAccess = function(managerCode) { return this.managerCodes.includes(managerCode); };
shopSchema.methods.addManager = function(managerCode) {
    if (!this.managerCodes.includes(managerCode)) this.managerCodes.push(managerCode);
    return this.save();
};
shopSchema.methods.removeManager = function(managerCode) {
    this.managerCodes = this.managerCodes.filter(code => code !== managerCode);
    return this.save();
};
shopSchema.methods.isAvailableForClaim = function() { return this.claimedBy === null && this.status === 'active'; };
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

// FIXED: Mongoose 7+ me next nahi hota - Vercel pe TypeError: next is not a function fix
// V27: logo / banner / ownerPhoto sync + phone normalize
shopSchema.pre('save', function() {
    try {
        if (this.phone) this.phone = normPhoneSetter(this.phone);
        if (this.ownerPhone) this.ownerPhone = normPhoneSetter(this.ownerPhone);
        if (this.whatsapp) this.whatsapp = normPhoneSetter(this.whatsapp);
        if (this.altPhone) this.altPhone = normPhoneSetter(this.altPhone);
        if (this.assignedManagerPhone) this.assignedManagerPhone = normPhoneSetter(this.assignedManagerPhone);
        if (this.email) this.email = normEmailSetter(this.email);
        if (this.areaCode) this.areaCode = normUpperSetter(this.areaCode);
        if (this.gst) this.gst = normUpperSetter(this.gst);
        if (this.shopType) this.shopType = String(this.shopType).toLowerCase().trim();
    } catch (e) {}

    // 1. LOGO SYNC - logo / shopLogo / uploadedLogo / image - 4 me same URL
    const logoPic = this.logo || this.shopLogo || this.uploadedLogo || this.image || '';
    if (logoPic) {
        this.logo = logoPic;
        this.shopLogo = logoPic;
        this.uploadedLogo = logoPic;
        this.image = logoPic;
    }
    // 2. BANNER SYNC - banner / coverPhoto / cover - 3 me same URL
    const bannerPic = this.banner || this.coverPhoto || this.cover || '';
    if (bannerPic) {
        this.banner = bannerPic;
        this.coverPhoto = bannerPic;
        this.cover = bannerPic;
    }
    // 3. OWNER PHOTO SYNC - ownerPhotoUrl / ownerPhoto / ownerAvatar - 3 me same URL
    const ownerPic = this.ownerPhotoUrl || this.ownerPhoto || this.ownerAvatar || '';
    if (ownerPic) {
        this.ownerPhotoUrl = ownerPic;
        this.ownerPhoto = ownerPic;
        this.ownerAvatar = ownerPic;
    }
    // 4. GALLERY SYNC
    if (this.shopImages && this.shopImages.length > 0 && (!this.gallery || this.gallery.length === 0)) {
        this.gallery = this.shopImages;
    }
    if (this.gallery && this.gallery.length > 0 && (!this.shopImages || this.shopImages.length === 0)) {
        this.shopImages = this.gallery;
    }
    // 5. OLD LOGIC - same rakha hai
    if (!this.businessMode || this.isModified('shopType')) {
        this.businessMode = this.detectBusinessMode();
    }
    if (!this.serviceType && this.shopType) {
        this.serviceType = this.shopType;
    }
    if (!this.template && this.shopType) {
        this.template = this.shopType;
    }
    if (!this.ownerPhone && this.phone) this.ownerPhone = this.phone;
});

module.exports = mongoose.models.Shop || mongoose.model('Shop', shopSchema);
const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    // Basic Info
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    image: {
        type: String,
        required: true
    }, // Banner image URL
    link: {
        type: String,
        default: '',
        trim: true
    }, // Click karne pe kaha jaye
    
    // Type & Placement
    type: {
        type: String,
        enum: ['admin', 'area_manager', 'shop'],
        default: 'admin',
        required: true
    }, // Kisne banaya
    placement: {
        type: String,
        enum: ['home_top', 'home_middle', 'home_bottom', 'category', 'shop_page'],
        default: 'home_top'
    }, // Kaha dikhega
    
    // Targeting
    areaId: {
        type: String,
        default: ''
    }, // Kis area ke liye - empty = all areas
    moduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module',
        default: null
    }, // Kis module me dikhega
    categoryId: {
        type: String,
        default: ''
    }, // Kis category me dikhega
    shopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        default: null
    }, // Shop banner hai to shop ID
    
    // Status & Priority
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'expired'],
        default: 'pending'
    }, // ← Boolean nahi, enum kiya
    isActive: {
        type: Boolean,
        default: true
    }, // Show/Hide toggle
    priority: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    }, // High priority pehle dikhega
    
    // Approval Info
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    approvedAt: {
        type: Date,
        default: null
    },
    rejectedReason: {
        type: String,
        default: ''
    },
    
    // Schedule
    startDate: {
        type: Date,
        default: Date.now
    }, // Kab se dikhega
    endDate: {
        type: Date,
        default: null
    }, // Kab tak dikhega - null = no expiry
    
    // Analytics
    views: {
        type: Number,
        default: 0
    },
    clicks: {
        type: Number,
        default: 0
    },
    
    // Creator Info
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'type', // Admin ya Manager
        required: true
    },
    createdByType: {
        type: String,
        enum: ['admin', 'manager'],
        default: 'admin'
    }
    
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ==================== INDEXES ====================
bannerSchema.index({ status: 1, isActive: 1 });
bannerSchema.index({ type: 1, status: 1 });
bannerSchema.index({ areaId: 1, status: 1 });
bannerSchema.index({ moduleId: 1, categoryId: 1 });
bannerSchema.index({ placement: 1, priority: -1 });
bannerSchema.index({ startDate: 1, endDate: 1 });
bannerSchema.index({ createdBy: 1 });

// ==================== VIRTUALS ====================
// CTR Calculate karo
bannerSchema.virtual('ctr').get(function() {
    if (this.views === 0) return 0;
    return ((this.clicks / this.views) * 100).toFixed(2);
});

// Check if banner is currently active
bannerSchema.virtual('isCurrentlyActive').get(function() {
    const now = new Date();
    const isStarted = !this.startDate || this.startDate <= now;
    const notExpired = !this.endDate || this.endDate >= now;
    return this.isActive && this.status === 'approved' && isStarted && notExpired;
});

// ==================== METHODS ====================
// Increment views
bannerSchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

// Increment clicks
bannerSchema.methods.incrementClicks = function() {
    this.clicks += 1;
    return this.save();
};

// ==================== STATICS ====================
// Get active banners for specific placement
bannerSchema.statics.getActiveBanners = async function(filters = {}) {
    const now = new Date();
    const query = {
        status: 'approved',
        isActive: true,
        $or: [
            { startDate: null },
            { startDate: { $lte: now } }
        ],
        $or: [
            { endDate: null },
            { endDate: { $gte: now } }
        ],
        ...filters
    };
    
    return await this.find(query)
        .sort({ priority: -1, createdAt: -1 })
        .populate('moduleId', 'name icon')
        .populate('shopId', 'shopName icon')
        .populate('createdBy', 'name');
};

// ==================== PRE SAVE ====================
bannerSchema.pre('save', function(next) {
    // Agar endDate past me hai to expired kar do
    if (this.endDate && this.endDate < new Date() && this.status === 'approved') {
        this.status = 'expired';
    }
    next();
});

module.exports = mongoose.models.Banner || mongoose.model('Banner', bannerSchema);
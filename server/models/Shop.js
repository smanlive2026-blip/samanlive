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
    area: { type: String, default: '' },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }
    },
    serviceType: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    banner: { type: String, default: '' },
    logo: { type: String, default: '' },

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
    rejectionReason: { type: String, default: '' }, // ← Naya add kiya

    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalOrders: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for fast queries
shopSchema.index({ location: '2dsphere' });
shopSchema.index({ status: 1 });
shopSchema.index({ area: 1 });
shopSchema.index({ bannerApproved: 1 });
shopSchema.index({ serviceType: 1 }); // ← Naya add kiya
shopSchema.index({ phone: 1 }); // ← Naya add kiya
shopSchema.index({ managerId: 1 }); // ← Naya add kiya
shopSchema.index({ createdAt: -1 }); // ← Naya add kiya - latest first

// Virtual for full address
shopSchema.virtual('fullAddress').get(function() {
    const addr = this.address;
    return `${addr.line1}, ${addr.city}, ${addr.state} - ${addr.pincode}`.trim();
});

module.exports = mongoose.models.Shop || mongoose.model('Shop', shopSchema);
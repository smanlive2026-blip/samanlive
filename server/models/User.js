const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    line1: {
        type: String,
        required: true,
        trim: true
    },
    line2: {
        type: String,
        default: '',
        trim: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    pincode: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: [0, 0]
        }
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    label: {
        type: String,
        enum: ['Home', 'Work', 'Other'],
        default: 'Home'
    }
}, { timestamps: true });

const paymentSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['upi', 'bank', 'card', 'cod'],
        required: true
    },
    // UPI
    upiId: {
        type: String,
        trim: true
    },
    // Bank
    bankName: {
        type: String,
        trim: true
    },
    accountLast4: {
        type: String,
        trim: true
    },
    ifsc: {
        type: String,
        trim: true,
        uppercase: true
    },
    // Card - PCI COMPLIANT - Only last 4
    cardLast4: {
        type: String,
        trim: true
    },
    cardType: {
        type: String,
        enum: ['Visa', 'Mastercard', 'RuPay', 'Amex', ''],
        trim: true
    },
    expiryMonth: {
        type: String,
        trim: true
    },
    expiryYear: {
        type: String,
        trim: true
    },
    cardHolderName: {
        type: String,
        trim: true
    },
    // Common
    displayName: {
        type: String,
        trim: true
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const notificationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['order', 'shop', 'offer', 'system', 'payment', 'delivery'],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    actionUrl: {
        type: String,
        default: '',
        trim: true
    },
    icon: {
        type: String,
        default: '🔔'
    },
    read: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
    // Basic Info
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    password: {
        type: String,
        required: true,
        select: false // By default password nahi aayega queries me
    },
    avatar: {
        type: String,
        default: ''
    },

    // Status
    status: {
        type: String,
        enum: ['active', 'blocked', 'deleted'],
        default: 'active'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    otp: {
        code: String,
        expiresAt: Date
    },

    // Location
    currentLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: [0, 0]
        }
    },
    city: {
        type: String,
        trim: true,
        index: true
    },
    area: {
        type: String,
        trim: true
    },

    // User Data
    addresses: [addressSchema],
    payments: [paymentSchema],
    notifications: [notificationSchema],
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    cart: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        quantity: {
            type: Number,
            default: 1,
            min: 1
        },
        variant: {
            type: String,
            default: ''
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Preferences
    preferences: {
        notifications: {
            order: { type: Boolean, default: true },
            offer: { type: Boolean, default: true },
            system: { type: Boolean, default: true }
        },
        language: {
            type: String,
            default: 'en'
        }
    },

    // Analytics
    lastLogin: {
        type: Date,
        default: null
    },
    loginCount: {
        type: Number,
        default: 0
    },
    totalOrders: {
        type: Number,
        default: 0
    },
    totalSpent: {
        type: Number,
        default: 0
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ==================== INDEXES ====================
userSchema.index({ 'currentLocation': '2dsphere' });
userSchema.index({ 'addresses.location': '2dsphere' });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

// ==================== VIRTUALS ====================
// Full name
userSchema.virtual('fullName').get(function() {
    return this.name;
});

// Default address
userSchema.virtual('defaultAddress').get(function() {
    return this.addresses.find(addr => addr.isDefault) || null;
});

// Default payment
userSchema.virtual('defaultPayment').get(function() {
    return this.payments.find(p => p.isDefault) || null;
});

// Unread notifications count
userSchema.virtual('unreadNotifications').get(function() {
    return this.notifications.filter(n =>!n.read).length;
});

// Wishlist count
userSchema.virtual('wishlistCount').get(function() {
    return this.wishlist.length;
});

// Cart count
userSchema.virtual('cartCount').get(function() {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
});

// ==================== METHODS ====================
// Check if user has address
userSchema.methods.hasAddress = function() {
    return this.addresses.length > 0;
};

// Get default address
userSchema.methods.getDefaultAddress = function() {
    return this.addresses.find(addr => addr.isDefault) || this.addresses[0] || null;
};

// Add to wishlist
userSchema.methods.addToWishlist = function(productId) {
    if (!this.wishlist.includes(productId)) {
        this.wishlist.push(productId);
    }
    return this.save();
};

// Remove from wishlist
userSchema.methods.removeFromWishlist = function(productId) {
    this.wishlist = this.wishlist.filter(id => id.toString()!== productId.toString());
    return this.save();
};

// ==================== PRE SAVE ====================
userSchema.pre('save', function(next) {
    // Ensure only one default address
    if (this.addresses && this.addresses.length > 0) {
        const defaultAddresses = this.addresses.filter(addr => addr.isDefault);
        if (defaultAddresses.length > 1) {
            this.addresses.forEach((addr, idx) => {
                addr.isDefault = idx === 0;
            });
        }
        // If no default, make first one default
        if (defaultAddresses.length === 0) {
            this.addresses[0].isDefault = true;
        }
    }

    // Ensure only one default payment
    if (this.payments && this.payments.length > 0) {
        const defaultPayments = this.payments.filter(p => p.isDefault);
        if (defaultPayments.length > 1) {
            this.payments.forEach((p, idx) => {
                p.isDefault = idx === 0;
            });
        }
        if (defaultPayments.length === 0) {
            this.payments[0].isDefault = true;
        }
    }

    next();
});

// ✅ FIXED: Bas ye 2 line change ki hai - purane wala cache pattern hata diya
const User = mongoose.model('User', userSchema);
module.exports = User;
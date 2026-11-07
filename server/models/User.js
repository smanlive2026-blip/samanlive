// LOCATION: server/models/User.js - USER MODEL - V27 FINAL - CUSTOMER + SHOP_OWNER
// CHANGE V27: 1) email required NAHI + unique NAHI (sparse) - family me 1 email 4 log use kar sakte hai, bina email ke bhi account banega 2) password required NAHI - OTP wale ka account bhi banega 3) phone hamesha aakhri 10 digit (setter se) - +91 / 0 kat jayega 4) email khali ho toh undefined jayega, '' nahi - warna khali email wale 100 log E11000 de denge 5) gender hamesha chhota - Male -> male
// FLOW: Customer / Shop Owner dashboard -> UnifiedProfile (common/profile/profile-core.js) -> /api/common/profile/upload-avatar -> Cloudinary -> User.photo / avatar / profilePic me URL
// RULE: Customer ki pehchan = PHONE (aakhri 10 digit). Email kabhi pehchan nahi hai.

const mongoose = require('mongoose');

// V27: Phone normalize - +91 8384800729 -> 8384800729
function normPhoneSetter(v) {
    if (v === undefined || v === null) return v;
    const d = String(v).replace(/\D/g, '');
    if (!d) return v;
    return d.length > 10 ? d.slice(-10) : d;
}
// V27: Email khali ho toh undefined bhejo - '' bheja toh sparse index bhi E11000 de dega
function normEmailSetter(v) {
    if (v === undefined || v === null) return undefined;
    const s = String(v).toLowerCase().trim();
    if (!s) return undefined;
    return s;
}
function normGenderSetter(v) {
    if (v === undefined || v === null) return '';
    return String(v).toLowerCase().trim();
}

const addressSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, set: normPhoneSetter },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, default: '', trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }
    },
    isDefault: { type: Boolean, default: false },
    label: { type: String, enum: ['Home', 'Work', 'Other'], default: 'Home' }
}, { timestamps: true });

const paymentSchema = new mongoose.Schema({
    type: { type: String, enum: ['upi', 'bank', 'card', 'cod'], required: true },
    upiId: { type: String, trim: true },
    bankName: { type: String, trim: true },
    accountLast4: { type: String, trim: true },
    ifsc: { type: String, trim: true, uppercase: true },
    cardLast4: { type: String, trim: true },
    cardType: { type: String, enum: ['Visa', 'Mastercard', 'RuPay', 'Amex', ''], trim: true },
    expiryMonth: { type: String, trim: true },
    expiryYear: { type: String, trim: true },
    cardHolderName: { type: String, trim: true },
    displayName: { type: String, trim: true },
    isDefault: { type: Boolean, default: false }
}, { timestamps: true });

const notificationSchema = new mongoose.Schema({
    type: { type: String, enum: ['order', 'shop', 'offer', 'system', 'payment', 'delivery'], required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    actionUrl: { type: String, default: '', trim: true },
    icon: { type: String, default: '🔔' },
    read: { type: Boolean, default: false },
    readAt: { type: Date, default: null }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    // V27: email required NAHI, default undefined - bina email ke bhi account banega. sparse unique - bhara hua email dobara nahi aa sakta, khali email wale 100 log ban sakte hai
    email: { type: String, required: false, default: undefined, lowercase: true, trim: true, set: normEmailSetter },
    // V27: phone hi pehchan hai - unique + setter se hamesha 10 digit
    phone: { type: String, required: true, unique: true, trim: true, set: normPhoneSetter },
    // V27: password required NAHI - OTP se login karne wale ke paas password hota hi nahi
    password: { type: String, required: false, default: '', select: false },

    // ===== PROFILE PHOTO - V27 UNIFIED - CLOUDINARY URL HI AAYEGA, BASE64 NAHI =====
    avatar: { type: String, default: '' },
    profilePic: { type: String, default: '' },
    photo: { type: String, default: '', trim: true }, // ADD - Executive / PM se match karne ke liye - teeno me same URL rahega
    coverPhoto: { type: String, default: '', trim: true }, // ADD - Profile cover / banner ke liye

    // ===== ROLE + SHOP LINK - V23 NEW - Iske bina shop owner ko customer samajhta tha =====
    role: { type: String, enum: ['customer', 'shop_owner', 'delivery_boy', 'admin', 'area-manager'], default: 'customer' },
    shopId: { type: String, default: null }, // Agar shop_owner hai toh uski shop ka Id - profile/me me shop info dikhane ke liye
    shopIds: [{ type: String }], // Ek owner ki multiple shop ho sakti hai

    status: { type: String, enum: ['active', 'blocked', 'deleted'], default: 'active' },
    isVerified: { type: Boolean, default: false },
    otp: { code: String, expiresAt: Date },
    currentLocation: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }
    },
    city: { type: String, trim: true, index: true },
    area: { type: String, trim: true },
    state: { type: String, trim: true, default: '' }, // ADD - address me tha, main me nahi tha
    pincode: { type: String, trim: true, default: '' }, // ADD - profile form me chahiye tha
    gender: { type: String, enum: ['male', 'female', 'other', ''], default: '', set: normGenderSetter }, // ADD - profile form me tha, model me nahi tha
    dob: { type: Date, default: null }, // ADD
    addresses: [addressSchema],
    payments: [paymentSchema],
    notifications: [notificationSchema],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    cart: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, default: 1, min: 1 },
        variant: { type: String, default: '' },
        addedAt: { type: Date, default: Date.now }
    }],
    preferences: {
        notifications: {
            order: { type: Boolean, default: true },
            offer: { type: Boolean, default: true },
            system: { type: Boolean, default: true }
        },
        language: { type: String, default: 'en' }
    },
    wallet: { balance: { type: Number, default: 0 }, totalEarning: { type: Number, default: 0 } }, // ADD - profile/me me wallet maangta tha, field hi nahi tha
    lastLogin: { type: Date, default: null },
    loginCount: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ===== INDEX - V27 FINAL =====
// phone pe unique Mongoose upar wale unique:true se ban jayega, dobara mat likhna
// email pe sparse unique - khali email wale skip honge, bhara hua email dobara nahi aayega
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ phone: 1 });
userSchema.index({ 'currentLocation': '2dsphere' });
userSchema.index({ 'addresses.location': '2dsphere' });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ role: 1 });
userSchema.index({ shopId: 1 });

userSchema.virtual('fullName').get(function() { return this.name; });
userSchema.virtual('defaultAddress').get(function() { return this.addresses.find(addr => addr.isDefault) || null; });
userSchema.virtual('defaultPayment').get(function() { return this.payments.find(p => p.isDefault) || null; });
userSchema.virtual('unreadNotifications').get(function() { return this.notifications.filter(n => !n.read).length; });
userSchema.virtual('wishlistCount').get(function() { return this.wishlist.length; });
userSchema.virtual('cartCount').get(function() { return this.cart.reduce((sum, item) => sum + item.quantity, 0); });

userSchema.methods.hasAddress = function() { return this.addresses.length > 0; };
userSchema.methods.getDefaultAddress = function() { return this.addresses.find(addr => addr.isDefault) || this.addresses[0] || null; };
userSchema.methods.addToWishlist = function(productId) {
    if (!this.wishlist.includes(productId)) this.wishlist.push(productId);
    return this.save();
};
userSchema.methods.removeFromWishlist = function(productId) {
    this.wishlist = this.wishlist.filter(id => id.toString() !== productId.toString());
    return this.save();
};

// ==================== PRE SAVE - FIXED + PHOTO SYNC ====================
// ✅ Async function use kiya, next() hataya - tera purana wala same rakha hai
// ✅ ADD: avatar / profilePic / photo teeno ko sync rakho - kahin se bhi photo aaye, teeno me same URL mile
userSchema.pre('save', async function() {
    // V27: Normalize - setter miss bhi ho jaye toh yahan pakka ho jayega
    if (this.phone) this.phone = normPhoneSetter(this.phone);
    if (this.email) this.email = normEmailSetter(this.email);
    else this.email = undefined; // khali email ko undefined rakho, '' mat rakho - warna sparse bhi E11000 dega
    if (this.gender) this.gender = normGenderSetter(this.gender);
    if (this.dob === '') this.dob = null;

    // Photo sync - teeno field me same Cloudinary URL
    const pic = this.photo || this.profilePic || this.avatar || '';
    if (pic) {
        this.photo = pic;
        this.profilePic = pic;
        this.avatar = pic;
    }

    // Ensure only one default address
    if (this.addresses && this.addresses.length > 0) {
        // V27: Address ka phone bhi normalize karo
        this.addresses.forEach(a => { if (a.phone) a.phone = normPhoneSetter(a.phone); });
        const defaultAddresses = this.addresses.filter(addr => addr.isDefault);
        if (defaultAddresses.length > 1) {
            this.addresses.forEach((addr, idx) => {
                addr.isDefault = idx === 0;
            });
        }
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
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
module.exports = User;
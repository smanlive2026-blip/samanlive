// LOCATION: server/models/Order.js - V13 HIERARCHY + GUEST + WORLD PRODUCTS + WALLET - FINAL
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    productId: { type: String },
    name: String,
    price: Number,
    quantity: { type: Number, default: 1 },
    qty: { type: Number, default: 1 },
    image: String,
    // Hierarchy extra - product ka malik kaun hai
    ownerRole: { type: String, enum: ['shop_owner','area_manager','admin'], default: 'shop_owner' },
    ownerId: { type: String, default: null },
    shopId: { type: String, default: null }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    // ===== OLD FIELDS - BACKWARD COMPATIBILITY KE LIYE RAKHE HAI =====
    userId: { type: String, required: false, index: true, default: null }, // guest ke liye null allow
    userKey: { type: String, index: true, default: null }, // guest key
    shopId: { type: String, required: false, index: true, default: null }, // ab optional kyuki multi-supplier
    shopType: { type: String, default: '' },
    orderId: {
        type: String,
        unique: true,
        index: true,
        default: function() {
            return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2,5).toUpperCase();
        }
    },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    total: { type: Number, default: function(){ return this.totalAmount; } },
    deliveryAddress: {
        name: String,
        phone: String,
        line1: String,
        line2: String,
        city: String,
        state: String,
        pincode: String,
        full: String
    },
    paymentMethod: { type: String, default: 'cod' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    orderStatus: {
        type: String,
        enum: ['placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'new', 'accepted', 'packed'],
        default: 'placed'
    },
    deliveryDate: Date,

    // ===== NEW HIERARCHY FIELDS - YAHI MAIN HAI =====
    buyerId: { type: String, required: true, index: true }, // customerId / shopId / managerId
    buyerRole: { type: String, enum: ['customer','shop_owner','area_manager','admin','guest'], required: true, index: true, default: 'customer' },
    buyerShopId: { type: String, default: null }, // agar buyer shop_owner hai toh uski shop
    buyerAreaId: { type: String, default: null },

    supplierId: { type: String, required: true, index: true }, // jisse kharida
    supplierRole: { type: String, enum: ['shop_owner','area_manager','admin'], required: true, index: true },
    supplierShopId: { type: String, default: null },

    areaId: { type: String, index: true, default: null },
    isBulkOrder: { type: Boolean, default: false }, // true agar buyer shop_owner / area_manager

    // Paisa ka hisab
    commissionAmount: { type: Number, default: 0 }, // 5% admin ko
    supplierEarning: { type: Number, default: 0 }, // total - commission

    addressId: { type: String, default: null },
    paymentMode: { type: String, enum: ['cod','upi','online','wallet','credit'], default: 'cod' },

    gstInvoiceNeeded: { type: Boolean, default: false },
    gstNumber: { type: String, default: null },

    walletDeducted: { type: Boolean, default: false },
    deliveryBoyId: { type: String, default: null },
    trackingId: { type: String, default: null }

}, {
    timestamps: true,
    // taaki purane order jisme naye fields nahi hai woh bhi save ho jaye
    strict: false
});

// Indexes for fast query
orderSchema.index({ supplierId: 1, createdAt: -1 });
orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ shopId: 1, createdAt: -1 });
orderSchema.index({ areaId: 1, createdAt: -1 });

// Auto set supplierEarning & commission before save
orderSchema.pre('save', function(next){
    if(this.totalAmount &&!this.supplierEarning){
        // Agar supplier admin nahi hai toh 5% commission
        if(this.supplierRole && this.supplierRole!== 'admin'){
            this.commissionAmount = Math.round(this.totalAmount * 0.05);
            this.supplierEarning = this.totalAmount - this.commissionAmount;
        } else {
            this.commissionAmount = 0;
            this.supplierEarning = this.totalAmount;
        }
    }
    // Backward compat: total = totalAmount
    if(!this.total) this.total = this.totalAmount;
    // userId fallback = buyerId
    if(!this.userId) this.userId = this.buyerId;
    if(!this.shopId && this.supplierShopId) this.shopId = this.supplierShopId;
    next();
});

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
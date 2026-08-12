/**
 * FILE: server/models/Product.js
 * KAAM: Ek hi Product collection jisme sabhi shop ke product rahenge
 * KYA HO RAHA:
 * 1. shopId + template se pata chalega product kiska hai - fruit, kirana, medical
 * 2. common fields: name, price, stock - sab me same
 * 3. extra: {} - Isme har shop apna alag data daalega. 
 *    Example: fruit: {weight: "1kg"}, kirana: {brand: "Tata"}
 * 4. Isi collection ko Admin, Area Manager, Shop teeno access karenge
 */
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    // === KAUNSA SHOP KA HAI ===
    shopId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Shop', 
        required: true,
        index: true // fast search
    },
    template: { 
        type: String, 
        required: true, 
        index: true, // fruit, kirana, restaurant etc
        trim: true
    },

    // === COMMON PRODUCT FIELDS ===
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, default: 0 }, // strikethrough price
    image: { type: String, default: '/assets/default-product.png' },
    images: [{ type: String }], // gallery
    category: { type: String, default: 'general', index: true },
    
    stock: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true }, // shop ne hide kiya ya nahi

    // === HAR SHOP KE ALAG FIELD YAHI JAYENGE ===
    // fruit: {weight, unit, ripeness}
    // kirana: {brand, unit, expiry}
    // medical: {salt, prescription}
    extra: { 
        type: mongoose.Schema.Types.Mixed, 
        default: {} 
    },

    // === KISNE BANAYA ===
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdByRole: { type: String, enum: ['admin', 'area_manager', 'shop'] }, // tracking

}, { 
    timestamps: true // createdAt, updatedAt auto
});

// SEARCH FAST KARNE KE LIYE
ProductSchema.index({ shopId: 1, template: 1, isActive: 1 });
ProductSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', ProductSchema);
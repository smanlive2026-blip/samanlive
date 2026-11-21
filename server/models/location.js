//  isska location h   server/models/location.js - V2 - COMMON CIRCLE - FULL CODE
// WORLD CLASS SHOP + USER LOCATION MODEL - FULL
// RULE 1: 1 Shop = 1 Circle. 1 Shop ki 1 hi entry rahegi - shopId pe unique hai.
// RULE 2: Shop Create se iska KOI lena-dena NAHI hai. Shop pehle ban jayegi, Location baad me kabhi bhi Profile se set hogi.
// RULE 3: locationType me 'dynamic' bhi hai - Thela / Moving wala bhi save hoga - Pehle sirf ['fixed', 'mobile'] tha, isliye Thela wala Save fail hota tha.
// RULE 4: 'thela' / 'moving' aaye toh khud hi 'dynamic' ban jayega - 'mobile' aaye toh 'mobile' hi rahega - Purana data nahi tootega.
// RULE 5: deliveryRange = Circle ka Radius - 1 KM se 30 KM tak - Shop wala khud chune ga.
// FLOW: shop-location.html -> POST /api/location/shop -> ShopLocation me save -> GET /api/location/shops/nearby -> Circle check -> Customer ko dukaan dikhegi

const mongoose = require('mongoose');

// Thela / Moving / Dynamic - Sab ek hi baat hai - Model me 1 hi naam rahega: 'dynamic'
function normalizeLocationType(v){
  if(!v) return 'fixed';
  var t = String(v).toLowerCase().trim();
  if(t === 'dynamic' || t === 'thela' || t === 'moving' || t === 'mobile') return t === 'mobile' ? 'mobile' : 'dynamic';
  if(t === 'fixed' || t === 'shop' || t === 'static') return 'fixed';
  return 'fixed';
}

// Shop Location Schema
const shopLocationSchema = new mongoose.Schema({
    shopId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Shop', 
        required: true, 
        unique: true 
    },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    locationType: { 
        type: String, 
        enum: ['fixed', 'mobile', 'dynamic', 'thela', 'moving'], 
        default: 'fixed',
        set: normalizeLocationType
    },
    deliveryRange: { 
        type: Number, 
        default: 5, // KM me
        min: 1,
        max: 30
    },
    address: { type: String }
}, { timestamps: true });

// User Location Schema
const userLocationSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
        unique: true 
    },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
}, { timestamps: true });

// 2D index for geo queries - nearby shop ke kaam aayega
shopLocationSchema.index({ latitude: 1, longitude: 1 });

module.exports = {
    ShopLocation: mongoose.model('ShopLocation', shopLocationSchema),
    UserLocation: mongoose.model('UserLocation', userLocationSchema)
};
const mongoose = require('mongoose');

const acharItemSchema = new mongoose.Schema({
    id: { type: String, default: () => Date.now().toString() },
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: ['Aam', 'Nimbu', 'Mix', 'Murabba', 'Gajar', 'Lahsun', 'Mirchi', 'Other'], default: 'Aam' },
    description: { type: String, default: '' },
    price500: { type: Number, default: 0 },
    price1kg: { type: Number, required: true, default: 0 },
    price: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    jarType: { type: String, enum: ['Glass', 'Plastic', 'Ceramic'], default: 'Glass' },
    spiceLevel: { type: String, enum: ['Mild', 'Medium', 'Teekha'], default: 'Medium' },
    image: { type: String, default: 'https://placehold.co/400/eab308/fff?text=Achar' },
    img: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
}, { _id: false });

const acharOrderSchema = new mongoose.Schema({
    trackingId: String,
    customerName: String,
    phone: String,
    address: String,
    items: [Object],
    total: Number,
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
}, { _id: false });

const acharSchema = new mongoose.Schema({
    shopId: { type: String, required: true, unique: true, index: true },
    items: [acharItemSchema],
    orders: [acharOrderSchema],

     // YE LOCATION WALE FIELD ADD KAR
    ownerName: { type: String, default: '' },
    fullAddress: { type: String, default: '' },
    shopAddress: { type: String, default: '' },
    locationType: { type: String, enum: ['fixed', 'dynamic'], default: 'fixed' },
    deliveryRange: { type: Number, default: 5 },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], default: [0,0], index: '2dsphere' } // [lng, lat]
    },

    settings: {
        isOpen: { type: Boolean, default: true },
        announcement: { type: String, default: '' },
        bannerPhotoUrl: { type: String, default: '' },
        ownerPhotoUrl: { type: String, default: '' },
        openTime: { type: String, default: '9:00 AM' },
        closeTime: { type: String, default: '9:00 PM' }
    },
    bannerPhotoUrl: { type: String, default: '' },
    ownerPhotoUrl: { type: String, default: '' },
    phone: { type: String, default: '' },
    announcement: { type: String, default: '' },
}, { timestamps: true });

// KOI PRE HOOK NAHI
module.exports = mongoose.model('Achar', acharSchema);
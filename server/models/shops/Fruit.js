const mongoose = require('mongoose');

// 1. FRUIT SUB-SCHEMA
const FruitSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        default: () => new Date().getTime().toString()
    },
    name: { type: String, required: [true, 'Fruit name is required'], trim: true },
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    unit: { type: String, default: 'kg', enum: ['kg', 'g', 'piece', 'dozen', 'box'] },
    stock: { type: Number, default: 0, min: 0 },
    image: { type: String, default: 'https://via.placeholder.com/100?text=Fruit' },
    cloudinaryUrl: { type: String, default: '' },
    expiryDays: { type: Number, default: 7, min: 1 },
    category: { type: String, default: 'other' },
    description: { type: String, default: '' },
    isOrganic: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true }
}, { _id: false });

// 2. SHOP MAIN SCHEMA
const ShopSchema = new mongoose.Schema({
    shopName: { type: String, required: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager' },
    area: { type: String },
    areaCode: { type: String },
    phone: { type: String },
    serviceType: { type: String, default: 'fruit' },
    template: { type: String, default: 'fruit' },

    ownerPhotoUrl: { type: String, default: '' },
    announcement: { type: String, default: '' },
    shopSettings: {
        openTime: { type: String, default: '08:00' },
        closeTime: { type: String, default: '22:00' }
    },
    isOpen: { type: Boolean, default: true },

    items: [FruitSchema], // ✅ fruits yahi store honge

    totalCustomers: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    todaySales: { type: Number, default: 0 },

    status: { type: String, default: 'approved' },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Shop', ShopSchema);
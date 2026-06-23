const mongoose = require('mongoose');
const ShopType = require('../models/ShopType');
require('dotenv').config();

const shopTypes = [
    {
        slug: 'kirana',
        name: 'Kirana/Grocery Store',
        icon: '🛒',
        description: 'Daily needs, grocery items',
        fields: ['weight', 'unit', 'brand', 'mrp', 'expiry']
    },
    {
        slug: 'cloth',
        name: 'Cloth/Garment Shop',
        icon: '👗',
        description: 'Clothing and apparel',
        fields: ['size', 'color', 'fabric', 'category', 'description']
    },
    {
        slug: 'medical',
        name: 'Medical Store',
        icon: '💊',
        description: 'Medicines and healthcare',
        fields: ['company', 'batch', 'expiry', 'type', 'packSize', 'prescription', 'mrp']
    },
    {
        slug: 'restaurant',
        name: 'Restaurant/Cafe',
        icon: '🍕',
        description: 'Food and beverages',
        fields: ['category', 'foodType', 'spiceLevel', 'prepTime', 'description', 'available']
    },
    {
        slug: 'electronics',
        name: 'Electronics Shop',
        icon: '📱',
        description: 'Mobile, gadgets, appliances',
        fields: ['brand', 'model', 'warranty', 'specs']
    },
    {
        slug: 'hardware',
        name: 'Hardware Store',
        icon: '🔧',
        description: 'Tools and hardware items',
        fields: ['brand', 'size', 'material', 'unit']
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
        
        await ShopType.deleteMany({});
        console.log('Old shop types deleted');
        
        await ShopType.insertMany(shopTypes);
        console.log('✅ Shop types seeded successfully');
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

seedDB();
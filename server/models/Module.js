const Module = require('../models/Module');

const defaultModules = [
    { id: 'grocery', name: 'Grocery', icon: '🛒', priority: 1 },
    { id: 'fresh', name: 'Fresh', icon: '🥬', priority: 2 },
    { id: 'food', name: 'Food', icon: '🍕', priority: 3 },
    { id: 'medicine', name: 'Medicine', icon: '💊', priority: 4 },
    { id: 'electronics', name: 'Electronics', icon: '📱', priority: 5 },
    { id: 'fashion', name: 'Fashion', icon: '👕', priority: 6 },
    { id: 'home', name: 'Home', icon: '🏠', priority: 7 },
    { id: 'hardware', name: 'Hardware', icon: '🔧', priority: 8 },
    { id: 'beauty', name: 'Beauty', icon: '💄', priority: 9 },
    { id: 'auto', name: 'Auto', icon: '🚗', priority: 10 },
    { id: 'stationery', name: 'Stationery', icon: '📚', priority: 11 },
    { id: 'service', name: 'Service', icon: '🛠️', priority: 12 },
    { id: 'meat', name: 'Meat', icon: '🥩', priority: 13 },
    { id: 'puja', name: 'Puja', icon: '🪔', priority: 14 },
    { id: 'others', name: 'Others', icon: '📦', priority: 15 }
];

async function seedModules() {
    for (const mod of defaultModules) {
        await Module.findOneAndUpdate(
            { id: mod.id },
            mod,
            { upsert: true, new: true }
        );
    }
    console.log('✅ 15 Modules seeded');
}

module.exports = seedModules;
const Module = require('../models/Module');

const defaultModules = [
    { id: 'grocery', name: 'Grocery', icon: '🛒', priority: 1, isActive: true },
    { id: 'fresh', name: 'Fresh', icon: '🥬', priority: 2, isActive: true },
    { id: 'food', name: 'Food', icon: '🍕', priority: 3, isActive: true },
    { id: 'medicine', name: 'Medicine', icon: '💊', priority: 4, isActive: true },
    { id: 'electronics', name: 'Electronics', icon: '📱', priority: 5, isActive: true },
    { id: 'fashion', name: 'Fashion', icon: '👕', priority: 6, isActive: true },
    { id: 'home', name: 'Home', icon: '🏠', priority: 7, isActive: true },
    { id: 'hardware', name: 'Hardware', icon: '🔧', priority: 8, isActive: true },
    { id: 'beauty', name: 'Beauty', icon: '💄', priority: 9, isActive: true },
    { id: 'auto', name: 'Auto', icon: '🚗', priority: 10, isActive: true },
    { id: 'stationery', name: 'Stationery', icon: '📚', priority: 11, isActive: true },
    { id: 'service', name: 'Service', icon: '🛠️', priority: 12, isActive: true },
    { id: 'meat', name: 'Meat', icon: '🥩', priority: 13, isActive: true },
    { id: 'puja', name: 'Puja', icon: '🪔', priority: 14, isActive: true },
    { id: 'others', name: 'Others', icon: '📦', priority: 15, isActive: true }
];

async function seedModules() {
    try {
        for (const mod of defaultModules) {
            await Module.findOneAndUpdate(
                { id: mod.id },
                { $set: mod },
                { upsert: true, new: true }
            );
        }
        console.log('✅ 15 Modules seeded successfully');
    } catch (err) {
        console.error('❌ Module seeding error:', err.message);
    }
}

module.exports = seedModules;
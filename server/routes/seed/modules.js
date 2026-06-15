const Module = require('../models/Module');
const path = require('path');
const fs = require('fs');

async function seedModules() {
    try {
        // JSON file se 25 modules load kar
        const jsonPath = path.join(__dirname, '../../public/assets/js/module.json');
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        
        const modulesToSeed = jsonData.modules.map(mod => ({
            id: mod.id,
            name: mod.name,
            icon: mod.icon,
            color: mod.color || '#6366f1',
            link: mod.link || `/modules/${mod.id}`,
            desc: mod.desc || '',
            priority: mod.priority || 0,
            status: mod.status === 'active' ? 'active' : 'hidden',
            banner: mod.banner || '',
            areas: mod.areas || [],
            categoryDetails: mod.categoryDetails || []
        }));

        // Upsert karo - agar exist karta hai to update, warna insert
        for (const mod of modulesToSeed) {
            await Module.findOneAndUpdate(
                { id: mod.id },
                { $set: mod },
                { upsert: true, new: true }
            );
        }
        
        console.log(`✅ ${modulesToSeed.length} Modules seeded successfully from JSON`);
    } catch (err) {
        console.error('❌ Module seeding error:', err.message);
    }
}

module.exports = seedModules;
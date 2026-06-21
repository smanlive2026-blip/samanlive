const Module = require('../../models/Module');
const seedData = require('./seed-modules.json'); // Ab seed folder se lega

async function seedModules() {
    try {
        // Purana JSON file ka path hata diya, ab direct require kar rahe
        const modulesToSeed = seedData.map(mod => ({
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

        for (const mod of modulesToSeed) {
            await Module.findOneAndUpdate(
                { id: mod.id },
                { $set: mod },
                { upsert: true, new: true }
            );
        }
        
        console.log(`✅ ${modulesToSeed.length} Modules seeded successfully from seed-modules.json`);
    } catch (err) {
        console.error('❌ Module seeding error:', err.message);
        console.error('Stack:', err.stack);
    }
}

module.exports = seedModules;
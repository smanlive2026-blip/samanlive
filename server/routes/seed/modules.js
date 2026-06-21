const Module = require('../../models/Module');
const seedData = require('./seed-modules.json'); // ✅ CHANGE 1: Path badla

async function seedModules() {
    try {
        console.log('🔄 Starting module seeding from seed-modules.json...'); // ✅ CHANGE 2: Log message
        
        // seed-modules.json me "modules" key ke andar array hai
        const modulesArray = seedData.modules || seedData;
        
        if (!Array.isArray(modulesArray)) {
            throw new Error('seed-modules.json me "modules" array nahi mila'); // ✅ CHANGE 3: Error msg
        }

        const modulesToSeed = modulesArray.map(mod => ({
            id: mod.id,
            name: mod.name,
            icon: mod.icon,
            color: mod.color || '#6366f1',
            link: mod.link || `/modules/${mod.id}`,
            desc: mod.desc || '',
            priority: mod.priority || 0,
            status: mod.status === true ? 'active' : 'hidden',
            banner: mod.banner || '',
            areas: mod.areas || [],
            categoryDetails: mod.categoryDetails || []
        }));

        // Purane 54 modules clear kar do
        await Module.deleteMany({});
        console.log('🗑️ Old modules cleared');

        // Naye modules insert kar - _id MongoDB khud banayega
        await Module.insertMany(modulesToSeed);
        
        console.log(`✅ ${modulesToSeed.length} Modules seeded successfully from seed-modules.json`); // ✅ CHANGE 4
        return { success: true, count: modulesToSeed.length };
    } catch (err) {
        console.error('❌ Module seeding error:', err.message);
        console.error('Stack:', err.stack);
        throw err;
    }
}

module.exports = seedModules;
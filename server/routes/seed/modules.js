const Module = require('../../models/Module');
const seedData = require('../../database/modules.json'); // Tere modules.json ka path

async function seedModules() {
    try {
        console.log('🔄 Starting module seeding...');
        
        // modules.json me "modules" key ke andar array hai
        const modulesArray = seedData.modules || seedData;
        
        if (!Array.isArray(modulesArray)) {
            throw new Error('modules.json me "modules" array nahi mila');
        }

        const modulesToSeed = modulesArray.map(mod => ({
            // _id: mod.id, ❌ YE LINE HATA DI - BSONError ka reason
            id: mod.id,
            name: mod.name,
            icon: mod.icon,
            color: mod.color || '#6366f1',
            link: mod.link || `/modules/${mod.id}`,
            desc: mod.desc || '',
            priority: mod.priority || 0,
            status: mod.status === true ? 'active' : 'hidden', // true/false ko active/hidden me convert
            banner: mod.banner || '',
            areas: mod.areas || [],
            categoryDetails: mod.categoryDetails || [] // Existing categories preserve hongi
        }));

        // Purane modules clear kar do
        await Module.deleteMany({});
        console.log('🗑️ Old modules cleared');

        // Naye modules insert kar - _id MongoDB khud banayega
        await Module.insertMany(modulesToSeed);
        
        console.log(`✅ ${modulesToSeed.length} Modules seeded successfully from modules.json`);
        return { success: true, count: modulesToSeed.length };
    } catch (err) {
        console.error('❌ Module seeding error:', err.message);
        console.error('Stack:', err.stack);
        throw err;
    }
}

module.exports = seedModules;
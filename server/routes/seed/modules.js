const Module = require('../../models/Module');
const seedData = require('../../database/modules.json'); // Tere modules.json ka path

async function seedModules() {
    try {
        // modules.json me "modules" key ke andar array hai
        const modulesArray = seedData.modules || seedData;
        
        if (!Array.isArray(modulesArray)) {
            throw new Error('modules.json me "modules" array nahi mila');
        }

        const modulesToSeed = modulesArray.map(mod => ({
            _id: mod.id, // MongoDB ke liye _id set karo
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

        for (const mod of modulesToSeed) {
            await Module.findOneAndUpdate(
                { _id: mod._id },
                { $set: mod },
                { upsert: true, new: true }
            );
        }
        
        console.log(`✅ ${modulesToSeed.length} Modules seeded successfully from modules.json`);
        return { success: true, count: modulesToSeed.length };
    } catch (err) {
        console.error('❌ Module seeding error:', err.message);
        console.error('Stack:', err.stack);
        throw err;
    }
}

module.exports = seedModules;
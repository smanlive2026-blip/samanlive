const Module = require('../../models/Module');
const path = require('path');
const fs = require('fs');

async function seedModules() {
    try {
        // FIXED: process.cwd() use kiya - Render + Local dono pe chalega
        const jsonPath = path.join(process.cwd(), 'public/assets/js/modules.json');
        
        // File exist check - debugging ke liye
        if (!fs.existsSync(jsonPath)) {
            console.error('❌ modules.json not found at:', jsonPath);
            console.error('Current working directory:', process.cwd());
            return;
        }
        
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
        console.error('Stack:', err.stack);
    }
}

module.exports = seedModules;
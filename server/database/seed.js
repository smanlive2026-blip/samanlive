const mongoose = require('mongoose');
const Module = require('../models/Module');
const Category = require('../models/Category');
const seedData = require('./modules.json');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('DB Connected');
  
  try {
    // 1. Modules Seed
    await Module.deleteMany({});
    const modulesArray = seedData.modules || [];
    
    const modulesToInsert = modulesArray.map(mod => ({
      id: mod.id, // String id hi use karna hai, _id nahi
      name: mod.name,
      icon: mod.icon,
      color: mod.color || '#6366f1',
      link: mod.link || `/modules/${mod.id}`,
      desc: mod.desc || '',
      priority: mod.priority || 0,
      status: mod.status === true ? 'active' : 'hidden', // true/false → active/hidden
      banner: mod.banner || '',
      areas: mod.areas || [],
      categoryDetails: mod.categoryDetails || []
    }));
    
    await Module.insertMany(modulesToInsert);
    console.log(`✅ ${modulesToInsert.length} Modules seeded successfully`);

    // 2. Categories Seed - marketCategories se
    await Category.deleteMany({});
    const categoriesArray = seedData.marketCategories || [];
    
    if (categoriesArray.length > 0) {
      const catsToInsert = categoriesArray.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        group: cat.group || 'General',
        desc: cat.desc || '',
        status: cat.status !== false ? 'active' : 'hidden',
        area: cat.area || []
      }));
      
      await Category.insertMany(catsToInsert);
      console.log(`✅ ${catsToInsert.length} Categories seeded successfully`);
    }

    console.log('🎉 Seeding Complete!');
    process.exit(0);
    
  } catch (err) {
    console.error('❌ Seeding Error:', err.message);
    console.error(err);
    process.exit(1);
  }
  
}).catch(err => {
  console.error('❌ DB Connection Error:', err);
  process.exit(1);
});
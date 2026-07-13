const mongoose = require('mongoose');
const TemplateProduct = require('../models/TemplateProduct');
require('dotenv').config();

const nurseryProducts = [
    // FLOWERING PLANTS - 20
    { shopType: 'nursery', category: 'Flowering', name: 'Rose Plant', description: 'Red Rose Hybrid', defaultUnit: 'piece', tags: ['rose', 'flower'] },
    { shopType: 'nursery', category: 'Flowering', name: 'Marigold', description: 'Genda Plant', defaultUnit: 'piece', tags: ['marigold'] },
    { shopType: 'nursery', category: 'Flowering', name: 'Hibiscus', description: 'Gudhal Red', defaultUnit: 'piece', tags: ['hibiscus'] },
    { shopType: 'nursery', category: 'Flowering', name: 'Jasmine', description: 'Chameli Plant', defaultUnit: 'piece', tags: ['jasmine'] },
    { shopType: 'nursery', category: 'Flowering', name: 'Bougainvillea', description: 'Paper Flower', defaultUnit: 'piece', tags: ['bougainvillea'] },
    { shopType: 'nursery', category: 'Flowering', name: 'Petunia', description: 'Colorful Petunia', defaultUnit: 'piece', tags: ['petunia'] },
    { shopType: 'nursery', category: 'Flowering', name: 'Geranium', description: 'Geranium Plant', defaultUnit: 'piece', tags: ['geranium'] },
    { shopType: 'nursery', category: 'Flowering', name: 'Sunflower', description: 'Dwarf Sunflower', defaultUnit: 'piece', tags: ['sunflower'] },
    { shopType: 'nursery', category: 'Flowering', name: 'Zinnia', description: 'Zinnia Flower', defaultUnit: 'piece', tags: ['zinnia'] },
    { shopType: 'nursery', category: 'Flowering', name: 'Dahlia', description: 'Dahlia Bulb', defaultUnit: 'piece', tags: ['dahlia'] },
    { shopType: 'nursery', category: 'Flowering', name: 'Lily', description: 'Asian Lily', defaultUnit: 'piece', tags: ['lily'] },
    { shopType: 'nursery', category: 'Flowering', name: 'Orchid', description: 'Phalaenopsis Orchid', defaultUnit: 'piece', tags: ['orchid'] },
    { shopType: 'nursery', category: 'Flowering', name: 'Chrysanthemum', description: 'Guldaudi', defaultUnit: 'piece', tags: ['chrysanthemum'] },
    { shopType: 'nursery', category: 'Flowering', name: 'Vinca', description: 'Sadabahar', defaultUnit: 'piece', tags: ['vinca'] },
    { shopType: 'nursery', category: 'Flowering', name: 'Calendula', description: 'Pot Marigold', defaultUnit: 'piece', tags: ['calendula'] },
    { shopType: 'nursery', category: 'Flowering', name: 'Aster', description: 'Aster Plant', defaultUnit: 'piece', tags: ['aster'] },
    { shopType: 'nursery', category: 'Flowering', name: 'Salvia', description: 'Salvia Red', defaultUnit: 'piece', tags: ['salvia'] },
    { shopType: 'nursery', category: 'Flowering', name: 'Dianthus', description: 'Carnation', defaultUnit: 'piece', tags: ['dianthus'] },
    { shopType: 'nursery', category: 'Flowering', name: 'Snapdragon', description: 'Antirrhinum', defaultUnit: 'piece', tags: ['snapdragon'] },
    { shopType: 'nursery', category: 'Flowering', name: 'Pansy', description: 'Pansy Flower', defaultUnit: 'piece', tags: ['pansy'] },

    // FRUIT PLANTS - 15
    { shopType: 'nursery', category: 'Fruit', name: 'Mango Plant', description: 'Dasheri Mango', defaultUnit: 'piece', tags: ['mango'] },
    { shopType: 'nursery', category: 'Fruit', name: 'Guava Plant', description: 'L-49 Guava', defaultUnit: 'piece', tags: ['guava'] },
    { shopType: 'nursery', category: 'Fruit', name: 'Lemon Plant', description: 'Kagzi Lemon', defaultUnit: 'piece', tags: ['lemon'] },
    { shopType: 'nursery', category: 'Fruit', name: 'Pomegranate', description: 'Anar Plant', defaultUnit: 'piece', tags: ['pomegranate'] },
    { shopType: 'nursery', category: 'Fruit', name: 'Papaya', description: 'Red Lady Papaya', defaultUnit: 'piece', tags: ['papaya'] },
    { shopType: 'nursery', category: 'Fruit', name: 'Banana Plant', description: 'Dwarf Banana', defaultUnit: 'piece', tags: ['banana'] },
    { shopType: 'nursery', category: 'Fruit', name: 'Apple Plant', description: 'Apple Sapling', defaultUnit: 'piece', tags: ['apple'] },
    { shopType: 'nursery', category: 'Fruit', name: 'Orange Plant', description: 'Nagpur Orange', defaultUnit: 'piece', tags: ['orange'] },
    { shopType: 'nursery', category: 'Fruit', name: 'Grapes Vine', description: 'Thompson Grapes', defaultUnit: 'piece', tags: ['grapes'] },
    { shopType: 'nursery', category: 'Fruit', name: 'Chikoo', description: 'Chikoo Plant', defaultUnit: 'piece', tags: ['chikoo'] },
    { shopType: 'nursery', category: 'Fruit', name: 'Amla', description: 'Amla Plant', defaultUnit: 'piece', tags: ['amla'] },
    { shopType: 'nursery', category: 'Fruit', name: 'Jamun', description: 'Jamun Plant', defaultUnit: 'piece', tags: ['jamun'] },
    { shopType: 'nursery', category: 'Fruit', name: 'Fig', description: 'Anjeer Plant', defaultUnit: 'piece', tags: ['fig'] },
    { shopType: 'nursery', category: 'Fruit', name: 'Dragon Fruit', description: 'Dragon Fruit Cactus', defaultUnit: 'piece', tags: ['dragon'] },
    { shopType: 'nursery', category: 'Fruit', name: 'Strawberry', description: 'Strawberry Plant', defaultUnit: 'piece', tags: ['strawberry'] },

    // VEGETABLE SEEDLINGS - 10
    { shopType: 'nursery', category: 'Vegetable', name: 'Tomato Seedling', description: 'Hybrid Tomato 10pc', defaultUnit: 'tray', tags: ['tomato'] },
    { shopType: 'nursery', category: 'Vegetable', name: 'Chilli Seedling', description: 'Green Chilli 10pc', defaultUnit: 'tray', tags: ['chilli'] },
    { shopType: 'nursery', category: 'Vegetable', name: 'Brinjal Seedling', description: 'Brinjal 10pc', defaultUnit: 'tray', tags: ['brinjal'] },
    { shopType: 'nursery', category: 'Vegetable', name: 'Cabbage Seedling', description: 'Cabbage 10pc', defaultUnit: 'tray', tags: ['cabbage'] },
    { shopType: 'nursery', category: 'Vegetable', name: 'Cauliflower Seedling', description: 'Cauliflower 10pc', defaultUnit: 'tray', tags: ['cauliflower'] },
    { shopType: 'nursery', category: 'Vegetable', name: 'Capsicum Seedling', description: 'Shimla Mirch 10pc', defaultUnit: 'tray', tags: ['capsicum'] },
    { shopType: 'nursery', category: 'Vegetable', name: 'Cucumber Seedling', description: 'Cucumber 10pc', defaultUnit: 'tray', tags: ['cucumber'] },
    { shopType: 'nursery', category: 'Vegetable', name: 'Bitter Gourd', description: 'Karela 10pc', defaultUnit: 'tray', tags: ['karela'] },
    { shopType: 'nursery', category: 'Vegetable', name: 'Bottle Gourd', description: 'Lauki 10pc', defaultUnit: 'tray', tags: ['lauki'] },
    { shopType: 'nursery', category: 'Vegetable', name: 'Okra Seedling', description: 'Bhindi 10pc', defaultUnit: 'tray', tags: ['bhindi'] },

    // INDOOR PLANTS - 15
    { shopType: 'nursery', category: 'Indoor', name: 'Money Plant', description: 'Pothos Green', defaultUnit: 'piece', tags: ['money plant'] },
    { shopType: 'nursery', category: 'Indoor', name: 'Snake Plant', description: 'Sansevieria', defaultUnit: 'piece', tags: ['snake plant'] },
    { shopType: 'nursery', category: 'Indoor', name: 'Spider Plant', description: 'Spider Plant', defaultUnit: 'piece', tags: ['spider'] },
    { shopType: 'nursery', category: 'Indoor', name: 'Areca Palm', description: 'Butterfly Palm', defaultUnit: 'piece', tags: ['palm'] },
    { shopType: 'nursery', category: 'Indoor', name: 'Rubber Plant', description: 'Ficus Elastica', defaultUnit: 'piece', tags: ['rubber'] },
    { shopType: 'nursery', category: 'Indoor', name: 'Peace Lily', description: 'Peace Lily', defaultUnit: 'piece', tags: ['lily'] },
    { shopType: 'nursery', category: 'Indoor', name: 'Bamboo Plant', description: 'Lucky Bamboo', defaultUnit: 'piece', tags: ['bamboo'] },
    { shopType: 'nursery', category: 'Indoor', name: 'Aloe Vera', description: 'Aloe Vera Plant', defaultUnit: 'piece', tags: ['aloe'] },
    { shopType: 'nursery', category: 'Indoor', name: 'Ficus', description: 'Ficus Benjamina', defaultUnit: 'piece', tags: ['ficus'] },
    { shopType: 'nursery', category: 'Indoor', name: 'ZZ Plant', description: 'Zamioculcas', defaultUnit: 'piece', tags: ['zz'] },
    { shopType: 'nursery', category: 'Indoor', name: 'Fern', description: 'Boston Fern', defaultUnit: 'piece', tags: ['fern'] },
    { shopType: 'nursery', category: 'Indoor', name: 'Philodendron', description: 'Philodendron', defaultUnit: 'piece', tags: ['philodendron'] },
    { shopType: 'nursery', category: 'Indoor', name: 'Monstera', description: 'Monstera Deliciosa', defaultUnit: 'piece', tags: ['monstera'] },
    { shopType: 'nursery', category: 'Indoor', name: 'Aglaonema', description: 'Chinese Evergreen', defaultUnit: 'piece', tags: ['aglaonema'] },
    { shopType: 'nursery', category: 'Indoor', name: 'Dieffenbachia', description: 'Dumb Cane', defaultUnit: 'piece', tags: ['dieffenbachia'] },

    // HERBS & MEDICINAL - 10
    { shopType: 'nursery', category: 'Herb', name: 'Tulsi Plant', description: 'Holy Basil', defaultUnit: 'piece', tags: ['tulsi'] },
    { shopType: 'nursery', category: 'Herb', name: 'Mint', description: 'Pudina Plant', defaultUnit: 'piece', tags: ['mint'] },
    { shopType: 'nursery', category: 'Herb', name: 'Coriander', description: 'Dhaniya Plant', defaultUnit: 'piece', tags: ['coriander'] },
    { shopType: 'nursery', category: 'Herb', name: 'Curry Leaves', description: 'Curry Patta', defaultUnit: 'piece', tags: ['curry'] },
    { shopType: 'nursery', category: 'Herb', name: 'Basil', description: 'Sweet Basil', defaultUnit: 'piece', tags: ['basil'] },
    { shopType: 'nursery', category: 'Herb', name: 'Rosemary', description: 'Rosemary Plant', defaultUnit: 'piece', tags: ['rosemary'] },
    { shopType: 'nursery', category: 'Herb', name: 'Lemongrass', description: 'Lemongrass', defaultUnit: 'piece', tags: ['lemongrass'] },
    { shopType: 'nursery', category: 'Herb', name: 'Oregano', description: 'Oregano Plant', defaultUnit: 'piece', tags: ['oregano'] },
    { shopType: 'nursery', category: 'Herb', name: 'Neem Plant', description: 'Neem Sapling', defaultUnit: 'piece', tags: ['neem'] },
    { shopType: 'nursery', category: 'Herb', name: 'Ashwagandha', description: 'Ashwagandha Plant', defaultUnit: 'piece', tags: ['ashwagandha'] },

    // POTS & ACCESSORIES - 15
    { shopType: 'nursery', category: 'Pot', name: 'Plastic Pot 8 inch', description: 'Black Plastic Pot', defaultUnit: 'piece', tags: ['pot'] },
    { shopType: 'nursery', category: 'Pot', name: 'Ceramic Pot', description: 'Decorative Ceramic', defaultUnit: 'piece', tags: ['ceramic'] },
    { shopType: 'nursery', category: 'Pot', name: 'Terracotta Pot', description: 'Clay Pot 10 inch', defaultUnit: 'piece', tags: ['terracotta'] },
    { shopType: 'nursery', category: 'Pot', name: 'Hanging Basket', description: 'Coconut Coir Basket', defaultUnit: 'piece', tags: ['basket'] },
    { shopType: 'nursery', category: 'Pot', name: 'Grow Bag', description: '15x15 inch Grow Bag', defaultUnit: 'piece', tags: ['growbag'] },
    { shopType: 'nursery', category: 'Soil', name: 'Garden Soil', description: '50kg Bag', defaultUnit: 'bag', tags: ['soil'] },
    { shopType: 'nursery', category: 'Soil', name: 'Vermicompost', description: 'Organic 10kg', defaultUnit: 'bag', tags: ['vermicompost'] },
    { shopType: 'nursery', category: 'Soil', name: 'Cocopeat', description: '5kg Block', defaultUnit: 'block', tags: ['cocopeat'] },
    { shopType: 'nursery', category: 'Soil', name: 'Perlite', description: '1kg Pack', defaultUnit: 'packet', tags: ['perlite'] },
    { shopType: 'nursery', category: 'Fertilizer', name: 'NPK 19:19:19', description: 'Water Soluble 1kg', defaultUnit: 'kg', tags: ['npk'] },
    { shopType: 'nursery', category: 'Fertilizer', name: 'Seaweed Extract', description: 'Liquid 1L', defaultUnit: 'litre', tags: ['seaweed'] },
    { shopType: 'nursery', category: 'Tool', name: 'Watering Can', description: '5L Can', defaultUnit: 'piece', tags: ['can'] },
    { shopType: 'nursery', category: 'Tool', name: 'Garden Trowel', description: 'Hand Trowel', defaultUnit: 'piece', tags: ['trowel'] },
    { shopType: 'nursery', category: 'Tool', name: 'Pruning Shear', description: 'Secateur', defaultUnit: 'piece', tags: ['shear'] },
    { shopType: 'nursery', category: 'Tool', name: 'Sprayer 2L', description: 'Pressure Sprayer', defaultUnit: 'piece', tags: ['sprayer'] },

    // DECORATIVE & OTHER - 15
    { shopType: 'nursery', category: 'Decorative', name: 'Bonsai Plant', description: 'Ficus Bonsai', defaultUnit: 'piece', tags: ['bonsai'] },
    { shopType: 'nursery', category: 'Decorative', name: 'Cactus', description: 'Assorted Cactus', defaultUnit: 'piece', tags: ['cactus'] },
    { shopType: 'nursery', category: 'Decorative', name: 'Succulent', description: 'Echeveria', defaultUnit: 'piece', tags: ['succulent'] },
    { shopType: 'nursery', category: 'Decorative', name: 'Terrarium Kit', description: 'Glass Terrarium', defaultUnit: 'kit', tags: ['terrarium'] },
    { shopType: 'nursery', category: 'Decorative', name: 'Artificial Grass', description: '1x1m Grass Mat', defaultUnit: 'piece', tags: ['grass'] },
    { shopType: 'nursery', category: 'Tree', name: 'Neem Tree', description: 'Neem Sapling', defaultUnit: 'piece', tags: ['tree'] },
    { shopType: 'nursery', category: 'Tree', name: 'Peepal', description: 'Peepal Plant', defaultUnit: 'piece', tags: ['peepal'] },
    { shopType: 'nursery', category: 'Tree', name: 'Banyan', description: 'Banyan Plant', defaultUnit: 'piece', tags: ['banyan'] },
    { shopType: 'nursery', category: 'Tree', name: 'Ashoka', description: 'Ashoka Tree', defaultUnit: 'piece', tags: ['ashoka'] },
    { shopType: 'nursery', category: 'Tree', name: 'Gulmohar', description: 'Gulmohar Plant', defaultUnit: 'piece', tags: ['gulmohar'] },
    { shopType: 'nursery', category: 'Grass', name: 'Lawn Grass', description: 'Mexican Grass 1sqm', defaultUnit: 'sqm', tags: ['lawn'] },
    { shopType: 'nursery', category: 'Grass', name: 'Korean Grass', description: 'Korean Grass 1sqm', defaultUnit: 'sqm', tags: ['korean'] },
    { shopType: 'nursery', category: 'Gift', name: 'Gift Plant', description: 'Gift Pack Plant', defaultUnit: 'set', tags: ['gift'] },
    { shopType: 'nursery', category: 'Gift', name: 'Plant Stand', description: '3 Tier Stand', defaultUnit: 'piece', tags: ['stand'] },
    { shopType: 'nursery', category: 'Gift', name: 'Garden Decor', description: 'Stone Statue', defaultUnit: 'piece', tags: ['decor'] }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        await TemplateProduct.deleteMany({ shopType: 'nursery' });
        await TemplateProduct.insertMany(nurseryProducts);
        console.log(`✅ ${nurseryProducts.length} Nursery Products Added!`);
        process.exit();
    } catch(err) { console.error(err); process.exit(1); }
}
seed();
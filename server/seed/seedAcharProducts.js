const mongoose = require('mongoose');
const TemplateProduct = require('../models/TemplateProduct');
require('dotenv').config();

const acharProducts = [
    // TRADITIONAL ACHAR - 20
    { shopType: 'achar', category: 'Mango', name: 'Aam ka Achar', description: 'Traditional Mango Pickle 500g', defaultUnit: 'jar', tags: ['aam', 'traditional'] },
    { shopType: 'achar', category: 'Mango', name: 'Khatta Meetha Aam Achar', description: 'Sweet & Sour Mango 500g', defaultUnit: 'jar', tags: ['aam', 'sweet'] },
    { shopType: 'achar', category: 'Mango', name: 'Bharwa Lal Mirch Aam', description: 'Stuffed Red Chilli Mango 500g', defaultUnit: 'jar', tags: ['aam', 'mirch'] },
    { shopType: 'achar', category: 'Mango', name: 'Aam ka Murabba', description: 'Sweet Mango Murabba 1kg', defaultUnit: 'jar', tags: ['aam', 'murabba'] },
    { shopType: 'achar', category: 'Mango', name: 'Keri ka Achar', description: 'Raw Mango Pickle 500g', defaultUnit: 'jar', tags: ['keri'] },
    
    { shopType: 'achar', category: 'Mixed', name: 'Mixed Achar', description: 'Mixed Vegetable Pickle 500g', defaultUnit: 'jar', tags: ['mixed'] },
    { shopType: 'achar', category: 'Mixed', name: 'Panchmela Achar', description: '5 Vegetable Mix 500g', defaultUnit: 'jar', tags: ['panchmela'] },
    { shopType: 'achar', category: 'Mixed', name: 'Gajar Gobi Shalgam', description: 'Winter Mix Pickle 500g', defaultUnit: 'jar', tags: ['winter'] },
    
    { shopType: 'achar', category: 'Lemon', name: 'Nimbu ka Achar', description: 'Traditional Lemon Pickle 500g', defaultUnit: 'jar', tags: ['nimbu'] },
    { shopType: 'achar', category: 'Lemon', name: 'Khatta Meetha Nimbu', description: 'Sweet Lemon Pickle 500g', defaultUnit: 'jar', tags: ['nimbu', 'sweet'] },
    { shopType: 'achar', category: 'Lemon', name: 'Nimbu Mirch Achar', description: 'Lemon Chilli Pickle 500g', defaultUnit: 'jar', tags: ['nimbu', 'mirch'] },
    
    { shopType: 'achar', category: 'Chilli', name: 'Lal Mirch ka Achar', description: 'Red Chilli Pickle 250g', defaultUnit: 'jar', tags: ['mirch'] },
    { shopType: 'achar', category: 'Chilli', name: 'Hari Mirch ka Achar', description: 'Green Chilli Pickle 250g', defaultUnit: 'jar', tags: ['hari mirch'] },
    { shopType: 'achar', category: 'Chilli', name: 'Bharwa Mirch', description: 'Stuffed Chilli Pickle 500g', defaultUnit: 'jar', tags: ['bharwa'] },
    
    { shopType: 'achar', category: 'Other', name: 'Lasun ka Achar', description: 'Garlic Pickle 500g', defaultUnit: 'jar', tags: ['lasun'] },
    { shopType: 'achar', category: 'Other', name: 'Adrak ka Achar', description: 'Ginger Pickle 500g', defaultUnit: 'jar', tags: ['adrak'] },
    { shopType: 'achar', category: 'Other', name: 'Gobhi ka Achar', description: 'Cauliflower Pickle 500g', defaultUnit: 'jar', tags: ['gobhi'] },
    { shopType: 'achar', category: 'Other', name: 'Gajar ka Achar', description: 'Carrot Pickle 500g', defaultUnit: 'jar', tags: ['gajar'] },
    { shopType: 'achar', category: 'Other', name: 'Shalgam ka Achar', description: 'Turnip Pickle 500g', defaultUnit: 'jar', tags: ['shalgam'] },
    { shopType: 'achar', category: 'Other', name: 'Karela ka Achar', description: 'Bitter Gourd Pickle 500g', defaultUnit: 'jar', tags: ['karela'] },

    // REGIONAL SPECIAL - 15
    { shopType: 'achar', category: 'Regional', name: 'Rajasthani Ker Sangri', description: 'Ker Sangri Pickle 500g', defaultUnit: 'jar', tags: ['rajasthan'] },
    { shopType: 'achar', category: 'Regional', name: 'Punjabi Aam Achar', description: 'Punjabi Style Mango 1kg', defaultUnit: 'jar', tags: ['punjab'] },
    { shopType: 'achar', category: 'Regional', name: 'Gujarati Chundo', description: 'Sweet Mango Chundo 500g', defaultUnit: 'jar', tags: ['gujarat'] },
    { shopType: 'achar', category: 'Regional', name: 'Bihari Tisi Achar', description: 'Flax Seed Pickle 500g', defaultUnit: 'jar', tags: ['bihar'] },
    { shopType: 'achar', category: 'Regional', name: 'Bengali Mango Achar', description: 'Bengali Sweet Achar 500g', defaultUnit: 'jar', tags: ['bengal'] },
    { shopType: 'achar', category: 'Regional', name: 'South Indian Mango', description: 'Avakkai Mango Pickle 500g', defaultUnit: 'jar', tags: ['south'] },
    { shopType: 'achar', category: 'Regional', name: 'Kashmiri Nadru Achar', description: 'Lotus Stem Pickle 500g', defaultUnit: 'jar', tags: ['kashmir'] },
    { shopType: 'achar', category: 'Regional', name: 'Himachali Apple Achar', description: 'Apple Pickle 500g', defaultUnit: 'jar', tags: ['himachal'] },
    { shopType: 'achar', category: 'Regional', name: 'Maharashtrian Lime', description: 'Maharashtrian Lemon 500g', defaultUnit: 'jar', tags: ['maharashtra'] },
    { shopType: 'achar', category: 'Regional', name: 'UP Style Aam Achar', description: 'UP Mango Pickle 1kg', defaultUnit: 'jar', tags: ['up'] },
    { shopType: 'achar', category: 'Regional', name: 'Rajasthani Mirchi', description: 'Rajasthani Red Chilli 500g', defaultUnit: 'jar', tags: ['rajasthan'] },
    { shopType: 'achar', category: 'Regional', name: 'Gujarati Gunda', description: 'Gunda Berry Pickle 500g', defaultUnit: 'jar', tags: ['gujarat'] },
    { shopType: 'achar', category: 'Regional', name: 'Punjabi Gobhi', description: 'Punjabi Cauliflower 500g', defaultUnit: 'jar', tags: ['punjab'] },
    { shopType: 'achar', category: 'Regional', name: 'Bengali Kamranga', description: 'Star Fruit Pickle 500g', defaultUnit: 'jar', tags: ['bengal'] },
    { shopType: 'achar', category: 'Regional', name: 'Kerala Nellikka', description: 'Amla Pickle 500g', defaultUnit: 'jar', tags: ['kerala'] },

    // CHUTNEY & SAUCE - 15
    { shopType: 'achar', category: 'Chutney', name: 'Imli ki Chutney', description: 'Tamarind Chutney 500g', defaultUnit: 'bottle', tags: ['imli', 'chutney'] },
    { shopType: 'achar', category: 'Chutney', name: 'Pudina Chutney', description: 'Mint Chutney 500g', defaultUnit: 'bottle', tags: ['pudina'] },
    { shopType: 'achar', category: 'Chutney', name: 'Dhaniya Chutney', description: 'Coriander Chutney 500g', defaultUnit: 'bottle', tags: ['dhaniya'] },
    { shopType: 'achar', category: 'Chutney', name: 'Lasun ki Chutney', description: 'Garlic Chutney 500g', defaultUnit: 'bottle', tags: ['lasun'] },
    { shopType: 'achar', category: 'Chutney', name: 'Tomato Chutney', description: 'Tomato Sweet Chutney 500g', defaultUnit: 'bottle', tags: ['tomato'] },
    { shopType: 'achar', category: 'Chutney', name: 'Aam ki Launji', description: 'Raw Mango Launji 500g', defaultUnit: 'jar', tags: ['launji'] },
    { shopType: 'achar', category: 'Chutney', name: 'Khajur Imli Chutney', description: 'Date Tamarind 500g', defaultUnit: 'bottle', tags: ['khajur'] },
    { shopType: 'achar', category: 'Sauce', name: 'Red Chilli Sauce', description: 'Spicy Red Sauce 500ml', defaultUnit: 'bottle', tags: ['sauce'] },
    { shopType: 'achar', category: 'Sauce', name: 'Green Chilli Sauce', description: 'Green Sauce 500ml', defaultUnit: 'bottle', tags: ['sauce'] },
    { shopType: 'achar', category: 'Sauce', name: 'Tomato Ketchup', description: 'Homemade Ketchup 1kg', defaultUnit: 'bottle', tags: ['ketchup'] },
    { shopType: 'achar', category: 'Sauce', name: 'Soya Sauce', description: 'Dark Soya 500ml', defaultUnit: 'bottle', tags: ['soya'] },
    { shopType: 'achar', category: 'Sauce', name: 'Chilli Garlic Sauce', description: 'Garlic Chilli 500ml', defaultUnit: 'bottle', tags: ['garlic'] },
    { shopType: 'achar', category: 'Sauce', name: 'Schezwan Sauce', description: 'Schezwan 500ml', defaultUnit: 'bottle', tags: ['schezwan'] },
    { shopType: 'achar', category: 'Sauce', name: 'Mango Sauce', description: 'Sweet Mango Sauce 500ml', defaultUnit: 'bottle', tags: ['mango'] },
    { shopType: 'achar', category: 'Sauce', name: 'Pineapple Sauce', description: 'Pineapple Sauce 500ml', defaultUnit: 'bottle', tags: ['pineapple'] },

    // MURABBA & CANDY - 10
    { shopType: 'achar', category: 'Murabba', name: 'Amla Murabba', description: 'Gooseberry Murabba 1kg', defaultUnit: 'jar', tags: ['amla'] },
    { shopType: 'achar', category: 'Murabba', name: 'Apple Murabba', description: 'Apple Murabba 1kg', defaultUnit: 'jar', tags: ['apple'] },
    { shopType: 'achar', category: 'Murabba', name: 'Gulab Murabba', description: 'Rose Petal Murabba 500g', defaultUnit: 'jar', tags: ['gulab'] },
    { shopType: 'achar', category: 'Murabba', name: 'Bel Murabba', description: 'Bael Fruit Murabba 1kg', defaultUnit: 'jar', tags: ['bel'] },
    { shopType: 'achar', category: 'Murabba', name: 'Petha', description: 'Sweet Petha 1kg', defaultUnit: 'box', tags: ['petha'] },
    { shopType: 'achar', category: 'Candy', name: 'Aam Papad', description: 'Mango Candy 250g', defaultUnit: 'packet', tags: ['aam papad'] },
    { shopType: 'achar', category: 'Candy', name: 'Imli Candy', description: 'Tamarind Candy 250g', defaultUnit: 'packet', tags: ['imli'] },
    { shopType: 'achar', category: 'Candy', name: 'Hing Candy', description: 'Asafoetida Candy 250g', defaultUnit: 'packet', tags: ['hing'] },
    { shopType: 'achar', category: 'Candy', name: 'Jeera Candy', description: 'Cumin Candy 250g', defaultUnit: 'packet', tags: ['jeera'] },
    { shopType: 'achar', category: 'Candy', name: 'Panchmeva Candy', description: 'Mixed Dry Fruit Candy 250g', defaultUnit: 'packet', tags: ['panchmeva'] },

    // OILS & MASALA - 20
    { shopType: 'achar', category: 'Oil', name: 'Mustard Oil', description: 'Kachi Ghani 1L', defaultUnit: 'litre', tags: ['oil', 'mustard'] },
    { shopType: 'achar', category: 'Oil', name: 'Sesame Oil', description: 'Til Oil 1L', defaultUnit: 'litre', tags: ['oil', 'til'] },
    { shopType: 'achar', category: 'Oil', name: 'Groundnut Oil', description: 'Peanut Oil 1L', defaultUnit: 'litre', tags: ['oil'] },
    { shopType: 'achar', category: 'Masala', name: 'Achar Masala', description: 'Pickle Spice Mix 200g', defaultUnit: 'packet', tags: ['masala'] },
    { shopType: 'achar', category: 'Masala', name: 'Panch Phoran', description: '5 Spice Mix 200g', defaultUnit: 'packet', tags: ['panch'] },
    { shopType: 'achar', category: 'Masala', name: 'Methi Dana', description: 'Fenugreek Seeds 200g', defaultUnit: 'packet', tags: ['methi'] },
    { shopType: 'achar', category: 'Masala', name: 'Rai', description: 'Mustard Seeds 200g', defaultUnit: 'packet', tags: ['rai'] },
    { shopType: 'achar', category: 'Masala', name: 'Kalonji', description: 'Nigella Seeds 100g', defaultUnit: 'packet', tags: ['kalonji'] },
    { shopType: 'achar', category: 'Masala', name: 'Saunf', description: 'Fennel Seeds 200g', defaultUnit: 'packet', tags: ['saunf'] },
    { shopType: 'achar', category: 'Masala', name: 'Hing', description: 'Asafoetida 50g', defaultUnit: 'packet', tags: ['hing'] },
    { shopType: 'achar', category: 'Masala', name: 'Haldi Powder', description: 'Turmeric 200g', defaultUnit: 'packet', tags: ['haldi'] },
    { shopType: 'achar', category: 'Masala', name: 'Lal Mirch Powder', description: 'Red Chilli 200g', defaultUnit: 'packet', tags: ['mirch'] },
    { shopType: 'achar', category: 'Masala', name: 'Dhaniya Powder', description: 'Coriander 200g', defaultUnit: 'packet', tags: ['dhaniya'] },
    { shopType: 'achar', category: 'Masala', name: 'Jeera Powder', description: 'Cumin 200g', defaultUnit: 'packet', tags: ['jeera'] },
    { shopType: 'achar', category: 'Masala', name: 'Garam Masala', description: 'Garam Masala 100g', defaultUnit: 'packet', tags: ['garam'] },
    { shopType: 'achar', category: 'Vinegar', name: 'White Vinegar', description: '500ml', defaultUnit: 'bottle', tags: ['vinegar'] },
    { shopType: 'achar', category: 'Vinegar', name: 'Apple Cider Vinegar', description: '500ml', defaultUnit: 'bottle', tags: ['apple'] },
    { shopType: 'achar', category: 'Salt', name: 'Black Salt', description: 'Kala Namak 200g', defaultUnit: 'packet', tags: ['salt'] },
    { shopType: 'achar', category: 'Salt', name: 'Rock Salt', description: 'Sendha Namak 1kg', defaultUnit: 'packet', tags: ['salt'] },
    { shopType: 'achar', category: 'Sugar', name: 'Jaggery Powder', description: 'Gud Powder 1kg', defaultUnit: 'packet', tags: ['gud'] },

    // PACKAGING & GIFTS - 20
    { shopType: 'achar', category: 'Gift', name: 'Achar Gift Pack', description: '5 Jar Combo Pack', defaultUnit: 'set', tags: ['gift'] },
    { shopType: 'achar', category: 'Gift', name: 'Festival Pack', description: 'Diwali Achar Pack', defaultUnit: 'set', tags: ['festival'] },
    { shopType: 'achar', category: 'Gift', name: 'Marriage Pack', description: 'Wedding Achar Set', defaultUnit: 'set', tags: ['wedding'] },
    { shopType: 'achar', category: 'Jar', name: 'Glass Jar 500ml', description: 'Empty Glass Jar', defaultUnit: 'piece', tags: ['jar'] },
    { shopType: 'achar', category: 'Jar', name: 'Glass Jar 1kg', description: 'Empty Glass Jar', defaultUnit: 'piece', tags: ['jar'] },
    { shopType: 'achar', category: 'Jar', name: 'Plastic Jar 1kg', description: 'Food Grade Jar', defaultUnit: 'piece', tags: ['jar'] },
    { shopType: 'achar', category: 'Jar', name: 'Ceramic Barni', description: 'Traditional Barni', defaultUnit: 'piece', tags: ['barni'] },
    { shopType: 'achar', category: 'Service', name: 'Custom Achar', description: 'Custom Made Pickle', defaultUnit: 'kg', tags: ['custom'] },
    { shopType: 'achar', category: 'Service', name: 'Bulk Order', description: 'Bulk Achar Order', defaultUnit: 'kg', tags: ['bulk'] },
    { shopType: 'achar', category: 'Dry', name: 'Dry Mango Slices', description: 'Sukha Aam 250g', defaultUnit: 'packet', tags: ['dry'] },
    { shopType: 'achar', category: 'Dry', name: 'Dry Chilli', description: 'Sukhi Lal Mirch 250g', defaultUnit: 'packet', tags: ['dry'] },
    { shopType: 'achar', category: 'Dry', name: 'Dry Lemon', description: 'Sukha Nimbu 250g', defaultUnit: 'packet', tags: ['dry'] },
    { shopType: 'achar', category: 'Premium', name: 'Premium Aam Achar', description: 'Premium Quality 500g', defaultUnit: 'jar', tags: ['premium'] },
    { shopType: 'achar', category: 'Premium', name: 'Organic Achar', description: 'Organic Pickle 500g', defaultUnit: 'jar', tags: ['organic'] },
    { shopType: 'achar', category: 'Sugar Free', name: 'Sugar Free Murabba', description: 'No Sugar Murabba 500g', defaultUnit: 'jar', tags: ['sugarfree'] },
    { shopType: 'achar', category: 'Low Salt', name: 'Low Salt Achar', description: 'Low Sodium Pickle 500g', defaultUnit: 'jar', tags: ['low salt'] },
    { shopType: 'achar', category: 'Export', name: 'Export Quality Achar', description: 'Export Grade 500g', defaultUnit: 'jar', tags: ['export'] },
    { shopType: 'achar', category: 'Diet', name: 'Diabetic Murabba', description: 'Sugar Free Murabba', defaultUnit: 'jar', tags: ['diabetic'] },
    { shopType: 'achar', category: 'Kids', name: 'Kids Friendly Achar', description: 'Mild Spice Pickle 500g', defaultUnit: 'jar', tags: ['kids'] },
    { shopType: 'achar', category: 'Spicy', name: 'Extra Spicy Achar', description: 'Teekha Achar 500g', defaultUnit: 'jar', tags: ['spicy'] }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        await TemplateProduct.deleteMany({ shopType: 'achar' });
        await TemplateProduct.insertMany(acharProducts);
        console.log(`✅ ${acharProducts.length} Achar Products Added!`);
        process.exit();
    } catch(err) { console.error(err); process.exit(1); }
}
seed();
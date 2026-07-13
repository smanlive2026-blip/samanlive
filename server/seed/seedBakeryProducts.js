const mongoose = require('mongoose');
const TemplateProduct = require('../models/TemplateProduct');
require('dotenv').config();

const bakeryProducts = [
    // BREAD - 15
    { shopType: 'bakery', category: 'Bread', name: 'White Bread', description: '400g White Bread Loaf', defaultUnit: 'packet', tags: ['bread', 'white'] },
    { shopType: 'bakery', category: 'Bread', name: 'Brown Bread', description: '400g Wheat Brown Bread', defaultUnit: 'packet', tags: ['bread', 'brown'] },
    { shopType: 'bakery', category: 'Bread', name: 'Milk Bread', description: 'Soft Milk Bread 400g', defaultUnit: 'packet', tags: ['bread', 'milk'] },
    { shopType: 'bakery', category: 'Bread', name: 'Burger Bun', description: 'Pack of 4 Burger Buns', defaultUnit: 'packet', tags: ['bun', 'burger'] },
    { shopType: 'bakery', category: 'Bread', name: 'Hot Dog Bun', description: 'Pack of 4 Hot Dog Buns', defaultUnit: 'packet', tags: ['bun'] },
    { shopType: 'bakery', category: 'Bread', name: 'Pav', description: 'Ladi Pav 8pcs', defaultUnit: 'packet', tags: ['pav'] },
    { shopType: 'bakery', category: 'Bread', name: 'Garlic Bread', description: 'Garlic Butter Bread', defaultUnit: 'piece', tags: ['garlic'] },
    { shopType: 'bakery', category: 'Bread', name: 'Multigrain Bread', description: 'Healthy Multigrain 400g', defaultUnit: 'packet', tags: ['multigrain'] },
    { shopType: 'bakery', category: 'Bread', name: 'Cheese Bread', description: 'Cheese Filled Bread', defaultUnit: 'piece', tags: ['cheese'] },
    { shopType: 'bakery', category: 'Bread', name: 'Fruit Bread', description: 'Dry Fruit Bread 400g', defaultUnit: 'packet', tags: ['fruit'] },
    { shopType: 'bakery', category: 'Bread', name: 'Croissant', description: 'Butter Croissant', defaultUnit: 'piece', tags: ['croissant'] },
    { shopType: 'bakery', category: 'Bread', name: 'Baguette', description: 'French Baguette', defaultUnit: 'piece', tags: ['baguette'] },
    { shopType: 'bakery', category: 'Bread', name: 'Toast Bread', description: 'Crispy Toast 200g', defaultUnit: 'packet', tags: ['toast'] },
    { shopType: 'bakery', category: 'Bread', name: 'Gluten Free Bread', description: 'Gluten Free 400g', defaultUnit: 'packet', tags: ['gluten free'] },
    { shopType: 'bakery', category: 'Bread', name: 'Sourdough Bread', description: 'Sourdough Loaf 500g', defaultUnit: 'piece', tags: ['sourdough'] },

    // CAKE - 20
    { shopType: 'bakery', category: 'Cake', name: 'Vanilla Cake', description: '1kg Vanilla Sponge Cake', defaultUnit: 'kg', tags: ['vanilla', 'cake'] },
    { shopType: 'bakery', category: 'Cake', name: 'Chocolate Cake', description: '1kg Chocolate Truffle', defaultUnit: 'kg', tags: ['chocolate'] },
    { shopType: 'bakery', category: 'Cake', name: 'Black Forest', description: '1kg Black Forest Cake', defaultUnit: 'kg', tags: ['black forest'] },
    { shopType: 'bakery', category: 'Cake', name: 'Pineapple Cake', description: '1kg Pineapple Cake', defaultUnit: 'kg', tags: ['pineapple'] },
    { shopType: 'bakery', category: 'Cake', name: 'Strawberry Cake', description: '1kg Strawberry Cake', defaultUnit: 'kg', tags: ['strawberry'] },
    { shopType: 'bakery', category: 'Cake', name: 'Red Velvet', description: '1kg Red Velvet Cake', defaultUnit: 'kg', tags: ['red velvet'] },
    { shopType: 'bakery', category: 'Cake', name: 'Butterscotch Cake', description: '1kg Butterscotch', defaultUnit: 'kg', tags: ['butterscotch'] },
    { shopType: 'bakery', category: 'Cake', name: 'Fruit Cake', description: '1kg Mixed Fruit Cake', defaultUnit: 'kg', tags: ['fruit'] },
    { shopType: 'bakery', category: 'Cake', name: 'Photo Cake', description: 'Custom Photo Cake 1kg', defaultUnit: 'kg', tags: ['photo'] },
    { shopType: 'bakery', category: 'Cake', name: 'Birthday Cake', description: 'Birthday Theme Cake', defaultUnit: 'kg', tags: ['birthday'] },
    { shopType: 'bakery', category: 'Cake', name: 'Wedding Cake', description: '3 Tier Wedding Cake', defaultUnit: 'piece', tags: ['wedding'] },
    { shopType: 'bakery', category: 'Cake', name: 'Cupcake', description: 'Vanilla Cupcake 6pcs', defaultUnit: 'box', tags: ['cupcake'] },
    { shopType: 'bakery', category: 'Cake', name: 'Muffin', description: 'Chocolate Muffin 4pcs', defaultUnit: 'box', tags: ['muffin'] },
    { shopType: 'bakery', category: 'Cake', name: 'Cheesecake', description: 'Blueberry Cheesecake', defaultUnit: 'piece', tags: ['cheesecake'] },
    { shopType: 'bakery', category: 'Cake', name: 'Tiramisu', description: 'Italian Tiramisu', defaultUnit: 'piece', tags: ['tiramisu'] },
    { shopType: 'bakery', category: 'Cake', name: 'Brownies', description: 'Chocolate Brownie 4pcs', defaultUnit: 'box', tags: ['brownie'] },
    { shopType: 'bakery', category: 'Cake', name: 'Pastry', description: 'Fresh Cream Pastry', defaultUnit: 'piece', tags: ['pastry'] },
    { shopType: 'bakery', category: 'Cake', name: 'Doughnut', description: 'Glazed Doughnut', defaultUnit: 'piece', tags: ['doughnut'] },
    { shopType: 'bakery', category: 'Cake', name: 'Pinata Cake', description: 'Chocolate Pinata Cake', defaultUnit: 'kg', tags: ['pinata'] },
    { shopType: 'bakery', category: 'Cake', name: 'Jar Cake', description: 'Assorted Jar Cake', defaultUnit: 'piece', tags: ['jar'] },

    // COOKIES & BISCUITS - 15
    { shopType: 'bakery', category: 'Cookie', name: 'Butter Cookies', description: 'Premium Butter Cookies 250g', defaultUnit: 'packet', tags: ['butter'] },
    { shopType: 'bakery', category: 'Cookie', name: 'Chocolate Chip Cookie', description: 'Choco Chip 200g', defaultUnit: 'packet', tags: ['chocolate'] },
    { shopType: 'bakery', category: 'Cookie', name: 'Oatmeal Cookie', description: 'Healthy Oatmeal 250g', defaultUnit: 'packet', tags: ['oatmeal'] },
    { shopType: 'bakery', category: 'Cookie', name: 'Jeera Biscuit', description: 'Salty Jeera Biscuit 200g', defaultUnit: 'packet', tags: ['jeera'] },
    { shopType: 'bakery', category: 'Cookie', name: 'Atta Biscuit', description: 'Whole Wheat Biscuit 250g', defaultUnit: 'packet', tags: ['atta'] },
    { shopType: 'bakery', category: 'Cookie', name: 'Coconut Cookie', description: 'Coconut Biscuit 200g', defaultUnit: 'packet', tags: ['coconut'] },
    { shopType: 'bakery', category: 'Cookie', name: 'Nan Khatai', description: 'Traditional Nan Khatai 250g', defaultUnit: 'packet', tags: ['nankhatai'] },
    { shopType: 'bakery', category: 'Cookie', name: 'Osmania Biscuit', description: 'Hyderabadi Biscuit 200g', defaultUnit: 'packet', tags: ['osmania'] },
    { shopType: 'bakery', category: 'Cookie', name: 'Fruit Biscuit', description: 'Fruit Biscuit 250g', defaultUnit: 'packet', tags: ['fruit'] },
    { shopType: 'bakery', category: 'Cookie', name: 'Cream Biscuit', description: 'Cream Filled 200g', defaultUnit: 'packet', tags: ['cream'] },
    { shopType: 'bakery', category: 'Cookie', name: 'Almond Cookie', description: 'Badam Cookie 250g', defaultUnit: 'packet', tags: ['almond'] },
    { shopType: 'bakery', category: 'Cookie', name: 'Ginger Cookie', description: 'Ginger Snap 200g', defaultUnit: 'packet', tags: ['ginger'] },
    { shopType: 'bakery', category: 'Cookie', name: 'Sugar Free Cookie', description: 'Diabetic Cookie 200g', defaultUnit: 'packet', tags: ['sugarfree'] },
    { shopType: 'bakery', category: 'Cookie', name: 'Rus', description: 'Crispy Rusk 400g', defaultUnit: 'packet', tags: ['rusk'] },
    { shopType: 'bakery', category: 'Cookie', name: 'Toast', description: 'Sweet Toast 400g', defaultUnit: 'packet', tags: ['toast'] },

    // PASTRY & SNACKS - 15
    { shopType: 'bakery', category: 'Pastry', name: 'Black Forest Pastry', description: 'Fresh Cream Pastry', defaultUnit: 'piece', tags: ['pastry'] },
    { shopType: 'bakery', category: 'Pastry', name: 'Pineapple Pastry', description: 'Pineapple Cream Pastry', defaultUnit: 'piece', tags: ['pastry'] },
    { shopType: 'bakery', category: 'Pastry', name: 'Chocolate Eclair', description: 'Chocolate Eclair', defaultUnit: 'piece', tags: ['eclair'] },
    { shopType: 'bakery', category: 'Pastry', name: 'Cream Roll', description: 'Vanilla Cream Roll', defaultUnit: 'piece', tags: ['roll'] },
    { shopType: 'bakery', category: 'Pastry', name: 'Swiss Roll', description: 'Chocolate Swiss Roll', defaultUnit: 'piece', tags: ['swiss'] },
    { shopType: 'bakery', category: 'Snacks', name: 'Veg Puff', description: 'Vegetable Puff', defaultUnit: 'piece', tags: ['puff'] },
    { shopType: 'bakery', category: 'Snacks', name: 'Chicken Puff', description: 'Chicken Puff', defaultUnit: 'piece', tags: ['chicken'] },
    { shopType: 'bakery', category: 'Snacks', name: 'Samosa', description: 'Baked Samosa', defaultUnit: 'piece', tags: ['samosa'] },
    { shopType: 'bakery', category: 'Snacks', name: 'Pizza Puff', description: 'Cheese Pizza Puff', defaultUnit: 'piece', tags: ['pizza'] },
    { shopType: 'bakery', category: 'Snacks', name: 'Cheese Roll', description: 'Cheese Stuffed Roll', defaultUnit: 'piece', tags: ['cheese'] },
    { shopType: 'bakery', category: 'Snacks', name: 'Bread Pakoda', description: 'Baked Bread Pakoda', defaultUnit: 'piece', tags: ['pakoda'] },
    { shopType: 'bakery', category: 'Snacks', name: 'Khari', description: 'Masala Khari 200g', defaultUnit: 'packet', tags: ['khari'] },
    { shopType: 'bakery', category: 'Snacks', name: 'Bread Sticks', description: 'Garlic Bread Sticks 150g', defaultUnit: 'packet', tags: ['sticks'] },
    { shopType: 'bakery', category: 'Snacks', name: 'Laccha', description: 'Masala Laccha 200g', defaultUnit: 'packet', tags: ['laccha'] },
    { shopType: 'bakery', category: 'Snacks', name: 'Cheese Straw', description: 'Cheese Flavored Straw', defaultUnit: 'packet', tags: ['straw'] },

    // PIZZA & SAVORY - 10
    { shopType: 'bakery', category: 'Pizza', name: 'Margherita Pizza', description: '7 inch Cheese Pizza', defaultUnit: 'piece', tags: ['pizza'] },
    { shopType: 'bakery', category: 'Pizza', name: 'Veg Pizza', description: '7 inch Veg Loaded', defaultUnit: 'piece', tags: ['pizza', 'veg'] },
    { shopType: 'bakery', category: 'Pizza', name: 'Chicken Pizza', description: '7 inch Chicken Pizza', defaultUnit: 'piece', tags: ['pizza', 'chicken'] },
    { shopType: 'bakery', category: 'Pizza', name: 'Paneer Pizza', description: '7 inch Paneer Pizza', defaultUnit: 'piece', tags: ['pizza', 'paneer'] },
    { shopType: 'bakery', category: 'Pizza', name: 'Pepperoni Pizza', description: '7 inch Pepperoni', defaultUnit: 'piece', tags: ['pizza'] },
    { shopType: 'bakery', category: 'Savory', name: 'Garlic Bread', description: 'Cheese Garlic Bread', defaultUnit: 'piece', tags: ['garlic'] },
    { shopType: 'bakery', category: 'Savory', name: 'Lasagna', description: 'Veg Lasagna', defaultUnit: 'piece', tags: ['lasagna'] },
    { shopType: 'bakery', category: 'Savory', name: 'Pasta Bake', description: 'White Sauce Pasta', defaultUnit: 'piece', tags: ['pasta'] },
    { shopType: 'bakery', category: 'Savory', name: 'Quiche', description: 'Veg Quiche', defaultUnit: 'piece', tags: ['quiche'] },
    { shopType: 'bakery', category: 'Savory', name: 'Sandwich', description: 'Grilled Veg Sandwich', defaultUnit: 'piece', tags: ['sandwich'] },

    // INGREDIENTS & DECOR - 15
    { shopType: 'bakery', category: 'Ingredient', name: 'Maida', description: 'All Purpose Flour 1kg', defaultUnit: 'kg', tags: ['maida'] },
    { shopType: 'bakery', category: 'Ingredient', name: 'Sugar', description: 'Powdered Sugar 1kg', defaultUnit: 'kg', tags: ['sugar'] },
    { shopType: 'bakery', category: 'Ingredient', name: 'Butter', description: 'Amul Butter 500g', defaultUnit: 'packet', tags: ['butter'] },
    { shopType: 'bakery', category: 'Ingredient', name: 'Eggs', description: 'Farm Fresh Eggs 6pcs', defaultUnit: 'tray', tags: ['egg'] },
    { shopType: 'bakery', category: 'Ingredient', name: 'Milk', description: 'Full Cream Milk 1L', defaultUnit: 'litre', tags: ['milk'] },
    { shopType: 'bakery', category: 'Ingredient', name: 'Cream', description: 'Whipping Cream 1L', defaultUnit: 'litre', tags: ['cream'] },
    { shopType: 'bakery', category: 'Ingredient', name: 'Chocolate', description: 'Dark Chocolate 500g', defaultUnit: 'packet', tags: ['chocolate'] },
    { shopType: 'bakery', category: 'Ingredient', name: 'Yeast', description: 'Instant Dry Yeast 100g', defaultUnit: 'packet', tags: ['yeast'] },
    { shopType: 'bakery', category: 'Ingredient', name: 'Baking Powder', description: '100g', defaultUnit: 'packet', tags: ['baking'] },
    { shopType: 'bakery', category: 'Ingredient', name: 'Vanilla Essence', description: '100ml', defaultUnit: 'bottle', tags: ['vanilla'] },
    { shopType: 'bakery', category: 'Decor', name: 'Cake Topper', description: 'Happy Birthday Topper', defaultUnit: 'piece', tags: ['topper'] },
    { shopType: 'bakery', category: 'Decor', name: 'Sprinkles', description: 'Colorful Sprinkles 100g', defaultUnit: 'packet', tags: ['sprinkles'] },
    { shopType: 'bakery', category: 'Decor', name: 'Fondant', description: 'White Fondant 500g', defaultUnit: 'packet', tags: ['fondant'] },
    { shopType: 'bakery', category: 'Decor', name: 'Candle', description: 'Birthday Candles 10pcs', defaultUnit: 'packet', tags: ['candle'] },
    { shopType: 'bakery', category: 'Decor', name: 'Cake Box', description: '1kg Cake Box', defaultUnit: 'piece', tags: ['box'] },

    // SPECIAL & FESTIVE - 10
    { shopType: 'bakery', category: 'Festive', name: 'Christmas Cake', description: 'Fruit Plum Cake 1kg', defaultUnit: 'kg', tags: ['christmas'] },
    { shopType: 'bakery', category: 'Festive', name: 'Diwali Cookies', description: 'Assorted Diwali Box', defaultUnit: 'box', tags: ['diwali'] },
    { shopType: 'bakery', category: 'Festive', name: 'Eid Cake', description: 'Special Eid Cake', defaultUnit: 'kg', tags: ['eid'] },
    { shopType: 'bakery', category: 'Diet', name: 'Sugar Free Cake', description: 'Sugar Free 1kg', defaultUnit: 'kg', tags: ['sugarfree'] },
    { shopType: 'bakery', category: 'Diet', name: 'Gluten Free Cookie', description: 'Gluten Free 200g', defaultUnit: 'packet', tags: ['glutenfree'] },
    { shopType: 'bakery', category: 'Vegan', name: 'Vegan Cake', description: 'Eggless Vegan Cake 1kg', defaultUnit: 'kg', tags: ['vegan'] },
    { shopType: 'bakery', category: 'Vegan', name: 'Vegan Cookie', description: 'Vegan Oat Cookie 200g', defaultUnit: 'packet', tags: ['vegan'] },
    { shopType: 'bakery', category: 'Gift', name: 'Gift Hamper', description: 'Bakery Gift Hamper', defaultUnit: 'set', tags: ['gift'] },
    { shopType: 'bakery', category: 'Custom', name: 'Custom Cake', description: 'Custom Design Cake', defaultUnit: 'kg', tags: ['custom'] },
    { shopType: 'bakery', category: 'Service', name: 'Cake Delivery', description: 'Home Delivery Service', defaultUnit: 'service', tags: ['delivery'] }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        await TemplateProduct.deleteMany({ shopType: 'bakery' });
        await TemplateProduct.insertMany(bakeryProducts);
        console.log(`✅ ${bakeryProducts.length} Bakery Products Added!`);
        process.exit();
    } catch(err) { console.error(err); process.exit(1); }
}
seed();
//<!-- TODO: Catalog Button Add Karna Hai -->
//<!-- API: /api/admin/shop/{shopId}/catalog/bakery -->
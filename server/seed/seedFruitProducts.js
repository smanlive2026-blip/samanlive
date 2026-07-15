const TemplateProduct = require('../models/TemplateProduct');

const fruitProducts = [
  // ========== COMMON FRUITS ==========
  { name: "Seb", name_en: "Apple", price: 120, unit: "kg", category: "Fruits", stock: 100, expiryDays: 10, templateId: "fruit" },
  { name: "Kela", name_en: "Banana", price: 60, unit: "dozen", category: "Fruits", stock: 200, expiryDays: 5, templateId: "fruit" },
  { name: "Aam", name_en: "Mango", price: 150, unit: "kg", category: "Fruits", stock: 80, expiryDays: 7, templateId: "fruit" },
  { name: "Angoor", name_en: "Grapes", price: 180, unit: "kg", category: "Fruits", stock: 60, expiryDays: 6, templateId: "fruit" },
  { name: "Santra", name_en: "Orange", price: 100, unit: "kg", category: "Fruits", stock: 90, expiryDays: 12, templateId: "fruit" },
  { name: "Mausambi", name_en: "Sweet Lime", price: 90, unit: "kg", category: "Fruits", stock: 70, expiryDays: 10, templateId: "fruit" },
  { name: "Nimbu", name_en: "Lemon", price: 120, unit: "kg", category: "Fruits", stock: 50, expiryDays: 15, templateId: "fruit" },
  { name: "Papita", name_en: "Papaya", price: 70, unit: "kg", category: "Fruits", stock: 60, expiryDays: 5, templateId: "fruit" },
  { name: "Amrud", name_en: "Guava", price: 80, unit: "kg", category: "Fruits", stock: 70, expiryDays: 6, templateId: "fruit" },
  { name: "Anar", name_en: "Pomegranate", price: 200, unit: "kg", category: "Fruits", stock: 40, expiryDays: 15, templateId: "fruit" },

  // ========== SEASONAL FRUITS ==========
  { name: "Litchi", name_en: "Lychee", price: 220, unit: "kg", category: "Fruits", stock: 50, expiryDays: 4, templateId: "fruit" },
  { name: "Jamun", name_en: "Indian Blackberry", price: 160, unit: "kg", category: "Fruits", stock: 40, expiryDays: 3, templateId: "fruit" },
  { name: "Falsa", name_en: "Phalsa", price: 140, unit: "kg", category: "Fruits", stock: 30, expiryDays: 2, templateId: "fruit" },
  { name: "Ber", name_en: "Indian Jujube", price: 100, unit: "kg", category: "Fruits", stock: 60, expiryDays: 8, templateId: "fruit" },
  { name: "Tarbhuj", name_en: "Watermelon", price: 40, unit: "kg", category: "Fruits", stock: 100, expiryDays: 10, templateId: "fruit" },
  { name: "Kharbooja", name_en: "Muskmelon", price: 60, unit: "kg", category: "Fruits", stock: 80, expiryDays: 7, templateId: "fruit" },
  { name: "Chiku", name_en: "Sapodilla", price: 110, unit: "kg", category: "Fruits", stock: 60, expiryDays: 5, templateId: "fruit" },
  { name: "Nariyal", name_en: "Coconut", price: 50, unit: "piece", category: "Fruits", stock: 150, expiryDays: 20, templateId: "fruit" },
  { name: "Ananas", name_en: "Pineapple", price: 90, unit: "piece", category: "Fruits", stock: 70, expiryDays: 8, templateId: "fruit" },
  { name: "Avocado", name_en: "Avocado", price: 300, unit: "kg", category: "Fruits", stock: 30, expiryDays: 6, templateId: "fruit" },

  // ========== DRY FRUITS ==========
  { name: "Badam", name_en: "Almond", price: 800, unit: "kg", category: "Fruits", stock: 50, expiryDays: 180, templateId: "fruit" },
  { name: "Kaju", name_en: "Cashew", price: 900, unit: "kg", category: "Fruits", stock: 40, expiryDays: 180, templateId: "fruit" },
  { name: "Kishmish", name_en: "Raisins", price: 400, unit: "kg", category: "Fruits", stock: 60, expiryDays: 365, templateId: "fruit" },
  { name: "Pista", name_en: "Pistachio", price: 1200, unit: "kg", category: "Fruits", stock: 30, expiryDays: 180, templateId: "fruit" },
  { name: "Akhrot", name_en: "Walnut", price: 1000, unit: "kg", category: "Fruits", stock: 40, expiryDays: 180, templateId: "fruit" },
  { name: "Khajoor", name_en: "Dates", price: 350, unit: "kg", category: "Fruits", stock: 80, expiryDays: 365, templateId: "fruit" },
  { name: "Anjeer", name_en: "Fig", price: 1400, unit: "kg", category: "Fruits", stock: 20, expiryDays: 180, templateId: "fruit" },
  { name: "Khumani", name_en: "Apricot", price: 600, unit: "kg", category: "Fruits", stock: 25, expiryDays: 180, templateId: "fruit" },

  // ========== EXOTIC FRUITS ==========
  { name: "Kiwi", name_en: "Kiwi", price: 350, unit: "kg", category: "Fruits", stock: 40, expiryDays: 10, templateId: "fruit" },
  { name: "Dragon Fruit", name_en: "Dragon Fruit", price: 400, unit: "kg", category: "Fruits", stock: 30, expiryDays: 7, templateId: "fruit" },
  { name: "Blueberry", name_en: "Blueberry", price: 600, unit: "kg", category: "Fruits", stock: 20, expiryDays: 5, templateId: "fruit" },
  { name: "Strawberry", name_en: "Strawberry", price: 250, unit: "kg", category: "Fruits", stock: 50, expiryDays: 4, templateId: "fruit" },
  { name: "Raspberry", name_en: "Raspberry", price: 700, unit: "kg", category: "Fruits", stock: 15, expiryDays: 3, templateId: "fruit" },
  { name: "Blackberry", name_en: "Blackberry", price: 650, unit: "kg", category: "Fruits", stock: 15, expiryDays: 3, templateId: "fruit" },
  { name: "Cherry", name_en: "Cherry", price: 500, unit: "kg", category: "Fruits", stock: 25, expiryDays: 5, templateId: "fruit" },
  { name: "Peach", name_en: "Peach", price: 280, unit: "kg", category: "Fruits", stock: 40, expiryDays: 6, templateId: "fruit" },
  { name: "Plum", name_en: "Plum", price: 260, unit: "kg", category: "Fruits", stock: 40, expiryDays: 7, templateId: "fruit" },
  { name: "Pear", name_en: "Pear", price: 180, unit: "kg", category: "Fruits", stock: 60, expiryDays: 10, templateId: "fruit" },

  // ========== TROPICAL FRUITS ==========
  { name: "Rambutan", name_en: "Rambutan", price: 450, unit: "kg", category: "Fruits", stock: 20, expiryDays: 5, templateId: "fruit" },
  { name: "Mangosteen", name_en: "Mangosteen", price: 550, unit: "kg", category: "Fruits", stock: 15, expiryDays: 5, templateId: "fruit" },
  { name: "Durian", name_en: "Durian", price: 800, unit: "kg", category: "Fruits", stock: 10, expiryDays: 4, templateId: "fruit" },
  { name: "Passion Fruit", name_en: "Passion Fruit", price: 350, unit: "kg", category: "Fruits", stock: 25, expiryDays: 7, templateId: "fruit" },
  { name: "Star Fruit", name_en: "Star Fruit", price: 200, unit: "kg", category: "Fruits", stock: 30, expiryDays: 6, templateId: "fruit" },
  { name: "Jackfruit", name_en: "Jackfruit", price: 80, unit: "kg", category: "Fruits", stock: 40, expiryDays: 8, templateId: "fruit" },
  { name: "Breadfruit", name_en: "Breadfruit", price: 100, unit: "kg", category: "Fruits", stock: 30, expiryDays: 7, templateId: "fruit" },
  { name: "Soursop", name_en: "Soursop", price: 300, unit: "kg", category: "Fruits", stock: 20, expiryDays: 5, templateId: "fruit" },

  // ========== CITRUS & OTHERS ==========
  { name: "Grapefruit", name_en: "Grapefruit", price: 160, unit: "kg", category: "Fruits", stock: 40, expiryDays: 12, templateId: "fruit" },
  { name: "Mandarin", name_en: "Mandarin", price: 140, unit: "kg", category: "Fruits", stock: 60, expiryDays: 10, templateId: "fruit" },
  { name: "Tangerine", name_en: "Tangerine", price: 130, unit: "kg", category: "Fruits", stock: 60, expiryDays: 10, templateId: "fruit" },
  { name: "Kinnow", name_en: "Kinnow", price: 110, unit: "kg", category: "Fruits", stock: 80, expiryDays: 12, templateId: "fruit" },
  { name: "Galgal", name_en: "Galgal", price: 90, unit: "kg", category: "Fruits", stock: 50, expiryDays: 15, templateId: "fruit" },

  // ========== BERRIES & SMALL FRUITS ==========
  { name: "Mulberry", name_en: "Mulberry", price: 200, unit: "kg", category: "Fruits", stock: 30, expiryDays: 3, templateId: "fruit" },
  { name: "Gooseberry", name_en: "Gooseberry", price: 120, unit: "kg", category: "Fruits", stock: 50, expiryDays: 10, templateId: "fruit" },
  { name: "Amla", name_en: "Indian Gooseberry", price: 100, unit: "kg", category: "Fruits", stock: 60, expiryDays: 15, templateId: "fruit" },
  { name: "Wood Apple", name_en: "Wood Apple", price: 90, unit: "kg", category: "Fruits", stock: 40, expiryDays: 12, templateId: "fruit" },
  { name: "Bael", name_en: "Bael Fruit", price: 70, unit: "kg", category: "Fruits", stock: 50, expiryDays: 15, templateId: "fruit" },

  // ========== 50 MORE MIXED FRUITS ==========
  { name: "Custard Apple", name_en: "Custard Apple", price: 130, unit: "kg", category: "Fruits", stock: 50, expiryDays: 5, templateId: "fruit" },
  { name: "Tamarind", name_en: "Tamarind", price: 180, unit: "kg", category: "Fruits", stock: 70, expiryDays: 365, templateId: "fruit" },
  { name: "Jujube", name_en: "Jujube", price: 110, unit: "kg", category: "Fruits", stock: 50, expiryDays: 8, templateId: "fruit" },
  { name: "Loquat", name_en: "Loquat", price: 170, unit: "kg", category: "Fruits", stock: 30, expiryDays: 5, templateId: "fruit" },
  { name: "Persimmon", name_en: "Persimmon", price: 320, unit: "kg", category: "Fruits", stock: 25, expiryDays: 7, templateId: "fruit" },
  { name: "Pomelo", name_en: "Pomelo", price: 150, unit: "kg", category: "Fruits", stock: 40, expiryDays: 14, templateId: "fruit" },
  { name: "Cantaloupe", name_en: "Cantaloupe", price: 70, unit: "kg", category: "Fruits", stock: 60, expiryDays: 7, templateId: "fruit" },
  { name: "Honeydew", name_en: "Honeydew", price: 80, unit: "kg", category: "Fruits", stock: 50, expiryDays: 7, templateId: "fruit" },
  { name: "Cranberry", name_en: "Cranberry", price: 550, unit: "kg", category: "Fruits", stock: 20, expiryDays: 10, templateId: "fruit" },
  { name: "Goji Berry", name_en: "Goji Berry", price: 1500, unit: "kg", category: "Fruits", stock: 10, expiryDays: 365, templateId: "fruit" },
  { name: "Sea Buckthorn", name_en: "Sea Buckthorn", price: 900, unit: "kg", category: "Fruits", stock: 15, expiryDays: 30, templateId: "fruit" },
  { name: "Elderberry", name_en: "Elderberry", price: 400, unit: "kg", category: "Fruits", stock: 20, expiryDays: 5, templateId: "fruit" },
  { name: "Currant", name_en: "Currant", price: 350, unit: "kg", category: "Fruits", stock: 20, expiryDays: 5, templateId: "fruit" },
  { name: "Quince", name_en: "Quince", price: 200, unit: "kg", category: "Fruits", stock: 30, expiryDays: 20, templateId: "fruit" },
  { name: "Nectarine", name_en: "Nectarine", price: 290, unit: "kg", category: "Fruits", stock: 35, expiryDays: 6, templateId: "fruit" },
  { name: "Apricot Fresh", name_en: "Apricot", price: 320, unit: "kg", category: "Fruits", stock: 30, expiryDays: 6, templateId: "fruit" },
  { name: "Fig Fresh", name_en: "Fig", price: 350, unit: "kg", category: "Fruits", stock: 30, expiryDays: 5, templateId: "fruit" },
  { name: "Date Fresh", name_en: "Date", price: 400, unit: "kg", category: "Fruits", stock: 40, expiryDays: 30, templateId: "fruit" },
  { name: "Olive", name_en: "Olive", price: 500, unit: "kg", category: "Fruits", stock: 30, expiryDays: 30, templateId: "fruit" },
  { name: "Carambola", name_en: "Carambola", price: 220, unit: "kg", category: "Fruits", stock: 25, expiryDays: 6, templateId: "fruit" },
  { name: "Longan", name_en: "Longan", price: 380, unit: "kg", category: "Fruits", stock: 20, expiryDays: 5, templateId: "fruit" },
  { name: "Lychee Dry", name_en: "Dried Lychee", price: 600, unit: "kg", category: "Fruits", stock: 20, expiryDays: 180, templateId: "fruit" },
  { name: "Mango Dry", name_en: "Dried Mango", price: 500, unit: "kg", category: "Fruits", stock: 30, expiryDays: 180, templateId: "fruit" },
  { name: "Banana Chips", name_en: "Banana Chips", price: 300, unit: "kg", category: "Fruits", stock: 50, expiryDays: 90, templateId: "fruit" },
  { name: "Coconut Dry", name_en: "Dry Coconut", price: 250, unit: "kg", category: "Fruits", stock: 60, expiryDays: 180, templateId: "fruit" },
  { name: "Lotus Seed", name_en: "Makhana", price: 600, unit: "kg", category: "Fruits", stock: 40, expiryDays: 365, templateId: "fruit" },
  { name: "Fox Nut", name_en: "Fox Nut", price: 650, unit: "kg", category: "Fruits", stock: 35, expiryDays: 365, templateId: "fruit" },
  { name: "Chironji", name_en: "Chironji", price: 2000, unit: "kg", category: "Fruits", stock: 10, expiryDays: 365, templateId: "fruit" },
  { name: "Pine Nut", name_en: "Pine Nut", price: 3000, unit: "kg", category: "Fruits", stock: 10, expiryDays: 180, templateId: "fruit" },
  { name: "Hazelnut", name_en: "Hazelnut", price: 1100, unit: "kg", category: "Fruits", stock: 20, expiryDays: 180, templateId: "fruit" },
  { name: "Macadamia", name_en: "Macadamia", price: 2500, unit: "kg", category: "Fruits", stock: 10, expiryDays: 180, templateId: "fruit" },
  { name: "Brazil Nut", name_en: "Brazil Nut", price: 1300, unit: "kg", category: "Fruits", stock: 15, expiryDays: 180, templateId: "fruit" },
  { name: "Chestnut", name_en: "Chestnut", price: 600, unit: "kg", category: "Fruits", stock: 25, expiryDays: 30, templateId: "fruit" },
  { name: "Prune", name_en: "Prune", price: 700, unit: "kg", category: "Fruits", stock: 20, expiryDays: 180, templateId: "fruit" },
  { name: "Dried Apricot", name_en: "Dried Apricot", price: 800, unit: "kg", category: "Fruits", stock: 20, expiryDays: 180, templateId: "fruit" },
  { name: "Dried Fig", name_en: "Dried Fig", price: 1500, unit: "kg", category: "Fruits", stock: 15, expiryDays: 180, templateId: "fruit" },
  { name: "Dried Dates", name_en: "Dried Dates", price: 400, unit: "kg", category: "Fruits", stock: 50, expiryDays: 365, templateId: "fruit" },
  { name: "Sun Dried Tomato", name_en: "Sun Dried Tomato", price: 1200, unit: "kg", category: "Fruits", stock: 15, expiryDays: 180, templateId: "fruit" },
  { name: "Tutti Frutti", name_en: "Tutti Frutti", price: 350, unit: "kg", category: "Fruits", stock: 30, expiryDays: 180, templateId: "fruit" },
  { name: "Candied Orange", name_en: "Candied Orange", price: 450, unit: "kg", category: "Fruits", stock: 25, expiryDays: 180, templateId: "fruit" },
  { name: "Candied Ginger", name_en: "Candied Ginger", price: 500, unit: "kg", category: "Fruits", stock: 20, expiryDays: 180, templateId: "fruit" },
  { name: "Fruit Cake Mix", name_en: "Fruit Cake Mix", price: 400, unit: "kg", category: "Fruits", stock: 30, expiryDays: 90, templateId: "fruit" },
  { name: "Mixed Fruit Jam", name_en: "Mixed Fruit Jam", price: 250, unit: "kg", category: "Fruits", stock: 40, expiryDays: 365, templateId: "fruit" },
  { name: "Fruit Juice Mix", name_en: "Fruit Juice Mix", price: 180, unit: "liter", category: "Fruits", stock: 100, expiryDays: 30, templateId: "fruit" },
  { name: "Fruit Salad", name_en: "Fruit Salad", price: 200, unit: "kg", category: "Fruits", stock: 50, expiryDays: 2, templateId: "fruit" },
  { name: "Frozen Mango", name_en: "Frozen Mango", price: 220, unit: "kg", category: "Fruits", stock: 60, expiryDays: 180, templateId: "fruit" },
  { name: "Frozen Berries", name_en: "Frozen Berries", price: 450, unit: "kg", category: "Fruits", stock: 40, expiryDays: 180, templateId: "fruit" },
  { name: "Frozen Pineapple", name_en: "Frozen Pineapple", price: 200, unit: "kg", category: "Fruits", stock: 50, expiryDays: 180, templateId: "fruit" },
  { name: "Dried Apple", name_en: "Dried Apple", price: 650, unit: "kg", category: "Fruits", stock: 25, expiryDays: 180, templateId: "fruit" },
  { name: "Dried Banana", name_en: "Dried Banana", price: 400, unit: "kg", category: "Fruits", stock: 30, expiryDays: 180, templateId: "fruit" },
  { name: "Fruit Bar", name_en: "Fruit Bar", price: 300, unit: "kg", category: "Fruits", stock: 40, expiryDays: 90, templateId: "fruit" },
  { name: "Fruit Leather", name_en: "Fruit Leather", price: 350, unit: "kg", category: "Fruits", stock: 30, expiryDays: 90, templateId: "fruit" }
];

const seedFruitProducts = async () => {
  try {
    await TemplateProduct.deleteMany({ category: "Fruits" });
    await TemplateProduct.insertMany(fruitProducts);
    console.log(`✅ ${fruitProducts.length} Fruits seed ho gaye DB me`);
    process.exit();
  } catch (error) {
    console.log("❌ Error:", error);
    process.exit(1);
  }
};

seedFruitProducts();

module.exports = seedFruitProducts;
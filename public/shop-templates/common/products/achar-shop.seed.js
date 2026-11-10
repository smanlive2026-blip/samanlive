// LOCATION: public/shop-templates/common/products/achar-shop.seed.js - ACHAR BOSS - 100 ITEMS
// FORMAT: Same as dairy.seed.js / kirana.seed.js - FORM_CONFIG + PRODUCTS
// LOADER: index.js -> loadSeed('achar-shop') -> import('./achar-shop.seed.js')
// CATEGORY: Aam, Nimbu, Mix, Murabba, Gajar, Lahsun, Mirchi, Amla, Karela, Baingan, Gobhi, Adrak, Imli, Haldi, Keri

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.PRODUCTS = exports.FORM_CONFIG = void 0;

const FORM_CONFIG = exports.FORM_CONFIG = {
  title: "Achar Product",
  icon: "🥒",
  fields: [
    { name: "name", label: "Product Name *", type: "text", placeholder: "Aam ka Achar 500g", col: "full" },
    { name: "brand", label: "Brand *", type: "text", placeholder: "Maa Ke Haath Ka, Ghar Ka Bana", col: "half" },
    { name: "category", label: "Category", type: "select", options: ["Aam", "Nimbu", "Mix", "Murabba", "Gajar", "Lahsun", "Mirchi", "Amla", "Karela", "Baingan", "Gobhi", "Adrak", "Imli", "Haldi", "Keri", "Other"], col: "half" },
    { name: "price", label: "Selling Price 500g *", type: "number", placeholder: "150", col: "half" },
    { name: "price500", label: "500g Price *", type: "number", placeholder: "150", col: "half" },
    { name: "price1kg", label: "1Kg Price *", type: "number", placeholder: "280", col: "half" },
    { name: "mrp", label: "MRP 500g", type: "number", placeholder: "180", col: "half" },
    { name: "stock", label: "Stock Kg *", type: "number", value: "20", col: "half" },
    { name: "lowStockAlert", label: "Low Stock Alert", type: "number", value: "2", col: "half" },
    { name: "spiceLevel", label: "Spice Level", type: "select", options: ["Mild", "Medium", "Teekha", "Extra Teekha"], col: "half" },
    { name: "jarType", label: "Jar Type", type: "select", options: ["Glass", "Plastic", "Ceramic"], col: "half" },
    { name: "weight", label: "Weight", type: "text", placeholder: "500g, 1Kg", col: "half" },
    { name: "unit", label: "Unit", type: "select", options: ["jar", "packet", "kg", "piece"], col: "half" },
    { name: "thumbnail", label: "Image URL", type: "text", placeholder: "https://...", col: "full" },
    { name: "description", label: "Description", type: "text", placeholder: "Maa ke haath ka bana hua...", col: "full" },
    { name: "isSpecial", label: "Is Special?", type: "select", options: ["false", "true"], col: "half" },
    { name: "layout", label: "Special Layout", type: "select", options: ["big", "scroll", "list"], col: "half" },
    { name: "badge", label: "Badge (Bestseller / Fresh / Premium)", type: "text", placeholder: "Bestseller", col: "half" },
    { name: "quality", label: "Quality", type: "text", placeholder: "Homemade, Premium", col: "half" },
    { name: "cardColor", label: "Card Color", type: "text", placeholder: "#fef3c7", col: "half" },
    { name: "isPaidSpecial", label: "Paid Special? Admin ke liye", type: "select", options: ["false", "true"], col: "half" }
  ]
};

// Helper - har product me price500 / price1kg / price teeno rakhna hai
// taaki dashboard.js (price500) + customer-view.js (price500) + common product-card.js (price) - teeno chal jayein
function P(name, category, price500, price1kg, spice, jar, badge, desc) {
  return {
    name: name,
    brand: "Maa Ke Haath Ka",
    category: category,
    acharType: category,
    price: price500,
    price500: price500,
    price1kg: price1kg,
    mrp: price500 + 30,
    stock: 20,
    weight: "500g",
    unit: "jar",
    jarType: jar || "Glass",
    spiceLevel: spice || "Medium",
    thumbnail: "",
    image: "https://placehold.co/600/d97706/fff?text=" + encodeURIComponent(name),
    description: desc || "Maa ke haath ka bana hua shuddh " + name + ". Ghar ka swad, bina preservative.",
    isSpecial: badge ? "true" : "false",
    layout: badge ? "big" : "list",
    badge: badge || "",
    quality: "Homemade",
    cardColor: "#fef3c7"
  };
}

const PRODUCTS = exports.PRODUCTS = [
  // ===== AAM - 1 to 15 =====
  P("Aam ka Achar 500g", "Aam", 150, 280, "Medium", "Glass", "Bestseller", "Sabse zyada bikne wala, khatta-meetha aam ka achar."),
  P("Aam ka Teekha Achar 500g", "Aam", 160, 300, "Teekha", "Glass", "", "Teekha pasand karne walo ke liye, mirchi wala aam ka achar."),
  P("Aam ka Meetha Achar 500g", "Aam", 170, 320, "Mild", "Glass", "", "Baccho ke liye meetha aam ka achar, gud wala."),
  P("Kacche Aam ka Achar 500g", "Aam", 155, 290, "Medium", "Glass", "", "Kacche aam ka khatta achar, garmi me best."),
  P("Aam ka Chunda 500g", "Aam", 180, 340, "Mild", "Glass", "Premium", "Gud wala meetha chunda, roti ke saath best."),
  P("Aam ka Murabba Style Achar 500g", "Aam", 175, 330, "Mild", "Glass", "", "Murabba jaisa meetha aam ka achar."),
  P("Aam Hing Achar 500g", "Aam", 165, 310, "Medium", "Glass", "", "Hing ka tadka wala aam ka achar, pachak."),
  P("Aam Methi Achar 500g", "Aam", 160, 300, "Medium", "Glass", "", "Methi dana wala aam ka achar, purana swad."),
  P("Aam Rajasthani Achar 500g", "Aam", 170, 320, "Teekha", "Ceramic", "", "Rajasthani masale wala aam ka achar."),
  P("Aam Gujarati Achar 500g", "Aam", 165, 310, "Mild", "Glass", "", "Gujarati meetha-khatta aam ka achar."),
  P("Aam Punjabi Achar 500g", "Aam", 170, 320, "Teekha", "Glass", "", "Punjabi tadka wala aam ka achar, sarso tel me."),
  P("Aam ka Achar 1Kg Family Pack", "Aam", 280, 280, "Medium", "Plastic", "Bestseller", "Family pack, 1Kg me sasta padega."),
  P("Aam ka Achar Sugar Free 500g", "Aam", 190, 360, "Medium", "Glass", "Premium", "Sugar free, diabetes walo ke liye."),
  P("Aam ka Achar Extra Oil 500g", "Aam", 155, 290, "Medium", "Glass", "", "Extra sarso tel wala, lamba chalega."),
  P("Aam ka Achar Low Salt 500g", "Aam", 160, 300, "Mild", "Glass", "", "Kam namak wala, BP walo ke liye."),

  // ===== NIMBU - 16 to 27 =====
  P("Nimbu ka Achar 500g", "Nimbu", 140, 260, "Medium", "Glass", "Bestseller", "Khatta nimbu ka achar, khana pachane me best."),
  P("Nimbu ka Meetha Achar 500g", "Nimbu", 150, 280, "Mild", "Glass", "", "Meetha nimbu ka achar, baccho ko bhi pasand."),
  P("Nimbu Mirchi Achar 500g", "Nimbu", 155, 290, "Teekha", "Glass", "", "Nimbu + hari mirchi ka combo achar."),
  P("Nimbu ka Khatta Achar 500g", "Nimbu", 145, 270, "Medium", "Glass", "", "Extra khatta, nimbu ke chilke wala."),
  P("Nimbu Adrak Achar 500g", "Nimbu", 160, 300, "Medium", "Glass", "", "Adrak wala nimbu ka achar, sardi me best."),
  P("Nimbu ka Achar Oil Free 500g", "Nimbu", 150, 280, "Mild", "Glass", "Premium", "Bina tel ka nimbu ka achar, diet wala."),
  P("Nimbu ka Achar 1Kg Pack", "Nimbu", 260, 260, "Medium", "Plastic", "", "1Kg family pack nimbu ka achar."),
  P("Nimbu Hing Achar 500g", "Nimbu", 155, 290, "Medium", "Glass", "", "Hing wala nimbu ka achar, gas me aaram."),
  P("Nimbu Kala Namak Achar 500g", "Nimbu", 150, 280, "Mild", "Glass", "", "Kala namak wala nimbu ka achar."),
  P("Nimbu ka Achar Sweet & Sour 500g", "Nimbu", 160, 300, "Mild", "Glass", "", "Meetha-khatta nimbu ka achar."),
  P("Nimbu ka Achar Teekha 500g", "Nimbu", 160, 300, "Extra Teekha", "Glass", "", "Bahut teekha nimbu ka achar."),
  P("Nimbu ka Achar Garlic 500g", "Nimbu", 165, 310, "Medium", "Glass", "", "Lahsun wala nimbu ka achar."),

  // ===== MIX - 28 to 39 =====
  P("Mix Achar 500g", "Mix", 150, 280, "Medium", "Glass", "Bestseller", "Sab kuch ek me - aam, nimbu, gajar, mirchi ka mix."),
  P("Mix Achar Teekha 500g", "Mix", 160, 300, "Teekha", "Glass", "", "Teekha mix achar, mirchi zyada."),
  P("Mix Achar Meetha 500g", "Mix", 160, 300, "Mild", "Glass", "", "Meetha mix achar, gud wala."),
  P("Mix Achar Punjabi 500g", "Mix", 170, 320, "Teekha", "Glass", "", "Punjabi masala wala mix achar."),
  P("Mix Achar Rajasthani 500g", "Mix", 170, 320, "Teekha", "Ceramic", "", "Rajasthani mix achar, sarso tel me."),
  P("Mix Achar Gujarati 500g", "Mix", 165, 310, "Mild", "Glass", "", "Gujarati meetha-khatta mix achar."),
  P("Mix Achar 1Kg Pack", "Mix", 280, 280, "Medium", "Plastic", "Bestseller", "1Kg mix achar family pack."),
  P("Mix Achar Oil Free 500g", "Mix", 160, 300, "Medium", "Glass", "", "Bina tel ka mix achar."),
  P("Mix Achar Hing Wala 500g", "Mix", 160, 300, "Medium", "Glass", "", "Hing ka tadka wala mix achar."),
  P("Mix Achar Garlic Wala 500g", "Mix", 170, 320, "Medium", "Glass", "", "Lahsun wala mix achar."),
  P("Mix Achar Sweet Chilli 500g", "Mix", 170, 320, "Mild", "Glass", "", "Meethi mirchi wala mix achar."),
  P("Mix Achar Extra Spicy 500g", "Mix", 175, 330, "Extra Teekha", "Glass", "", "Bahut zyada teekha mix achar."),

  // ===== MURABBA - 40 to 51 =====
  P("Aam ka Murabba 500g", "Murabba", 180, 340, "Mild", "Glass", "Bestseller", "Meetha aam ka murabba, gud wala."),
  P("Gajar ka Murabba 500g", "Murabba", 170, 320, "Mild", "Glass", "", "Gajar ka meetha murabba."),
  P("Amla ka Murabba 500g", "Murabba", 190, 360, "Mild", "Glass", "Premium", "Amla ka murabba, immunity ke liye best."),
  P("Bel ka Murabba 500g", "Murabba", 200, 380, "Mild", "Glass", "", "Bel ka murabba, pet ke liye best."),
  P("Seb ka Murabba 500g", "Murabba", 190, 360, "Mild", "Glass", "", "Seb ka meetha murabba."),
  P("Aawla Murabba Sugar Free 500g", "Murabba", 210, 400, "Mild", "Glass", "Premium", "Sugar free aawla murabba."),
  P("Harad ka Murabba 500g", "Murabba", 200, 380, "Mild", "Glass", "", "Harad ka murabba, ayurvedic."),
  P("Bael Murabba 1Kg Pack", "Murabba", 380, 380, "Mild", "Plastic", "", "1Kg bael murabba family pack."),
  P("Aam Murabba 1Kg Pack", "Murabba", 340, 340, "Mild", "Plastic", "", "1Kg aam murabba family pack."),
  P("Gajar Murabba 1Kg Pack", "Murabba", 320, 320, "Mild", "Plastic", "", "1Kg gajar murabba family pack."),
  P("Amla Murabba Honey Wala 500g", "Murabba", 220, 420, "Mild", "Glass", "Premium", "Shahad wala amla murabba."),
  P("Mix Murabba 500g", "Murabba", 190, 360, "Mild", "Glass", "", "Mix fruit murabba, sab fruit ka combo."),

  // ===== GAJAR - 52 to 61 =====
  P("Gajar ka Achar 500g", "Gajar", 140, 260, "Medium", "Glass", "Bestseller", "Gajar ka khatta-meetha achar."),
  P("Gajar Gobhi Achar 500g", "Gajar", 150, 280, "Medium", "Glass", "", "Gajar + gobhi ka combo achar."),
  P("Gajar ka Achar Teekha 500g", "Gajar", 150, 280, "Teekha", "Glass", "", "Teekha gajar ka achar."),
  P("Gajar ka Achar Meetha 500g", "Gajar", 150, 280, "Mild", "Glass", "", "Meetha gajar ka achar."),
  P("Gajar Mooli Achar 500g", "Gajar", 155, 290, "Medium", "Glass", "", "Gajar + mooli ka achar."),
  P("Gajar ka Achar Punjabi 500g", "Gajar", 160, 300, "Teekha", "Glass", "", "Punjabi gajar ka achar."),
  P("Gajar ka Achar 1Kg Pack", "Gajar", 260, 260, "Medium", "Plastic", "", "1Kg gajar achar pack."),
  P("Gajar ka Achar Oil Free 500g", "Gajar", 150, 280, "Mild", "Glass", "", "Bina tel ka gajar achar."),
  P("Gajar ka Achar Garlic 500g", "Gajar", 160, 300, "Medium", "Glass", "", "Lahsun wala gajar achar."),
  P("Gajar ka Achar Sirka Wala 500g", "Gajar", 155, 290, "Medium", "Glass", "", "Sirka wala gajar achar, khatta."),

  // ===== LAHSUN - 62 to 71 =====
  P("Lahsun ka Achar 500g", "Lahsun", 170, 320, "Medium", "Glass", "Bestseller", "Lahsun ka achar, sardard me best."),
  P("Lahsun ka Achar Teekha 500g", "Lahsun", 180, 340, "Teekha", "Glass", "", "Teekha lahsun ka achar."),
  P("Lahsun ka Achar Meetha 500g", "Lahsun", 180, 340, "Mild", "Glass", "", "Meetha lahsun ka achar."),
  P("Lahsun Mirchi Achar 500g", "Lahsun", 180, 340, "Teekha", "Glass", "", "Lahsun + mirchi ka combo."),
  P("Lahsun ka Achar Oil Free 500g", "Lahsun", 180, 340, "Medium", "Glass", "", "Bina tel ka lahsun achar."),
  P("Lahsun ka Achar 1Kg Pack", "Lahsun", 320, 320, "Medium", "Plastic", "", "1Kg lahsun achar pack."),
  P("Lahsun ka Achar Rajasthani 500g", "Lahsun", 190, 360, "Teekha", "Ceramic", "", "Rajasthani lahsun achar."),
  P("Lahsun ka Achar Punjabi 500g", "Lahsun", 185, 350, "Teekha", "Glass", "", "Punjabi lahsun achar."),
  P("Lahsun ka Achar Sweet 500g", "Lahsun", 185, 350, "Mild", "Glass", "", "Meetha lahsun achar, gud wala."),
  P("Lahsun ka Achar Extra Garlic 500g", "Lahsun", 190, 360, "Medium", "Glass", "Premium", "Double lahsun wala achar."),

  // ===== MIRCHI - 72 to 83 =====
  P("Mirchi ka Achar 500g", "Mirchi", 150, 280, "Teekha", "Glass", "Bestseller", "Hari mirchi ka achar, teekha."),
  P("Lal Mirchi ka Achar 500g", "Mirchi", 160, 300, "Extra Teekha", "Glass", "", "Lal mirchi ka bahut teekha achar."),
  P("Hari Mirchi ka Achar 500g", "Mirchi", 150, 280, "Teekha", "Glass", "", "Hari mirchi ka achar."),
  P("Mirchi ka Achar Bharwa 500g", "Mirchi", 180, 340, "Teekha", "Glass", "Premium", "Bharwa mirchi ka achar, masala bhara."),
  P("Mirchi ka Achar Meetha 500g", "Mirchi", 160, 300, "Mild", "Glass", "", "Meethi mirchi ka achar."),
  P("Mirchi ka Achar 1Kg Pack", "Mirchi", 280, 280, "Teekha", "Plastic", "", "1Kg mirchi achar pack."),
  P("Mirchi ka Achar Rajasthani 500g", "Mirchi", 170, 320, "Teekha", "Ceramic", "", "Rajasthani mirchi achar."),
  P("Mirchi ka Achar Punjabi 500g", "Mirchi", 170, 320, "Teekha", "Glass", "", "Punjabi mirchi achar."),
  P("Mirchi ka Achar Sirka Wala 500g", "Mirchi", 160, 300, "Teekha", "Glass", "", "Sirka wali mirchi ka achar."),
  P("Mirchi ka Achar Oil Free 500g", "Mirchi", 160, 300, "Medium", "Glass", "", "Bina tel ki mirchi achar."),
  P("Mirchi ka Achar Garlic 500g", "Mirchi", 170, 320, "Teekha", "Glass", "", "Lahsun wali mirchi achar."),
  P("Mirchi ka Achar Sweet Chilli 500g", "Mirchi", 170, 320, "Mild", "Glass", "", "Meethi chilli ka achar."),

  // ===== BAAKI - 84 to 100 =====
  P("Amla ka Achar 500g", "Amla", 170, 320, "Medium", "Glass", "Premium", "Amla ka achar, vitamin C se bhara."),
  P("Karela ka Achar 500g", "Karela", 160, 300, "Medium", "Glass", "", "Karela ka achar, sugar walo ke liye."),
  P("Baingan ka Achar 500g", "Baingan", 150, 280, "Medium", "Glass", "", "Baingan ka achar, Bengali style."),
  P("Gobhi ka Achar 500g", "Gobhi", 140, 260, "Medium", "Glass", "", "Gobhi ka achar, gajar ke saath."),
  P("Adrak ka Achar 500g", "Adrak", 170, 320, "Medium", "Glass", "", "Adrak ka achar, sardi-khansi me best."),
  P("Imli ka Achar 500g", "Imli", 160, 300, "Mild", "Glass", "", "Imli ka khatta-meetha achar."),
  P("Haldi ka Achar 500g", "Haldi", 180, 340, "Mild", "Glass", "Premium", "Kacchi haldi ka achar, immunity ke liye."),
  P("Keri ka Achar 500g", "Keri", 170, 320, "Medium", "Glass", "", "Keri ka achar, Rajasthani style."),
  P("Kair Sangri Achar 500g", "Other", 200, 380, "Teekha", "Ceramic", "Premium", "Rajasthani kair sangri ka achar."),
  P("Kerda ka Achar 500g", "Other", 190, 360, "Medium", "Glass", "", "Kerda ka achar, Rajasthani."),
  P("Bamboo Shoot Achar 500g", "Other", 200, 380, "Medium", "Glass", "", "Bans ka achar, North-East style."),
  P("Mushroom Achar 500g", "Other", 220, 420, "Medium", "Glass", "Premium", "Mushroom ka achar, naya swad."),
  P("Chicken Achar 500g", "Other", 350, 650, "Teekha", "Glass", "Premium", "Chicken ka achar, non-veg wala."),
  P("Mutton Achar 500g", "Other", 450, 850, "Teekha", "Glass", "Premium", "Mutton ka achar, special."),
  P("Fish Achar 500g", "Other", 350, 650, "Teekha", "Glass", "Premium", "Fish ka achar, Kerala style."),
  P("Prawn Achar 500g", "Other", 400, 750, "Teekha", "Glass", "Premium", "Prawn ka achar, coastal style."),
  P("Achar Combo Pack - 4 Jar", "Mix", 550, 1000, "Medium", "Glass", "Bestseller", "4 jar combo - Aam + Nimbu + Mix + Mirchi, sasta padega.")
];

var _default = exports.default = { FORM_CONFIG, PRODUCTS };
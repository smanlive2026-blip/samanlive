export const FORM_CONFIG = {
  title: "Kirana Product",
  icon: "🛒",
  fields: [
    { name: "name", label: "Product Name *", type: "text", placeholder: "Aashirvaad Atta 10kg", col: "full" },
    { name: "brand", label: "Brand *", type: "text", placeholder: "Aashirvaad, Tata", col: "half" },
    { name: "category", label: "Category", type: "select", options: ["Atta","Dal","Rice","Oil","Masala","Biscuit","Namkeen","Tea","Sugar","General"], col: "half" },
    { name: "price", label: "Selling Price *", type: "number", placeholder: "480", col: "half" },
    { name: "mrp", label: "MRP", type: "number", placeholder: "500", col: "half" },
    { name: "stock", label: "Stock Qty *", type: "number", value: "100", col: "half" },
    { name: "lowStockAlert", label: "Low Stock Alert", type: "number", value: "10", col: "half" },
    { name: "weight", label: "Weight", type: "text", placeholder: "10kg, 1L", col: "half" },
    { name: "unit", label: "Unit", type: "select", options: ["packet","kg","gram","litre","ml","piece","bottle"], col: "half" },
    { name: "thumbnail", label: "Image URL", type: "text", placeholder: "https://...", col: "full" },
    { name: "description", label: "Description", type: "text", placeholder: "Fresh kirana...", col: "full" },

    { name: "isSpecial", label: "Is Special? (true = Special Card me dikhega)", type: "select", options: ["false","true"], col: "half" },
    { name: "layout", label: "Special Layout", type: "select", options: ["big","scroll","list"], col: "half" },
    { name: "badge", label: "Badge (Bestseller / Premium / New)", type: "text", placeholder: "Bestseller", col: "half" },
    { name: "quality", label: "Quality", type: "text", placeholder: "Premium, Fresh, Long Grain", col: "half" },
    { name: "cardColor", label: "Card Color", type: "text", placeholder: "#fff7ed", col: "half" },
    { name: "isPaidSpecial", label: "Paid Special? Admin ke liye", type: "select", options: ["false","true"], col: "half" }
  ]
};

export const PRODUCTS = [
  { name: "Aashirvaad Atta 10kg", brand: "Aashirvaad", category: "Atta", price: 480, mrp: 520, stock: 100, weight: "10kg", unit: "packet", thumbnail: "", description: "100% shudh gehun atta, soft roti ke liye", isSpecial: "true", layout: "big", badge: "Bestseller", quality: "Premium", cardColor: "#fff7ed" },
  { name: "Fortune Oil 1L", brand: "Fortune", category: "Oil", price: 155, mrp: 170, stock: 100, weight: "1L", unit: "bottle", thumbnail: "" },
  { name: "Tata Salt 1kg", brand: "Tata", category: "Masala", price: 28, mrp: 30, stock: 200, weight: "1kg", unit: "packet", thumbnail: "" },
  { name: "Toor Dal 1kg", brand: "Local", category: "Dal", price: 140, mrp: 160, stock: 100, weight: "1kg", unit: "packet", thumbnail: "" },
  { name: "Basmati Rice 5kg", brand: "India Gate", category: "Rice", price: 450, mrp: 500, stock: 80, weight: "5kg", unit: "packet", thumbnail: "", description: "Long grain basmati, biryani ke liye best", isSpecial: "true", layout: "scroll", badge: "Premium", quality: "Long Grain", cardColor: "#fefce8" },
  { name: "Sugar 1kg", brand: "Local", category: "Sugar", price: 45, mrp: 50, stock: 150, weight: "1kg", unit: "packet", thumbnail: "" },
  { name: "Tata Tea Gold 250g", brand: "Tata", category: "Tea", price: 145, mrp: 160, stock: 100, weight: "250g", unit: "packet", thumbnail: "" },
  { name: "Parle-G 800g", brand: "Parle", category: "Biscuit", price: 90, mrp: 100, stock: 120, weight: "800g", unit: "packet", thumbnail: "" },
  { name: "Haldiram Bhujia 400g", brand: "Haldiram", category: "Namkeen", price: 95, mrp: 110, stock: 100, weight: "400g", unit: "packet", thumbnail: "" },
  { name: "MDH Kitchen King 100g", brand: "MDH", category: "Masala", price: 55, mrp: 60, stock: 100, weight: "100g", unit: "packet", thumbnail: "" }
];

// ===== 250 AUR KIRANA PRODUCT - ASLI NAAM WALE, FAKE "Item 1,2,3" NAHI =====
const KIRANA_ITEMS = [
  ["Atta 5kg","Atta"],["Atta 10kg","Atta"],["Maida 1kg","Atta"],["Sooji 500g","Atta"],["Besan 1kg","Atta"],["Rice Flour 1kg","Atta"],
  ["Basmati Rice 1kg","Rice"],["Basmati Rice 10kg","Rice"],["Sona Masoori Rice 5kg","Rice"],["Brown Rice 1kg","Rice"],["Poha 500g","Rice"],["Idli Rice 5kg","Rice"],
  ["Toor Dal 500g","Dal"],["Moong Dal 1kg","Dal"],["Chana Dal 1kg","Dal"],["Masoor Dal 1kg","Dal"],["Urad Dal 1kg","Dal"],["Arhar Dal 500g","Dal"],["Mixed Dal 1kg","Dal"],["Kabuli Chana 1kg","Dal"],["Kala Chana 1kg","Dal"],["Rajma 1kg","Dal"],["Lobia 500g","Dal"],["Soyabean 500g","Dal"],
  ["Sunflower Oil 1L","Oil"],["Mustard Oil 1L","Oil"],["Groundnut Oil 1L","Oil"],["Coconut Oil 500ml","Oil"],["Olive Oil 500ml","Oil"],["Ghee 500ml","Oil"],["Ghee 1L","Oil"],["Refined Oil 5L","Oil"],["Sesame Oil 500ml","Oil"],
  ["Haldi Powder 200g","Masala"],["Mirchi Powder 200g","Masala"],["Dhaniya Powder 200g","Masala"],["Garam Masala 100g","Masala"],["Chaat Masala 100g","Masala"],["Kitchen King 100g","Masala"],["Sambar Masala 100g","Masala"],["Pav Bhaji Masala 100g","Masala"],["Biryani Masala 100g","Masala"],["Jeera 200g","Masala"],["Rai 200g","Masala"],["Ajwain 100g","Masala"],["Kali Mirch 100g","Masala"],["Elaichi 50g","Masala"],["Long 50g","Masala"],["Dalchini 50g","Masala"],["Hing 50g","Masala"],["Namak 1kg","Masala"],["Kala Namak 200g","Masala"],["Sendha Namak 500g","Masala"],
  ["Sugar 5kg","Sugar"],["Brown Sugar 1kg","Sugar"],["Jaggery 1kg","Sugar"],["Jaggery Powder 500g","Sugar"],["Mishri 500g","Sugar"],["Honey 500g","Sugar"],
  ["Tea 500g","Tea"],["Tea Gold 500g","Tea"],["Green Tea 100g","Tea"],["Masala Tea 250g","Tea"],["Coffee 200g","Tea"],["Instant Coffee 100g","Tea"],["Boost 500g","Tea"],["Horlicks 500g","Tea"],["Bournvita 500g","Tea"],["Complan 500g","Tea"],
  ["Parle-G 200g","Biscuit"],["Good Day 600g","Biscuit"],["Marie Gold 800g","Biscuit"],["Hide & Seek 300g","Biscuit"],["Bourbon 400g","Biscuit"],["Krackjack 400g","Biscuit"],["Monaco 400g","Biscuit"],["Nice Time 300g","Biscuit"],["50-50 400g","Biscuit"],["Dark Fantasy 300g","Biscuit"],["Oreo 300g","Biscuit"],["Rusks 300g","Biscuit"],["Khari 200g","Biscuit"],["Cake Rusk 300g","Biscuit"],
  ["Bhujia 200g","Namkeen"],["Mixture 400g","Namkeen"],["Moong Dal Namkeen 400g","Namkeen"],["Chana Jor 400g","Namkeen"],["Peanut Masala 400g","Namkeen"],["Khatta Meetha 400g","Namkeen"],["Punjabi Tadka 200g","Namkeen"],["Sev 400g","Namkeen"],["Gathiya 400g","Namkeen"],["Chips Lays 90g","Namkeen"],["Kurkure 90g","Namkeen"],["Popcorn 100g","Namkeen"],["Makhana 100g","Namkeen"],["Roasted Chana 500g","Namkeen"],
  ["Detergent 1kg","General"],["Detergent 3kg","General"],["Dish Gel 500ml","General"],["Floor Cleaner 1L","General"],["Toilet Cleaner 500ml","General"],["Glass Cleaner 500ml","General"],["Soap Lux","General"],["Soap Dove","General"],["Soap Lifebuoy","General"],["Shampoo 340ml","General"],["Hair Oil 200ml","General"],["Toothpaste 150g","General"],["Toothbrush","General"],["Tissue Roll","General"],["Napkin","General"],["Agarbatti","General"],["Mosquito Coil","General"],["Room Freshener","General"],["Handwash 200ml","General"],["Sanitizer 500ml","General"],
  ["Milk Powder 500g","General"],["Condensed Milk 400g","General"],["Paneer 200g","General"],["Curd Cup 400g","General"],["Butter 100g","General"],["Cheese Slice","General"],["Bread 400g","General"],["Pav","General"],["Bun","General"],
  ["Maggi 280g","General"],["Pasta 500g","General"],["Macaroni 500g","General"],["Vermicelli 500g","General"],["Noodles Hakka","General"],["Soup Mix","General"],["Ketchup 500g","General"],["Mayonnaise 250g","General"],["Jam 500g","General"],["Pickle 500g","General"],["Papad 200g","General"],["Soya Sauce","General"],["Vinegar","General"],
  ["Dry Fruits Almond 250g","General"],["Kaju 250g","General"],["Kishmish 250g","General"],["Pista 250g","General"],["Walnut 250g","General"],["Anjeer 250g","General"],["Dates 500g","General"],["Peanut 1kg","General"],["Cashew Broken 500g","General"],
  ["Bath Soap Pack","General"],["Face Wash","General"],["Body Lotion","General"],["Talc Powder","General"],["Deodorant","General"],["Shaving Cream","General"],["Razor Pack","General"],["Cotton Roll","General"],["Band Aid","General"],
  ["Notebook","General"],["Pen Pack","General"],["Pencil Pack","General"],["Eraser","General"],["Scale","General"],["Glue Stick","General"],["Tape Roll","General"],["Battery AA","General"],["Bulb LED 9W","General"],["Extension Board","General"]
];
const BRANDS = ["Tata","Fortune","Aashirvaad","MDH","Haldiram","Parle","Britannia","Local","Everest","Catch"];
const WEIGHTS = ["500g","1kg","250g","200g","400g","100g","1L","500ml","5kg","2kg"];

let added = 0;
for(let i=0; added<250; i++){
  const item = KIRANA_ITEMS[i % KIRANA_ITEMS.length];
  const brand = BRANDS[i % BRANDS.length];
  const baseName = item[0];
  const already = PRODUCTS.some(p=> p.name === `${brand} ${baseName}` && p.brand===brand);
  const name = already? `${brand} ${baseName} Pack ${Math.floor(i/KIRANA_ITEMS.length)+1}` : `${brand} ${baseName}`;
  const price = 25 + ((i*7) % 450);
  PRODUCTS.push({
    name: name,
    brand: brand,
    category: item[1],
    price: price,
    mrp: price + 10 + (i % 40),
    stock: 100,
    weight: WEIGHTS[i % WEIGHTS.length],
    unit: item[1]==="Oil"? "bottle" : "packet",
    thumbnail: ""
  });
  added++;
}

export default { FORM_CONFIG, PRODUCTS };
// LOCATION: public/shop-templates/common/products/patanjali.seed.js - PATANJALI BOSS - 1000 ITEMS - IMAGE WALA
export const FORM_CONFIG = {
  title: "Patanjali Product",
  icon: "🌿",
  fields: [
    { name: "name", label: "Product Name *", type: "text", placeholder: "Patanjali Cow Ghee 1L", col: "full" },
    { name: "brand", label: "Brand *", type: "text", placeholder: "Patanjali", col: "half" },
    { name: "category", label: "Category", type: "select", options: ["Atta & Grains","Ghee & Oil","Spices","Dal & Pulses","Rice","Honey & Sugar","Ayurvedic Medicine","Chyawanprash","Juice","Personal Care","Hair Care","Skin Care","Oral Care","Bath & Soap","Detergent","Agarbatti & Pooja","Snacks","Biscuits & Cookies","Noodles & Pasta","Health Drink","General"], col: "half" },
    { name: "price", label: "Selling Price *", type: "number", placeholder: "99", col: "half" },
    { name: "mrp", label: "MRP", type: "number", placeholder: "110", col: "half" },
    { name: "stock", label: "Stock Qty *", type: "number", value: "100", col: "half" },
    { name: "lowStockAlert", label: "Low Stock Alert", type: "number", value: "20", col: "half" },
    { name: "size", label: "Pack Size", type: "text", placeholder: "500g, 1kg, 200ml", col: "half" },
    { name: "color", label: "Variant", type: "text", placeholder: "Classic, Premium", col: "half" },
    { name: "weight", label: "Weight", type: "text", placeholder: "500g, 1L", col: "half" },
    { name: "unit", label: "Unit", type: "select", options: ["piece","packet","box","bottle","jar","tube"], col: "half" },
    { name: "thumbnail", label: "Image URL", type: "text", placeholder: "https://...", col: "full" },
    { name: "description", label: "Description", type: "text", placeholder: "Patanjali ayurvedic product...", col: "full" },
    { name: "isSpecial", label: "Is Special? (true = Special Card)", type: "select", options: ["false","true"], col: "half" },
    { name: "layout", label: "Special Layout", type: "select", options: ["big","scroll","list"], col: "half" },
    { name: "badge", label: "Badge (Bestseller / Ayurvedic / New)", type: "text", placeholder: "Bestseller", col: "half" },
    { name: "quality", label: "Quality", type: "text", placeholder: "Ayurvedic, Natural", col: "half" },
    { name: "cardColor", label: "Card Color", type: "text", placeholder: "#f0fdf4", col: "half" },
    { name: "isPaidSpecial", label: "Paid Special? Admin ke liye", type: "select", options: ["false","true"], col: "half" }
  ]
};

// ===== CATEGORY WISE PHOTO - UNSPLASH FREE =====
const IMG = {
  "Atta & Grains": ["https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&q=80","https://images.unsplash.com/photo-1627485937980-221c88ac04f3?w=800&q=80"],
  "Ghee & Oil": ["https://images.unsplash.com/photo-1633436375153-d7045cb93e38?w=800&q=80","https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&q=80"],
  "Spices": ["https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80","https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=800&q=80"],
  "Dal & Pulses": ["https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=800&q=80"],
  "Rice": ["https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80"],
  "Honey & Sugar": ["https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80"],
  "Ayurvedic Medicine": ["https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=800&q=80","https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=800&q=80"],
  "Chyawanprash": ["https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80"],
  "Juice": ["https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&q=80","https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=800&q=80"],
  "Personal Care": ["https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80"],
  "Hair Care": ["https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800&q=80"],
  "Skin Care": ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80"],
  "Oral Care": ["https://images.unsplash.com/photo-1559671210728-a4f2f0c3d1e1?w=800&q=80"],
  "Bath & Soap": ["https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=800&q=80"],
  "Detergent": ["https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=800&q=80"],
  "Agarbatti & Pooja": ["https://images.unsplash.com/photo-1602523961358-f9f03dd557db?w=800&q=80"],
  "Snacks": ["https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=800&q=80"],
  "Biscuits & Cookies": ["https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&q=80"],
  "Noodles & Pasta": ["https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80"],
  "Health Drink": ["https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=800&q=80"],
  "General": ["https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80","https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&q=80"]
};
function getImage(category, seed){
  const list = IMG[category] || IMG.General;
  return list[Math.abs(seed) % list.length];
}

export const PRODUCTS = [
  { name: "Patanjali Cow Ghee 1L", brand: "Patanjali", category: "Ghee & Oil", price: 650, mrp: 720, stock: 50, size: "1L", color: "Cow Ghee", weight: "1L", unit: "jar", thumbnail: IMG["Ghee & Oil"][0], description: "Shudh gay ka ghee, danedar", isSpecial: "true", layout: "big", badge: "Bestseller", quality: "Pure Cow Ghee", cardColor: "#fefce8" },
  { name: "Patanjali Chyawanprash 1kg", brand: "Patanjali", category: "Chyawanprash", price: 340, mrp: 395, stock: 60, size: "1kg", color: "Special", weight: "1kg", unit: "jar", thumbnail: IMG.Chyawanprash[0], description: "Immunity ke liye special chyawanprash", isSpecial: "true", layout: "big", badge: "Immunity", quality: "Ayurvedic", cardColor: "#f0fdf4" },
  { name: "Patanjali Dant Kanti Toothpaste 200g", brand: "Patanjali", category: "Oral Care", price: 90, mrp: 100, stock: 120, size: "200g", color: "Regular", weight: "200g", unit: "tube", thumbnail: IMG["Oral Care"][0], description: "Ayurvedic dant manjan", isSpecial: "true", layout: "big", badge: "Bestseller", quality: "Ayurvedic", cardColor: "#eff6ff" },
  { name: "Patanjali Aloe Vera Juice 1L", brand: "Patanjali", category: "Juice", price: 180, mrp: 210, stock: 80, size: "1L", color: "Aloe Vera", weight: "1L", unit: "bottle", thumbnail: IMG.Juice[0] },
  { name: "Patanjali Atta 10kg", brand: "Patanjali", category: "Atta & Grains", price: 420, mrp: 475, stock: 40, size: "10kg", color: "Whole Wheat", weight: "10kg", unit: "packet", thumbnail: IMG["Atta & Grains"][0] },
  { name: "Patanjali Honey 500g", brand: "Patanjali", category: "Honey & Sugar", price: 199, mrp: 230, stock: 70, size: "500g", color: "Pure Honey", weight: "500g", unit: "jar", thumbnail: IMG["Honey & Sugar"][0] }
];

const ITEMS = [
  ["Cow Ghee 200ml","Ghee & Oil",160],["Cow Ghee 500ml","Ghee & Oil",360],["Cow Ghee 1L","Ghee & Oil",650],["Cow Ghee 5L","Ghee & Oil",3100],["Kachi Ghani Mustard Oil 1L","Ghee & Oil",210],["Kachi Ghani Mustard Oil 5L","Ghee & Oil",999],["Sunflower Oil 1L","Ghee & Oil",145],["Groundnut Oil 1L","Ghee & Oil",230],["Coconut Oil 200ml","Ghee & Oil",85],["Coconut Oil 500ml","Ghee & Oil",190],["Sesame Oil 200ml","Ghee & Oil",110],["Olive Oil 200ml","Ghee & Oil",320],
  ["Whole Wheat Atta 5kg","Atta & Grains",220],["Whole Wheat Atta 10kg","Atta & Grains",420],["Multigrain Atta 5kg","Atta & Grains",260],["Besan 500g","Atta & Grains",55],["Besan 1kg","Atta & Grains",105],["Maida 500g","Atta & Grains",35],["Sooji Rava 500g","Atta & Grains",40],["Rice Flour 500g","Atta & Grains",45],["Poha 500g","Atta & Grains",48],["Dalia 500g","Atta & Grains",52],["Oats 500g","Atta & Grains",95],["Oats 1kg","Atta & Grains",180],
  ["Basmati Rice 1kg","Rice",120],["Basmati Rice 5kg","Rice",550],["Brown Rice 1kg","Rice",95],["Sona Masoori Rice 5kg","Rice",320],["Arhar Dal 1kg","Dal & Pulses",145],["Moong Dal 1kg","Dal & Pulses",135],["Chana Dal 1kg","Dal & Pulses",85],["Masoor Dal 1kg","Dal & Pulses",95],["Urad Dal 1kg","Dal & Pulses",125],["Kabuli Chana 1kg","Dal & Pulses",115],["Rajma 1kg","Dal & Pulses",130],["Soyabean 500g","Dal & Pulses",65],
  ["Haldi Powder 200g","Spices",45],["Mirchi Powder 200g","Spices",55],["Dhania Powder 200g","Spices",42],["Garam Masala 100g","Spices",65],["Chaat Masala 100g","Spices",48],["Jeera 200g","Spices",95],["Ajwain 100g","Spices",40],["Methi Dana 100g","Spices",35],["Kala Namak 200g","Spices",30],["Sendha Namak 1kg","Spices",45],["Sabut Garam Masala 100g","Spices",85],["Amchur Powder 100g","Spices",50],
  ["Honey 250g","Honey & Sugar",110],["Honey 500g","Honey & Sugar",199],["Honey 1kg","Honey & Sugar",380],["Sugar 1kg","Honey & Sugar",45],["Brown Sugar 500g","Honey & Sugar",65],["Jaggery 500g","Honey & Sugar",55],["Jaggery Powder 500g","Honey & Sugar",70],["Mishri 250g","Honey & Sugar",60],
  ["Aloe Vera Juice 500ml","Juice",110],["Aloe Vera Juice 1L","Juice",180],["Amla Juice 500ml","Juice",95],["Amla Juice 1L","Juice",170],["Giloy Juice 500ml","Juice",120],["Neem Juice 500ml","Juice",105],["Karela Jamun Juice 500ml","Juice",130],["Triphala Juice 500ml","Juice",115],["Wheatgrass Juice 500ml","Juice",125],["Orange Juice 1L","Juice",110],["Mixed Fruit Juice 1L","Juice",115],["Litchi Drink 1L","Juice",99],
  ["Chyawanprash 500g","Chyawanprash",185],["Chyawanprash 1kg","Chyawanprash",340],["Special Chyawanprash 1kg","Chyawanprash",420],["Badam Pak 250g","Ayurvedic Medicine",180],["Ashwagandha Churna 100g","Ayurvedic Medicine",85],["Ashwagandha Tablet 60","Ayurvedic Medicine",140],["Triphala Churna 100g","Ayurvedic Medicine",70],["Giloy Ghanvati 60","Ayurvedic Medicine",110],["Neem Ghanvati 60","Ayurvedic Medicine",95],["Tulsi Ghanvati 60","Ayurvedic Medicine",100],["Amla Churna 100g","Ayurvedic Medicine",65],["Shatavari Churna 100g","Ayurvedic Medicine",120],["Mulethi Churna 100g","Ayurvedic Medicine",75],["Harad Churna 100g","Ayurvedic Medicine",60],["Baheda Churna 100g","Ayurvedic Medicine",60],["Isabgol 100g","Ayurvedic Medicine",85],["Isabgol 200g","Ayurvedic Medicine",160],["Kayam Churna 100g","Ayurvedic Medicine",95],["Divya Peya 100g","Health Drink",55],["Herbal Tea 100g","Health Drink",90],
  ["Dant Kanti Regular 100g","Oral Care",50],["Dant Kanti Regular 200g","Oral Care",90],["Dant Kanti Medicated 100g","Oral Care",65],["Dant Kanti Advanced 100g","Oral Care",80],["Dant Kanti Junior 80g","Oral Care",45],["Toothbrush Soft","Oral Care",25],["Toothbrush Medium","Oral Care",25],["Mouth Freshener","Oral Care",35],
  ["Kesh Kanti Hair Oil 200ml","Hair Care",85],["Kesh Kanti Hair Oil 300ml","Hair Care",120],["Kesh Kanti Shampoo 200ml","Hair Care",95],["Kesh Kanti Aloe Vera Shampoo 200ml","Hair Care",99],["Kesh Kanti Reetha Shampoo 200ml","Hair Care",99],["Kesh Kanti Conditioner 100ml","Hair Care",75],["Bhringraj Oil 200ml","Hair Care",110],["Almond Hair Oil 200ml","Hair Care",105],["Coconut Hair Oil 200ml","Hair Care",70],["Hair Colour Black","Hair Care",65],
  ["Aloe Vera Gel 150ml","Skin Care",90],["Aloe Vera Gel 60ml","Skin Care",45],["Sandal Face Wash 60g","Skin Care",55],["Neem Face Wash 60g","Skin Care",55],["Orange Face Wash 60g","Skin Care",55],["Body Lotion 200ml","Skin Care",95],["Moisturizer Cream 50g","Skin Care",75],["Sunscreen SPF30 50g","Skin Care",120],["Fairness Cream 50g","Skin Care",85],["Lip Balm","Skin Care",40],["Rose Water 120ml","Skin Care",45],["Multani Mitti 100g","Skin Care",35],
  ["Neem Soap 75g","Bath & Soap",30],["Haldi Chandan Soap 75g","Bath & Soap",30],["Aloe Vera Soap 75g","Bath & Soap",32],["Rose Soap 75g","Bath & Soap",30],["Lemon Soap 75g","Bath & Soap",28],["Body Wash 200ml","Bath & Soap",95],["Hand Wash 200ml","Personal Care",65],["Hand Sanitizer 200ml","Personal Care",60],["Detergent Powder 1kg","Detergent",85],["Detergent Cake 200g","Detergent",22],["Dishwash Gel 500ml","Detergent",85],["Dishwash Bar","Detergent",18],["Floor Cleaner 500ml","Detergent",75],
  ["Sandal Agarbatti","Agarbatti & Pooja",40],["Rose Agarbatti","Agarbatti & Pooja",40],["Mogra Agarbatti","Agarbatti & Pooja",40],["Dhoop Batti","Agarbatti & Pooja",35],["Camphor 100g","Agarbatti & Pooja",90],["Ganga Jal 200ml","Agarbatti & Pooja",30],["Hawan Samagri 500g","Agarbatti & Pooja",85],
  ["Doosra Biscuit 200g","Biscuits & Cookies",35],["Marie Biscuit 300g","Biscuits & Cookies",40],["Cookies 200g","Biscuits & Cookies",55],["Cream Biscuit 100g","Biscuits & Cookies",25],["Namkeen Mixture 200g","Snacks",45],["Aloo Bhujia 200g","Snacks",50],["Roasted Chana 200g","Snacks",55],["Peanuts 200g","Snacks",48],["Atta Noodles","Noodles & Pasta",14],["Atta Noodles Family Pack","Noodles & Pasta",55],["Pasta 200g","Noodles & Pasta",45],["Vermicelli 400g","Noodles & Pasta",42],
  ["Protein Powder 500g","Health Drink",450],["Whey Protein 1kg","Health Drink",1450],["Badam Drink Mix 200g","Health Drink",140],["Horlicks Type Mix 500g","Health Drink",220],["Cornflakes 500g","Snacks",160],["Muesli 500g","Snacks",210]
];

const VARIANTS = ["Classic","Premium","Special","Regular","Advanced","Family Pack","Value Pack","New","Herbal","Natural"];
const PACKS = ["100g","200g","500g","1kg","200ml","500ml","1L","75g","250g","400g"];

let added = 0;
for(let i=0; added<1000; i++){
  const item = ITEMS[i % ITEMS.length];
  const cycle = Math.floor(i / ITEMS.length) + 1;
  const variant = VARIANTS[i % VARIANTS.length];
  const pack = PACKS[i % PACKS.length];
  const name = cycle === 1? `Patanjali ${item[0]}` : `Patanjali ${item[0]} ${variant} ${pack} V${cycle}`;
  if(PRODUCTS.some(p=>p.name===name)){ added++; continue; }
  const basePrice = item[2] || 50;
  const price = cycle === 1? basePrice : basePrice + (cycle * 3) + (i % 30);
  PRODUCTS.push({
    name, brand: "Patanjali", category: item[1],
    price, mrp: price + Math.ceil(price * 0.15),
    stock: 100, lowStockAlert: 20,
    size: pack, weight: pack,
    unit: item[1]==="Juice" || item[1]==="Ghee & Oil"? "bottle" : "packet",
    thumbnail: getImage(item[1], i),
    color: variant, description: "Patanjali natural aur ayurvedic product"
  });
  added++;
}
export default { FORM_CONFIG, PRODUCTS };
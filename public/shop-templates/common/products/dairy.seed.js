// LOCATION: public/shop-templates/common/products/dairy.seed.js - DAIRY BOSS - 100+ ITEMS - IMAGE WALA
export const FORM_CONFIG = {
  title: "Dairy Product",
  icon: "🥛",
  fields: [
    { name: "name", label: "Product Name *", type: "text", placeholder: "Amul Taaza Milk 500ml", col: "full" },
    { name: "brand", label: "Brand *", type: "text", placeholder: "Amul, Mother Dairy, Gokul", col: "half" },
    { name: "category", label: "Category", type: "select", options: ["Milk","Curd","Paneer","Ghee","Butter","Cheese","Cream","Buttermilk","Lassi","Ice Cream","Sweets","Milk Powder","Flavoured Milk","Yogurt","General"], col: "half" },
    { name: "price", label: "Selling Price *", type: "number", placeholder: "28", col: "half" },
    { name: "mrp", label: "MRP", type: "number", placeholder: "30", col: "half" },
    { name: "stock", label: "Stock Qty *", type: "number", value: "100", col: "half" },
    { name: "lowStockAlert", label: "Low Stock Alert", type: "number", value: "20", col: "half" },
    { name: "size", label: "Pack Size", type: "text", placeholder: "500ml, 1L, 200g, 500g", col: "half" },
    { name: "color", label: "Variant / Flavour", type: "text", placeholder: "Full Cream, Toned, Chocolate", col: "half" },
    { name: "weight", label: "Weight", type: "text", placeholder: "500ml, 1kg", col: "half" },
    { name: "unit", label: "Unit", type: "select", options: ["piece","packet","box","bottle","cup","tin"], col: "half" },
    { name: "thumbnail", label: "Image URL", type: "text", placeholder: "https://...", col: "full" },
    { name: "description", label: "Description", type: "text", placeholder: "Fresh dairy product...", col: "full" },
    { name: "isSpecial", label: "Is Special? (true = Special Card)", type: "select", options: ["false","true"], col: "half" },
    { name: "layout", label: "Special Layout", type: "select", options: ["big","scroll","list"], col: "half" },
    { name: "badge", label: "Badge (Bestseller / Fresh / Premium)", type: "text", placeholder: "Bestseller", col: "half" },
    { name: "quality", label: "Quality", type: "text", placeholder: "Farm Fresh, Premium", col: "half" },
    { name: "cardColor", label: "Card Color", type: "text", placeholder: "#eff6ff", col: "half" },
    { name: "isPaidSpecial", label: "Paid Special? Admin ke liye", type: "select", options: ["false","true"], col: "half" }
  ]
};

// ===== CATEGORY WISE PHOTO - UNSPLASH FREE =====
const IMG = {
  Milk: [
    "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&q=80",
    "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&q=80"
  ],
  Curd: [
    "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80",
    "https://images.unsplash.com/photo-1571212515416-fef01fc436a8?w=800&q=80"
  ],
  Paneer: [
    "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&q=80"
  ],
  Ghee: [
    "https://images.unsplash.com/photo-1633436375153-d7045cb93e38?w=800&q=80"
  ],
  Butter: [
    "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=800&q=80"
  ],
  Cheese: [
    "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800&q=80",
    "https://images.unsplash.com/photo-1452195100486-9cc805987862?w=800&q=80"
  ],
  Cream: [
    "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&q=80"
  ],
  Buttermilk: [
    "https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=800&q=80"
  ],
  Lassi: [
    "https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=800&q=80"
  ],
  "Ice Cream": [
    "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80",
    "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=800&q=80"
  ],
  Sweets: [
    "https://images.unsplash.com/photo-1605197161470-5d5f2d2e2e2e?w=800&q=80",
    "https://images.unsplash.com/photo-1610508500445-a4592435e27e?w=800&q=80"
  ],
  "Milk Powder": [
    "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&q=80"
  ],
  "Flavoured Milk": [
    "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80"
  ],
  Yogurt: [
    "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80"
  ],
  General: [
    "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&q=80",
    "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&q=80"
  ]
};
function getImage(category, seed){
  const list = IMG[category] || IMG.General;
  return list[Math.abs(seed) % list.length];
}

export const PRODUCTS = [
  { name: "Amul Taaza Toned Milk 500ml", brand: "Amul", category: "Milk", price: 28, mrp: 30, stock: 100, size: "500ml", color: "Toned", weight: "500ml", unit: "packet", thumbnail: IMG.Milk[0], description: "Roz ka taaza toned doodh", isSpecial: "true", layout: "big", badge: "Bestseller", quality: "Farm Fresh", cardColor: "#eff6ff" },
  { name: "Amul Gold Full Cream Milk 500ml", brand: "Amul", category: "Milk", price: 34, mrp: 36, stock: 80, size: "500ml", color: "Full Cream", weight: "500ml", unit: "packet", thumbnail: IMG.Milk[1], description: "Full cream, chai aur mithaas ke liye best", isSpecial: "true", layout: "big", badge: "Premium", quality: "Full Cream", cardColor: "#fff7ed" },
  { name: "Amul Fresh Paneer 200g", brand: "Amul", category: "Paneer", price: 95, mrp: 110, stock: 50, size: "200g", color: "Malai Paneer", weight: "200g", unit: "packet", thumbnail: IMG.Paneer[0] },
  { name: "Amul Pure Ghee 1L", brand: "Amul", category: "Ghee", price: 650, mrp: 720, stock: 30, size: "1L", color: "Danedar", weight: "1L", unit: "tin", thumbnail: IMG.Ghee[0], description: "Shudh danedar ghee", isSpecial: "true", layout: "big", badge: "Premium", quality: "Pure Ghee", cardColor: "#fefce8" },
  { name: "Amul Butter 100g", brand: "Amul", category: "Butter", price: 58, mrp: 62, stock: 60, size: "100g", color: "Salted", weight: "100g", unit: "packet", thumbnail: IMG.Butter[0] },
  { name: "Amul Cheese Slice 200g", brand: "Amul", category: "Cheese", price: 130, mrp: 145, stock: 40, size: "200g", color: "Slice", weight: "200g", unit: "packet", thumbnail: IMG.Cheese[0] }
];

const ITEMS = [
  // MILK - 20
  ["Taaza Toned Milk 500ml","Milk",28],["Taaza Toned Milk 1L","Milk",55],["Gold Full Cream Milk 500ml","Milk",34],["Gold Full Cream Milk 1L","Milk",66],["Cow Milk 500ml","Milk",30],["Buffalo Milk 500ml","Milk",38],["Buffalo Milk 1L","Milk",75],["Skimmed Milk 500ml","Milk",26],["UHT Milk 1L","Milk",68],["Chocolate Milk 200ml","Flavoured Milk",35],["Badam Milk 200ml","Flavoured Milk",40],["Rose Milk 200ml","Flavoured Milk",35],["Kesar Badam Milk 200ml","Flavoured Milk",45],["Cold Coffee 200ml","Flavoured Milk",45],["Buttermilk Masala 500ml","Buttermilk",25],["Buttermilk Plain 200ml","Buttermilk",15],["Sweet Lassi 200ml","Lassi",40],["Mango Lassi 200ml","Lassi",45],["Punjabi Lassi 400ml","Lassi",70],["Chaas Tetra Pack 200ml","Buttermilk",18],
  // CURD / DAHI - 12
  ["Fresh Curd Cup 200g","Curd",35],["Fresh Curd Cup 400g","Curd",65],["Dahi Pouch 500g","Curd",35],["Dahi Pouch 1kg","Curd",65],["Mishti Doi 100g","Curd",30],["Greek Yogurt 100g","Yogurt",60],["Fruit Yogurt Strawberry 100g","Yogurt",45],["Fruit Yogurt Mango 100g","Yogurt",45],["Hung Curd 200g","Curd",50],["Curd Bucket 1kg","Curd",110],["Curd Bucket 5kg","Curd",450],["Probiotic Curd 200g","Curd",55],
  // PANEER - 8
  ["Fresh Paneer 200g","Paneer",95],["Fresh Paneer 500g","Paneer",220],["Malai Paneer 200g","Paneer",110],["Malai Paneer 500g","Paneer",260],["Low Fat Paneer 200g","Paneer",90],["Paneer Cubes 200g","Paneer",105],["Smoked Paneer 200g","Paneer",140],["Paneer 1kg Pack","Paneer",420],
  // GHEE - 8
  ["Pure Ghee 200ml","Ghee",150],["Pure Ghee 500ml","Ghee",340],["Pure Ghee 1L","Ghee",650],["Pure Ghee 5L Tin","Ghee",3100],["Cow Ghee 500ml","Ghee",420],["Cow Ghee 1L","Ghee",820],["Buffalo Ghee 1L","Ghee",700],["Organic Ghee 500ml","Ghee",550],
  // BUTTER / CHEESE / CREAM - 18
  ["Butter 100g","Butter",58],["Butter 500g","Butter",275],["White Butter 200g","Butter",90],["Garlic Butter 100g","Butter",75],["Cheese Slice 200g","Cheese",130],["Cheese Cube 200g","Cheese",125],["Cheese Block 200g","Cheese",120],["Cheese Block 1kg","Cheese",520],["Mozzarella Cheese 200g","Cheese",135],["Processed Cheese 400g","Cheese",210],["Cheese Spread 200g","Cheese",95],["Fresh Cream 200ml","Cream",55],["Fresh Cream 1L","Cream",240],["Whipping Cream 1L","Cream",320],["Malai Cream 200g","Cream",60],["Sour Cream 200g","Cream",110],["Cream Cheese 200g","Cheese",160],["Parmesan Cheese 100g","Cheese",220],
  // SWEETS / ICE CREAM / POWDER - 24
  ["Gulab Jamun 500g","Sweets",180],["Rasgulla 500g","Sweets",160],["Rasmalai 500g","Sweets",220],["Kaju Katli 250g","Sweets",320],["Motichur Laddu 500g","Sweets",240],["Besan Laddu 500g","Sweets",220],["Milk Cake 500g","Sweets",260],["Kalakand 500g","Sweets",280],["Peda 500g","Sweets",250],["Shrikhand 500g","Sweets",140],["Basundi 500g","Sweets",170],["Vanilla Ice Cream 700ml","Ice Cream",180],["Chocolate Ice Cream 700ml","Ice Cream",210],["Butterscotch Ice Cream 700ml","Ice Cream",200],["Mango Ice Cream 700ml","Ice Cream",190],["Kulfi Pack 4pc","Ice Cream",120],["Choco Bar Ice Cream","Ice Cream",40],["Cornetto Cone","Ice Cream",60],["Family Pack Ice Cream 4L","Ice Cream",650],["Milk Powder 500g","Milk Powder",240],["Milk Powder 1kg","Milk Powder",460],["Dairy Whitener 500g","Milk Powder",220],["Skimmed Milk Powder 500g","Milk Powder",260],["Tea Powder Mix Dairy 500g","Milk Powder",230]
];

const BRANDS = ["Amul","Mother Dairy","Gokul","Aarey","Verka","Nandini","Britannia","Nestle","Milky Mist","Local Fresh"];
const PACKS = ["200g","500g","1kg","200ml","500ml","1L","100g","400g"];

let added = PRODUCTS.length;
for(let i=0; added<140; i++){
  const item = ITEMS[i % ITEMS.length];
  const cycle = Math.floor(i / ITEMS.length);
  if(cycle === 0 && PRODUCTS.some(p=>p.name.includes(item[0]))){ added++; continue; }
  const brand = cycle === 0? "Amul" : BRANDS[i % BRANDS.length];
  const name = cycle === 0? `${brand} ${item[0]}` : `${brand} ${item[0]} V${cycle+1}`;
  if(PRODUCTS.some(p=>p.name===name)) { added++; continue; }
  const basePrice = item[2] || 50;
  const price = cycle === 0? basePrice : basePrice + (cycle * 5) + (i % 20);
  PRODUCTS.push({
    name, brand, category: item[1],
    price, mrp: price + Math.ceil(price * 0.12),
    stock: 100, lowStockAlert: 20,
    size: PACKS[i % PACKS.length], weight: PACKS[i % PACKS.length],
    unit: item[1]==="Milk" || item[1]==="Flavoured Milk" || item[1]==="Buttermilk" || item[1]==="Lassi"? "packet" : "packet",
    thumbnail: getImage(item[1], i),
    color: "", description: "Fresh dairy product, roz taaza supply"
  });
  added++;
}
export default { FORM_CONFIG, PRODUCTS };
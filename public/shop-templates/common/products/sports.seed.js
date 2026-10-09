// LOCATION: public/shop-templates/common/products/sports.seed.js - SPORTS BOSS - 1000 ITEMS - IMAGE WALA - KAPDE + SPORTS SAB
export const FORM_CONFIG = {
  title: "Sports Product",
  icon: "🏏",
  fields: [
    { name: "name", label: "Product Name *", type: "text", placeholder: "Nike Running Shoes", col: "full" },
    { name: "brand", label: "Brand *", type: "text", placeholder: "Nike, Adidas, SG, Yonex", col: "half" },
    { name: "category", label: "Category", type: "select", options: ["Cricket","Football","Badminton","Tennis","Fitness","Gym Wear","Sports Shoes","Running","Cycling","Swimming","Boxing","Yoga","Skating","Carrom","Chess","Kids Sports","General"], col: "half" },
    { name: "price", label: "Selling Price *", type: "number", placeholder: "999", col: "half" },
    { name: "mrp", label: "MRP", type: "number", placeholder: "1299", col: "half" },
    { name: "stock", label: "Stock Qty *", type: "number", value: "50", col: "half" },
    { name: "lowStockAlert", label: "Low Stock Alert", type: "number", value: "10", col: "half" },
    { name: "size", label: "Size", type: "text", placeholder: "7,8,9,10 / S,M,L,XL", col: "half" },
    { name: "color", label: "Color", type: "text", placeholder: "Black, Blue, Red", col: "half" },
    { name: "weight", label: "Weight", type: "text", placeholder: "500g, 1kg", col: "half" },
    { name: "unit", label: "Unit", type: "select", options: ["piece","pair","set","packet","box"], col: "half" },
    { name: "thumbnail", label: "Image URL", type: "text", placeholder: "https://...", col: "full" },
    { name: "description", label: "Description", type: "text", placeholder: "Original sports item...", col: "full" },
    { name: "isSpecial", label: "Is Special? (true = Special Card)", type: "select", options: ["false","true"], col: "half" },
    { name: "layout", label: "Special Layout", type: "select", options: ["big","scroll","list"], col: "half" },
    { name: "badge", label: "Badge (Bestseller / Premium / New)", type: "text", placeholder: "Bestseller", col: "half" },
    { name: "quality", label: "Quality", type: "text", placeholder: "Premium, Original", col: "half" },
    { name: "cardColor", label: "Card Color", type: "text", placeholder: "#eff6ff", col: "half" },
    { name: "isPaidSpecial", label: "Paid Special? Admin ke liye", type: "select", options: ["false","true"], col: "half" }
  ]
};

// ===== CATEGORY WISE PHOTO - UNSPLASH FREE, HAR CATEGORY KI 2-3 PHOTO GHUMEGI =====
const IMG = {
  Cricket: [
    "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80",
    "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=800&q=80",
    "https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=800&q=80"
  ],
  Football: [
    "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80",
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80",
    "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&q=80"
  ],
  Badminton: [
    "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80",
    "https://images.unsplash.com/photo-1613918431703-aa50889e3be9?w=800&q=80"
  ],
  Tennis: [
    "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80",
    "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&q=80"
  ],
  Fitness: [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80"
  ],
  "Gym Wear": [
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
    "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&q=80"
  ],
  "Sports Shoes": [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80",
    "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80"
  ],
  Running: [
    "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80",
    "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80"
  ],
  Cycling: [
    "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80",
    "https://images.unsplash.com/photo-1471506480208-91b3a4cc78be?w=800&q=80"
  ],
  Swimming: [
    "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&q=80",
    "https://images.unsplash.com/photo-1600965962102-9d260a71890d?w=800&q=80"
  ],
  Boxing: [
    "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&q=80",
    "https://images.unsplash.com/photo-1517438322307-e67111335449?w=800&q=80"
  ],
  Yoga: [
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80"
  ],
  Skating: [
    "https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=800&q=80",
    "https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=800&q=80"
  ],
  Carrom: [
    "https://images.unsplash.com/photo-1611374243147-44a702c2d44c?w=800&q=80"
  ],
  Chess: [
    "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&q=80",
    "https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=800&q=80"
  ],
  "Kids Sports": [
    "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800&q=80",
    "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&q=80"
  ],
  General: [
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80",
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&q=80",
    "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80"
  ]
};
function getImage(category, seed){
  const list = IMG[category] || IMG.General;
  return list[Math.abs(seed) % list.length];
}

export const PRODUCTS = [
  { name: "SG English Willow Cricket Bat", brand: "SG", category: "Cricket", price: 5499, mrp: 6999, stock: 20, size: "Full Size", color: "Natural", weight: "1.1kg", unit: "piece", thumbnail: IMG.Cricket[0], description: "English willow, powerful strokes ke liye", isSpecial: "true", layout: "big", badge: "Premium", quality: "English Willow", cardColor: "#eff6ff" },
  { name: "Nike Running Shoes Revolution", brand: "Nike", category: "Sports Shoes", price: 2995, mrp: 3995, stock: 40, size: "7,8,9,10", color: "Black", weight: "600g", unit: "pair", thumbnail: IMG["Sports Shoes"][0], description: "Lightweight running shoes", isSpecial: "true", layout: "big", badge: "Bestseller", quality: "Premium", cardColor: "#fff7ed" },
  { name: "Adidas Football Size 5", brand: "Adidas", category: "Football", price: 1499, mrp: 1999, stock: 50, size: "5", color: "White", weight: "450g", unit: "piece", thumbnail: IMG.Football[0] },
  { name: "Yonex Badminton Racket", brand: "Yonex", category: "Badminton", price: 1899, mrp: 2499, stock: 30, size: "Standard", color: "Blue", weight: "90g", unit: "piece", thumbnail: IMG.Badminton[0] },
  { name: "Cosco Tennis Ball Pack 3", brand: "Cosco", category: "Tennis", price: 299, mrp: 399, stock: 100, size: "Standard", color: "Yellow", weight: "180g", unit: "packet", thumbnail: IMG.Tennis[0] }
];

const ITEMS = [
  ["Cricket Bat Kashmir Willow","Cricket"],["Cricket Bat English Willow","Cricket"],["Cricket Ball Leather","Cricket"],["Cricket Ball Tennis","Cricket"],["Cricket Batting Gloves","Cricket"],["Cricket Wicket Keeping Gloves","Cricket"],["Cricket Batting Pads","Cricket"],["Cricket Helmet","Cricket"],["Cricket Shoes Spikes","Cricket"],["Cricket Jersey","Cricket"],["Cricket Trouser","Cricket"],["Cricket Kit Bag","Cricket"],["Cricket Stumps Set","Cricket"],["Cricket Bails","Cricket"],["Cricket Cap","Cricket"],["Cricket Sunglasses","Cricket"],["Cricket Inner Gloves","Cricket"],["Cricket Thigh Guard","Cricket"],["Cricket Arm Guard","Cricket"],["Cricket Chest Guard","Cricket"],
  ["Football Size 3","Football"],["Football Size 4","Football"],["Football Size 5","Football"],["Football Shoes Studs","Football"],["Football Jersey Set","Football"],["Football Shorts","Football"],["Football Socks","Football"],["Football Shin Guard","Football"],["Goalkeeper Gloves","Football"],["Football Pump","Football"],["Football Net","Football"],["Football Cone Set","Football"],["Football Training Ladder","Football"],["Football Cap","Football"],["Football Kit Bag","Football"],
  ["Badminton Racket Steel","Badminton"],["Badminton Racket Carbon","Badminton"],["Badminton Shuttle Feather","Badminton"],["Badminton Shuttle Nylon","Badminton"],["Badminton Shoes","Badminton"],["Badminton Jersey","Badminton"],["Badminton Grip","Badminton"],["Badminton Net","Badminton"],["Badminton Kit Bag","Badminton"],["Tennis Racket","Tennis"],["Tennis Ball Can","Tennis"],["Tennis Shoes","Tennis"],["Tennis Grip","Tennis"],["Table Tennis Bat","Tennis"],["Table Tennis Ball","Tennis"],["Table Tennis Table","Tennis"],
  ["Dumbbell 2.5kg Pair","Fitness"],["Dumbbell 5kg Pair","Fitness"],["Dumbbell 10kg Pair","Fitness"],["Dumbbell 15kg Pair","Fitness"],["Dumbbell 20kg Pair","Fitness"],["Kettlebell 8kg","Fitness"],["Kettlebell 12kg","Fitness"],["Barbell Rod 4ft","Fitness"],["Barbell Rod 5ft","Fitness"],["Barbell Rod 7ft Olympic","Fitness"],["Weight Plate 2.5kg","Fitness"],["Weight Plate 5kg","Fitness"],["Weight Plate 10kg","Fitness"],["Resistance Band Light","Fitness"],["Resistance Band Heavy","Fitness"],["Yoga Mat 4mm","Yoga"],["Yoga Mat 6mm","Yoga"],["Yoga Mat 8mm","Yoga"],["Yoga Block","Yoga"],["Yoga Belt","Yoga"],["Pushup Board","Fitness"],["Skipping Rope","Fitness"],["Gym Gloves","Fitness"],["Gym Belt","Fitness"],["Wrist Band","Fitness"],["Head Band","Fitness"],["Gym Bag","Fitness"],["Shaker Bottle 700ml","Fitness"],["Protein Shaker","Fitness"],["Hand Gripper","Fitness"],["Ab Roller","Fitness"],["Pullup Bar Door","Fitness"],["Exercise Cycle","Fitness"],["Treadmill Belt Oil","Fitness"],
  ["Sports T-Shirt Dry Fit","Gym Wear"],["Sports Jersey Team","Gym Wear"],["Sports Shorts","Gym Wear"],["Track Pant","Gym Wear"],["Track Suit Upper Lower","Gym Wear"],["Gym Vest Sando","Fitness"],["Compression T-Shirt","Gym Wear"],["Sports Bra Women","Gym Wear"],["Leggings Women Sports","Gym Wear"],["Sports Cap","Gym Wear"],["Sports Socks Cotton","Gym Wear"],["Sports Socks Ankle","Gym Wear"],["Winter Sports Jacket","Gym Wear"],["Rain Sports Jacket","Gym Wear"],["Cricket White Dress Set","Cricket"],["Football Jersey Kids","Football"],["Sports Uniform School","Kids Sports"],["Karate Dress","Boxing"],["Taekwondo Dress","Boxing"],["Judo Dress","Boxing"],
  ["Running Shoes Men","Running"],["Running Shoes Women","Running"],["Walking Shoes","Running"],["Cricket Shoes Rubber","Cricket"],["Football Shoes Turf","Football"],["Badminton Shoes Non Marking","Badminton"],["Basketball Shoes","General"],["Skating Shoes","Skating"],["Cycling Shoes","Cycling"],["Gym Training Shoes","Fitness"],["Sports Sandal","General"],["Kids Sports Shoes","Kids Sports"],
  ["Basketball Size 7","General"],["Basketball Ring Net","General"],["Volleyball","General"],["Volleyball Net","General"],["Volleyball Shoes","General"],["Hockey Stick","General"],["Hockey Ball","General"],["Baseball Bat","General"],["Baseball Glove","General"],["Skateboard","Skating"],["Roller Skates","Skating"],["Skating Helmet","Skating"],["Skating Knee Pad","Skating"],["Cycling Helmet","Cycling"],["Cycling Gloves","Cycling"],["Cycle Pump","Cycling"],["Cycle Lock","Cycling"],["Swimming Goggles","Swimming"],["Swimming Cap","Swimming"],["Swimming Costume Men","Swimming"],["Swimming Costume Women","Swimming"],["Swimming Ring Kids","Swimming"],["Boxing Gloves 10oz","Boxing"],["Boxing Gloves 12oz","Boxing"],["Boxing Punching Bag","Boxing"],["Boxing Hand Wrap","Boxing"],["Boxing Head Guard","Boxing"],["Carrom Board","Carrom"],["Carrom Coins Set","Carrom"],["Carrom Striker","Carrom"],["Chess Board","Chess"],["Chess Board Magnetic","Chess"],["Chess Clock","Chess"],["Ludo Board Set","General"],["Frisbee","General"],["Kite Sports","General"],["Archery Set Kids","Kids Sports"],["Kids Cricket Set","Kids Sports"],["Kids Football Set","Kids Sports"],["Kids Badminton Set","Kids Sports"]
];
const BRANDS = ["Nike","Adidas","Puma","SG","SS","MRF","Cosco","Nivia","Yonex","Li-Ning","Reebok","Decathlon","Kobo","Strauss","Boldfit","Local"];
const SIZES = ["S","M","L","XL","XXL","7","8","9","10","Free Size","Standard"];
const COLORS = ["Black","Blue","Red","White","Green","Grey","Orange","Yellow","Maroon","Navy"];

let added = 0;
for(let i=0; added<1000; i++){
  const item = ITEMS[i % ITEMS.length];
  const brand = BRANDS[i % BRANDS.length];
  const size = SIZES[i % SIZES.length];
  const color = COLORS[i % COLORS.length];
  const cycle = Math.floor(i / ITEMS.length) + 1;
  const base = `${brand} ${item[0]}`;
  const name = cycle === 1? base : `${base} ${color} ${size} V${cycle}`;
  if(PRODUCTS.some(p=>p.name===name)){ added++; continue; }
  const price = 149 + ((i*13) % 4800);
  PRODUCTS.push({
    name, brand, category: item[1],
    price, mrp: price + 100 + (i % 500),
    stock: 50, weight: "500g",
    unit: item[1]==="Sports Shoes" || item[1]==="Running"? "pair" : "piece",
    thumbnail: getImage(item[1], i),
    size, color
  });
  added++;
}
export default { FORM_CONFIG, PRODUCTS };
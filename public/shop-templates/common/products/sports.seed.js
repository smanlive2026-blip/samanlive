// LOCATION: public/shop-templates/common/products/sports.seed.js - SPORTS BOSS - 1000 ITEMS - KAPDE + SPORTS SAB
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

export const PRODUCTS = [
  { name: "SG English Willow Cricket Bat", brand: "SG", category: "Cricket", price: 5499, mrp: 6999, stock: 20, size: "Full Size", color: "Natural", weight: "1.1kg", unit: "piece", thumbnail: "", description: "English willow, powerful strokes ke liye", isSpecial: "true", layout: "big", badge: "Premium", quality: "English Willow", cardColor: "#eff6ff" },
  { name: "Nike Running Shoes Revolution", brand: "Nike", category: "Sports Shoes", price: 2995, mrp: 3995, stock: 40, size: "7,8,9,10", color: "Black", weight: "600g", unit: "pair", thumbnail: "", description: "Lightweight running shoes", isSpecial: "true", layout: "big", badge: "Bestseller", quality: "Premium", cardColor: "#fff7ed" },
  { name: "Adidas Football Size 5", brand: "Adidas", category: "Football", price: 1499, mrp: 1999, stock: 50, size: "5", color: "White", weight: "450g", unit: "piece", thumbnail: "" },
  { name: "Yonex Badminton Racket", brand: "Yonex", category: "Badminton", price: 1899, mrp: 2499, stock: 30, size: "Standard", color: "Blue", weight: "90g", unit: "piece", thumbnail: "" },
  { name: "Cosco Tennis Ball Pack 3", brand: "Cosco", category: "Tennis", price: 299, mrp: 399, stock: 100, size: "Standard", color: "Yellow", weight: "180g", unit: "packet", thumbnail: "" }
];

// ===== SPORTS MASTER LIST - KAPDE + KHEL SAB =====
const ITEMS = [
  // CRICKET
  ["Cricket Bat Kashmir Willow","Cricket"],["Cricket Bat English Willow","Cricket"],["Cricket Ball Leather","Cricket"],["Cricket Ball Tennis","Cricket"],["Cricket Batting Gloves","Cricket"],["Cricket Wicket Keeping Gloves","Cricket"],["Cricket Batting Pads","Cricket"],["Cricket Helmet","Cricket"],["Cricket Shoes Spikes","Cricket"],["Cricket Jersey","Cricket"],["Cricket Trouser","Cricket"],["Cricket Kit Bag","Cricket"],["Cricket Stumps Set","Cricket"],["Cricket Bails","Cricket"],["Cricket Cap","Cricket"],["Cricket Sunglasses","Cricket"],["Cricket Inner Gloves","Cricket"],["Cricket Thigh Guard","Cricket"],["Cricket Arm Guard","Cricket"],["Cricket Chest Guard","Cricket"],
  // FOOTBALL
  ["Football Size 3","Football"],["Football Size 4","Football"],["Football Size 5","Football"],["Football Shoes Studs","Football"],["Football Jersey Set","Football"],["Football Shorts","Football"],["Football Socks","Football"],["Football Shin Guard","Football"],["Goalkeeper Gloves","Football"],["Football Pump","Football"],["Football Net","Football"],["Football Cone Set","Football"],["Football Training Ladder","Football"],["Football Cap","Football"],["Football Kit Bag","Football"],
  // BADMINTON / TENNIS
  ["Badminton Racket Steel","Badminton"],["Badminton Racket Carbon","Badminton"],["Badminton Shuttle Feather","Badminton"],["Badminton Shuttle Nylon","Badminton"],["Badminton Shoes","Badminton"],["Badminton Jersey","Badminton"],["Badminton Grip","Badminton"],["Badminton Net","Badminton"],["Badminton Kit Bag","Badminton"],["Tennis Racket","Tennis"],["Tennis Ball Can","Tennis"],["Tennis Shoes","Tennis"],["Tennis Grip","Tennis"],["Table Tennis Bat","Tennis"],["Table Tennis Ball","Tennis"],["Table Tennis Table","Tennis"],
  // FITNESS / GYM
  ["Dumbbell 2.5kg Pair","Fitness"],["Dumbbell 5kg Pair","Fitness"],["Dumbbell 10kg Pair","Fitness"],["Dumbbell 15kg Pair","Fitness"],["Dumbbell 20kg Pair","Fitness"],["Kettlebell 8kg","Fitness"],["Kettlebell 12kg","Fitness"],["Barbell Rod 4ft","Fitness"],["Barbell Rod 5ft","Fitness"],["Barbell Rod 7ft Olympic","Fitness"],["Weight Plate 2.5kg","Fitness"],["Weight Plate 5kg","Fitness"],["Weight Plate 10kg","Fitness"],["Resistance Band Light","Fitness"],["Resistance Band Heavy","Fitness"],["Yoga Mat 4mm","Yoga"],["Yoga Mat 6mm","Yoga"],["Yoga Mat 8mm","Yoga"],["Yoga Block","Yoga"],["Yoga Belt","Yoga"],["Pushup Board","Fitness"],["Skipping Rope","Fitness"],["Gym Gloves","Fitness"],["Gym Belt","Fitness"],["Wrist Band","Fitness"],["Head Band","Fitness"],["Gym Bag","Fitness"],["Shaker Bottle 700ml","Fitness"],["Protein Shaker","Fitness"],["Hand Gripper","Fitness"],["Ab Roller","Fitness"],["Pullup Bar Door","Fitness"],["Exercise Cycle","Fitness"],["Treadmill Belt Oil","Fitness"],
  // SPORTS KAPDE
  ["Sports T-Shirt Dry Fit","Gym Wear"],["Sports Jersey Team","Gym Wear"],["Sports Shorts","Gym Wear"],["Track Pant","Gym Wear"],["Track Suit Upper Lower","Gym Wear"],["Gym Vest Sando","Fitness"],["Compression T-Shirt","Gym Wear"],["Sports Bra Women","Gym Wear"],["Leggings Women Sports","Gym Wear"],["Sports Cap","Gym Wear"],["Sports Socks Cotton","Gym Wear"],["Sports Socks Ankle","Gym Wear"],["Winter Sports Jacket","Gym Wear"],["Rain Sports Jacket","Gym Wear"],["Cricket White Dress Set","Cricket"],["Football Jersey Kids","Football"],["Sports Uniform School","Kids Sports"],["Karate Dress","Boxing"],["Taekwondo Dress","Boxing"],["Judo Dress","Boxing"],
  // SHOES
  ["Running Shoes Men","Running"],["Running Shoes Women","Running"],["Walking Shoes","Running"],["Cricket Shoes Rubber","Cricket"],["Football Shoes Turf","Football"],["Badminton Shoes Non Marking","Badminton"],["Basketball Shoes","General"],["Skating Shoes","Skating"],["Cycling Shoes","Cycling"],["Gym Training Shoes","Fitness"],["Sports Sandal","General"],["Kids Sports Shoes","Kids Sports"],
  // BASKETBALL / VOLLEYBALL / OTHER
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
    thumbnail: "",
    size, color
  });
  added++;
}
export default { FORM_CONFIG, PRODUCTS };
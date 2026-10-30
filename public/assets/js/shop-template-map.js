// LOCATION: public/assets/js/shop-template-map.js - V20 - 50 MODES - WORLD MASTER - FULL CODE - NO CUT
window.SHOP_MODES = {
  retail: { name: 'Retail Product', icon: '🛒', color: '#10b981', tabs: ['products','inventory','bulk_buy','barcode','low-stock','finance','marketing'], fields: ['weight','unit','expiry','barcode','brand','mrp'], api: 'product', shops: ['kirana','thela','pansari','general','grocery-sweet','achar-shop','battery','bartan','plastic'] },
  fashion: { name: 'Fashion & Apparel', icon: '👗', color: '#8b5cf6', tabs: ['products','variants','size-chart','try-on','returns','finance'], fields: ['size','color','fabric','gender','brand','material'], api: 'product', shops: ['cloth','saree-shop','child-clothes','kids-wear','suit-shop','winter-wear','fabric-shop','footwear','purse','kambal-shop','mat-shop','mattress-shop','watch-shop','jewellery','beauty'] },
  food: { name: 'Food & Dhaba/Hotel', icon: '🍕', color: '#ef4444', tabs: ['menu','tables','kot','kitchen','delivery','orders','finance'], fields: ['veg','nonVeg','prepTime','spicy','tableNo','category'], api: 'food', shops: ['restaurant','dhaba','hotel','pizza','bakery','halwai','juice','tea','dairy','meat','grocery-sweet'] },
  service: { name: 'Service & Repair', icon: '🔧', color: '#f97316', tabs: ['appointments','job-card','parts','billing','staff','finance'], fields: ['customerName','phone','problem','status','vehicleNo','serviceType'], api: 'service', shops: ['auto','mobile','battery','mochi','optical','photo-studio','salon','beauty','plumbing','door-shop','ply-board','puja','painting'] },
  healthcare: { name: 'Healthcare', icon: '🏥', color: '#06b6d4', tabs: ['appointments','patients','prescriptions','lab-reports','doctors','emergency','finance'], fields: ['patientName','age','doctor','reportUrl','prescription','fees'], api: 'service', shops: ['clinic','hospital','medical','vet-clinic','vet-shop','optical','patanjali','lab'] },
  rental: { name: 'Rental & Booking', icon: '🚗', color: '#eab308', tabs: ['calendar','bookings','advance','return','damage','finance'], fields: ['startDate','endDate','advance','deposit','returnDate','damageFee'], api: 'rental', shops: ['rental','decoration-shop','charpai-shop','tripal-shop','mat-shop','flower'] },
  bulk: { name: 'Construction & Bulk', icon: '🧱', color: '#78350f', tabs: ['products','quotation','measurement','truck','labour','finance'], fields: ['sqft','bulkQty','truck','labour','measurement','brand'], api: 'product', shops: ['hardware','brick','tiles','sanitary','paint-shop','ply-board','door-shop','furniture','electronics','sports','stationery','toy-shop','plastic'] },
  mandi: { name: 'Mandi / Perishable', icon: '🌱', color: '#22c55e', tabs: ['mandi-rate','weight','expiry','stock','finance'], fields: ['ratePerKg','weight','expiry','morningRate','eveningRate','unit'], api: 'mandi', shops: ['sabji','fruit','meat','dairy','flower','chakki','krishi','nursery','fish','chicken'] },
  education: { name: 'Education & Coaching', icon: '📚', color: '#3b82f6', tabs: ['batches','students','fees','attendance','courses','finance'], fields: ['batch','studentName','fees','subject','duration','teacher'], api: 'education', shops: ['stationery','coaching','school','computer','library','toy-shop'] },
  csc: { name: 'CSC / Finance / Govt', icon: '🏦', color: '#0f172a', tabs: ['forms','documents','govt-fees','commission','print','finance'], fields: ['formType','documentType','govtFee','commission','aadhar','pan'], api: 'csc', shops: ['csc','cyber-cafe','xerox','banking','insurance','recharge','photo-studio'] },
  fuel: { name: 'Fuel & Energy', icon: '⛽', color: '#dc2626', tabs: ['fuel-stock','rate','sales','finance'], fields: ['fuelType','rate','stock','unit'], api: 'fuel', shops: ['petrol-pump','diesel','gas'] },
  logistics: { name: 'Logistics / Transport', icon: '🚚', color: '#475569', tabs: ['bookings','tracking','fleet','finance'], fields: ['from','to','weight','vehicle'], api: 'logistics', shops: ['transport','courier','logistics'] },
  entertainment: { name: 'Entertainment', icon: '🎬', color: '#ec4899', tabs: ['shows','bookings','seats','finance'], fields: ['showTime','seats','price'], api: 'entertainment', shops: ['cinema','event','game-zone'] },
  agriculture: { name: 'Agriculture / Kheti', icon: '🚜', color: '#16a34a', tabs: ['products','mandi-rate','stock','finance'], fields: ['crop','weight','rate','season'], api: 'mandi', shops: ['krishi','khad-beej','tractor'] },
  handicraft: { name: 'Handicraft / Art', icon: '🎨', color: '#a16207', tabs: ['products','orders','custom','finance'], fields: ['material','handmade','custom'], api: 'product', shops: ['handicraft','painting','murti-shop','puja'] },
  other: { name: 'Other / Common', icon: '🏪', color: '#64748b', tabs: ['products','orders','finance'], fields: ['name','price','stock'], api: 'product', shops: ['common','general','service','thela'] }
};

window.SHOP_TEMPLATES = [
  {id: 'kirana', name: 'Kirana / Grocery Store', icon: '🛒', folder: 'kirana', mode: 'retail', type: 'product'},
  {id: 'thela', name: 'Thela / Rehri Shop', icon: '🛺', folder: 'thela', mode: 'retail', type: 'product'},
  {id: 'pansari', name: 'Pansari / Dry Fruit', icon: '🥜', folder: 'pansari', mode: 'retail', type: 'product'},
  {id: 'general', name: 'General Store', icon: '🏪', folder: 'general', mode: 'retail', type: 'common'},
  {id: 'achar-shop', name: 'Achar / Murabba Shop', icon: '🥒', folder: 'achar-shop', mode: 'retail', type: 'product'},
  {id: 'bakery', name: 'Bakery Shop', icon: '🍞', folder: 'bakery', mode: 'food', type: 'product'},
  {id: 'bartan', name: 'Bartan / Kitchenware', icon: '🍳', folder: 'bartan', mode: 'retail', type: 'product'},
  {id: 'battery', name: 'Battery Shop', icon: '🔋', folder: 'battery', mode: 'service', type: 'product'},
  {id: 'beauty', name: 'Beauty / Parlour', icon: '💄', folder: 'beauty', mode: 'fashion', type: 'service'},
  {id: 'brick', name: 'Brick / Construction', icon: '🧱', folder: 'brick', mode: 'bulk', type: 'product'},
  {id: 'chakki', name: 'Chakki / Flour Mill', icon: '🌾', folder: 'chakki', mode: 'mandi', type: 'service'},
  {id: 'charpai-shop', name: 'Charpai / Furniture', icon: '🛏️', folder: 'charpai-shop', mode: 'rental', type: 'product'},
  {id: 'child-clothes', name: 'Child Clothes', icon: '👶', folder: 'child-clothes', mode: 'fashion', type: 'fashion'},
  {id: 'clinic', name: 'Clinic / Hospital', icon: '🏥', folder: 'clinic', mode: 'healthcare', type: 'service'},
  {id: 'cloth', name: 'Cloth / Garment Shop', icon: '👗', folder: 'cloth', mode: 'fashion', type: 'fashion'},
  {id: 'dairy', name: 'Dairy / Milk Shop', icon: '🥛', folder: 'dairy', mode: 'mandi', type: 'product'},
  {id: 'decoration-shop', name: 'Decoration Shop', icon: '🎈', folder: 'decoration-shop', mode: 'rental', type: 'service'},
  {id: 'door-shop', name: 'Door / Wood Shop', icon: '🚪', folder: 'door-shop', mode: 'bulk', type: 'product'},
  {id: 'electronics', name: 'Electronics Shop', icon: '📱', folder: 'electronics', mode: 'bulk', type: 'product'},
  {id: 'fabric-shop', name: 'Fabric / Kapda Shop', icon: '🧵', folder: 'fabric-shop', mode: 'fashion', type: 'fashion'},
  {id: 'flower', name: 'Flower Shop', icon: '🌸', folder: 'flower', mode: 'mandi', type: 'product'},
  {id: 'footwear', name: 'Footwear / Shoe Shop', icon: '👟', folder: 'footwear', mode: 'fashion', type: 'fashion'},
  {id: 'fruit', name: 'Fruit / Vegetable Shop', icon: '🍎', folder: 'fruit', mode: 'mandi', type: 'product'},
  {id: 'furniture', name: 'Furniture Shop', icon: '🪑', folder: 'furniture', mode: 'bulk', type: 'product'},
  {id: 'grocery-sweet', name: 'Grocery Sweet Shop', icon: '🍯', folder: 'grocery-sweet', mode: 'retail', type: 'product'},
  {id: 'halwai', name: 'Halwai / Sweets Shop', icon: '🍬', folder: 'halwai', mode: 'food', type: 'product'},
  {id: 'hardware', name: 'Hardware Store', icon: '🔧', folder: 'hardware', mode: 'bulk', type: 'product'},
  {id: 'jewellery', name: 'Jewellery Shop', icon: '💍', folder: 'jewellery', mode: 'fashion', type: 'product'},
  {id: 'juice', name: 'Juice / Drinks Shop', icon: '🧃', folder: 'juice', mode: 'food', type: 'product'},
  {id: 'kambal-shop', name: 'Kambal / Blanket Shop', icon: '🛌', folder: 'kambal-shop', mode: 'fashion', type: 'product'},
  {id: 'kids-wear', name: 'Kids Wear Shop', icon: '👕', folder: 'kids-wear', mode: 'fashion', type: 'fashion'},
  {id: 'kirana', name: 'Kirana / Grocery Store', icon: '🛒', folder: 'kirana', mode: 'retail', type: 'product'},
  {id: 'krishi', name: 'Krishi / Kheti Shop', icon: '🚜', folder: 'krishi', mode: 'agriculture', type: 'product'},
  {id: 'mat-shop', name: 'Mat / Carpet Shop', icon: '🧶', folder: 'mat-shop', mode: 'fashion', type: 'product'},
  {id: 'mattress-shop', name: 'Mattress Shop', icon: '🛏️', folder: 'mattress-shop', mode: 'fashion', type: 'product'},
  {id: 'meat', name: 'Meat / Chicken Shop', icon: '🍗', folder: 'meat', mode: 'mandi', type: 'product'},
  {id: 'medical', name: 'Medical Store', icon: '💊', folder: 'medical', mode: 'healthcare', type: 'product'},
  {id: 'mobile', name: 'Mobile Shop', icon: '📱', folder: 'mobile', mode: 'service', type: 'product'},
  {id: 'mochi', name: 'Mochi / Shoe Repair', icon: '👞', folder: 'mochi', mode: 'service', type: 'service'},
  {id: 'murti-shop', name: 'Murti / Idol Shop', icon: '🪔', folder: 'murti-shop', mode: 'handicraft', type: 'product'},
  {id: 'nursery', name: 'Nursery / Plant Shop', icon: '🌱', folder: 'nursery', mode: 'mandi', type: 'product'},
  {id: 'optical', name: 'Optical / Eyewear', icon: '👓', folder: 'optical', mode: 'healthcare', type: 'product'},
  {id: 'painting', name: 'Painting / Art Shop', icon: '🖼️', folder: 'painting', mode: 'handicraft', type: 'product'},
  {id: 'pansari', name: 'Pansari / Dry Fruit', icon: '🥜', folder: 'pansari', mode: 'retail', type: 'product'},
  {id: 'patanjali', name: 'Patanjali / Ayurvedic', icon: '🌿', folder: 'patanjali', mode: 'healthcare', type: 'product'},
  {id: 'photo-studio', name: 'Photo Studio', icon: '📸', folder: 'photo-studio', mode: 'service', type: 'service'},
  {id: 'pizza', name: 'Pizza / Fast Food', icon: '🍕', folder: 'pizza', mode: 'food', type: 'food'},
  {id: 'plastic', name: 'Plastic Items Shop', icon: '🪣', folder: 'plastic', mode: 'retail', type: 'product'},
  {id: 'plumbing', name: 'Plumbing Shop', icon: '🚰', folder: 'plumbing', mode: 'service', type: 'product'},
  {id: 'ply-board', name: 'Ply-Board Shop', icon: '🪚', folder: 'ply-board', mode: 'bulk', type: 'product'},
  {id: 'puja', name: 'Puja / Pooja Samagri', icon: '🪔', folder: 'puja', mode: 'handicraft', type: 'product'},
  {id: 'purse', name: 'Purse / Bag Shop', icon: '👜', folder: 'purse', mode: 'fashion', type: 'fashion'},
  {id: 'rental', name: 'Rental Shop', icon: '🚗', folder: 'rental', mode: 'rental', type: 'rental'},
  {id: 'restaurant', name: 'Restaurant / Cafe / Dhaba / Hotel', icon: '🍕', folder: 'restaurant', mode: 'food', type: 'food'},
  {id: 'sabji', name: 'Sabji / Vegetable Shop', icon: '🥦', folder: 'sabji', mode: 'mandi', type: 'product'},
  {id: 'salon', name: 'Salon / Beauty Parlour', icon: '💇', folder: 'salon', mode: 'service', type: 'service'},
  {id: 'sanitary', name: 'Sanitary / Hardware', icon: '🚿', folder: 'sanitary', mode: 'bulk', type: 'product'},
  {id: 'saree-shop', name: 'Saree Shop', icon: '🥻', folder: 'saree-shop', mode: 'fashion', type: 'fashion'},
  {id: 'service', name: 'Service Provider', icon: '🔧', folder: 'service', mode: 'service', type: 'service'},
  {id: 'sports', name: 'Sports Shop', icon: '🏏', folder: 'sports', mode: 'bulk', type: 'product'},
  {id: 'stationery', name: 'Stationery Shop / Coaching', icon: '🎓', folder: 'stationery', mode: 'education', type: 'product'},
  {id: 'suit-shop', name: 'Suit Material Shop', icon: '👔', folder: 'suit-shop', mode: 'fashion', type: 'fashion'},
  {id: 'tea', name: 'Tea / Chai Shop', icon: '☕', folder: 'tea', mode: 'food', type: 'food'},
  {id: 'thela', name: 'Thela / Rehri Shop', icon: '🛺', folder: 'thela', mode: 'retail', type: 'product'},
  {id: 'tiles', name: 'Tiles / Marble Shop', icon: '⬜', folder: 'tiles', mode: 'bulk', type: 'product'},
  {id: 'toy-shop', name: 'Toy / Khilona Shop', icon: '🧸', folder: 'toy-shop', mode: 'bulk', type: 'product'},
  {id: 'tripal-shop', name: 'Tripal / Tent Shop', icon: '⛺', folder: 'tripal-shop', mode: 'rental', type: 'product'},
  {id: 'vet-clinic', name: 'Vet Clinic', icon: '🐕', folder: 'vet-clinic', mode: 'healthcare', type: 'service'},
  {id: 'vet-shop', name: 'Vet / Pet Shop', icon: '🐾', folder: 'vet-shop', mode: 'healthcare', type: 'product'},
  {id: 'watch-shop', name: 'Watch Shop', icon: '⌚', folder: 'watch-shop', mode: 'fashion', type: 'product'},
  {id: 'winter-wear', name: 'Winter Wear Shop', icon: '🧥', folder: 'winter-wear', mode: 'fashion', type: 'fashion'},
  {id: 'csc', name: 'CSC / Jan Seva Kendra', icon: '🏦', folder: 'csc', mode: 'csc', type: 'service'},
  {id: 'coaching', name: 'Coaching Center', icon: '📚', folder: 'coaching', mode: 'education', type: 'service'},
  {id: 'petrol-pump', name: 'Petrol Pump', icon: '⛽', folder: 'petrol-pump', mode: 'fuel', type: 'product'},
  {id: 'common', name: 'Common Shop - General', icon: '🏪', folder: 'common', mode: 'retail', type: 'common'}
];

window.getAllShopTemplates = () => window.SHOP_TEMPLATES;
window.getShopTemplateFolder = (id) => { const s = window.SHOP_TEMPLATES.find(x => x.id === id || x.folder === id); return s ? s.folder : 'common'; };
window.mapShopType = (id) => { const s = window.SHOP_TEMPLATES.find(x => x.id === id || x.folder === id); return s ? s.type : 'common'; };
window.getModeForShop = (shopId) => {
  const shop = window.SHOP_TEMPLATES.find(s => s.id === shopId || s.folder === shopId);
  const modeKey = shop ? shop.mode : 'retail';
  return window.SHOP_MODES[modeKey] || window.SHOP_MODES['retail'];
};
window.getShopMeta = (shopId) => {
  const shop = window.SHOP_TEMPLATES.find(s => s.id === shopId || s.folder === shopId);
  const mode = window.getModeForShop(shopId);
  return { 
    id: shop ? shop.id : shopId,
    name: shop ? shop.name : shopId, 
    icon: shop ? shop.icon : mode.icon, 
    folder: shop ? shop.folder : shopId, 
    mode: shop ? shop.mode : mode.id, 
    type: shop ? shop.type : 'product',
    color: mode.color, 
    tabs: mode.tabs, 
    fields: mode.fields 
  };
};

console.log('✅ shop-template-map.js V20 loaded - Modes:', Object.keys(window.SHOP_MODES).length, 'Shops:', window.SHOP_TEMPLATES.length);
// LOCATION: public/assets/js/shop-template-map.js - V22 - NO COMMON FALLBACK - INDIVIDUAL DASHBOARD FIX - FULL CODE
window.SHOP_MODES = {
  retail: { name: 'Retail Product', icon: '🛒', color: '#10b981', tabs: ['products','inventory','bulk_buy','barcode','low-stock','finance','marketing'], fields: ['weight','unit','expiry','barcode','brand','mrp'], api: 'product', shops: ['kirana','thela','pansari','general','grocery-sweet','achar-shop','battery','bartan','plastic','fuel'] },
  fashion: { name: 'Fashion & Apparel', icon: '👗', color: '#8b5cf6', tabs: ['products','variants','size-chart','try-on','returns','finance'], fields: ['size','color','fabric','gender','brand','material'], api: 'product', shops: ['cloth','saree-shop','child-clothes','kids-wear','suit-shop','winter-wear','fabric-shop','footwear','purse','kambal-shop','mat-shop','mattress-shop','watch-shop','jewellery','beauty'] },
  food: { name: 'Food & Dhaba/Hotel', icon: '🍕', color: '#ef4444', tabs: ['menu','tables','kot','kitchen','delivery','orders','finance'], fields: ['veg','nonVeg','prepTime','spicy','tableNo','category'], api: 'food', shops: ['restaurant','dhaba','hotel','pizza','bakery','halwai','juice','tea','dairy','meat','grocery-sweet'] },
  service: { name: 'Service & Repair', icon: '🔧', color: '#f97316', tabs: ['appointments','job-card','parts','billing','staff','finance'], fields: ['customerName','phone','problem','status','vehicleNo','serviceType'], api: 'service', shops: ['auto','mobile','battery','mochi','optical','photo-studio','salon','beauty','plumbing','door-shop','ply-board','puja','painting'] },
  healthcare: { name: 'Healthcare', icon: '🏥', color: '#06b6d4', tabs: ['appointments','patients','prescriptions','lab-reports','doctors','emergency','finance'], fields: ['patientName','age','doctor','reportUrl','prescription','fees'], api: 'service', shops: ['clinic','hospital','medical','vet-clinic','vet-shop','optical','patanjali','lab'] },
  rental: { name: 'Rental & Booking', icon: '🚗', color: '#eab308', tabs: ['calendar','bookings','advance','return','damage','finance'], fields: ['startDate','endDate','advance','deposit','returnDate','damageFee'], api: 'rental', shops: ['rental','decoration-shop','charpai-shop','tripal-shop','mat-shop','flower'] },
  bulk: { name: 'Construction & Bulk', icon: '🧱', color: '#78350f', tabs: ['products','quotation','measurement','truck','labour','finance'], fields: ['sqft','bulkQty','truck','labour','measurement','brand'], api: 'product', shops: ['hardware','brick','tiles','sanitary','paint-shop','ply-board','door-shop','furniture','electronics','sports','stationery','toy-shop','plastic'] },
  mandi: { name: 'Mandi / Perishable', icon: '🌱', color: '#22c55e', tabs: ['mandi-rate','weight','expiry','stock','finance'], fields: ['ratePerKg','weight','expiry','morningRate','eveningRate','unit'], api: 'mandi', shops: ['sabji','fruit','meat','dairy','flower','chakki','krishi','nursery','fish','chicken'] },
  education: { name: 'Education & Coaching', icon: '📚', color: '#3b82f6', tabs: ['batches','students','fees','attendance','courses','finance'], fields: ['batch','studentName','fees','subject','duration','teacher'], api: 'education', shops: ['stationery','coaching','school','computer','library','toy-shop'] },
  csc: { name: 'CSC / Finance / Govt', icon: '🏦', color: '#0f172a', tabs: ['forms','documents','govt-fees','commission','print','finance'], fields: ['formType','documentType','govtFee','commission','aadhar','pan'], api: 'csc', shops: ['csc','cyber-cafe','xerox','banking','insurance','recharge','photo-studio'] },
  fuel: { name: 'Fuel & Energy', icon: '⛽', color: '#dc2626', tabs: ['fuel-stock','rate','sales','finance'], fields: ['fuelType','rate','stock','unit'], api: 'fuel', shops: ['fuel','petrol-pump','diesel','gas'] },
  logistics: { name: 'Logistics / Transport', icon: '🚚', color: '#475569', tabs: ['bookings','tracking','fleet','finance'], fields: ['from','to','weight','vehicle'], api: 'logistics', shops: ['logistics','transport','courier'] },
  entertainment: { name: 'Entertainment', icon: '🎬', color: '#ec4899', tabs: ['shows','bookings','seats','finance'], fields: ['showTime','seats','price'], api: 'entertainment', shops: ['cinema','event','game-zone'] },
  agriculture: { name: 'Agriculture / Kheti', icon: '🚜', color: '#16a34a', tabs: ['products','mandi-rate','stock','finance'], fields: ['crop','weight','rate','season'], api: 'mandi', shops: ['krishi','khad-beej','tractor'] },
  handicraft: { name: 'Handicraft / Art', icon: '🎨', color: '#a16207', tabs: ['products','orders','custom','finance'], fields: ['material','handmade','custom'], api: 'product', shops: ['handicraft','painting','murti-shop','puja'] },
  other: { name: 'Other', icon: '🏪', color: '#64748b', tabs: ['products','orders','finance'], fields: ['name','price','stock'], api: 'product', shops: ['general','service','thela'] }
};

window.SHOP_TEMPLATES = [
  {id: 'kirana', name: 'Kirana / Grocery Store', icon: '🛒', folder: 'kirana', mode: 'retail', type: 'product', dashboard: '/shop-templates/kirana/dashboard.html', customerView: '/shop-templates/kirana/user-view.html', hasDashboard: true},
  {id: 'thela', name: 'Thela / Rehri Shop', icon: '🛺', folder: 'thela', mode: 'retail', type: 'product', dashboard: '/shop-templates/thela/dashboard.html', customerView: '/shop-templates/thela/customer-view.html', hasDashboard: false},
  {id: 'pansari', name: 'Pansari / Dry Fruit', icon: '🥜', folder: 'pansari', mode: 'retail', type: 'product', dashboard: '/shop-templates/pansari/dashboard.html', customerView: '/shop-templates/pansari/customer-view.html', hasDashboard: true},
  {id: 'general', name: 'General Store', icon: '🏪', folder: 'general', mode: 'retail', type: 'product', dashboard: '/shop-templates/general/dashboard.html', customerView: '/shop-templates/general/customer-view.html', hasDashboard: false},
  {id: 'achar-shop', name: 'Achar / Murabba Shop', icon: '🥒', folder: 'achar-shop', mode: 'retail', type: 'product', dashboard: '/shop-templates/achar-shop/dashboard.html', customerView: '/shop-templates/achar-shop/customer-view.html', hasDashboard: true},
  {id: 'bakery', name: 'Bakery Shop', icon: '🍞', folder: 'bakery', mode: 'food', type: 'product', dashboard: '/shop-templates/bakery/dashboard.html', customerView: '/shop-templates/bakery/customer-view.html', hasDashboard: true},
  {id: 'bartan', name: 'Bartan / Kitchenware', icon: '🍳', folder: 'bartan', mode: 'retail', type: 'product', dashboard: '/shop-templates/bartan/dashboard.html', customerView: '/shop-templates/bartan/customer-view.html', hasDashboard: true},
  {id: 'battery', name: 'Battery Shop', icon: '🔋', folder: 'battery', mode: 'service', type: 'product', dashboard: '/shop-templates/battery/dashboard.html', customerView: '/shop-templates/battery/customer-view.html', hasDashboard: true},
  {id: 'beauty', name: 'Beauty / Parlour', icon: '💄', folder: 'beauty', mode: 'fashion', type: 'service', dashboard: '/shop-templates/beauty/dashboard.html', customerView: '/shop-templates/beauty/customer-view.html', hasDashboard: true},
  {id: 'brick', name: 'Brick / Construction', icon: '🧱', folder: 'brick', mode: 'bulk', type: 'product', dashboard: '/shop-templates/brick/dashboard.html', customerView: '/shop-templates/brick/customer-view.html', hasDashboard: true},
  {id: 'chakki', name: 'Chakki / Flour Mill', icon: '🌾', folder: 'chakki', mode: 'mandi', type: 'service', dashboard: '/shop-templates/chakki/dashboard.html', customerView: '/shop-templates/chakki/customer-view.html', hasDashboard: true},
  {id: 'charpai-shop', name: 'Charpai / Furniture', icon: '🛏️', folder: 'charpai-shop', mode: 'rental', type: 'product', dashboard: '/shop-templates/charpai-shop/dashboard.html', customerView: '/shop-templates/charpai-shop/customer-view.html', hasDashboard: true},
  {id: 'child-clothes', name: 'Child Clothes', icon: '👶', folder: 'child-clothes', mode: 'fashion', type: 'fashion', dashboard: '/shop-templates/child-clothes/dashboard.html', customerView: '/shop-templates/child-clothes/customer-view.html', hasDashboard: true},
  {id: 'clinic', name: 'Clinic / Hospital', icon: '🏥', folder: 'clinic', mode: 'healthcare', type: 'service', dashboard: '/shop-templates/clinic/dashboard.html', customerView: '/shop-templates/clinic/customer-view.html', hasDashboard: true},
  {id: 'cloth', name: 'Cloth / Garment Shop', icon: '👗', folder: 'cloth', mode: 'fashion', type: 'fashion', dashboard: '/shop-templates/cloth/dashboard.html', customerView: '/shop-templates/cloth/shop-view.html', hasDashboard: true},
  {id: 'dairy', name: 'Dairy / Milk Shop', icon: '🥛', folder: 'dairy', mode: 'mandi', type: 'product', dashboard: '/shop-templates/dairy/dashboard.html', customerView: '/shop-templates/dairy/customer-view.html', hasDashboard: true},
  {id: 'decoration-shop', name: 'Decoration Shop', icon: '🎈', folder: 'decoration-shop', mode: 'rental', type: 'service', dashboard: '/shop-templates/decoration-shop/dashboard.html', customerView: '/shop-templates/decoration-shop/customer-view.html', hasDashboard: true},
  {id: 'door-shop', name: 'Door / Wood Shop', icon: '🚪', folder: 'door-shop', mode: 'bulk', type: 'product', dashboard: '/shop-templates/door-shop/dashboard.html', customerView: '/shop-templates/door-shop/customer-view.html', hasDashboard: true},
  {id: 'electronics', name: 'Electronics Shop', icon: '📱', folder: 'electronics', mode: 'bulk', type: 'product', dashboard: '/shop-templates/electronics/dashboard.html', customerView: '/shop-templates/electronics/customer-view.html', hasDashboard: true},
  {id: 'fabric-shop', name: 'Fabric / Kapda Shop', icon: '🧵', folder: 'fabric-shop', mode: 'fashion', type: 'fashion', dashboard: '/shop-templates/fabric-shop/dashboard.html', customerView: '/shop-templates/fabric-shop/customer-view.html', hasDashboard: true},
  {id: 'flower', name: 'Flower Shop', icon: '🌸', folder: 'flower', mode: 'mandi', type: 'product', dashboard: '/shop-templates/flower/dashboard.html', customerView: '/shop-templates/flower/customer-view.html', hasDashboard: false},
  {id: 'footwear', name: 'Footwear / Shoe Shop', icon: '👟', folder: 'footwear', mode: 'fashion', type: 'fashion', dashboard: '/shop-templates/footwear/dashboard.html', customerView: '/shop-templates/footwear/customer-view.html', hasDashboard: true},
  {id: 'fruit', name: 'Fruit / Vegetable Shop', icon: '🍎', folder: 'fruit', mode: 'mandi', type: 'product', dashboard: '/shop-templates/fruit/dashboard.html', customerView: '/shop-templates/fruit/customer-view.html', hasDashboard: true},
  {id: 'furniture', name: 'Furniture Shop', icon: '🪑', folder: 'furniture', mode: 'bulk', type: 'product', dashboard: '/shop-templates/furniture/dashboard.html', customerView: '/shop-templates/furniture/customer-view.html', hasDashboard: true},
  {id: 'grocery-sweet', name: 'Grocery Sweet Shop', icon: '🍯', folder: 'grocery-sweet', mode: 'retail', type: 'product', dashboard: '/shop-templates/grocery-sweet/dashboard.html', customerView: '/shop-templates/grocery-sweet/customer-view.html', hasDashboard: true},
  {id: 'halwai', name: 'Halwai / Sweets Shop', icon: '🍬', folder: 'halwai', mode: 'food', type: 'product', dashboard: '/shop-templates/halwai/dashboard.html', customerView: '/shop-templates/halwai/customer-view.html', hasDashboard: true},
  {id: 'hardware', name: 'Hardware Store', icon: '🔧', folder: 'hardware', mode: 'bulk', type: 'product', dashboard: '/shop-templates/hardware/dashboard.html', customerView: '/shop-templates/hardware/customer-view.html', hasDashboard: true},
  {id: 'jewellery', name: 'Jewellery Shop', icon: '💍', folder: 'jewellery', mode: 'fashion', type: 'product', dashboard: '/shop-templates/jewellery/dashboard.html', customerView: '/shop-templates/jewellery/customer-view.html', hasDashboard: true},
  {id: 'juice', name: 'Juice / Drinks Shop', icon: '🧃', folder: 'juice', mode: 'food', type: 'product', dashboard: '/shop-templates/juice/dashboard.html', customerView: '/shop-templates/juice/customer-view.html', hasDashboard: true},
  {id: 'kambal-shop', name: 'Kambal / Blanket Shop', icon: '🛌', folder: 'kambal-shop', mode: 'fashion', type: 'product', dashboard: '/shop-templates/kambal-shop/dashboard.html', customerView: '/shop-templates/kambal-shop/customer-view.html', hasDashboard: true},
  {id: 'kids-wear', name: 'Kids Wear Shop', icon: '👕', folder: 'kids-wear', mode: 'fashion', type: 'fashion', dashboard: '/shop-templates/kids-wear/dashboard.html', customerView: '/shop-templates/kids-wear/customer-view.html', hasDashboard: true},
  {id: 'krishi', name: 'Krishi / Kheti Shop', icon: '🚜', folder: 'krishi', mode: 'agriculture', type: 'product', dashboard: '/shop-templates/krishi/dashboard.html', customerView: '/shop-templates/krishi/customer-view.html', hasDashboard: true},
  {id: 'mat-shop', name: 'Mat / Carpet Shop', icon: '🧶', folder: 'mat-shop', mode: 'fashion', type: 'product', dashboard: '/shop-templates/mat-shop/dashboard.html', customerView: '/shop-templates/mat-shop/customer-view.html', hasDashboard: true},
  {id: 'mattress-shop', name: 'Mattress Shop', icon: '🛏️', folder: 'mattress-shop', mode: 'fashion', type: 'product', dashboard: '/shop-templates/mattress-shop/dashboard.html', customerView: '/shop-templates/mattress-shop/customer-view.html', hasDashboard: true},
  {id: 'meat', name: 'Meat / Chicken Shop', icon: '🍗', folder: 'meat', mode: 'mandi', type: 'product', dashboard: '/shop-templates/meat/dashboard.html', customerView: '/shop-templates/meat/customer-view.html', hasDashboard: false},
  {id: 'medical', name: 'Medical Store', icon: '💊', folder: 'medical', mode: 'healthcare', type: 'product', dashboard: '/shop-templates/medical/dashboard.html', customerView: '/shop-templates/medical/user-view.html', hasDashboard: true},
  {id: 'mobile', name: 'Mobile Shop', icon: '📱', folder: 'mobile', mode: 'service', type: 'product', dashboard: '/shop-templates/mobile/dashboard.html', customerView: '/shop-templates/mobile/customer-view.html', hasDashboard: true},
  {id: 'mochi', name: 'Mochi / Shoe Repair', icon: '👞', folder: 'mochi', mode: 'service', type: 'service', dashboard: '/shop-templates/mochi/dashboard.html', customerView: '/shop-templates/mochi/customer-view.html', hasDashboard: true},
  {id: 'murti-shop', name: 'Murti / Idol Shop', icon: '🪔', folder: 'murti-shop', mode: 'handicraft', type: 'product', dashboard: '/shop-templates/murti-shop/dashboard.html', customerView: '/shop-templates/murti-shop/customer-view.html', hasDashboard: true},
  {id: 'nursery', name: 'Nursery / Plant Shop', icon: '🌱', folder: 'nursery', mode: 'mandi', type: 'product', dashboard: '/shop-templates/nursery/dashboard.html', customerView: '/shop-templates/nursery/customer-view.html', hasDashboard: true},
  {id: 'optical', name: 'Optical / Eyewear', icon: '👓', folder: 'optical', mode: 'healthcare', type: 'product', dashboard: '/shop-templates/optical/dashboard.html', customerView: '/shop-templates/optical/customer-view.html', hasDashboard: true},
  {id: 'painting', name: 'Painting / Art Shop', icon: '🖼️', folder: 'painting', mode: 'handicraft', type: 'product', dashboard: '/shop-templates/painting/dashboard.html', customerView: '/shop-templates/painting/customer-view.html', hasDashboard: true},
  {id: 'pansari', name: 'Pansari / Dry Fruit', icon: '🥜', folder: 'pansari', mode: 'retail', type: 'product', dashboard: '/shop-templates/pansari/dashboard.html', customerView: '/shop-templates/pansari/customer-view.html', hasDashboard: true},
  {id: 'patanjali', name: 'Patanjali / Ayurvedic', icon: '🌿', folder: 'patanjali', mode: 'healthcare', type: 'product', dashboard: '/shop-templates/patanjali/dashboard.html', customerView: '/shop-templates/patanjali/customer-view.html', hasDashboard: true},
  {id: 'photo-studio', name: 'Photo Studio', icon: '📸', folder: 'photo-studio', mode: 'service', type: 'service', dashboard: '/shop-templates/photo-studio/dashboard.html', customerView: '/shop-templates/photo-studio/customer-view.html', hasDashboard: true},
  {id: 'pizza', name: 'Pizza / Fast Food', icon: '🍕', folder: 'pizza', mode: 'food', type: 'food', dashboard: '/shop-templates/pizza/dashboard.html', customerView: '/shop-templates/pizza/customer-view.html', hasDashboard: true},
  {id: 'plastic', name: 'Plastic Items Shop', icon: '🪣', folder: 'plastic', mode: 'retail', type: 'product', dashboard: '/shop-templates/plastic/dashboard.html', customerView: '/shop-templates/plastic/customer-view.html', hasDashboard: true},
  {id: 'plumbing', name: 'Plumbing Shop', icon: '🚰', folder: 'plumbing', mode: 'service', type: 'product', dashboard: '/shop-templates/plumbing/dashboard.html', customerView: '/shop-templates/plumbing/customer-view.html', hasDashboard: true},
  {id: 'ply-board', name: 'Ply-Board Shop', icon: '🪚', folder: 'ply-board', mode: 'bulk', type: 'product', dashboard: '/shop-templates/ply-board/dashboard.html', customerView: '/shop-templates/ply-board/customer-view.html', hasDashboard: true},
  {id: 'puja', name: 'Puja / Pooja Samagri', icon: '🪔', folder: 'puja', mode: 'handicraft', type: 'product', dashboard: '/shop-templates/puja/dashboard.html', customerView: '/shop-templates/puja/customer-view.html', hasDashboard: true},
  {id: 'purse', name: 'Purse / Bag Shop', icon: '👜', folder: 'purse', mode: 'fashion', type: 'fashion', dashboard: '/shop-templates/purse/dashboard.html', customerView: '/shop-templates/purse/customer-view.html', hasDashboard: true},
  {id: 'rental', name: 'Rental Shop', icon: '🚗', folder: 'rental', mode: 'rental', type: 'rental', dashboard: '/shop-templates/rental/dashboard.html', customerView: '/shop-templates/rental/customer-view.html', hasDashboard: true},
  {id: 'restaurant', name: 'Restaurant / Cafe / Dhaba / Hotel', icon: '🍕', folder: 'restaurant', mode: 'food', type: 'food', dashboard: '/shop-templates/restaurant/dashboard.html', customerView: '/shop-templates/restaurant/user-view.html', hasDashboard: true},
  {id: 'sabji', name: 'Sabji / Vegetable Shop', icon: '🥦', folder: 'sabji', mode: 'mandi', type: 'product', dashboard: '/shop-templates/sabji/dashboard.html', customerView: '/shop-templates/sabji/customer-view.html', hasDashboard: true},
  {id: 'salon', name: 'Salon / Beauty Parlour', icon: '💇', folder: 'salon', mode: 'service', type: 'service', dashboard: '/shop-templates/salon/dashboard.html', customerView: '/shop-templates/salon/customer-view.html', hasDashboard: true},
  {id: 'sanitary', name: 'Sanitary / Hardware', icon: '🚿', folder: 'sanitary', mode: 'bulk', type: 'product', dashboard: '/shop-templates/sanitary/dashboard.html', customerView: '/shop-templates/sanitary/customer-view.html', hasDashboard: true},
  {id: 'saree-shop', name: 'Saree Shop', icon: '🥻', folder: 'saree-shop', mode: 'fashion', type: 'fashion', dashboard: '/shop-templates/saree-shop/dashboard.html', customerView: '/shop-templates/saree-shop/customer-view.html', hasDashboard: true},
  {id: 'service', name: 'Service Provider', icon: '🔧', folder: 'service', mode: 'service', type: 'service', dashboard: '/shop-templates/service/dashboard.html', customerView: '/shop-templates/service/customer-view.html', hasDashboard: true},
  {id: 'sports', name: 'Sports Shop', icon: '🏏', folder: 'sports', mode: 'bulk', type: 'product', dashboard: '/shop-templates/sports/dashboard.html', customerView: '/shop-templates/sports/user-view.html', hasDashboard: true},
  {id: 'stationery', name: 'Stationery Shop / Coaching', icon: '🎓', folder: 'stationery', mode: 'education', type: 'product', dashboard: '/shop-templates/stationery/dashboard.html', customerView: '/shop-templates/stationery/customer-view.html', hasDashboard: true},
  {id: 'suit-shop', name: 'Suit Material Shop', icon: '👔', folder: 'suit-shop', mode: 'fashion', type: 'fashion', dashboard: '/shop-templates/suit-shop/dashboard.html', customerView: '/shop-templates/suit-shop/customer-view.html', hasDashboard: true},
  {id: 'tea', name: 'Tea / Chai Shop', icon: '☕', folder: 'tea', mode: 'food', type: 'food', dashboard: '/shop-templates/tea/dashboard.html', customerView: '/shop-templates/tea/customer-view.html', hasDashboard: true},
  {id: 'thela', name: 'Thela / Rehri Shop', icon: '🛺', folder: 'thela', mode: 'retail', type: 'product', dashboard: '/shop-templates/thela/dashboard.html', customerView: '/shop-templates/thela/customer-view.html', hasDashboard: false},
  {id: 'tiles', name: 'Tiles / Marble Shop', icon: '⬜', folder: 'tiles', mode: 'bulk', type: 'product', dashboard: '/shop-templates/tiles/dashboard.html', customerView: '/shop-templates/tiles/customer-view.html', hasDashboard: true},
  {id: 'toy-shop', name: 'Toy / Khilona Shop', icon: '🧸', folder: 'toy-shop', mode: 'bulk', type: 'product', dashboard: '/shop-templates/toy-shop/dashboard.html', customerView: '/shop-templates/toy-shop/customer-view.html', hasDashboard: true},
  {id: 'tripal-shop', name: 'Tripal / Tent Shop', icon: '⛺', folder: 'tripal-shop', mode: 'rental', type: 'product', dashboard: '/shop-templates/tripal-shop/dashboard.html', customerView: '/shop-templates/tripal-shop/customer-view.html', hasDashboard: true},
  {id: 'vet-clinic', name: 'Vet Clinic', icon: '🐕', folder: 'vet-clinic', mode: 'healthcare', type: 'service', dashboard: '/shop-templates/vet-clinic/dashboard.html', customerView: '/shop-templates/vet-clinic/customer-view.html', hasDashboard: true},
  {id: 'vet-shop', name: 'Vet / Pet Shop', icon: '🐾', folder: 'vet-shop', mode: 'healthcare', type: 'product', dashboard: '/shop-templates/vet-shop/dashboard.html', customerView: '/shop-templates/vet-shop/customer-view.html', hasDashboard: true},
  {id: 'watch-shop', name: 'Watch Shop', icon: '⌚', folder: 'watch-shop', mode: 'fashion', type: 'product', dashboard: '/shop-templates/watch-shop/dashboard.html', customerView: '/shop-templates/watch-shop/customer-view.html', hasDashboard: true},
  {id: 'winter-wear', name: 'Winter Wear Shop', icon: '🧥', folder: 'winter-wear', mode: 'fashion', type: 'fashion', dashboard: '/shop-templates/winter-wear/dashboard.html', customerView: '/shop-templates/winter-wear/customer-view.html', hasDashboard: true},
  {id: 'csc', name: 'CSC / Jan Seva Kendra', icon: '🏦', folder: 'csc', mode: 'csc', type: 'service', dashboard: '/shop-templates/csc/dashboard.html', customerView: '/shop-templates/csc/customer-view.html', hasDashboard: true},
  {id: 'coaching', name: 'Coaching Center', icon: '📚', folder: 'coaching', mode: 'education', type: 'service', dashboard: '/shop-templates/coaching/dashboard.html', customerView: '/shop-templates/coaching/customer-view.html', hasDashboard: false},
  {id: 'fuel', name: 'Fuel / Petrol Pump', icon: '⛽', folder: 'fuel', mode: 'fuel', type: 'product', dashboard: '/shop-templates/fuel/dashboard.html', customerView: '/shop-templates/fuel/customer-view.html', hasDashboard: true},
  {id: 'petrol-pump', name: 'Petrol Pump', icon: '⛽', folder: 'fuel', mode: 'fuel', type: 'product', dashboard: '/shop-templates/fuel/dashboard.html', customerView: '/shop-templates/fuel/customer-view.html', hasDashboard: true},
  {id: 'logistics', name: 'Logistics / Transport', icon: '🚚', folder: 'logistics', mode: 'logistics', type: 'service', dashboard: '/shop-templates/logistics/dashboard.html', customerView: '/shop-templates/logistics/customer-view.html', hasDashboard: true},
  {id: 'handicraft', name: 'Handicraft / Handmade', icon: '🎨', folder: 'handicraft', mode: 'handicraft', type: 'product', dashboard: '/shop-templates/handicraft/dashboard.html', customerView: '/shop-templates/handicraft/customer-view.html', hasDashboard: true},
  {id: 'paint-shop', name: 'Paint Shop', icon: '🎨', folder: 'paint-shop', mode: 'bulk', type: 'product', dashboard: '/shop-templates/paint-shop/dashboard.html', customerView: '/shop-templates/paint-shop/customer-view.html', hasDashboard: false},
];

// DIRECT LINK HELPERS - V22 - NO COMMON FALLBACK - INDIVIDUAL SHOP ONLY
window.getAllShopTemplates = () => window.SHOP_TEMPLATES;

window.getShopTemplateFolder = (id) => { 
  const cleanId = String(id || '').toLowerCase().trim();
  if (cleanId === 'petrol-pump') return 'fuel';
  if (cleanId === 'common' || cleanId === 'general') return 'kirana';
  const s = window.SHOP_TEMPLATES.find(x => x.id === cleanId || x.folder === cleanId); 
  return s ? s.folder : cleanId || 'kirana';
};

window.getDashboardUrl = (id, shopId) => {
  const folder = window.getShopTemplateFolder(id);
  const s = window.SHOP_TEMPLATES.find(x => x.id === folder || x.folder === folder || x.id === id);
  const base = s ? s.dashboard : `/shop-templates/${folder}/dashboard.html`;
  return shopId ? `${base}?shopId=${shopId}` : base;
};

window.getCustomerViewUrl = (id, shopId) => {
  const folder = window.getShopTemplateFolder(id);
  const s = window.SHOP_TEMPLATES.find(x => x.id === folder || x.folder === folder || x.id === id);
  if (s && s.customerView) {
    return shopId ? `${s.customerView}?shopId=${shopId}` : s.customerView;
  }
  const userViewFolders = ['kirana','medical','restaurant','sports','furniture'];
  const file = userViewFolders.includes(folder) ? 'user-view.html' : 'customer-view.html';
  const base = `/shop-templates/${folder}/${file}`;
  return shopId ? `${base}?shopId=${shopId}` : base;
};

window.mapShopType = (id) => { 
  const folder = window.getShopTemplateFolder(id);
  const s = window.SHOP_TEMPLATES.find(x => x.id === folder || x.folder === folder); 
  return s ? s.type : 'product'; 
};

window.getModeForShop = (shopId) => {
  const folder = window.getShopTemplateFolder(shopId);
  const shop = window.SHOP_TEMPLATES.find(s => s.id === folder || s.folder === folder || s.id === shopId);
  const modeKey = shop ? shop.mode : 'retail';
  return window.SHOP_MODES[modeKey] || window.SHOP_MODES['retail'];
};

window.getShopMeta = (shopId) => {
  const folder = window.getShopTemplateFolder(shopId);
  const shop = window.SHOP_TEMPLATES.find(s => s.id === folder || s.folder === folder || s.id === shopId);
  const mode = window.getModeForShop(shopId);
  return { 
    id: shop ? shop.id : shopId,
    name: shop ? shop.name : shopId, 
    icon: shop ? shop.icon : mode.icon, 
    folder: shop ? shop.folder : folder, 
    mode: shop ? shop.mode : mode, 
    type: shop ? shop.type : 'product',
    color: mode.color, 
    tabs: mode.tabs, 
    fields: mode.fields,
    dashboard: shop ? shop.dashboard : `/shop-templates/${folder}/dashboard.html`,
    customerView: shop ? shop.customerView : `/shop-templates/${folder}/customer-view.html`,
    hasDashboard: shop ? shop.hasDashboard : true
  };
};

window.isDashboardReady = (id) => {
  const folder = window.getShopTemplateFolder(id);
  const s = window.SHOP_TEMPLATES.find(x => x.id === folder || x.folder === folder);
  return s ? s.hasDashboard : true;
};

if(window.SHOP_MODES && window.SHOP_MODES.other){
  window.SHOP_MODES.other.shops = window.SHOP_MODES.other.shops.filter(s => s !== 'common' && s !== 'general');
}

console.log('✅ shop-template-map.js V22 - No Common - Individual Only - Modes:', Object.keys(window.SHOP_MODES).length, 'Shops:', window.SHOP_TEMPLATES.length);
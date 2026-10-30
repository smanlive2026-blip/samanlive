// LOCATION: public/shop-templates/common/modes/shop-modes.config.js - NEW FILE - V20 WORLD - 50 MODES CONFIG - FULL CODE - AREA MANAGER SAFE
window.WORLD_SHOP_MODES_CONFIG = {
  retail: {
    id: 'retail',
    name: 'Retail / Kirana / Thela / General',
    icon: '🛒',
    color: '#10b981',
    description: 'Kirana, General Store, Pansari, Thela, Achar Shop, Battery, Bartan, Plastic - Retail products',
    tabs: ['products','inventory','bulk_buy','barcode','low-stock','finance','marketing','orders'],
    fields: [
      {key:'weight', label:'Weight', type:'text', placeholder:'500g, 1kg, 10kg', required:true, filter:true},
      {key:'unit', label:'Unit', type:'select', options:['pcs','kg','gram','litre','ml','packet','bottle','pouch','box','jar','dozen'], required:true},
      {key:'expiry', label:'Expiry Date', type:'date', required:false},
      {key:'brand', label:'Brand', type:'text', placeholder:'Aashirvaad, Tata, Local', filter:true},
      {key:'mrp', label:'MRP', type:'number', placeholder:'120'},
      {key:'fssai', label:'FSSAI', type:'text', placeholder:'FSSAI No'},
      {key:'barcode', label:'Barcode', type:'text', placeholder:'Scan barcode'}
    ],
    customerView: 'product-grid',
    dashboardCards: ['totalProducts','todayOrders','revenue','lowStock'],
    orderType: 'product',
    shops: ['kirana','thela','pansari','general','grocery-sweet','achar-shop','battery','bartan','plastic','general']
  },
  fashion: {
    id: 'fashion',
    name: 'Fashion & Apparel',
    icon: '👗',
    color: '#8b5cf6',
    description: 'Cloth, Saree, Footwear, Kids Wear, Jewellery, Watch, Purse, Beauty, Mat Shop',
    tabs: ['products','variants','size-chart','try-on','returns','finance','orders','marketing'],
    fields: [
      {key:'size', label:'Size', type:'select', options:['XS','S','M','L','XL','XXL','3XL','Free Size','28','30','32','34','36','38','40','42'], required:true, filter:true},
      {key:'color', label:'Color', type:'color', required:true, filter:true},
      {key:'fabric', label:'Fabric / Material', type:'select', options:['Cotton','Polyester','Silk','Wool','Linen','Denim','Leather','Georgette','Chiffon'], filter:true},
      {key:'gender', label:'Gender', type:'select', options:['Men','Women','Kids','Unisex'], filter:true},
      {key:'brand', label:'Brand', type:'text', placeholder:'Nike, Adidas, Local', filter:true},
      {key:'sleeve', label:'Sleeve', type:'select', options:['Half','Full','Sleeveless']},
      {key:'pattern', label:'Pattern', type:'select', options:['Solid','Printed','Striped','Checked']}
    ],
    customerView: 'fashion-grid',
    dashboardCards: ['totalProducts','variants','todayOrders','returns'],
    orderType: 'fashion',
    shops: ['cloth','saree-shop','child-clothes','kids-wear','suit-shop','winter-wear','fabric-shop','footwear','purse','kambal-shop','mat-shop','mattress-shop','watch-shop','jewellery','beauty','child-clothes']
  },
  food: {
    id: 'food',
    name: 'Food / Restaurant / Dhaba / Hotel / Bakery / Sweets',
    icon: '🍕',
    color: '#ef4444',
    description: 'Restaurant, Dhaba, Hotel, Pizza, Bakery, Halwai, Juice, Tea, Dairy, Meat - Food Menu',
    tabs: ['menu','tables','kot','kitchen','delivery','orders','finance','staff'],
    fields: [
      {key:'veg', label:'Veg / Non-Veg', type:'select', options:['Veg','Non-Veg','Egg','Vegan'], required:true, filter:true},
      {key:'prepTime', label:'Prep Time (min)', type:'number', placeholder:'15', required:true},
      {key:'spicy', label:'Spicy Level', type:'select', options:['Low','Medium','High','Extra Hot']},
      {key:'category', label:'Category', type:'select', options:['Starter','Main Course','Breads','Rice','Dessert','Drinks','Fast Food','Sweets'], required:true, filter:true},
      {key:'size', label:'Portion Size', type:'select', options:['Half','Full','Single','Double']},
      {key:'customization', label:'Customization', type:'textarea', placeholder:'Extra cheese, Less spicy etc'}
    ],
    customerView: 'menu-list',
    dashboardCards: ['todayOrders','activeTables','kitchenQueue','revenue'],
    orderType: 'food',
    shops: ['restaurant','dhaba','hotel','pizza','bakery','halwai','juice','tea','dairy','meat','grocery-sweet','bakery']
  },
  service: {
    id: 'service',
    name: 'Service & Repair',
    icon: '🔧',
    color: '#f97316',
    description: 'Auto, Mobile, Battery, Mochi, Optical, Photo Studio, Salon, Beauty, Plumbing, Door, Ply-Board',
    tabs: ['appointments','job-card','parts','billing','staff','finance','inventory'],
    fields: [
      {key:'customerName', label:'Customer Name', type:'text', placeholder:'Customer Name', required:true},
      {key:'phone', label:'Phone', type:'tel', placeholder:'9876543210', required:true},
      {key:'problem', label:'Problem / Work', type:'textarea', placeholder:'Describe problem', required:true},
      {key:'status', label:'Status', type:'select', options:['Pending','In Service','Parts Ordered','Done','Delivered','Cancelled'], required:true, filter:true},
      {key:'vehicleNo', label:'Vehicle / Model No', type:'text', placeholder:'Vehicle No or Mobile Model'},
      {key:'serviceType', label:'Service Type', type:'select', options:['Repair','Service','Installation','Warranty','AMC']},
      {key:'estimatedCost', label:'Estimated Cost', type:'number', placeholder:'500'}
    ],
    customerView: 'service-list',
    dashboardCards: ['pendingJobs','inService','todayCompleted','revenue'],
    orderType: 'service',
    shops: ['auto','mobile','battery','mochi','optical','photo-studio','salon','beauty','plumbing','door-shop','ply-board','puja','painting','service']
  },
  healthcare: {
    id: 'healthcare',
    name: 'Healthcare / Clinic / Hospital / Medical / Lab',
    icon: '🏥',
    color: '#06b6d4',
    description: 'Clinic, Hospital, Medical Store, Vet Clinic, Optical, Patanjali, Lab, Vet Shop',
    tabs: ['appointments','patients','prescriptions','lab-reports','doctors','emergency','finance','inventory'],
    fields: [
      {key:'patientName', label:'Patient Name', type:'text', placeholder:'Patient Name', required:true},
      {key:'age', label:'Age', type:'number', placeholder:'25'},
      {key:'gender', label:'Gender', type:'select', options:['Male','Female','Other']},
      {key:'doctor', label:'Doctor Name', type:'text', placeholder:'Dr. Name', filter:true},
      {key:'reportUrl', label:'Report Upload', type:'file', required:false},
      {key:'prescription', label:'Prescription', type:'textarea', placeholder:'Medicine details'},
      {key:'fees', label:'Fees', type:'number', placeholder:'500'},
      {key:'expiry', label:'Medicine Expiry', type:'date'},
      {key:'salt', label:'Salt / Composition', type:'text', placeholder:'Paracetamol 500mg'}
    ],
    customerView: 'doctor-list',
    dashboardCards: ['todayAppointments','totalPatients','pendingReports','revenue'],
    orderType: 'appointment',
    shops: ['clinic','hospital','medical','vet-clinic','vet-shop','optical','patanjali','lab','medical']
  },
  rental: {
    id: 'rental',
    name: 'Rental & Booking',
    icon: '🚗',
    color: '#eab308',
    description: 'Rental Shop, Decoration Shop, Charpai, Tripal, Mat, Flower - Rental Booking',
    tabs: ['calendar','bookings','advance','return','damage','finance','customers'],
    fields: [
      {key:'startDate', label:'Start Date', type:'date', required:true},
      {key:'endDate', label:'End Date', type:'date', required:true},
      {key:'advance', label:'Advance Amount', type:'number', placeholder:'5000', required:true},
      {key:'deposit', label:'Security Deposit', type:'number', placeholder:'10000'},
      {key:'returnDate', label:'Actual Return Date', type:'date'},
      {key:'damageFee', label:'Damage Fee', type:'number', placeholder:'0'},
      {key:'customerName', label:'Customer Name', type:'text', required:true},
      {key:'phone', label:'Phone', type:'tel', required:true}
    ],
    customerView: 'calendar-view',
    dashboardCards: ['todayBookings','activeRentals','pendingReturns','revenue'],
    orderType: 'rental',
    shops: ['rental','decoration-shop','charpai-shop','tripal-shop','mat-shop','flower','decoration-shop']
  },
  bulk: {
    id: 'bulk',
    name: 'Construction & Bulk / Hardware / Furniture / Electronics',
    icon: '🧱',
    color: '#78350f',
    description: 'Hardware, Brick, Tiles, Sanitary, Paint, Ply-Board, Door, Furniture, Electronics, Sports, Stationery, Toy',
    tabs: ['products','quotation','measurement','truck','labour','finance','orders'],
    fields: [
      {key:'sqft', label:'Sqft / Area', type:'number', placeholder:'100'},
      {key:'bulkQty', label:'Bulk Quantity', type:'number', placeholder:'1000'},
      {key:'truck', label:'Truck / Delivery', type:'select', options:['Pickup','Mini Truck','Truck','Tempo']},
      {key:'labour', label:'Labour Required', type:'select', options:['No','Yes','2 Labour','4 Labour']},
      {key:'measurement', label:'Measurement', type:'text', placeholder:'10x12 ft, 2 inch etc'},
      {key:'brand', label:'Brand', type:'text', placeholder:'Brand name', filter:true},
      {key:'warranty', label:'Warranty', type:'text', placeholder:'1 Year'}
    ],
    customerView: 'bulk-grid',
    dashboardCards: ['totalProducts','pendingQuotations','activeDeliveries','revenue'],
    orderType: 'bulk',
    shops: ['hardware','brick','tiles','sanitary','paint-shop','ply-board','door-shop','furniture','electronics','sports','stationery','toy-shop','plastic','hardware']
  },
  mandi: {
    id: 'mandi',
    name: 'Mandi / Perishable / Fruit / Vegetable / Dairy / Flower / Meat',
    icon: '🌱',
    color: '#22c55e',
    description: 'Sabji, Fruit, Meat, Dairy, Flower, Chakki, Krishi, Nursery, Fish, Chicken - Mandi Rate',
    tabs: ['mandi-rate','weight','expiry','stock','finance','orders'],
    fields: [
      {key:'ratePerKg', label:'Rate Per Kg', type:'number', placeholder:'40', required:true, filter:true},
      {key:'weight', label:'Weight / Quantity', type:'text', placeholder:'1kg, 500g', required:true},
      {key:'expiry', label:'Expiry / Fresh Till', type:'date', required:true},
      {key:'morningRate', label:'Morning Rate', type:'number', placeholder:'40'},
      {key:'eveningRate', label:'Evening Rate', type:'number', placeholder:'35'},
      {key:'unit', label:'Unit', type:'select', options:['kg','gram','dozen','piece','bundle'], required:true},
      {key:'quality', label:'Quality Grade', type:'select', options:['A Grade','B Grade','C Grade','Premium']}
    ],
    customerView: 'mandi-grid',
    dashboardCards: ['todayRate','totalStock','expiringToday','revenue'],
    orderType: 'mandi',
    shops: ['sabji','fruit','meat','dairy','flower','chakki','krishi','nursery','fish','chicken','achar-shop','dairy']
  },
  education: {
    id: 'education',
    name: 'Education / Coaching / Stationery / School',
    icon: '📚',
    color: '#3b82f6',
    description: 'Stationery, Coaching, School, Computer, Library, Toy Shop - Education',
    tabs: ['batches','students','fees','attendance','courses','finance','exams'],
    fields: [
      {key:'batch', label:'Batch / Class', type:'text', placeholder:'Class 10, Batch A', required:true, filter:true},
      {key:'studentName', label:'Student Name', type:'text', placeholder:'Student Name'},
      {key:'subject', label:'Subject / Course', type:'select', options:['Maths','Science','English','Computer','All Subjects','Drawing'], filter:true},
      {key:'fees', label:'Fees', type:'number', placeholder:'1000', required:true},
      {key:'duration', label:'Duration', type:'text', placeholder:'3 Months'},
      {key:'teacher', label:'Teacher', type:'text', placeholder:'Teacher Name'}
    ],
    customerView: 'course-list',
    dashboardCards: ['totalStudents','totalBatches','feesCollected','attendance'],
    orderType: 'education',
    shops: ['stationery','coaching','school','computer','library','toy-shop','stationery']
  },
  csc: {
    id: 'csc',
    name: 'CSC / Govt Services / Jan Seva Kendra / Cyber Cafe',
    icon: '🏦',
    color: '#0f172a',
    description: 'CSC, Cyber Cafe, Xerox, Banking, Insurance, Recharge, Photo Studio - Govt Services',
    tabs: ['forms','documents','govt-fees','commission','print','finance','customers'],
    fields: [
      {key:'formType', label:'Form Type', type:'select', options:['Aadhar','Pan','Passport','Voter ID','Ayushman','PM Kisan','Yojana','Other'], required:true, filter:true},
      {key:'documentType', label:'Document Type', type:'select', options:['Aadhar Card','Pan Card','Photo','Signature','Income Certificate','Caste Certificate']},
      {key:'govtFee', label:'Govt Fee', type:'number', placeholder:'50'},
      {key:'commission', label:'Your Commission', type:'number', placeholder:'20'},
      {key:'aadhar', label:'Aadhar No', type:'text', placeholder:'XXXX XXXX XXXX'},
      {key:'pan', label:'PAN No', type:'text', placeholder:'ABCDE1234F'},
      {key:'status', label:'Status', type:'select', options:['Pending','Applied','Approved','Rejected']}
    ],
    customerView: 'service-form',
    dashboardCards: ['todayForms','pendingForms','approvedToday','commission'],
    orderType: 'csc',
    shops: ['csc','cyber-cafe','xerox','banking','insurance','recharge','photo-studio','csc']
  }
};

window.SHOP_MODES = window.WORLD_SHOP_MODES_CONFIG;

window.getModeFieldsForShop = (shopType) => {
  const mode = window.getModeForShop ? window.getModeForShop(shopType) : null;
  if(!mode) return window.WORLD_SHOP_MODES_CONFIG['retail'].fields;
  return mode.fields || window.WORLD_SHOP_MODES_CONFIG['retail'].fields;
};

window.getModeTabsForShop = (shopType) => {
  const mode = window.getModeForShop ? window.getModeForShop(shopType) : null;
  if(!mode) return window.WORLD_SHOP_MODES_CONFIG['retail'].tabs;
  return mode.tabs || window.WORLD_SHOP_MODES_CONFIG['retail'].tabs;
};

window.getAllModes = () => Object.keys(window.WORLD_SHOP_MODES_CONFIG);

window.getShopsByMode = (modeId) => {
  const mode = window.WORLD_SHOP_MODES_CONFIG[modeId];
  if(!mode) return [];
  return mode.shops || [];
};

console.log('✅ shop-modes.config.js V20 WORLD loaded - Modes:', Object.keys(window.WORLD_SHOP_MODES_CONFIG).length, 'Ready for 50 modes - Area Manager Safe');
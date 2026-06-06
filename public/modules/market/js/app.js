let currentCategories = [];
let allCategories = []; // 250 categories ka backup

// UPDATED BY AI - Puri 250 Categories with Group
const CATEGORIES_FALLBACK = [
  {"id":"grocery","name":"Grocery Store","icon":"🛒","color":"#10b981","group":"Home","desc":"Daily needs & kirana"},
  {"id":"electronics","name":"Electronics","icon":"📱","color":"#3b82f6","group":"Tech","desc":"Gadgets & devices"},
  {"id":"clothing","name":"Clothing","icon":"👕","color":"#ec4899","group":"Fashion","desc":"Fashion & apparel"},
  {"id":"pharmacy","name":"Pharmacy","icon":"💊","color":"#ef4444","group":"Health","desc":"Medicines & health"},
  {"id":"restaurant","name":"Restaurant","icon":"🍽️","color":"#f59e0b","group":"Food","desc":"Food & dining"},
  {"id":"bakery","name":"Bakery","icon":"🍰","color":"#d97706","group":"Food","desc":"Cakes & breads"},
  {"id":"hardware","name":"Hardware","icon":"🔨","color":"#6b7280","group":"Home","desc":"Tools & building"},
  {"id":"mobile-shop","name":"Mobile Shop","icon":"📲","color":"#8b5cf6","group":"Tech","desc":"Phones & accessories"},
  {"id":"cosmetics","name":"Cosmetics","icon":"💄","color":"#f43f5e","group":"Beauty","desc":"Beauty products"},
  {"id":"stationery","name":"Stationery","icon":"✏️","color":"#06b6d4","group":"Education","desc":"Books & papers"},
  {"id":"furniture","name":"Furniture","icon":"🛋️","color":"#92400e","group":"Home","desc":"Home furniture"},
  {"id":"jewelry","name":"Jewelry","icon":"💍","color":"#eab308","group":"Fashion","desc":"Gold & diamond"},
  {"id":"footwear","name":"Footwear","icon":"👟","color":"#0ea5e9","group":"Fashion","desc":"Shoes & chappals"},
  {"id":"pet-shop","name":"Pet Shop","icon":"🐕","color":"#84cc16","group":"Pets","desc":"Pet food & care"},
  {"id":"gym","name":"Gym & Fitness","icon":"💪","color":"#dc2626","group":"Health","desc":"Fitness equipment"},
  {"id":"salon","name":"Salon","icon":"💇","color":"#c026d3","group":"Beauty","desc":"Hair & beauty"},
  {"id":"automobile","name":"Automobile","icon":"🚗","color":"#1f2937","group":"Vehicle","desc":"Car & bike parts"},
  {"id":"books","name":"Books","icon":"📚","color":"#059669","group":"Education","desc":"Books & novels"},
  {"id":"toys","name":"Toys","icon":"🧸","color":"#f97316","group":"Kids","desc":"Kids toys"},
  {"id":"sports","name":"Sports Goods","icon":"⚽","color":"#14b8a6","group":"Sports","desc":"Sports equipment"},
  {"id":"dairy","name":"Dairy Products","icon":"🥛","color":"#60a5fa","group":"Food","desc":"Milk & paneer"},
  {"id":"sweets","name":"Sweet Shop","icon":"🍬","color":"#fb923c","group":"Food","desc":"Mithai & desserts"},
  {"id":"vegetables","name":"Vegetables","icon":"🥦","color":"#22c55e","group":"Food","desc":"Sabzi mandi"},
  {"id":"fruits","name":"Fruits","icon":"🍎","color":"#ef4444","group":"Food","desc":"Fresh fruits"},
  {"id":"meat-shop","name":"Meat Shop","icon":"🥩","color":"#991b1b","group":"Food","desc":"Chicken & mutton"},
  {"id":"fish-market","name":"Fish Market","icon":"🐟","color":"#0284c7","group":"Food","desc":"Fresh fish"},
  {"id":"flower-shop","name":"Flower Shop","icon":"💐","color":"#ec4899","group":"Home","desc":"Bouquets & mala"},
  {"id":"gift-shop","name":"Gift Shop","icon":"🎁","color":"#a855f7","group":"Shopping","desc":"Gifts & cards"},
  {"id":"watch-shop","name":"Watch Shop","icon":"⌚","color":"#475569","group":"Fashion","desc":"Watches & clocks"},
  {"id":"optical","name":"Optical Store","icon":"👓","color":"#0891b2","group":"Health","desc":"Specs & lenses"},
  {"id":"tailor","name":"Tailor","icon":"🧵","color":"#7c3aed","group":"Services","desc":"Stitching & alter"},
  {"id":"laundry","name":"Laundry","icon":"🧺","color":"#0d9488","group":"Services","desc":"Dhobi & dry clean"},
  {"id":"photography","name":"Photo Studio","icon":"📸","color":"#4f46e5","group":"Services","desc":"Passport & shoots"},
  {"id":"cyber-cafe","name":"Cyber Cafe","icon":"💻","color":"#1e40af","group":"Tech","desc":"Internet & printing"},
  {"id":"printing-press","name":"Printing Press","icon":"🖨️","color":"#374151","group":"Services","desc":"Cards & flex"},
  {"id":"electrician","name":"Electrician","icon":"💡","color":"#ca8a04","group":"Home","desc":"Wiring & repair"},
  {"id":"plumber","name":"Plumber","icon":"🚰","color":"#0369a1","group":"Home","desc":"Pipe & tap repair"},
  {"id":"carpenter","name":"Carpenter","icon":"🪚","color":"#854d0e","group":"Home","desc":"Wood work"},
  {"id":"painter","name":"Painter","icon":"🎨","color":"#be123c","group":"Home","desc":"Wall painting"},
  {"id":"ac-repair","name":"AC Repair","icon":"❄️","color":"#0ea5e9","group":"Home","desc":"AC service"},
  {"id":"computer-repair","name":"Computer Repair","icon":"🛠️","color":"#4b5563","group":"Tech","desc":"Laptop repair"},
  {"id":"mobile-repair","name":"Mobile Repair","icon":"🔧","color":"#6366f1","group":"Tech","desc":"Phone repair"},
  {"id":"bike-repair","name":"Bike Repair","icon":"🏍️","color":"#b91c1c","group":"Vehicle","desc":"Two wheeler"},
  {"id":"car-wash","name":"Car Wash","icon":"🚿","color":"#0284c7","group":"Vehicle","desc":"Car cleaning"},
  {"id":"tyres","name":"Tyre Shop","icon":"🛞","color":"#1f2937","group":"Vehicle","desc":"Tyres & tubes"},
  {"id":"battery","name":"Battery Shop","icon":"🔋","color":"#65a30d","group":"Vehicle","desc":"Inverter battery"},
  {"id":"gas-agency","name":"Gas Agency","icon":"🔥","color":"#ea580c","group":"Home","desc":"LPG cylinder"},
  {"id":"water-supply","name":"Water Supply","icon":"💧","color":"#06b6d4","group":"Home","desc":"Bisleri & cans"},
  {"id":"ice-cream","name":"Ice Cream","icon":"🍦","color":"#f9a8d4","group":"Food","desc":"Ice cream parlour"},
  {"id":"juice-center","name":"Juice Center","icon":"🧃","color":"#84cc16","group":"Food","desc":"Fresh juice"},
  {"id":"tea-stall","name":"Tea Stall","icon":"☕","color":"#92400e","group":"Food","desc":"Chai & coffee"},
  {"id":"paan-shop","name":"Paan Shop","icon":"🍃","color":"#16a34a","group":"Food","desc":"Paan & gutka"},
  {"id":"tobacco","name":"Tobacco Shop","icon":"🚬","color":"#57534e","group":"Food","desc":"Cigarette"},
  {"id":"liquor","name":"Liquor Shop","icon":"🍾","color":"#7c2d12","group":"Food","desc":"Wine & beer"},
  {"id":"general-store","name":"General Store","icon":"🏪","color":"#0891b2","group":"Shopping","desc":"All in one"},
  {"id":"supermarket","name":"Supermarket","icon":"🛍️","color":"#7c3aed","group":"Shopping","desc":"Big bazar type"},
  {"id":"wholesale","name":"Wholesale","icon":"📦","color":"#475569","group":"Business","desc":"Bulk items"},
  {"id":"agro-seeds","name":"Agro Seeds","icon":"🌾","color":"#65a30d","group":"Agriculture","desc":"Khaad beej"},
  {"id":"fertilizer","name":"Fertilizer","icon":"🧪","color":"#4d7c0f","group":"Agriculture","desc":"Pesticides"},
  {"id":"poultry","name":"Poultry Farm","icon":"🐔","color":"#ca8a04","group":"Agriculture","desc":"Anda murgi"},
  {"id":"nursery","name":"Plant Nursery","icon":"🪴","color":"#15803d","group":"Home","desc":"Plants & pots"},
  {"id":"medical-equipment","name":"Medical Equipment","icon":"🩺","color":"#dc2626","group":"Health","desc":"Hospital items"},
  {"id":"surgical","name":"Surgical Store","icon":"⚕️","color":"#991b1b","group":"Health","desc":"Surgical items"},
  {"id":"dental","name":"Dental Clinic","icon":"🦷","color":"#e0f2fe","group":"Health","desc":"Dentist"},
  {"id":"pathology","name":"Pathology Lab","icon":"🔬","color":"#0891b2","group":"Health","desc":"Blood test"},
  {"id":"xray","name":"X-Ray Center","icon":"🩻","color":"#1e293b","group":"Health","desc":"Scan & xray"},
  {"id":"ambulance","name":"Ambulance","icon":"🚑","color":"#dc2626","group":"Health","desc":"Emergency"},
  {"id":"blood-bank","name":"Blood Bank","icon":"🩸","color":"#b91c1c","group":"Health","desc":"Blood donate"},
  {"id":"clinic","name":"Clinic","icon":"🏥","color":"#0ea5e9","group":"Health","desc":"Doctor clinic"},
  {"id":"hospital","name":"Hospital","icon":"🏨","color":"#0369a1","group":"Health","desc":"Multi specialty"},
  {"id":"ayurvedic","name":"Ayurvedic","icon":"🌿","color":"#15803d","group":"Health","desc":"Jadi booti"},
  {"id":"homeopathy","name":"Homeopathy","icon":"💧","color":"#0d9488","group":"Health","desc":"Homeo medicine"},
  {"id":"yoga-center","name":"Yoga Center","icon":"🧘","color":"#8b5cf6","group":"Health","desc":"Yoga classes"},
  {"id":"spa","name":"Spa & Massage","icon":"💆","color":"#a855f7","group":"Beauty","desc":"Spa & massage"},
  {"id":"beauty-parlour","name":"Beauty Parlour","icon":"💅","color":"#ec4899","group":"Beauty","desc":"Makeup"},
  {"id":"mehendi","name":"Mehendi Artist","icon":"🤲","color":"#15803d","group":"Beauty","desc":"Bridal mehendi"},
  {"id":"tattoo","name":"Tattoo Studio","icon":"🎭","color":"#1f2937","group":"Beauty","desc":"Tattoo & piercing"},
  {"id":"dance-class","name":"Dance Class","icon":"💃","color":"#f43f5e","group":"Education","desc":"Dance academy"},
  {"id":"music-class","name":"Music Class","icon":"🎵","color":"#6366f1","group":"Education","desc":"Singing & instruments"},
  {"id":"coaching","name":"Coaching Center","icon":"📝","color":"#0ea5e9","group":"Education","desc":"Tuition classes"},
  {"id":"computer-class","name":"Computer Class","icon":"⌨️","color":"#1e40af","group":"Education","desc":"Computer course"},
  {"id":"language-class","name":"Language Class","icon":"🗣️","color":"#7c3aed","group":"Education","desc":"English spoken"},
  {"id":"driving-school","name":"Driving School","icon":"🚘","color":"#374151","group":"Vehicle","desc":"Car driving"},
  {"id":"library","name":"Library","icon":"📖","color":"#059669","group":"Education","desc":"Book library"},
  {"id":"newspaper","name":"Newspaper","icon":"📰","color":"#475569","group":"Services","desc":"Paper agency"},
  {"id":"magazine","name":"Magazine Store","icon":"📔","color":"#0891b2","group":"Education","desc":"Magazines"},
  {"id":"xerox","name":"Xerox Shop","icon":"📄","color":"#6b7280","group":"Services","desc":"Photocopy"},
  {"id":"courier","name":"Courier Service","icon":"📮","color":"#ca8a04","group":"Services","desc":"Parcel service"},
  {"id":"travel-agency","name":"Travel Agency","icon":"✈️","color":"#0284c7","group":"Travel","desc":"Ticket booking"},
  {"id":"hotel","name":"Hotel","icon":"🏨","color":"#92400e","group":"Travel","desc":"Stay & rooms"},
  {"id":"guest-house","name":"Guest House","icon":"🏠","color":"#78716c","group":"Travel","desc":"Lodge"},
  {"id":"banquet","name":"Banquet Hall","icon":"🎪","color":"#be123c","group":"Events","desc":"Shadi hall"},
  {"id":"catering","name":"Catering","icon":"🍛","color":"#ea580c","group":"Events","desc":"Food service"},
  {"id":"tent-house","name":"Tent House","icon":"⛺","color":"#854d0e","group":"Events","desc":"Shamiyana"},
  {"id":"dj-sound","name":"DJ & Sound","icon":"🎧","color":"#4f46e5","group":"Events","desc":"Music system"},
  {"id":"light-decoration","name":"Light Decoration","icon":"✨","color":"#eab308","group":"Events","desc":"Jhalar lights"},
  {"id":"event-planner","name":"Event Planner","icon":"🎉","color":"#f43f5e","group":"Events","desc":"Wedding planner"},
  {"id":"card-printing","name":"Card Printing","icon":"💌","color":"#c026d3","group":"Events","desc":"Shadi cards"},
  {"id":"temple-shop","name":"Temple Shop","icon":"🛕","color":"#ea580c","group":"Religious","desc":"Puja samagri"},
  {"id":"mosque-items","name":"Mosque Items","icon":"☪️","color":"#16a34a","group":"Religious","desc":"Islamic items"},
  {"id":"church-items","name":"Church Items","icon":"⛪","color":"#6b7280","group":"Religious","desc":"Christian items"},
  {"id":"astrology","name":"Astrology","icon":"🔮","color":"#7c3aed","group":"Religious","desc":"Pandit & jyotish"},
  {"id":"palmistry","name":"Palmistry","icon":"✋","color":"#a855f7","group":"Religious","desc":"Hast rekha"},
  {"id":"vastu","name":"Vastu Expert","icon":"🧭","color":"#0891b2","group":"Religious","desc":"Vastu consultant"},
  {"id":"pandit","name":"Pandit Ji","icon":"🙏","color":"#ea580c","group":"Religious","desc":"Puja path"},
  {"id":"real-estate","name":"Real Estate","icon":"🏘️","color":"#0d9488","group":"Business","desc":"Property dealer"},
  {"id":"interior","name":"Interior Design","icon":"🖼️","color":"#8b5cf6","group":"Home","desc":"Home decor"},
  {"id":"tiles","name":"Tiles & Marble","icon":"🧱","color":"#64748b","group":"Home","desc":"Flooring"},
  {"id":"sanitary","name":"Sanitary Ware","icon":"🚽","color":"#0284c7","group":"Home","desc":"Bath fittings"},
  {"id":"paint-shop","name":"Paint Shop","icon":"🪣","color":"#f59e0b","group":"Home","desc":"Wall paint"},
  {"id":"glass-shop","name":"Glass Shop","icon":"🪟","color":"#06b6d4","group":"Home","desc":"Mirror & glass"},
  {"id":"plywood","name":"Plywood","icon":"🪵","color":"#92400e","group":"Home","desc":"Wood & laminate"},
  {"id":"cement","name":"Cement Shop","icon":"🏗️","color":"#475569","group":"Construction","desc":"Cement sariya"},
  {"id":"steel","name":"Steel Shop","icon":"⚙️","color":"#374151","group":"Construction","desc":"Loha & steel"},
  {"id":"aluminium","name":"Aluminium Work","icon":"🪜","color":"#9ca3af","group":"Construction","desc":"Aluminium doors"},
  {"id":"welding","name":"Welding Shop","icon":"🔥","color":"#ea580c","group":"Services","desc":"Welding work"},
  {"id":"grill-house","name":"Grill House","icon":"🔲","color":"#1f2937","group":"Home","desc":"Iron grill"},
  {"id":"security","name":"Security Service","icon":"🛡️","color":"#0f172a","group":"Services","desc":"Guard agency"},
  {"id":"cctv","name":"CCTV Camera","icon":"📹","color":"#1e293b","group":"Tech","desc":"Security camera"},
  {"id":"fire-safety","name":"Fire Safety","icon":"🧯","color":"#dc2626","group":"Services","desc":"Fire extinguisher"},
  {"id":"pest-control","name":"Pest Control","icon":"🐜","color":"#65a30d","group":"Services","desc":"Termite control"},
  {"id":"tank-cleaning","name":"Tank Cleaning","icon":"🛢️","color":"#0891b2","group":"Services","desc":"Water tank"},
  {"id":"septic-tank","name":"Septic Tank","icon":"🚛","color":"#ca8a04","group":"Services","desc":"Septic cleaning"},
  {"id":"scrap","name":"Scrap Dealer","icon":"♻️","color":"#15803d","group":"Business","desc":"Kabadi wala"},
  {"id":"second-hand","name":"Second Hand","icon":"🪑","color":"#78716c","group":"Shopping","desc":"Purana saman"},
  {"id":"pawn-shop","name":"Pawn Shop","icon":"💰","color":"#ca8a04","group":"Finance","desc":"Girvi shop"},
  {"id":"money-exchange","name":"Money Exchange","icon":"💱","color":"#059669","group":"Finance","desc":"Dollar exchange"},
  {"id":"atm","name":"ATM","icon":"🏧","color":"#0ea5e9","group":"Finance","desc":"ATM machine"},
  {"id":"bank","name":"Bank","icon":"🏦","color":"#1e40af","group":"Finance","desc":"Bank branch"},
  {"id":"insurance","name":"Insurance","icon":"📋","color":"#4f46e5","group":"Finance","desc":"Bima agent"},
  {"id":"ca-office","name":"CA Office","icon":"🧮","color":"#374151","group":"Finance","desc":"Chartered accountant"},
  {"id":"lawyer","name":"Lawyer","icon":"⚖️","color":"#1f2937","group":"Legal","desc":"Vakil"},
  {"id":"notary","name":"Notary","icon":"📝","color":"#475569","group":"Legal","desc":"Stamp paper"},
  {"id":"rto-agent","name":"RTO Agent","icon":"🚙","color":"#0284c7","group":"Vehicle","desc":"License agent"},
  {"id":"passport","name":"Passport Agent","icon":"🛂","color":"#0ea5e9","group":"Services","desc":"Passport seva"},
  {"id":"aadhar","name":"Aadhar Center","icon":"🪪","color":"#ea580c","group":"Services","desc":"Aadhar update"},
  {"id":"pan-card","name":"PAN Card","icon":"💳","color":"#0891b2","group":"Services","desc":"PAN service"},
  {"id":"voter-id","name":"Voter ID","icon":"🗳️","color":"#059669","group":"Services","desc":"Voter card"},
  {"id":"ration-card","name":"Ration Card","icon":"📃","color":"#ca8a04","group":"Services","desc":"Ration service"},
  {"id":"csc-center","name":"CSC Center","icon":"🏛️","color":"#0d9488","group":"Services","desc":"Common service"},
  {"id":"post-office","name":"Post Office","icon":"📯","color":"#dc2626","group":"Services","desc":"Dak ghar"},
  {"id":"police-station","name":"Police Station","icon":"👮","color":"#1e40af","group":"Government","desc":"Thana"},
  {"id":"fire-station","name":"Fire Station","icon":"🚒","color":"#b91c1c","group":"Government","desc":"Fire brigade"},
  {"id":"bus-stand","name":"Bus Stand","icon":"🚌","color":"#ca8a04","group":"Travel","desc":"Bus stop"},
  {"id":"railway","name":"Railway Station","icon":"🚂","color":"#374151","group":"Travel","desc":"Railway"},
  {"id":"auto-stand","name":"Auto Stand","icon":"🛺","color":"#eab308","group":"Travel","desc":"Auto rickshaw"},
  {"id":"taxi-stand","name":"Taxi Stand","icon":"🚕","color":"#facc15","group":"Travel","desc":"Taxi service"},
  {"id":"parking","name":"Parking","icon":"🅿️","color":"#0284c7","group":"Vehicle","desc":"Vehicle parking"},
  {"id":"petrol-pump","name":"Petrol Pump","icon":"⛽","color":"#dc2626","group":"Vehicle","desc":"Fuel station"},
  {"id":"cng-pump","name":"CNG Pump","icon":"🚐","color":"#16a34a","group":"Vehicle","desc":"CNG gas"},
  {"id":"ev-charging","name":"EV Charging","icon":"🔌","color":"#0ea5e9","group":"Vehicle","desc":"Electric charging"},
  {"id":"car-service","name":"Car Service","icon":"🔧","color":"#1f2937","group":"Vehicle","desc":"Car workshop"},
  {"id":"bike-service","name":"Bike Service","icon":"🛵","color":"#b91c1c","group":"Vehicle","desc":"Bike workshop"},
  {"id":"towing","name":"Towing Service","icon":"🚚","color":"#ca8a04","group":"Vehicle","desc":"Vehicle towing"},
  {"id":"rto-office","name":"RTO Office","icon":"📄","color":"#475569","group":"Government","desc":"Vehicle RC"},
  {"id":"driving-test","name":"Driving Test","icon":"🚦","color":"#ea580c","group":"Vehicle","desc":"License test"},
  {"id":"weighbridge","name":"Weighbridge","icon":"⚖️","color":"#374151","group":"Business","desc":"Dharam kanta"},
  {"id":"cold-storage","name":"Cold Storage","icon":"🧊","color":"#06b6d4","group":"Business","desc":"Cold store"},
  {"id":"warehouse","name":"Warehouse","icon":"🏭","color":"#6b7280","group":"Business","desc":"Godam"},
  {"id":"transport","name":"Transport","icon":"🚛","color":"#1e40af","group":"Business","desc":"Goods carrier"},
  {"id":"packers","name":"Packers Movers","icon":"📦","color":"#ca8a04","group":"Services","desc":"House shifting"},
  {"id":"container","name":"Container Service","icon":"🚢","color":"#0284c7","group":"Business","desc":"Shipping"},
  {"id":"customs","name":"Custom Clearing","icon":"🛃","color":"#374151","group":"Business","desc":"Import export"},
  {"id":"freight","name":"Freight Service","icon":"✈️","color":"#0ea5e9","group":"Business","desc":"Air cargo"},
  {"id":"logistics","name":"Logistics","icon":"🗺️","color":"#4f46e5","group":"Business","desc":"Supply chain"},
  {"id":"storage","name":"Storage Service","icon":"🗄️","color":"#78716c","group":"Business","desc":"Self storage"},
  {"id":"godown","name":"Godown","icon":"🏚️","color":"#57534e","group":"Business","desc":"Storage space"},
  {"id":"factory","name":"Factory","icon":"🏭","color":"#1f2937","group":"Business","desc":"Manufacturing"},
  {"id":"workshop","name":"Workshop","icon":"🔨","color":"#374151","group":"Business","desc":"Small factory"},
  {"id":"flour-mill","name":"Flour Mill","icon":"🌾","color":"#ca8a04","group":"Food","desc":"Chakki"},
  {"id":"oil-mill","name":"Oil Mill","icon":"🫒","color":"#65a30d","group":"Food","desc":"Tel mill"},
  {"id":"rice-mill","name":"Rice Mill","icon":"🍚","color":"#e5e7eb","group":"Food","desc":"Chawal mill"},
  {"id":"saw-mill","name":"Saw Mill","icon":"🪚","color":"#92400e","group":"Construction","desc":"Lakdi mill"},
  {"id":"ice-factory","name":"Ice Factory","icon":"🧊","color":"#06b6d4","group":"Business","desc":"Baraf factory"},
  {"id":"brick-kiln","name":"Brick Kiln","icon":"🧱","color":"#991b1b","group":"Construction","desc":"Eent bhatta"},
  {"id":"stone-crusher","name":"Stone Crusher","icon":"🪨","color":"#475569","group":"Construction","desc":"Pathar crusher"},
  {"id":"sand-supplier","name":"Sand Supplier","icon":"⏳","color":"#ca8a04","group":"Construction","desc":"Ret bajri"},
  {"id":"building-material","name":"Building Material","icon":"🏗️","color":"#374151","group":"Construction","desc":"Construction"},
  {"id":"readymix","name":"Ready Mix","icon":"🚜","color":"#6b7280","group":"Construction","desc":"Concrete mix"},
  {"id":"crane","name":"Crane Service","icon":"🏗️","color":"#eab308","group":"Construction","desc":"Hydra crane"},
  {"id":"jcb","name":"JCB Service","icon":"🚜","color":"#f59e0b","group":"Construction","desc":"Earth mover"},
  {"id":"tractor-service","name":"Tractor","icon":"🚜","color":"#16a34a","group":"Agriculture","desc":"Tractor service"},
  {"id":"agriculture","name":"Agriculture","icon":"🚜","color":"#65a30d","group":"Agriculture","desc":"Kheti saman"},
  {"id":"dairy-farm","name":"Dairy Farm","icon":"🐄","color":"#e5e7eb","group":"Agriculture","desc":"Doodh dairy"},
  {"id":"goat-farm","name":"Goat Farm","icon":"🐐","color":"#78716c","group":"Agriculture","desc":"Bakri farm"},
  {"id":"fishery","name":"Fishery","icon":"🎣","color":"#0284c7","group":"Agriculture","desc":"Machli palan"},
  {"id":"hatchery","name":"Hatchery","icon":"🐣","color":"#facc15","group":"Agriculture","desc":"Murgi hatchery"},
  {"id":"beekeeping","name":"Beekeeping","icon":"🐝","color":"#eab308","group":"Agriculture","desc":"Madhu makhi"},
  {"id":"mushroom","name":"Mushroom Farm","icon":"🍄","color":"#78716c","group":"Agriculture","desc":"Mushroom"},
  {"id":"organic-farm","name":"Organic Farm","icon":"🥬","color":"#15803d","group":"Agriculture","desc":"Jaivik kheti"},
  {"id":"polyhouse","name":"Polyhouse","icon":"🏡","color":"#16a34a","group":"Agriculture","desc":"Green house"},
  {"id":"irrigation","name":"Drip Irrigation","icon":"💧","color":"#06b6d4","group":"Agriculture","desc":"Sinchai"},
  {"id":"tractor-dealer","name":"Tractor Dealer","icon":"🚜","color":"#dc2626","group":"Vehicle","desc":"Tractor showroom"},
  {"id":"farm-equipment","name":"Farm Equipment","icon":"🌾","color":"#65a30d","group":"Agriculture","desc":"Kheti machine"},
  {"id":"animal-feed","name":"Animal Feed","icon":"🌽","color":"#ca8a04","group":"Agriculture","desc":"Pashu aahar"},
  {"id":"veterinary","name":"Veterinary","icon":"🐾","color":"#0ea5e9","group":"Pets","desc":"Pashu doctor"},
  {"id":"pet-grooming","name":"Pet Grooming","icon":"✂️","color":"#a855f7","group":"Pets","desc":"Pet salon"},
  {"id":"pet-clinic","name":"Pet Clinic","icon":"🏥","color":"#ec4899","group":"Pets","desc":"Pet hospital"},
  {"id":"aquarium","name":"Aquarium Shop","icon":"🐠","color":"#0284c7","group":"Pets","desc":"Fish tank"},
  {"id":"bird-shop","name":"Bird Shop","icon":"🦜","color":"#16a34a","group":"Pets","desc":"Pet birds"},
  {"id":"zoo-supplies","name":"Zoo Supplies","icon":"🦁","color":"#ca8a04","group":"Pets","desc":"Animal care"},
  {"id":"zoo","name":"Zoo","icon":"🦒","color":"#84cc16","group":"Entertainment","desc":"Chidiya ghar"},
  {"id":"park","name":"Park","icon":"🌳","color":"#15803d","group":"Entertainment","desc":"Public park"},
  {"id":"playground","name":"Playground","icon":"🛝","color":"#f43f5e","group":"Kids","desc":"Kids park"},
  {"id":"swimming-pool","name":"Swimming Pool","icon":"🏊","color":"#06b6d4","group":"Sports","desc":"Swimming"},
  {"id":"stadium","name":"Stadium","icon":"🏟️","color":"#16a34a","group":"Sports","desc":"Sports stadium"},
  {"id":"cinema","name":"Cinema Hall","icon":"🎬","color":"#7c3aed","group":"Entertainment","desc":"Movie theater"},
  {"id":"theatre","name":"Theatre","icon":"🎭","color":"#be123c","group":"Entertainment","desc":"Drama hall"},
  {"id":"museum","name":"Museum","icon":"🏛️","color":"#78716c","group":"Education","desc":"Sangrahalaya"},
  {"id":"art-gallery","name":"Art Gallery","icon":"🖼️","color":"#c026d3","group":"Entertainment","desc":"Painting gallery"},
  {"id":"exhibition","name":"Exhibition","icon":"🎪","color":"#f59e0b","group":"Events","desc":"Mela pradarshani"},
  {"id":"fair","name":"Fair","icon":"🎡","color":"#ec4899","group":"Entertainment","desc":"Mela"},
  {"id":"circus","name":"Circus","icon":"🎪","color":"#dc2626","group":"Entertainment","desc":"Circus"},
  {"id":"amusement-park","name":"Amusement Park","icon":"🎢","color":"#8b5cf6","group":"Entertainment","desc":"Fun park"},
  {"id":"water-park","name":"Water Park","icon":"🌊","color":"#06b6d4","group":"Entertainment","desc":"Water slides"},
  {"id":"resort","name":"Resort","icon":"🏝️","color":"#0ea5e9","group":"Travel","desc":"Holiday resort"},
  {"id":"farm-house","name":"Farm House","icon":"🏡","color":"#65a30d","group":"Travel","desc":"Farm stay"},
  {"id":"picnic-spot","name":"Picnic Spot","icon":"🧺","color":"#84cc16","group":"Entertainment","desc":"Picnic place"},
  {"id":"trekking","name":"Trekking","icon":"⛰️","color":"#78716c","group":"Sports","desc":"Hiking"},
  {"id":"camping","name":"Camping","icon":"🏕️","color":"#16a34a","group":"Travel","desc":"Camp site"},
  {"id":"boating","name":"Boating","icon":"🚣","color":"#0284c7","group":"Entertainment","desc":"Boat ride"},
  {"id":"fishing-point","name":"Fishing Point","icon":"🎣","color":"#0ea5e9","group":"Sports","desc":"Fishing"},
  {"id":"adventure","name":"Adventure Sports","icon":"🪂","color":"#dc2626","group":"Sports","desc":"Paragliding"},
  {"id":"club","name":"Club","icon":"🎱","color":"#1f2937","group":"Entertainment","desc":"Sports club"},
  {"id":"bar","name":"Bar","icon":"🍻","color":"#ca8a04","group":"Food","desc":"Beer bar"},
  {"id":"pub","name":"Pub","icon":"🍺","color":"#d97706","group":"Food","desc":"Pub & lounge"},
  {"id":"hookah","name":"Hookah Parlour","icon":"💨","color":"#64748b","group":"Entertainment","desc":"Sheesha lounge"},
  {"id":"nightclub","name":"Night Club","icon":"🪩","color":"#c026d3","group":"Entertainment","desc":"Disco club"},
  {"id":"cafe","name":"Cafe","icon":"☕","color":"#92400e","group":"Food","desc":"Coffee shop"},
  {"id":"fast-food","name":"Fast Food","icon":"🍔","color":"#ef4444","group":"Food","desc":"Burger pizza"},
  {"id":"chinese","name":"Chinese Food","icon":"🥡","color":"#dc2626","group":"Food","desc":"Noodles manchurian"},
  {"id":"south-indian","name":"South Indian","icon":"🥥","color":"#16a34a","group":"Food","desc":"Dosa idli"},
  {"id":"punjabi-dhaba","name":"Punjabi Dhaba","icon":"🍛","color":"#ea580c","group":"Food","desc":"Desi dhaba"},
  {"id":"biryani","name":"Biryani Center","icon":"🍗","color":"#ca8a04","group":"Food","desc":"Biryani shop"},
  {"id":"kebab","name":"Kebab Shop","icon":"🍢","color":"#991b1b","group":"Food","desc":"Tandoor & kebab"},
  {"id":"momos","name":"Momos Stall","icon":"🥟","color":"#e5e7eb","group":"Food","desc":"Veg non-veg momos"},
  {"id":"chaat","name":"Chaat Bhandar","icon":"🥗","color":"#84cc16","group":"Food","desc":"Golgappa chaat"},
  {"id":"pani-puri","name":"Pani Puri","icon":"💧","color":"#06b6d4","group":"Food","desc":"Golgappa stall"},
  {"id":"bhel-puri","name":"Bhel Puri","icon":"🥙","color":"#f59e0b","group":"Food","desc":"Bhel chaat"},
  {"id":"sandwich","name":"Sandwich Shop","icon":"🥪","color":"#facc15","group":"Food","desc":"Grilled sandwich"},
  {"id":"pizza","name":"Pizza Shop","icon":"🍕","color":"#ef4444","group":"Food","desc":"Pizza parlour"},
  {"id":"burger","name":"Burger Shop","icon":"🍔","color":"#dc2626","group":"Food","desc":"Burger joint"},
  {"id":"shawarma","name":"Shawarma","icon":"🌯","color":"#854d0e","group":"Food","desc":"Roll & shawarma"},
  {"id":"rolls","name":"Rolls Center","icon":"🌯","color":"#ca8a04","group":"Food","desc":"Kathi rolls"},
  {"id":"tiffin-service","name":"Tiffin Service","icon":"🍱","color":"#0891b2","group":"Food","desc":"Home food dabba"},
  {"id":"mess","name":"Mess","icon":"🍽️","color":"#78716c","group":"Food","desc":"Students mess"},
  {"id":"canteen","name":"Canteen","icon":"🏫","color":"#475569","group":"Food","desc":"School canteen"},
  {"id":"food-truck","name":"Food Truck","icon":"🚚","color":"#f59e0b","group":"Food","desc":"Mobile food"},
  {"id":"dhaba","name":"Highway Dhaba","icon":"🛣️","color":"#854d0e","group":"Food","desc":"24x7 dhaba"},
  {"id":"pure-veg","name":"Pure Veg Hotel","icon":"🥬","color":"#16a34a","group":"Food","desc":"Veg restaurant"},
  {"id":"non-veg","name":"Non-Veg Hotel","icon":"🍖","color":"#991b1b","group":"Food","desc":"Chicken mutton"},
  {"id":"family-restaurant","name":"Family Restaurant","icon":"👨‍👩‍👧","color":"#0ea5e9","group":"Food","desc":"AC restaurant"},
  {"id":"rooftop-cafe","name":"Rooftop Cafe","icon":"🌃","color":"#1e293b","group":"Food","desc":"Open air cafe"},
  {"id":"food-court","name":"Food Court","icon":"🏬","color":"#7c3aed","group":"Food","desc":"Mall food court"}
];

async function loadCategories() {
    try {
        const res = await fetch('/api/market/categories');
        if (!res.ok) throw new Error('API Error');

        const categories = await res.json();
        allCategories = categories.length > 0 ? categories : CATEGORIES_FALLBACK;
        currentCategories = allCategories;
        renderCategories(allCategories);
        setupSearchAndFilters();
        updateCount(allCategories.length);

    } catch(err) {
        console.error(err);
        allCategories = CATEGORIES_FALLBACK;
        currentCategories = allCategories;
        renderCategories(allCategories);
        setupSearchAndFilters();
        updateCount(allCategories.length);
    }
}

function renderCategories(categories) {
    const box = document.getElementById('categoriesBox');

    if (categories.length === 0) {
        box.innerHTML = '<div class="loading">Koi category nahi mili 😔</div>';
        return;
    }

    box.innerHTML = categories.map(cat => `
        <div class="category-card" style="--cat-color: ${cat.color || '#10b981'}" onclick="openCategory('${cat.id}', '${cat.name}', '${cat.icon}')">
            <div class="category-count-badge">${cat.shopCount || '0'}</div>
            <div class="category-icon">${cat.icon}</div>
            <div class="category-name">${cat.name}</div>
            <div class="category-group">${cat.group || 'General'}</div>
        </div>
    `).join('');
}

function setupSearchAndFilters() {
    const searchInput = document.getElementById('categorySearch');
    const filterBtns = document.querySelectorAll('.filter-btn');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const filtered = allCategories.filter(cat => 
                cat.name.toLowerCase().includes(query) || 
                (cat.desc && cat.desc.toLowerCase().includes(query)) ||
                (cat.group && cat.group.toLowerCase().includes(query))
            );
            currentCategories = filtered;
            renderCategories(filtered);
            updateCount(filtered.length);
        });
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.dataset.filter;
            let filtered = [...allCategories];
            
            if (filter === 'popular') {
                filtered.sort((a, b) => (b.shopCount || 0) - (a.shopCount || 0));
            } else if (filter === 'az') {
                filtered.sort((a, b) => a.name.localeCompare(b.name));
            } else if (filter !== 'all') {
                filtered = allCategories.filter(cat => cat.group === filter);
            }
            
            currentCategories = filtered;
            renderCategories(filtered);
            updateCount(filtered.length);
        });
    });
}

function updateCount(count) {
    const countEl = document.getElementById('totalCount');
    if (countEl) countEl.textContent = count;
}

async function openCategory(id, name, icon) {
    const container = document.getElementById('mainContainer');
    container.innerHTML = `
        <div class="market-header">
            <button class="back-btn" onclick="backToCategories()">← Back to Categories</button>
            <h1>${icon} ${name}</h1>
            <p>Is category ki sabhi dukaanen</p>
        </div>
        <div id="shopsBox" class="loading">Loading shops...</div>
    `;

    try {
        let url = `/api/market/shops/${id}`;

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                url += `?lat=${lat}&lng=${lng}`;
                await fetchShops(url);
            }, async () => {
                await fetchShops(url);
            });
        } else {
            await fetchShops(url);
        }
    } catch(err) {
        console.error(err);
        document.getElementById('shopsBox').innerHTML =
            '<div class="error">Error loading shops 😢</div>';
    }
}

async function fetchShops(url) {
    const res = await fetch(url);
    const shops = await res.json();
    const box = document.getElementById('shopsBox');

    if (shops.length === 0) {
        box.innerHTML = '<div class="loading">Is category me abhi koi shop nahi hai 😔</div>';
        return;
    }

    const banners = [
        { img: '/assets/banners/banner1.jpg', link: '#' },
        { img: '/assets/banners/banner2.jpg', link: '#' },
        { img: '/assets/banners/banner3.jpg', link: '#' },
        { img: '/assets/banners/banner4.jpg', link: '#' }
    ];

    let html = '<div class="shops-grid">';
    let bannerIndex = 0;

    shops.forEach((shop, index) => {
        html += `
            <div class="shop-card">
                <div class="shop-header">
                    <div class="shop-icon">${shop.icon}</div>
                    <div class="shop-info">
                        <h3>${shop.name}</h3>
                        <div class="shop-address">📍 ${shop.address || 'Address not available'}</div>
                    </div>
                ${shop.distance? `<div class="shop-distance">${shop.distance}m door</div>` : ''}
            </div>
        `;

        if ((index + 1) % 8 === 0) {
            const shopWithBanner = shops.slice(Math.max(0, index - 7), index + 1).find(s => s.banner && s.banner!== '');

            if (shopWithBanner && shopWithBanner.banner) {
                html += `
                    <div class="shop-banner">
                        <img src="${shopWithBanner.banner}" alt="Shop Banner">
                    </div>
                `;
            } else {
                const banner = banners[bannerIndex % banners.length];
                html += `
                    <div class="shop-banner" onclick="window.open('${banner.link}', '_blank')">
                        <img src="${banner.img}" alt="Promo Banner">
                    </div>
                `;
            }
            bannerIndex++;
        }
    });

    html += '</div>';
    box.innerHTML = html;
}

function backToCategories() {
    location.reload();
}

loadCategories();
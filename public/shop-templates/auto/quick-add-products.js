// ========================================
// QUICK ADD 50 AUTO PRODUCTS - AUTO SHOP
// File: public/shop-templates/auto/quick-add-products.js
// Teri purani Auto.js model + auto.js route ke hisab se
// API: /api/shops/auto/:shopId/quick-add
// ========================================

const autoProductsList = [
    { name: 'Engine Oil 5W-30', category: 'Engine', price: 1200, mrp: 1500, stock: 25, description: 'Full synthetic engine oil', brand: 'Castrol', partNo: 'CAST5W30', compatible: 'All Petrol Cars', warranty: '6 Month', image: 'https://placehold.co/400/1f2937/fff?text=Engine+Oil' },
    { name: 'Brake Pad Front', category: 'Brake', price: 1800, mrp: 2200, stock: 15, description: 'Front brake pad set', brand: 'Bosch', partNo: 'BOS-FP-001', compatible: 'Swift, Baleno', warranty: '1 Year', image: 'https://placehold.co/400/f97316/fff?text=Brake+Pad' },
    { name: 'Air Filter', category: 'Engine', price: 450, mrp: 600, stock: 30, description: 'High flow air filter', brand: 'Mahle', partNo: 'AF-101', compatible: 'Maruti All', warranty: '6 Month', image: 'https://placehold.co/400/f97316/fff?text=Air+Filter' },
    { name: 'Spark Plug Set 4pcs', category: 'Engine', price: 800, mrp: 1000, stock: 40, description: 'Iridium spark plug', brand: 'NGK', partNo: 'NGK-IR-4', compatible: 'Petrol Cars', warranty: '1 Year', image: 'https://placehold.co/400/111827/fff?text=Spark+Plug' },
    { name: 'Battery 12V 65Ah', category: 'Battery', price: 6500, mrp: 7800, stock: 8, description: 'Maintenance free battery', brand: 'Exide', partNo: 'EXD65', compatible: 'Diesel Cars', warranty: '3 Year', image: 'https://placehold.co/400/1f2937/fff?text=Battery' },
    { name: 'Clutch Plate Kit', category: 'Engine', price: 5500, mrp: 6800, stock: 10, description: 'Clutch + Pressure + Bearing', brand: 'Valeo', partNo: 'VAL-CL-550', compatible: 'Swift Diesel', warranty: '1 Year', image: 'https://placehold.co/400/f97316/fff?text=Clutch+Kit' },
    { name: 'Oil Filter', category: 'Engine', price: 350, mrp: 500, stock: 50, description: 'Oil filter universal', brand: 'Purolator', partNo: 'OF-202', compatible: 'All Cars', warranty: '6 Month', image: 'https://placehold.co/400/1f2937/fff?text=Oil+Filter' },
    { name: 'Wiper Blade Pair', category: 'Other', price: 600, mrp: 800, stock: 35, description: '22 inch wiper blade', brand: 'Bosch', partNo: 'WB-22', compatible: 'Universal', warranty: '6 Month', image: 'https://placehold.co/400/f97316/fff?text=Wiper' },
    { name: 'Coolant 1L', category: 'Engine', price: 350, mrp: 450, stock: 60, description: 'Radiator coolant green', brand: 'Castrol', partNo: 'COOL-1L', compatible: 'All Cars', warranty: '2 Year', image: 'https://placehold.co/400/1f2937/fff?text=Coolant' },
    { name: 'Headlight Bulb H4 LED', category: 'Electrical', price: 900, mrp: 1200, stock: 20, description: 'LED headlight H4', brand: 'Philips', partNo: 'PHI-H4-LED', compatible: 'All Cars', warranty: '1 Year', image: 'https://placehold.co/400/f97316/fff?text=Headlight' },
    { name: 'Brake Fluid DOT4', category: 'Brake', price: 400, mrp: 550, stock: 45, description: 'DOT4 brake oil 500ml', brand: 'Bosch', partNo: 'BF-DOT4', compatible: 'Universal', warranty: '2 Year', image: 'https://placehold.co/400/111827/fff?text=Brake+Fluid' },
    { name: 'Fan Belt', category: 'Engine', price: 750, mrp: 950, stock: 18, description: 'Alternator fan belt', brand: 'Gates', partNo: 'GT-FB-10', compatible: 'Swift', warranty: '1 Year', image: 'https://placehold.co/400/1f2937/fff?text=Fan+Belt' },
    { name: 'Fuel Filter Diesel', category: 'Engine', price: 1200, mrp: 1500, stock: 12, description: 'Diesel fuel filter', brand: 'Delphi', partNo: 'FF-DL-01', compatible: 'Swift Diesel', warranty: '1 Year', image: 'https://placehold.co/400/f97316/fff?text=Fuel+Filter' },
    { name: 'Horn Pair', category: 'Electrical', price: 1100, mrp: 1400, stock: 22, description: 'High low horn', brand: 'Roots', partNo: 'RT-HORN', compatible: 'Universal', warranty: '1 Year', image: 'https://placehold.co/400/1f2937/fff?text=Horn' },
    { name: 'Side Mirror Left', category: 'Body', price: 1500, mrp: 1900, stock: 10, description: 'Left side mirror', brand: 'OEM', partNo: 'SM-L-SWIFT', compatible: 'Swift', warranty: '6 Month', image: 'https://placehold.co/400/111827/fff?text=Mirror' },
    { name: 'Shock Absorber Front Pair', category: 'Other', price: 3200, mrp: 4000, stock: 8, description: 'Front shocker pair', brand: 'Gabriel', partNo: 'GB-SH-F', compatible: 'Baleno', warranty: '1 Year', image: 'https://placehold.co/400/f97316/fff?text=Shocker' },
    { name: 'Radiator', category: 'Engine', price: 4500, mrp: 5500, stock: 6, description: 'Aluminium radiator', brand: 'Behr', partNo: 'RD-SWIFT', compatible: 'Swift Petrol', warranty: '1 Year', image: 'https://placehold.co/400/1f2937/fff?text=Radiator' },
    { name: 'Timing Belt Kit', category: 'Engine', price: 2800, mrp: 3500, stock: 9, description: 'Timing belt with tensioner', brand: 'Contitech', partNo: 'CT-TB-KIT', compatible: 'Swift', warranty: '1 Year', image: 'https://placehold.co/400/111827/fff?text=Timing+Belt' },
    { name: 'AC Filter Cabin', category: 'Engine', price: 400, mrp: 600, stock: 30, description: 'Cabin AC filter', brand: 'Mahle', partNo: 'ACF-01', compatible: 'All Maruti', warranty: '6 Month', image: 'https://placehold.co/400/f97316/fff?text=AC+Filter' },
    { name: 'Gear Oil 75W-90 1L', category: 'Engine', price: 650, mrp: 800, stock: 25, description: 'Transmission oil', brand: 'Castrol', partNo: 'GO-75W', compatible: 'Manual Cars', warranty: '1 Year', image: 'https://placehold.co/400/1f2937/fff?text=Gear+Oil' },
    { name: 'Tyre 165/80 R14', category: 'Tyre', price: 3800, mrp: 4500, stock: 12, description: 'Tubeless tyre', brand: 'MRF', partNo: 'MRF-165-14', compatible: 'Swift, WagonR', warranty: '2 Year', image: 'https://placehold.co/400/1f2937/fff?text=Tyre' },
    { name: 'Battery Terminal Pair', category: 'Battery', price: 250, mrp: 350, stock: 50, description: 'Brass battery terminal', brand: 'OEM', partNo: 'BT-TERM', compatible: 'Universal', warranty: '6 Month', image: 'https://placehold.co/400/f97316/fff?text=Terminal' },
    { name: 'Brake Shoe Rear', category: 'Brake', price: 1200, mrp: 1500, stock: 18, description: 'Rear brake shoe set', brand: 'Bosch', partNo: 'BOS-BS-R', compatible: 'Swift', warranty: '1 Year', image: 'https://placehold.co/400/111827/fff?text=Brake+Shoe' },
    { name: 'Clutch Cable', category: 'Engine', price: 550, mrp: 750, stock: 25, description: 'Clutch wire cable', brand: 'Supreme', partNo: 'CC-SWIFT', compatible: 'Swift', warranty: '6 Month', image: 'https://placehold.co/400/1f2937/fff?text=Clutch+Cable' },
    { name: 'Head Gasket', category: 'Engine', price: 1800, mrp: 2200, stock: 8, description: 'Engine head gasket', brand: 'Victor', partNo: 'HG-SWIFT-D', compatible: 'Swift Diesel', warranty: '1 Year', image: 'https://placehold.co/400/f97316/fff?text=Gasket' },
    { name: 'Water Pump', category: 'Engine', price: 2200, mrp: 2800, stock: 7, description: 'Engine water pump', brand: 'GMB', partNo: 'WP-SWIFT', compatible: 'Swift Petrol', warranty: '1 Year', image: 'https://placehold.co/400/111827/fff?text=Water+Pump' },
    { name: 'Starter Motor', category: 'Electrical', price: 7500, mrp: 9000, stock: 4, description: 'Self starter motor', brand: 'Denso', partNo: 'SM-DZIRE', compatible: 'Dzire Diesel', warranty: '1 Year', image: 'https://placehold.co/400/1f2937/fff?text=Starter' },
    { name: 'Alternator', category: 'Electrical', price: 8500, mrp: 10000, stock: 3, description: 'Alternator 12V', brand: 'Bosch', partNo: 'ALT-90A', compatible: 'Swift', warranty: '1 Year', image: 'https://placehold.co/400/f97316/fff?text=Alternator' },
    { name: 'Door Handle Outer', category: 'Body', price: 450, mrp: 600, stock: 20, description: 'Outer door handle', brand: 'OEM', partNo: 'DH-SWIFT-F', compatible: 'Swift', warranty: '6 Month', image: 'https://placehold.co/400/111827/fff?text=Door+Handle' },
    { name: 'Bumper Front', category: 'Body', price: 3500, mrp: 4500, stock: 5, description: 'Front bumper white', brand: 'OEM', partNo: 'BMP-F-SWIFT', compatible: 'Swift 2020', warranty: '6 Month', image: 'https://placehold.co/400/1f2937/fff?text=Bumper' },
    { name: 'Tail Light Right', category: 'Electrical', price: 1800, mrp: 2300, stock: 12, description: 'Right tail lamp', brand: 'Lumax', partNo: 'TL-R-SWIFT', compatible: 'Swift', warranty: '6 Month', image: 'https://placehold.co/400/f97316/fff?text=Tail+Light' },
    { name: 'Windshield Glass', category: 'Body', price: 5500, mrp: 7000, stock: 3, description: 'Front windshield', brand: 'AIS', partNo: 'WS-SWIFT', compatible: 'Swift', warranty: '1 Year', image: 'https://placehold.co/400/111827/fff?text=Windshield' },
    { name: 'Steering Wheel Cover', category: 'Other', price: 450, mrp: 650, stock: 40, description: 'Leather steering cover', brand: 'OEM', partNo: 'SWC-LEA', compatible: 'Universal', warranty: '6 Month', image: 'https://placehold.co/400/1f2937/fff?text=Steering+Cover' },
    { name: 'Seat Cover Set', category: 'Other', price: 4500, mrp: 5500, stock: 8, description: '5 seater seat cover', brand: 'AutoFurnish', partNo: 'SC-BEIGE-5', compatible: 'Swift', warranty: '1 Year', image: 'https://placehold.co/400/f97316/fff?text=Seat+Cover' },
    { name: 'Car Perfume', category: 'Other', price: 350, mrp: 500, stock: 60, description: 'Gel car perfume', brand: 'Involve', partNo: 'PER-GEL', compatible: 'Universal', warranty: '6 Month', image: 'https://placehold.co/400/1f2937/fff?text=Perfume' },
    { name: 'Mobile Holder', category: 'Other', price: 300, mrp: 450, stock: 50, description: 'Dashboard mobile holder', brand: 'OEM', partNo: 'MH-DASH', compatible: 'Universal', warranty: '6 Month', image: 'https://placehold.co/400/111827/fff?text=Mobile+Holder' },
    { name: 'Vacuum Cleaner 12V', category: 'Other', price: 1500, mrp: 2000, stock: 15, description: 'Car vacuum cleaner', brand: 'Bergmann', partNo: 'VC-12V', compatible: 'Universal', warranty: '1 Year', image: 'https://placehold.co/400/1f2937/fff?text=Vacuum' },
    { name: 'Puncture Kit', category: 'Tyre', price: 250, mrp: 350, stock: 100, description: 'Tyre puncture repair kit', brand: 'OEM', partNo: 'PK-10IN1', compatible: 'Universal', warranty: '6 Month', image: 'https://placehold.co/400/f97316/fff?text=Puncture+Kit' },
    { name: 'Jack Hydraulic', category: 'Other', price: 1800, mrp: 2200, stock: 10, description: '2 Ton hydraulic jack', brand: 'OEM', partNo: 'JACK-2T', compatible: 'Universal', warranty: '1 Year', image: 'https://placehold.co/400/1f2937/fff?text=Jack' },
    { name: 'Engine Mounting', category: 'Engine', price: 1200, mrp: 1500, stock: 14, description: 'Engine mounting bush', brand: 'Anand', partNo: 'EM-SWIFT', compatible: 'Swift', warranty: '1 Year', image: 'https://placehold.co/400/111827/fff?text=Mounting' },
    { name: 'Silencer', category: 'Engine', price: 3800, mrp: 4500, stock: 6, description: 'Exhaust silencer', brand: 'OEM', partNo: 'SIL-SWIFT', compatible: 'Swift Diesel', warranty: '1 Year', image: 'https://placehold.co/400/1f2937/fff?text=Silencer' },
    { name: 'Turbo Hose Pipe', category: 'Engine', price: 900, mrp: 1200, stock: 12, description: 'Turbo intercooler hose', brand: 'OEM', partNo: 'THP-SWIFT-D', compatible: 'Swift Diesel', warranty: '6 Month', image: 'https://placehold.co/400/f97316/fff?text=Turbo+Hose' },
    { name: 'AC Compressor', category: 'Electrical', price: 12000, mrp: 15000, stock: 2, description: 'AC compressor', brand: 'Sanden', partNo: 'AC-COMP-SW', compatible: 'Swift', warranty: '1 Year', image: 'https://placehold.co/400/1f2937/fff?text=Compressor' },
    { name: 'Power Window Motor', category: 'Electrical', price: 1600, mrp: 2000, stock: 10, description: 'Window motor front', brand: 'OEM', partNo: 'PWM-SWIFT', compatible: 'Swift', warranty: '6 Month', image: 'https://placehold.co/400/111827/fff?text=Window+Motor' },
    { name: 'Central Lock Kit', category: 'Electrical', price: 2800, mrp: 3500, stock: 8, description: '4 door central lock', brand: 'Autocop', partNo: 'CL-4D', compatible: 'Universal', warranty: '1 Year', image: 'https://placehold.co/400/1f2937/fff?text=Central+Lock' },
    { name: 'Music System 7 Inch', category: 'Electrical', price: 6500, mrp: 8000, stock: 6, description: 'Touch music system', brand: 'Sony', partNo: 'MS-7-SONY', compatible: 'Universal', warranty: '1 Year', image: 'https://placehold.co/400/f97316/fff?text=Music+System' },
    { name: 'Reverse Camera', category: 'Electrical', price: 1200, mrp: 1600, stock: 18, description: 'HD reverse camera', brand: 'OEM', partNo: 'RC-HD', compatible: 'Universal', warranty: '6 Month', image: 'https://placehold.co/400/1f2937/fff?text=Camera' },
    { name: 'Fog Light Pair', category: 'Electrical', price: 1800, mrp: 2300, stock: 14, description: 'LED fog light pair', brand: 'Lumax', partNo: 'FL-LED-P', compatible: 'Swift', warranty: '1 Year', image: 'https://placehold.co/400/111827/fff?text=Fog+Light' },
    { name: 'Number Plate Frame', category: 'Body', price: 250, mrp: 350, stock: 80, description: 'Chrome number plate frame', brand: 'OEM', partNo: 'NPF-CHR', compatible: 'Universal', warranty: '6 Month', image: 'https://placehold.co/400/f97316/fff?text=Number+Plate' },
    { name: 'Mud Flap Set 4pcs', category: 'Body', price: 400, mrp: 550, stock: 35, description: 'Mud flap set', brand: 'OEM', partNo: 'MF-SWIFT-4', compatible: 'Swift', warranty: '6 Month', image: 'https://placehold.co/400/1f2937/fff?text=Mud+Flap' }
];

async function quickAddAutoProducts() {
    const urlParams = new URLSearchParams(window.location.search);
    const shopId = urlParams.get('shopId') || urlParams.get('id') || localStorage.getItem('shopId');
    if(!shopId) return alert('ShopId nahi mila URL me ?shopId=xxx check kar');

    if(!confirm(`${autoProductsList.length} auto parts ek saath add karein?`)) return;

    const btn = document.getElementById('quickAddBtn');
    if(btn) { btn.innerText = 'Adding...'; btn.disabled = true; }

    try {
        const res = await fetch(`/api/shops/auto/${shopId}/quick-add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products: autoProductsList })
        });

        const data = await res.json();

        if(data.success) {
            alert(`${data.count} parts successfully add ho gaye!`);
            location.reload();
        } else {
            alert('Fail: ' + (data.message || data.error));
        }

    } catch(e) {
        console.error(e);
        alert('Error: ' + e.message);
    }

    if(btn) { btn.innerText = '⚡ 50+ Auto Parts Quick Add'; btn.disabled = false; }
}
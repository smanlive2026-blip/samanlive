const mongoose = require('mongoose');
const TemplateProduct = require('../models/TemplateProduct');
require('dotenv').config();

const autoProducts = [
    // ENGINE PARTS - 20
    { shopType: 'auto', category: 'Engine', name: 'Engine Oil 1L', description: '10W40 Synthetic Engine Oil', defaultUnit: 'litre', tags: ['oil', 'engine'] },
    { shopType: 'auto', category: 'Engine', name: 'Engine Oil 3L', description: '15W40 Mineral Oil', defaultUnit: 'can', tags: ['oil'] },
    { shopType: 'auto', category: 'Engine', name: 'Oil Filter', description: 'Car Oil Filter', defaultUnit: 'piece', tags: ['filter'] },
    { shopType: 'auto', category: 'Engine', name: 'Air Filter', description: 'Engine Air Filter', defaultUnit: 'piece', tags: ['filter'] },
    { shopType: 'auto', category: 'Engine', name: 'Fuel Filter', description: 'Petrol Fuel Filter', defaultUnit: 'piece', tags: ['filter'] },
    { shopType: 'auto', category: 'Engine', name: 'Spark Plug', description: 'NGK Spark Plug', defaultUnit: 'piece', tags: ['spark'] },
    { shopType: 'auto', category: 'Engine', name: 'Radiator Coolant', description: 'Green Coolant 1L', defaultUnit: 'litre', tags: ['coolant'] },
    { shopType: 'auto', category: 'Engine', name: 'Timing Belt', description: 'Engine Timing Belt', defaultUnit: 'piece', tags: ['belt'] },
    { shopType: 'auto', category: 'Engine', name: 'Fan Belt', description: 'Alternator Fan Belt', defaultUnit: 'piece', tags: ['belt'] },
    { shopType: 'auto', category: 'Engine', name: 'Piston Set', description: '4 Cylinder Piston Set', defaultUnit: 'set', tags: ['piston'] },
    { shopType: 'auto', category: 'Engine', name: 'Gasket Set', description: 'Engine Gasket Kit', defaultUnit: 'kit', tags: ['gasket'] },
    { shopType: 'auto', category: 'Engine', name: 'Cylinder Head', description: 'Cylinder Head Assembly', defaultUnit: 'piece', tags: ['head'] },
    { shopType: 'auto', category: 'Engine', name: 'Crankshaft', description: 'Engine Crankshaft', defaultUnit: 'piece', tags: ['crank'] },
    { shopType: 'auto', category: 'Engine', name: 'Camshaft', description: 'Engine Camshaft', defaultUnit: 'piece', tags: ['cam'] },
    { shopType: 'auto', category: 'Engine', name: 'Water Pump', description: 'Engine Water Pump', defaultUnit: 'piece', tags: ['pump'] },
    { shopType: 'auto', category: 'Engine', name: 'Thermostat', description: 'Coolant Thermostat', defaultUnit: 'piece', tags: ['thermostat'] },
    { shopType: 'auto', category: 'Engine', name: 'Injector', description: 'Fuel Injector', defaultUnit: 'piece', tags: ['injector'] },
    { shopType: 'auto', category: 'Engine', name: 'Turbo Charger', description: 'Engine Turbo', defaultUnit: 'piece', tags: ['turbo'] },
    { shopType: 'auto', category: 'Engine', name: 'Engine Mount', description: 'Rubber Engine Mount', defaultUnit: 'piece', tags: ['mount'] },
    { shopType: 'auto', category: 'Engine', name: 'Exhaust Manifold', description: 'Exhaust Manifold', defaultUnit: 'piece', tags: ['exhaust'] },

    // BRAKE SYSTEM - 10
    { shopType: 'auto', category: 'Brake', name: 'Brake Pad Set', description: 'Front Brake Pads', defaultUnit: 'set', tags: ['brake', 'pad'] },
    { shopType: 'auto', category: 'Brake', name: 'Brake Shoe', description: 'Rear Brake Shoe', defaultUnit: 'set', tags: ['brake', 'shoe'] },
    { shopType: 'auto', category: 'Brake', name: 'Brake Disc', description: 'Front Brake Disc', defaultUnit: 'piece', tags: ['brake', 'disc'] },
    { shopType: 'auto', category: 'Brake', name: 'Brake Drum', description: 'Rear Brake Drum', defaultUnit: 'piece', tags: ['brake', 'drum'] },
    { shopType: 'auto', category: 'Brake', name: 'Brake Fluid', description: 'DOT3 Brake Fluid 500ml', defaultUnit: 'bottle', tags: ['fluid'] },
    { shopType: 'auto', category: 'Brake', name: 'Master Cylinder', description: 'Brake Master Cylinder', defaultUnit: 'piece', tags: ['cylinder'] },
    { shopType: 'auto', category: 'Brake', name: 'Brake Caliper', description: 'Front Brake Caliper', defaultUnit: 'piece', tags: ['caliper'] },
    { shopType: 'auto', category: 'Brake', name: 'ABS Sensor', description: 'Wheel ABS Sensor', defaultUnit: 'piece', tags: ['abs'] },
    { shopType: 'auto', category: 'Brake', name: 'Hand Brake Cable', description: 'Parking Brake Cable', defaultUnit: 'piece', tags: ['cable'] },
    { shopType: 'auto', category: 'Brake', name: 'Brake Hose', description: 'Flexible Brake Hose', defaultUnit: 'piece', tags: ['hose'] },

    // SUSPENSION & STEERING - 10
    { shopType: 'auto', category: 'Suspension', name: 'Shock Absorber', description: 'Front Shock Absorber', defaultUnit: 'piece', tags: ['shocker'] },
    { shopType: 'auto', category: 'Suspension', name: 'Strut Assembly', description: 'Front Strut', defaultUnit: 'piece', tags: ['strut'] },
    { shopType: 'auto', category: 'Suspension', name: 'Coil Spring', description: 'Suspension Spring', defaultUnit: 'piece', tags: ['spring'] },
    { shopType: 'auto', category: 'Suspension', name: 'Control Arm', description: 'Lower Control Arm', defaultUnit: 'piece', tags: ['arm'] },
    { shopType: 'auto', category: 'Suspension', name: 'Ball Joint', description: 'Suspension Ball Joint', defaultUnit: 'piece', tags: ['joint'] },
    { shopType: 'auto', category: 'Steering', name: 'Steering Rack', description: 'Power Steering Rack', defaultUnit: 'piece', tags: ['rack'] },
    { shopType: 'auto', category: 'Steering', name: 'Tie Rod End', description: 'Outer Tie Rod', defaultUnit: 'piece', tags: ['rod'] },
    { shopType: 'auto', category: 'Steering', name: 'Power Steering Pump', description: 'PS Pump', defaultUnit: 'piece', tags: ['pump'] },
    { shopType: 'auto', category: 'Steering', name: 'Steering Wheel', description: 'Car Steering Wheel', defaultUnit: 'piece', tags: ['wheel'] },
    { shopType: 'auto', category: 'Steering', name: 'Steering Oil', description: 'PS Fluid 1L', defaultUnit: 'litre', tags: ['oil'] },

    // ELECTRICAL - 15
    { shopType: 'auto', category: 'Electrical', name: 'Car Battery 12V', description: 'Exide 65AH Battery', defaultUnit: 'piece', tags: ['battery'] },
    { shopType: 'auto', category: 'Electrical', name: 'Alternator', description: 'Car Alternator', defaultUnit: 'piece', tags: ['alternator'] },
    { shopType: 'auto', category: 'Electrical', name: 'Starter Motor', description: 'Self Starter Motor', defaultUnit: 'piece', tags: ['starter'] },
    { shopType: 'auto', category: 'Electrical', name: 'Headlight Bulb', description: 'H4 12V 60/55W', defaultUnit: 'pair', tags: ['bulb'] },
    { shopType: 'auto', category: 'Electrical', name: 'Tail Light', description: 'Rear Tail Lamp', defaultUnit: 'piece', tags: ['light'] },
    { shopType: 'auto', category: 'Electrical', name: 'Indicator Bulb', description: 'Turn Signal Bulb', defaultUnit: 'piece', tags: ['indicator'] },
    { shopType: 'auto', category: 'Electrical', name: 'Horn', description: 'Car Horn 12V', defaultUnit: 'piece', tags: ['horn'] },
    { shopType: 'auto', category: 'Electrical', name: 'Wiper Motor', description: 'Windshield Wiper Motor', defaultUnit: 'piece', tags: ['wiper'] },
    { shopType: 'auto', category: 'Electrical', name: 'Wiper Blade', description: '24 inch Wiper', defaultUnit: 'pair', tags: ['wiper'] },
    { shopType: 'auto', category: 'Electrical', name: 'Car Stereo', description: '2DIN Music System', defaultUnit: 'piece', tags: ['stereo'] },
    { shopType: 'auto', category: 'Electrical', name: 'Car Speaker', description: '6 inch Speaker', defaultUnit: 'pair', tags: ['speaker'] },
    { shopType: 'auto', category: 'Electrical', name: 'Wiring Harness', description: 'Complete Wiring Kit', defaultUnit: 'kit', tags: ['wire'] },
    { shopType: 'auto', category: 'Electrical', name: 'Fuse Box', description: 'Car Fuse Box', defaultUnit: 'piece', tags: ['fuse'] },
    { shopType: 'auto', category: 'Electrical', name: 'Relay', description: '4 Pin Relay', defaultUnit: 'piece', tags: ['relay'] },
    { shopType: 'auto', category: 'Electrical', name: 'Power Window Motor', description: 'Window Motor', defaultUnit: 'piece', tags: ['window'] },

    // TYRES & WHEELS - 10
    { shopType: 'auto', category: 'Tyre', name: 'Car Tyre 165/80R14', description: '14 inch Car Tyre', defaultUnit: 'piece', tags: ['tyre'] },
    { shopType: 'auto', category: 'Tyre', name: 'Car Tyre 185/65R15', description: '15 inch Car Tyre', defaultUnit: 'piece', tags: ['tyre'] },
    { shopType: 'auto', category: 'Tyre', name: 'Bike Tyre', description: '100/90-17 Bike Tyre', defaultUnit: 'piece', tags: ['bike'] },
    { shopType: 'auto', category: 'Tyre', name: 'Tube', description: 'Car Tube 14 inch', defaultUnit: 'piece', tags: ['tube'] },
    { shopType: 'auto', category: 'Tyre', name: 'Wheel Rim', description: 'Alloy Wheel 15 inch', defaultUnit: 'piece', tags: ['rim', 'alloy'] },
    { shopType: 'auto', category: 'Tyre', name: 'Wheel Cap', description: 'Wheel Cover Set', defaultUnit: 'set', tags: ['cap'] },
    { shopType: 'auto', category: 'Tyre', name: 'Tyre Sealant', description: 'Puncture Sealant 500ml', defaultUnit: 'bottle', tags: ['sealant'] },
    { shopType: 'auto', category: 'Tyre', name: 'Air Pump', description: '12V Air Compressor', defaultUnit: 'piece', tags: ['pump'] },
    { shopType: 'auto', category: 'Tyre', name: 'Nitrogen Gas', description: 'Nitrogen Fill', defaultUnit: 'service', tags: ['nitrogen'] },
    { shopType: 'auto', category: 'Tyre', name: 'Wheel Alignment', description: '4 Wheel Alignment', defaultUnit: 'service', tags: ['alignment'] },

    // CAR ACCESSORIES - 15
    { shopType: 'auto', category: 'Accessory', name: 'Seat Cover', description: 'Leather Seat Cover', defaultUnit: 'set', tags: ['seat'] },
    { shopType: 'auto', category: 'Accessory', name: 'Floor Mat', description: '7D Floor Mat', defaultUnit: 'set', tags: ['mat'] },
    { shopType: 'auto', category: 'Accessory', name: 'Car Perfume', description: 'Dashboard Perfume', defaultUnit: 'piece', tags: ['perfume'] },
    { shopType: 'auto', category: 'Accessory', name: 'Sun Film', description: 'Car Sun Control Film', defaultUnit: 'roll', tags: ['film'] },
    { shopType: 'auto', category: 'Accessory', name: 'Car Cover', description: 'Waterproof Car Cover', defaultUnit: 'piece', tags: ['cover'] },
    { shopType: 'auto', category: 'Accessory', name: 'Fog Lamp', description: 'LED Fog Light', defaultUnit: 'pair', tags: ['fog'] },
    { shopType: 'auto', category: 'Accessory', name: 'Reverse Camera', description: 'Parking Camera', defaultUnit: 'piece', tags: ['camera'] },
    { shopType: 'auto', category: 'Accessory', name: 'Parking Sensor', description: '4 Sensor Kit', defaultUnit: 'kit', tags: ['sensor'] },
    { shopType: 'auto', category: 'Accessory', name: 'Dash Cam', description: 'Car DVR Camera', defaultUnit: 'piece', tags: ['dashcam'] },
    { shopType: 'auto', category: 'Accessory', name: 'Phone Holder', description: 'Magnetic Phone Mount', defaultUnit: 'piece', tags: ['holder'] },
    { shopType: 'auto', category: 'Accessory', name: 'Car Charger', description: 'USB Car Charger', defaultUnit: 'piece', tags: ['charger'] },
    { shopType: 'auto', category: 'Accessory', name: 'LED Light', description: 'Interior LED Strip', defaultUnit: 'piece', tags: ['led'] },
    { shopType: 'auto', category: 'Accessory', name: 'Steering Cover', description: 'Leather Steering Cover', defaultUnit: 'piece', tags: ['steering'] },
    { shopType: 'auto', category: 'Accessory', name: 'Door Visor', description: 'Window Rain Visor', defaultUnit: 'set', tags: ['visor'] },
    { shopType: 'auto', category: 'Accessory', name: 'Boot Mat', description: 'Trunk Mat', defaultUnit: 'piece', tags: ['boot'] },

    // BIKE PARTS - 10
    { shopType: 'auto', category: 'Bike', name: 'Bike Engine Oil', description: '20W40 Bike Oil 1L', defaultUnit: 'litre', tags: ['bike', 'oil'] },
    { shopType: 'auto', category: 'Bike', name: 'Bike Chain', description: 'Drive Chain', defaultUnit: 'piece', tags: ['chain'] },
    { shopType: 'auto', category: 'Bike', name: 'Bike Brake Pad', description: 'Disc Brake Pad', defaultUnit: 'set', tags: ['bike', 'brake'] },
    { shopType: 'auto', category: 'Bike', name: 'Bike Clutch Plate', description: 'Clutch Plate Set', defaultUnit: 'set', tags: ['clutch'] },
    { shopType: 'auto', category: 'Bike', name: 'Bike Battery', description: '12V 4AH Battery', defaultUnit: 'piece', tags: ['bike', 'battery'] },
    { shopType: 'auto', category: 'Bike', name: 'Bike Headlight', description: 'Bike Headlamp', defaultUnit: 'piece', tags: ['bike', 'light'] },
    { shopType: 'auto', category: 'Bike', name: 'Bike Silencer', description: 'Exhaust Silencer', defaultUnit: 'piece', tags: ['silencer'] },
    { shopType: 'auto', category: 'Bike', name: 'Bike Handle', description: 'Bike Handle Bar', defaultUnit: 'piece', tags: ['handle'] },
    { shopType: 'auto', category: 'Bike', name: 'Bike Mirror', description: 'Side Mirror', defaultUnit: 'pair', tags: ['mirror'] },
    { shopType: 'auto', category: 'Bike', name: 'Helmet', description: 'Full Face Helmet', defaultUnit: 'piece', tags: ['helmet'] },

    // SERVICE & FLUIDS - 10
    { shopType: 'auto', category: 'Service', name: 'General Service', description: 'Full Car Service', defaultUnit: 'service', tags: ['service'] },
    { shopType: 'auto', category: 'Service', name: 'Oil Change', description: 'Engine Oil Change', defaultUnit: 'service', tags: ['oil'] },
    { shopType: 'auto', category: 'Service', name: 'Car Wash', description: 'Foam Car Wash', defaultUnit: 'service', tags: ['wash'] },
    { shopType: 'auto', category: 'Fluid', name: 'Gear Oil', description: '90 Grade Gear Oil 1L', defaultUnit: 'litre', tags: ['gear'] },
    { shopType: 'auto', category: 'Fluid', name: 'Windshield Washer', description: 'Washer Fluid 1L', defaultUnit: 'litre', tags: ['washer'] },
    { shopType: 'auto', category: 'Fluid', name: 'Grease', description: 'Multi-purpose Grease 500g', defaultUnit: 'box', tags: ['grease'] },
    { shopType: 'auto', category: 'AC', name: 'AC Gas', description: 'R134a AC Gas', defaultUnit: 'kg', tags: ['ac'] },
    { shopType: 'auto', category: 'AC', name: 'AC Compressor', description: 'Car AC Compressor', defaultUnit: 'piece', tags: ['ac'] },
    { shopType: 'auto', category: 'AC', name: 'AC Filter', description: 'Cabin AC Filter', defaultUnit: 'piece', tags: ['ac', 'filter'] },
    { shopType: 'auto', category: 'Towing', name: 'Towing Service', description: '24x7 Towing', defaultUnit: 'service', tags: ['towing'] }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        await TemplateProduct.deleteMany({ shopType: 'auto' });
        await TemplateProduct.insertMany(autoProducts);
        console.log(`✅ ${autoProducts.length} Auto Parts Added!`);
        process.exit();
    } catch(err) { console.error(err); process.exit(1); }
}
seed();
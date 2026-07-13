const mongoose = require('mongoose');
const TemplateProduct = require('../models/TemplateProduct');
require('dotenv').config();

const hardwareProducts = [
    // TOOLS - 20
    { shopType: 'hardware', category: 'Tool', name: 'Hammer', description: 'Claw Hammer 500g', defaultUnit: 'piece', tags: ['hammer', 'tool'] },
    { shopType: 'hardware', category: 'Tool', name: 'Screwdriver Set', description: '6pc Screwdriver Set', defaultUnit: 'set', tags: ['screwdriver'] },
    { shopType: 'hardware', category: 'Tool', name: 'Pliers', description: 'Combination Pliers 8 inch', defaultUnit: 'piece', tags: ['pliers'] },
    { shopType: 'hardware', category: 'Tool', name: 'Adjustable Wrench', description: '12 inch Adjustable Wrench', defaultUnit: 'piece', tags: ['wrench'] },
    { shopType: 'hardware', category: 'Tool', name: 'Spanner Set', description: 'Ring Spanner Set 8pc', defaultUnit: 'set', tags: ['spanner'] },
    { shopType: 'hardware', category: 'Tool', name: 'Drill Machine', description: 'Electric Drill 500W', defaultUnit: 'piece', tags: ['drill'] },
    { shopType: 'hardware', category: 'Tool', name: 'Drill Bit Set', description: 'HSS Drill Bit 13pc', defaultUnit: 'set', tags: ['bit'] },
    { shopType: 'hardware', category: 'Tool', name: 'Grinder', description: 'Angle Grinder 4 inch', defaultUnit: 'piece', tags: ['grinder'] },
    { shopType: 'hardware', category: 'Tool', name: 'Measuring Tape', description: '5 Meter Steel Tape', defaultUnit: 'piece', tags: ['tape'] },
    { shopType: 'hardware', category: 'Tool', name: 'Spirit Level', description: '24 inch Spirit Level', defaultUnit: 'piece', tags: ['level'] },
    { shopType: 'hardware', category: 'Tool', name: 'Cutter', description: 'Utility Cutter', defaultUnit: 'piece', tags: ['cutter'] },
    { shopType: 'hardware', category: 'Tool', name: 'Saw', description: 'Hand Saw Wood', defaultUnit: 'piece', tags: ['saw'] },
    { shopType: 'hardware', category: 'Tool', name: 'Chisel Set', description: 'Wood Chisel 4pc', defaultUnit: 'set', tags: ['chisel'] },
    { shopType: 'hardware', category: 'Tool', name: 'File Set', description: 'Metal File 3pc', defaultUnit: 'set', tags: ['file'] },
    { shopType: 'hardware', category: 'Tool', name: 'Tool Box', description: 'Steel Tool Box', defaultUnit: 'piece', tags: ['toolbox'] },
    { shopType: 'hardware', category: 'Tool', name: 'Wire Cutter', description: 'Wire Cutter 6 inch', defaultUnit: 'piece', tags: ['cutter'] },
    { shopType: 'hardware', category: 'Tool', name: 'Socket Set', description: 'Socket Wrench 21pc', defaultUnit: 'set', tags: ['socket'] },
    { shopType: 'hardware', category: 'Tool', name: 'Pipe Wrench', description: '14 inch Pipe Wrench', defaultUnit: 'piece', tags: ['pipe'] },
    { shopType: 'hardware', category: 'Tool', name: 'Allen Key Set', description: 'Hex Allen Key 9pc', defaultUnit: 'set', tags: ['allen'] },
    { shopType: 'hardware', category: 'Tool', name: 'Gloves', description: 'Working Hand Gloves', defaultUnit: 'pair', tags: ['gloves'] },

    // FASTENERS - 15
    { shopType: 'hardware', category: 'Fastener', name: 'Nail', description: 'Iron Nail 2 inch 1kg', defaultUnit: 'kg', tags: ['nail'] },
    { shopType: 'hardware', category: 'Fastener', name: 'Screw', description: 'Wood Screw 1 inch 100pc', defaultUnit: 'packet', tags: ['screw'] },
    { shopType: 'hardware', category: 'Fastener', name: 'Nut Bolt', description: '8mm Nut Bolt Set', defaultUnit: 'set', tags: ['nut', 'bolt'] },
    { shopType: 'hardware', category: 'Fastener', name: 'Washer', description: 'Flat Washer 10mm', defaultUnit: 'packet', tags: ['washer'] },
    { shopType: 'hardware', category: 'Fastener', name: 'Anchor Bolt', description: 'Wall Anchor 8mm', defaultUnit: 'packet', tags: ['anchor'] },
    { shopType: 'hardware', category: 'Fastener', name: 'Rivet', description: 'Aluminum Rivet 100pc', defaultUnit: 'packet', tags: ['rivet'] },
    { shopType: 'hardware', category: 'Fastener', name: 'Thread Screw', description: 'Gypsum Screw 1.5 inch', defaultUnit: 'packet', tags: ['screw'] },
    { shopType: 'hardware', category: 'Fastener', name: 'Hook', description: 'Ceiling Hook', defaultUnit: 'piece', tags: ['hook'] },
    { shopType: 'hardware', category: 'Fastener', name: 'Clamp', description: 'C Clamp 4 inch', defaultUnit: 'piece', tags: ['clamp'] },
    { shopType: 'hardware', category: 'Fastener', name: 'Zip Tie', description: 'Cable Tie 200mm 100pc', defaultUnit: 'packet', tags: ['tie'] },
    { shopType: 'hardware', category: 'Fastener', name: 'Hinge', description: 'Door Hinge 4 inch', defaultUnit: 'pair', tags: ['hinge'] },
    { shopType: 'hardware', category: 'Fastener', name: 'Door Handle', description: 'SS Door Handle', defaultUnit: 'piece', tags: ['handle'] },
    { shopType: 'hardware', category: 'Fastener', name: 'Door Lock', description: 'Main Door Lock', defaultUnit: 'piece', tags: ['lock'] },
    { shopType: 'hardware', category: 'Fastener', name: 'Latch', description: 'Door Latch', defaultUnit: 'piece', tags: ['latch'] },
    { shopType: 'hardware', category: 'Fastener', name: 'Tower Bolt', description: '6 inch Tower Bolt', defaultUnit: 'piece', tags: ['bolt'] },

    // ELECTRICAL - 20
    { shopType: 'hardware', category: 'Electrical', name: 'Wire 1mm', description: '1mm Copper Wire 90m', defaultUnit: 'coil', tags: ['wire'] },
    { shopType: 'hardware', category: 'Electrical', name: 'Wire 2.5mm', description: '2.5mm Copper Wire 90m', defaultUnit: 'coil', tags: ['wire'] },
    { shopType: 'hardware', category: 'Electrical', name: 'Switch', description: '6A Electric Switch', defaultUnit: 'piece', tags: ['switch'] },
    { shopType: 'hardware', category: 'Electrical', name: 'Socket', description: '5 Pin Socket', defaultUnit: 'piece', tags: ['socket'] },
    { shopType: 'hardware', category: 'Electrical', name: 'MCB', description: '16A Single Pole MCB', defaultUnit: 'piece', tags: ['mcb'] },
    { shopType: 'hardware', category: 'Electrical', name: 'DB Box', description: '4 Way DB Box', defaultUnit: 'piece', tags: ['db'] },
    { shopType: 'hardware', category: 'Electrical', name: 'LED Bulb', description: '9W LED Bulb', defaultUnit: 'piece', tags: ['bulb', 'led'] },
    { shopType: 'hardware', category: 'Electrical', name: 'Tube Light', description: '20W LED Tube', defaultUnit: 'piece', tags: ['tube'] },
    { shopType: 'hardware', category: 'Electrical', name: 'Fan', description: 'Ceiling Fan 1200mm', defaultUnit: 'piece', tags: ['fan'] },
    { shopType: 'hardware', category: 'Electrical', name: 'Regulator', description: 'Fan Regulator', defaultUnit: 'piece', tags: ['regulator'] },
    { shopType: 'hardware', category: 'Electrical', name: 'Extension Board', description: '4 Socket Extension', defaultUnit: 'piece', tags: ['extension'] },
    { shopType: 'hardware', category: 'Electrical', name: 'Plug', description: '3 Pin Plug Top', defaultUnit: 'piece', tags: ['plug'] },
    { shopType: 'hardware', category: 'Electrical', name: 'PVC Pipe', description: '20mm PVC Conduit Pipe', defaultUnit: 'meter', tags: ['pipe'] },
    { shopType: 'hardware', category: 'Electrical', name: 'Tape', description: 'Electrical Insulation Tape', defaultUnit: 'piece', tags: ['tape'] },
    { shopType: 'hardware', category: 'Electrical', name: 'Connector', description: 'Wire Connector 3 way', defaultUnit: 'packet', tags: ['connector'] },
    { shopType: 'hardware', category: 'Electrical', name: 'Holder', description: 'Batten Holder', defaultUnit: 'piece', tags: ['holder'] },
    { shopType: 'hardware', category: 'Electrical', name: 'Ceiling Rose', description: '2 Pin Ceiling Rose', defaultUnit: 'piece', tags: ['rose'] },
    { shopType: 'hardware', category: 'Electrical', name: 'Bell', description: 'Electric Door Bell', defaultUnit: 'piece', tags: ['bell'] },
    { shopType: 'hardware', category: 'Electrical', name: 'Inverter', description: '1000VA Inverter', defaultUnit: 'piece', tags: ['inverter'] },
    { shopType: 'hardware', category: 'Electrical', name: 'Battery', description: '150AH Inverter Battery', defaultUnit: 'piece', tags: ['battery'] },

    // PLUMBING - 15
    { shopType: 'hardware', category: 'Plumbing', name: 'PVC Pipe 1 inch', description: '1 inch PVC Pipe', defaultUnit: 'meter', tags: ['pvc', 'pipe'] },
    { shopType: 'hardware', category: 'Plumbing', name: 'PVC Elbow', description: '1 inch PVC Elbow', defaultUnit: 'piece', tags: ['elbow'] },
    { shopType: 'hardware', category: 'Plumbing', name: 'PVC Tee', description: '1 inch PVC Tee', defaultUnit: 'piece', tags: ['tee'] },
    { shopType: 'hardware', category: 'Plumbing', name: 'Tap', description: 'Bib Tap Brass', defaultUnit: 'piece', tags: ['tap'] },
    { shopType: 'hardware', category: 'Plumbing', name: 'Shower', description: 'Shower Head', defaultUnit: 'piece', tags: ['shower'] },
    { shopType: 'hardware', category: 'Plumbing', name: 'Pipe Wrench', description: '18 inch Pipe Wrench', defaultUnit: 'piece', tags: ['wrench'] },
    { shopType: 'hardware', category: 'Plumbing', name: 'Teflon Tape', description: 'PTFE Thread Tape', defaultUnit: 'piece', tags: ['teflon'] },
    { shopType: 'hardware', category: 'Plumbing', name: 'Valve', description: 'Ball Valve 1 inch', defaultUnit: 'piece', tags: ['valve'] },
    { shopType: 'hardware', category: 'Plumbing', name: 'Water Tank', description: '500L Water Tank', defaultUnit: 'piece', tags: ['tank'] },
    { shopType: 'hardware', category: 'Plumbing', name: 'Motor', description: '1HP Water Motor', defaultUnit: 'piece', tags: ['motor'] },
    { shopType: 'hardware', category: 'Plumbing', name: 'Flexible Pipe', description: 'Braided Flexible Pipe', defaultUnit: 'piece', tags: ['flexible'] },
    { shopType: 'hardware', category: 'Plumbing', name: 'Sink', description: 'SS Kitchen Sink', defaultUnit: 'piece', tags: ['sink'] },
    { shopType: 'hardware', category: 'Plumbing', name: 'Waste Pipe', description: 'PVC Waste Pipe', defaultUnit: 'meter', tags: ['waste'] },
    { shopType: 'hardware', category: 'Plumbing', name: 'Sealant', description: 'Silicone Sealant', defaultUnit: 'tube', tags: ['sealant'] },
    { shopType: 'hardware', category: 'Plumbing', name: 'Geyser', description: '15L Water Geyser', defaultUnit: 'piece', tags: ['geyser'] },

    // BUILDING MATERIAL - 15
    { shopType: 'hardware', category: 'Building', name: 'Cement', description: 'OPC Cement 50kg Bag', defaultUnit: 'bag', tags: ['cement'] },
    { shopType: 'hardware', category: 'Building', name: 'Sand', description: 'River Sand 1 CFT', defaultUnit: 'cft', tags: ['sand'] },
    { shopType: 'hardware', category: 'Building', name: 'Brick', description: 'Red Brick', defaultUnit: 'piece', tags: ['brick'] },
    { shopType: 'hardware', category: 'Building', name: 'Steel Rod', description: '12mm TMT Bar', defaultUnit: 'kg', tags: ['steel', 'rod'] },
    { shopType: 'hardware', category: 'Building', name: 'Paint', description: 'Asian Paint 1L', defaultUnit: 'litre', tags: ['paint'] },
    { shopType: 'hardware', category: 'Building', name: 'Primer', description: 'Wall Primer 1L', defaultUnit: 'litre', tags: ['primer'] },
    { shopType: 'hardware', category: 'Building', name: 'Distemper', description: 'White Distemper 10L', defaultUnit: 'litre', tags: ['distemper'] },
    { shopType: 'hardware', category: 'Building', name: 'Putty', description: 'Wall Putty 40kg', defaultUnit: 'bag', tags: ['putty'] },
    { shopType: 'hardware', category: 'Building', name: 'Tile', description: 'Ceramic Floor Tile', defaultUnit: 'sqft', tags: ['tile'] },
    { shopType: 'hardware', category: 'Building', name: 'Adhesive', description: 'Tile Adhesive 20kg', defaultUnit: 'bag', tags: ['adhesive'] },
    { shopType: 'hardware', category: 'Building', name: 'POP', description: 'POP Powder 40kg', defaultUnit: 'bag', tags: ['pop'] },
    { shopType: 'hardware', category: 'Building', name: 'Gypsum Board', description: 'Gypsum Board 8x4', defaultUnit: 'sheet', tags: ['gypsum'] },
    { shopType: 'hardware', category: 'Building', name: 'Glass', description: '5mm Clear Glass', defaultUnit: 'sqft', tags: ['glass'] },
    { shopType: 'hardware', category: 'Building', name: 'Aluminum Section', description: 'Window Section', defaultUnit: 'kg', tags: ['aluminum'] },
    { shopType: 'hardware', category: 'Building', name: 'Roof Sheet', description: 'GI Roof Sheet', defaultUnit: 'sqft', tags: ['sheet'] },

    // SAFETY & OTHER - 15
    { shopType: 'hardware', category: 'Safety', name: 'Helmet', description: 'Safety Helmet', defaultUnit: 'piece', tags: ['helmet'] },
    { shopType: 'hardware', category: 'Safety', name: 'Mask', description: 'Dust Mask N95', defaultUnit: 'piece', tags: ['mask'] },
    { shopType: 'hardware', category: 'Safety', name: 'Goggles', description: 'Safety Goggles', defaultUnit: 'piece', tags: ['goggles'] },
    { shopType: 'hardware', category: 'Safety', name: 'Safety Belt', description: 'Full Body Safety Belt', defaultUnit: 'piece', tags: ['belt'] },
    { shopType: 'hardware', category: 'Safety', name: 'Fire Extinguisher', description: 'ABC Fire Extinguisher', defaultUnit: 'piece', tags: ['fire'] },
    { shopType: 'hardware', category: 'Cleaning', name: 'Brush', description: 'Paint Brush 4 inch', defaultUnit: 'piece', tags: ['brush'] },
    { shopType: 'hardware', category: 'Cleaning', name: 'Roller', description: 'Paint Roller', defaultUnit: 'piece', tags: ['roller'] },
    { shopType: 'hardware', category: 'Cleaning', name: 'Sand Paper', description: '80 Grit Sand Paper', defaultUnit: 'sheet', tags: ['sandpaper'] },
    { shopType: 'hardware', category: 'Cleaning', name: 'Thinner', description: 'Paint Thinner 1L', defaultUnit: 'litre', tags: ['thinner'] },
    { shopType: 'hardware', category: 'Cleaning', name: 'Turpentine', description: 'Turpentine Oil 1L', defaultUnit: 'litre', tags: ['turpentine'] },
    { shopType: 'hardware', category: 'Garden', name: 'Garden Hose', description: '20m Garden Hose', defaultUnit: 'piece', tags: ['hose'] },
    { shopType: 'hardware', category: 'Garden', name: 'Sprinkler', description: 'Garden Sprinkler', defaultUnit: 'piece', tags: ['sprinkler'] },
    { shopType: 'hardware', category: 'Garden', name: 'Grass Cutter', description: 'Manual Grass Cutter', defaultUnit: 'piece', tags: ['cutter'] },
    { shopType: 'hardware', category: 'Service', name: 'Electrician Service', description: 'Electrician Work', defaultUnit: 'service', tags: ['service'] },
    { shopType: 'hardware', category: 'Service', name: 'Plumber Service', description: 'Plumber Work', defaultUnit: 'service', tags: ['service'] }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        await TemplateProduct.deleteMany({ shopType: 'hardware' });
        await TemplateProduct.insertMany(hardwareProducts);
        console.log(`✅ ${hardwareProducts.length} Hardware Products Added!`);
        process.exit();
    } catch(err) { console.error(err); process.exit(1); }
}
seed();
// <!-- TODO: Catalog Button Add Karna Hai -->
//<!-- API: /api/admin/shop/{shopId}/catalog/hardware -->

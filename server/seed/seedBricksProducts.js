const mongoose = require('mongoose');
const TemplateProduct = require('../models/TemplateProduct');
require('dotenv').config();

const bricksProducts = [
    // BRICKS - 15
    { shopType: 'bricks', category: 'Brick', name: 'Red Clay Brick', description: 'Standard Red Brick 9x4x3 inch', defaultUnit: 'piece', tags: ['brick', 'red'] },
    { shopType: 'bricks', category: 'Brick', name: 'Fly Ash Brick', description: 'Fly Ash Brick 9x4x3 inch', defaultUnit: 'piece', tags: ['brick', 'flyash'] },
    { shopType: 'bricks', category: 'Brick', name: 'AAC Block', description: 'AAC Lightweight Block 24x8x8 inch', defaultUnit: 'piece', tags: ['aac', 'block'] },
    { shopType: 'bricks', category: 'Brick', name: 'Hollow Block', description: '6 inch Hollow Concrete Block', defaultUnit: 'piece', tags: ['hollow', 'block'] },
    { shopType: 'bricks', category: 'Brick', name: 'Solid Block', description: '6 inch Solid Concrete Block', defaultUnit: 'piece', tags: ['solid', 'block'] },
    { shopType: 'bricks', category: 'Brick', name: 'Jali Brick', description: 'Decorative Jali Brick', defaultUnit: 'piece', tags: ['jali', 'decorative'] },
    { shopType: 'bricks', category: 'Brick', name: 'Fire Brick', description: 'Refractory Fire Brick', defaultUnit: 'piece', tags: ['fire', 'refractory'] },
    { shopType: 'bricks', category: 'Brick', name: 'Interlocking Brick', description: 'Paver Interlocking Brick', defaultUnit: 'piece', tags: ['paver', 'interlocking'] },
    { shopType: 'bricks', category: 'Brick', name: 'Face Brick', description: 'Red Face Brick', defaultUnit: 'piece', tags: ['face'] },
    { shopType: 'bricks', category: 'Brick', name: 'Engineering Brick', description: 'High Strength Engineering Brick', defaultUnit: 'piece', tags: ['engineering'] },
    { shopType: 'bricks', category: 'Brick', name: 'Clay Tile', description: 'Roof Clay Tile', defaultUnit: 'piece', tags: ['tile', 'roof'] },
    { shopType: 'bricks', category: 'Brick', name: 'Kerb Stone', description: 'Concrete Kerb Stone', defaultUnit: 'piece', tags: ['kerb'] },
    { shopType: 'bricks', category: 'Brick', name: 'Grid Paver', description: 'Grass Grid Paver', defaultUnit: 'piece', tags: ['paver'] },
    { shopType: 'bricks', category: 'Brick', name: 'Cobble Stone', description: 'Natural Cobble Stone', defaultUnit: 'piece', tags: ['cobble'] },
    { shopType: 'bricks', category: 'Brick', name: 'Chequered Tile', description: 'Footpath Chequered Tile', defaultUnit: 'piece', tags: ['tile'] },

    // CEMENT & BINDING - 10
    { shopType: 'bricks', category: 'Cement', name: 'OPC Cement', description: 'OPC 53 Grade Cement 50kg', defaultUnit: 'bag', tags: ['cement', 'opc'] },
    { shopType: 'bricks', category: 'Cement', name: 'PPC Cement', description: 'PPC Cement 50kg', defaultUnit: 'bag', tags: ['cement', 'ppc'] },
    { shopType: 'bricks', category: 'Cement', name: 'White Cement', description: 'White Cement 40kg', defaultUnit: 'bag', tags: ['cement', 'white'] },
    { shopType: 'bricks', category: 'Cement', name: 'Waterproof Cement', description: 'Waterproof Cement 50kg', defaultUnit: 'bag', tags: ['cement'] },
    { shopType: 'bricks', category: 'Cement', name: 'Rapid Hardening Cement', description: 'RHC Cement 50kg', defaultUnit: 'bag', tags: ['cement'] },
    { shopType: 'bricks', category: 'Binding', name: 'Lime', description: 'Hydrated Lime 30kg', defaultUnit: 'bag', tags: ['lime'] },
    { shopType: 'bricks', category: 'Binding', name: 'Gypsum', description: 'Gypsum Powder 50kg', defaultUnit: 'bag', tags: ['gypsum'] },
    { shopType: 'bricks', category: 'Binding', name: 'Tile Adhesive', description: 'Tile Adhesive 20kg', defaultUnit: 'bag', tags: ['adhesive'] },
    { shopType: 'bricks', category: 'Binding', name: 'Wall Putty', description: 'Wall Putty 40kg', defaultUnit: 'bag', tags: ['putty'] },
    { shopType: 'bricks', category: 'Binding', name: 'Joint Filler', description: 'Tile Joint Filler 1kg', defaultUnit: 'packet', tags: ['joint'] },

    // SAND & AGGREGATE - 10
    { shopType: 'bricks', category: 'Sand', name: 'River Sand', description: 'Clean River Sand', defaultUnit: 'cft', tags: ['sand', 'river'] },
    { shopType: 'bricks', category: 'Sand', name: 'M Sand', description: 'Manufactured Sand', defaultUnit: 'cft', tags: ['sand', 'm-sand'] },
    { shopType: 'bricks', category: 'Sand', name: 'Plaster Sand', description: 'Fine Plaster Sand', defaultUnit: 'cft', tags: ['sand'] },
    { shopType: 'bricks', category: 'Aggregate', name: '20mm Jelly', description: '20mm Blue Metal Jelly', defaultUnit: 'cft', tags: ['jelly', 'aggregate'] },
    { shopType: 'bricks', category: 'Aggregate', name: '40mm Jelly', description: '40mm Blue Metal Jelly', defaultUnit: 'cft', tags: ['jelly'] },
    { shopType: 'bricks', category: 'Aggregate', name: '6mm Chips', description: '6mm Stone Chips', defaultUnit: 'cft', tags: ['chips'] },
    { shopType: 'bricks', category: 'Aggregate', name: 'Gravel', description: 'Construction Gravel', defaultUnit: 'cft', tags: ['gravel'] },
    { shopType: 'bricks', category: 'Aggregate', name: 'Crushed Stone', description: 'Crushed Stone Dust', defaultUnit: 'cft', tags: ['dust'] },
    { shopType: 'bricks', category: 'Aggregate', name: 'Laterite Stone', description: 'Laterite Building Stone', defaultUnit: 'cft', tags: ['laterite'] },
    { shopType: 'bricks', category: 'Aggregate', name: 'Marble Chips', description: 'White Marble Chips', defaultUnit: 'bag', tags: ['marble'] },

    // STEEL & REINFORCEMENT - 10
    { shopType: 'bricks', category: 'Steel', name: 'TMT Bar 8mm', description: '8mm TMT Steel Bar', defaultUnit: 'kg', tags: ['tmt', 'steel'] },
    { shopType: 'bricks', category: 'Steel', name: 'TMT Bar 10mm', description: '10mm TMT Steel Bar', defaultUnit: 'kg', tags: ['tmt'] },
    { shopType: 'bricks', category: 'Steel', name: 'TMT Bar 12mm', description: '12mm TMT Steel Bar', defaultUnit: 'kg', tags: ['tmt'] },
    { shopType: 'bricks', category: 'Steel', name: 'TMT Bar 16mm', description: '16mm TMT Steel Bar', defaultUnit: 'kg', tags: ['tmt'] },
    { shopType: 'bricks', category: 'Steel', name: 'TMT Bar 20mm', description: '20mm TMT Steel Bar', defaultUnit: 'kg', tags: ['tmt'] },
    { shopType: 'bricks', category: 'Steel', name: 'Binding Wire', description: 'GI Binding Wire', defaultUnit: 'kg', tags: ['wire'] },
    { shopType: 'bricks', category: 'Steel', name: 'MS Rod', description: 'Mild Steel Rod', defaultUnit: 'kg', tags: ['ms'] },
    { shopType: 'bricks', category: 'Steel', name: 'Angle Iron', description: 'MS Angle 2x2 inch', defaultUnit: 'kg', tags: ['angle'] },
    { shopType: 'bricks', category: 'Steel', name: 'Channel', description: 'MS Channel', defaultUnit: 'kg', tags: ['channel'] },
    { shopType: 'bricks', category: 'Steel', name: 'Steel Plate', description: 'MS Plate 10mm', defaultUnit: 'kg', tags: ['plate'] },

    // ROOFING & SHEETS - 10
    { shopType: 'bricks', category: 'Roofing', name: 'GI Sheet', description: 'Galvanized Iron Sheet', defaultUnit: 'sqft', tags: ['gi', 'sheet'] },
    { shopType: 'bricks', category: 'Roofing', name: 'Color Coated Sheet', description: 'Color Coated Roof Sheet', defaultUnit: 'sqft', tags: ['roof'] },
    { shopType: 'bricks', category: 'Roofing', name: 'Polycarbonate Sheet', description: 'Transparent PC Sheet', defaultUnit: 'sqft', tags: ['polycarbonate'] },
    { shopType: 'bricks', category: 'Roofing', name: 'Asbestos Sheet', description: 'Cement Asbestos Sheet', defaultUnit: 'piece', tags: ['asbestos'] },
    { shopType: 'bricks', category: 'Roofing', name: 'UPVC Sheet', description: 'UPVC Roofing Sheet', defaultUnit: 'sqft', tags: ['upvc'] },
    { shopType: 'bricks', category: 'Roofing', name: 'Roof Tile', description: 'Ceramic Roof Tile', defaultUnit: 'piece', tags: ['tile'] },
    { shopType: 'bricks', category: 'Roofing', name: 'Ridge Cap', description: 'GI Ridge Cap', defaultUnit: 'piece', tags: ['ridge'] },
    { shopType: 'bricks', category: 'Roofing', name: 'Roof Bolt', description: 'Roofing J Bolt', defaultUnit: 'piece', tags: ['bolt'] },
    { shopType: 'bricks', category: 'Roofing', name: 'Gutter', description: 'PVC Rain Gutter', defaultUnit: 'meter', tags: ['gutter'] },
    { shopType: 'bricks', category: 'Roofing', name: 'Insulation', description: 'Roof Insulation Sheet', defaultUnit: 'sqft', tags: ['insulation'] },

    // PAINT & FINISHING - 10
    { shopType: 'bricks', category: 'Paint', name: 'Exterior Paint', description: 'Exterior Emulsion 20L', defaultUnit: 'litre', tags: ['paint', 'exterior'] },
    { shopType: 'bricks', category: 'Paint', name: 'Interior Paint', description: 'Interior Emulsion 20L', defaultUnit: 'litre', tags: ['paint', 'interior'] },
    { shopType: 'bricks', category: 'Paint', name: 'Enamel Paint', description: 'Oil Based Enamel 1L', defaultUnit: 'litre', tags: ['enamel'] },
    { shopType: 'bricks', category: 'Paint', name: 'Primer', description: 'Wall Primer 20L', defaultUnit: 'litre', tags: ['primer'] },
    { shopType: 'bricks', category: 'Paint', name: 'Distemper', description: 'White Distemper 20kg', defaultUnit: 'kg', tags: ['distemper'] },
    { shopType: 'bricks', category: 'Paint', name: 'Texture Paint', description: 'Texture Wall Paint', defaultUnit: 'litre', tags: ['texture'] },
    { shopType: 'bricks', category: 'Paint', name: 'Weather Proof Paint', description: 'Waterproof Paint', defaultUnit: 'litre', tags: ['waterproof'] },
    { shopType: 'bricks', category: 'Paint', name: 'Thinner', description: 'Paint Thinner 1L', defaultUnit: 'litre', tags: ['thinner'] },
    { shopType: 'bricks', category: 'Paint', name: 'Brush', description: 'Paint Brush 4 inch', defaultUnit: 'piece', tags: ['brush'] },
    { shopType: 'bricks', category: 'Paint', name: 'Roller', description: 'Paint Roller', defaultUnit: 'piece', tags: ['roller'] },

    // TILES & FLOORING - 15
    { shopType: 'bricks', category: 'Tile', name: 'Floor Tile', description: '2x2 Floor Tile', defaultUnit: 'sqft', tags: ['tile', 'floor'] },
    { shopType: 'bricks', category: 'Tile', name: 'Wall Tile', description: '1x1 Wall Tile', defaultUnit: 'sqft', tags: ['tile', 'wall'] },
    { shopType: 'bricks', category: 'Tile', name: 'Vitrified Tile', description: '2x4 Vitrified Tile', defaultUnit: 'sqft', tags: ['vitrified'] },
    { shopType: 'bricks', category: 'Tile', name: 'Bathroom Tile', description: 'Ceramic Bathroom Tile', defaultUnit: 'sqft', tags: ['bathroom'] },
    { shopType: 'bricks', category: 'Tile', name: 'Parking Tile', description: 'Heavy Duty Parking Tile', defaultUnit: 'sqft', tags: ['parking'] },
    { shopType: 'bricks', category: 'Tile', name: 'Granite', description: 'Granite Slab', defaultUnit: 'sqft', tags: ['granite'] },
    { shopType: 'bricks', category: 'Tile', name: 'Marble', description: 'Marble Slab', defaultUnit: 'sqft', tags: ['marble'] },
    { shopType: 'bricks', category: 'Tile', name: 'Kota Stone', description: 'Kota Stone Slab', defaultUnit: 'sqft', tags: ['kota'] },
    { shopType: 'bricks', category: 'Tile', name: 'Sandstone', description: 'Sandstone Tile', defaultUnit: 'sqft', tags: ['sandstone'] },
    { shopType: 'bricks', category: 'Tile', name: 'Mosaic Tile', description: 'Glass Mosaic Tile', defaultUnit: 'sqft', tags: ['mosaic'] },
    { shopType: 'bricks', category: 'Tile', name: 'Terrazzo Tile', description: 'Terrazzo Flooring Tile', defaultUnit: 'sqft', tags: ['terrazzo'] },
    { shopType: 'bricks', category: 'Tile', name: 'Wooden Flooring', description: 'Laminate Wooden Floor', defaultUnit: 'sqft', tags: ['wooden'] },
    { shopType: 'bricks', category: 'Tile', name: 'Vinyl Flooring', description: 'PVC Vinyl Floor', defaultUnit: 'sqft', tags: ['vinyl'] },
    { shopType: 'bricks', category: 'Tile', name: 'Stair Nosing', description: 'Aluminum Stair Nosing', defaultUnit: 'meter', tags: ['nosing'] },
    { shopType: 'bricks', category: 'Tile', name: 'Skirting Tile', description: '4 inch Skirting Tile', defaultUnit: 'meter', tags: ['skirting'] },

    // WATERPROOFING & CHEMICALS - 10
    { shopType: 'bricks', category: 'Waterproofing', name: 'Waterproofing Chemical', description: 'Liquid Waterproofing 20L', defaultUnit: 'litre', tags: ['waterproofing'] },
    { shopType: 'bricks', category: 'Waterproofing', name: 'Bitumen', description: 'Bitumen 30kg', defaultUnit: 'kg', tags: ['bitumen'] },
    { shopType: 'bricks', category: 'Waterproofing', name: 'Waterproof Membrane', description: 'PVC Waterproof Membrane', defaultUnit: 'sqft', tags: ['membrane'] },
    { shopType: 'bricks', category: 'Waterproofing', name: 'Sealant', description: 'Silicone Sealant', defaultUnit: 'tube', tags: ['sealant'] },
    { shopType: 'bricks', category: 'Waterproofing', name: 'Damp Proof Course', description: 'DPC Sheet', defaultUnit: 'meter', tags: ['dpc'] },
    { shopType: 'bricks', category: 'Chemical', name: 'Concrete Admixture', description: 'Concrete Plasticizer', defaultUnit: 'litre', tags: ['admixture'] },
    { shopType: 'bricks', category: 'Chemical', name: 'Curing Compound', description: 'Concrete Curing Compound', defaultUnit: 'litre', tags: ['curing'] },
    { shopType: 'bricks', category: 'Chemical', name: 'Rust Remover', description: 'Rust Remover 1L', defaultUnit: 'litre', tags: ['rust'] },
    { shopType: 'bricks', category: 'Chemical', name: 'Termite Treatment', description: 'Termite Chemical', defaultUnit: 'litre', tags: ['termite'] },
    { shopType: 'bricks', category: 'Chemical', name: 'Epoxy', description: 'Epoxy Resin', defaultUnit: 'kg', tags: ['epoxy'] },

    // SERVICE & DELIVERY - 10
    { shopType: 'bricks', category: 'Service', name: 'Brick Delivery', description: 'Brick Home Delivery', defaultUnit: 'trip', tags: ['delivery'] },
    { shopType: 'bricks', category: 'Service', name: 'Masonry Work', description: 'Brick Masonry Work', defaultUnit: 'sqft', tags: ['masonry'] },
    { shopType: 'bricks', category: 'Service', name: 'Tile Laying', description: 'Tile Laying Service', defaultUnit: 'sqft', tags: ['tiling'] },
    { shopType: 'bricks', category: 'Service', name: 'Plastering', description: 'Wall Plastering', defaultUnit: 'sqft', tags: ['plaster'] },
    { shopType: 'bricks', category: 'Service', name: 'Construction', description: 'Complete Construction', defaultUnit: 'sqft', tags: ['construction'] },
    { shopType: 'bricks', category: 'Rental', name: 'JCB Rental', description: 'JCB Machine Rental', defaultUnit: 'hour', tags: ['jcb'] },
    { shopType: 'bricks', category: 'Rental', name: 'Mixer Rental', description: 'Concrete Mixer Rental', defaultUnit: 'day', tags: ['mixer'] },
    { shopType: 'bricks', category: 'Rental', name: 'Scaffolding', description: 'Scaffolding Rental', defaultUnit: 'sqft', tags: ['scaffolding'] },
    { shopType: 'bricks', category: 'Rental', name: 'Crane Rental', description: 'Crane Service', defaultUnit: 'hour', tags: ['crane'] },
    { shopType: 'bricks', category: 'Rental', name: 'Tractor Rental', description: 'Tractor with Trolley', defaultUnit: 'trip', tags: ['tractor'] }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        await TemplateProduct.deleteMany({ shopType: 'bricks' });
        await TemplateProduct.insertMany(bricksProducts);
        console.log(`✅ ${bricksProducts.length} Bricks & Building Material Products Added!`);
        process.exit();
    } catch(err) { console.error(err); process.exit(1); }
}
seed();
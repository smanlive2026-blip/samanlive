const mongoose = require('mongoose');
const TemplateProduct = require('../models/TemplateProduct');
require('dotenv').config();

const furnitureProducts = [
    // BED & BEDROOM - 20
    { shopType: 'furniture', category: 'Bed', name: 'Single Bed', description: 'Wooden Single Bed 3x6', defaultUnit: 'piece', tags: ['bed', 'single'] },
    { shopType: 'furniture', category: 'Bed', name: 'Double Bed', description: 'Queen Size Double Bed 5x6', defaultUnit: 'piece', tags: ['bed', 'double'] },
    { shopType: 'furniture', category: 'Bed', name: 'King Size Bed', description: 'King Size Bed 6x6 with Storage', defaultUnit: 'piece', tags: ['bed', 'king'] },
    { shopType: 'furniture', category: 'Bed', name: 'Bunk Bed', description: 'Kids Bunk Bed', defaultUnit: 'piece', tags: ['bed', 'bunk'] },
    { shopType: 'furniture', category: 'Bed', name: 'Sofa Cum Bed', description: 'Foldable Sofa Cum Bed', defaultUnit: 'piece', tags: ['sofa', 'bed'] },
    { shopType: 'furniture', category: 'Bedroom', name: 'Wardrobe 2 Door', description: 'Wooden 2 Door Wardrobe', defaultUnit: 'piece', tags: ['wardrobe'] },
    { shopType: 'furniture', category: 'Bedroom', name: 'Wardrobe 3 Door', description: '3 Door Wardrobe with Mirror', defaultUnit: 'piece', tags: ['wardrobe'] },
    { shopType: 'furniture', category: 'Bedroom', name: 'Wardrobe 4 Door', description: 'Sliding Door Wardrobe', defaultUnit: 'piece', tags: ['wardrobe'] },
    { shopType: 'furniture', category: 'Bedroom', name: 'Dressing Table', description: 'Wooden Dressing Table with Mirror', defaultUnit: 'piece', tags: ['dressing'] },
    { shopType: 'furniture', category: 'Bedroom', name: 'Side Table', description: 'Bedside Table', defaultUnit: 'piece', tags: ['side table'] },
    { shopType: 'furniture', category: 'Bedroom', name: 'Chest of Drawers', description: '5 Drawer Chest', defaultUnit: 'piece', tags: ['chest'] },
    { shopType: 'furniture', category: 'Bedroom', name: 'Study Table', description: 'Student Study Table', defaultUnit: 'piece', tags: ['study'] },
    { shopType: 'furniture', category: 'Bedroom', name: 'Book Shelf', description: '5 Shelf Book Rack', defaultUnit: 'piece', tags: ['shelf'] },
    { shopType: 'furniture', category: 'Bedroom', name: 'Shoe Rack', description: 'Wooden Shoe Rack', defaultUnit: 'piece', tags: ['shoe'] },
    { shopType: 'furniture', category: 'Bedroom', name: 'Mattress Single', description: 'Foam Mattress 3x6', defaultUnit: 'piece', tags: ['mattress'] },
    { shopType: 'furniture', category: 'Bedroom', name: 'Mattress Double', description: 'Spring Mattress 5x6', defaultUnit: 'piece', tags: ['mattress'] },
    { shopType: 'furniture', category: 'Bedroom', name: 'Pillow', description: 'Fiber Pillow', defaultUnit: 'piece', tags: ['pillow'] },
    { shopType: 'furniture', category: 'Bedroom', name: 'Blanket Box', description: 'Storage Blanket Box', defaultUnit: 'piece', tags: ['storage'] },
    { shopType: 'furniture', category: 'Bedroom', name: 'Vanity Table', description: 'Modern Vanity with Light', defaultUnit: 'piece', tags: ['vanity'] },
    { shopType: 'furniture', category: 'Bedroom', name: 'Kids Bed', description: 'Kids Single Bed', defaultUnit: 'piece', tags: ['kids'] },

    // SOFA & LIVING - 15
    { shopType: 'furniture', category: 'Sofa', name: '2 Seater Sofa', description: 'Fabric 2 Seater Sofa', defaultUnit: 'piece', tags: ['sofa'] },
    { shopType: 'furniture', category: 'Sofa', name: '3 Seater Sofa', description: 'Leather 3 Seater Sofa', defaultUnit: 'piece', tags: ['sofa'] },
    { shopType: 'furniture', category: 'Sofa', name: 'L Shape Sofa', description: 'L Shape Corner Sofa', defaultUnit: 'piece', tags: ['sofa', 'L'] },
    { shopType: 'furniture', category: 'Sofa', name: 'Sofa Set 5 Seater', description: '5 Seater Sofa Set', defaultUnit: 'set', tags: ['sofa', 'set'] },
    { shopType: 'furniture', category: 'Sofa', name: 'Recliner Sofa', description: 'Single Recliner Chair', defaultUnit: 'piece', tags: ['recliner'] },
    { shopType: 'furniture', category: 'Living', name: 'Center Table', description: 'Glass Center Table', defaultUnit: 'piece', tags: ['table'] },
    { shopType: 'furniture', category: 'Living', name: 'TV Unit', description: 'Wooden TV Cabinet', defaultUnit: 'piece', tags: ['tv'] },
    { shopType: 'furniture', category: 'Living', name: 'Entertainment Unit', description: 'Large TV Entertainment Unit', defaultUnit: 'piece', tags: ['tv'] },
    { shopType: 'furniture', category: 'Living', name: 'Coffee Table', description: 'Small Coffee Table', defaultUnit: 'piece', tags: ['coffee'] },
    { shopType: 'furniture', category: 'Living', name: 'Arm Chair', description: 'Single Arm Chair', defaultUnit: 'piece', tags: ['chair'] },
    { shopType: 'furniture', category: 'Living', name: 'Rocking Chair', description: 'Wooden Rocking Chair', defaultUnit: 'piece', tags: ['rocking'] },
    { shopType: 'furniture', category: 'Living', name: 'Side Rack', description: 'Decorative Side Rack', defaultUnit: 'piece', tags: ['rack'] },
    { shopType: 'furniture', category: 'Living', name: 'Wall Shelf', description: 'Floating Wall Shelf', defaultUnit: 'piece', tags: ['shelf'] },
    { shopType: 'furniture', category: 'Living', name: 'Showcase', description: 'Glass Showcase', defaultUnit: 'piece', tags: ['showcase'] },
    { shopType: 'furniture', category: 'Living', name: 'Foot Stool', description: 'Fabric Foot Stool', defaultUnit: 'piece', tags: ['stool'] },

    // DINING - 10
    { shopType: 'furniture', category: 'Dining', name: 'Dining Table 4 Seater', description: 'Wooden 4 Seater Dining', defaultUnit: 'set', tags: ['dining'] },
    { shopType: 'furniture', category: 'Dining', name: 'Dining Table 6 Seater', description: '6 Seater Dining Table', defaultUnit: 'set', tags: ['dining'] },
    { shopType: 'furniture', category: 'Dining', name: 'Dining Table 8 Seater', description: 'Large 8 Seater Dining', defaultUnit: 'set', tags: ['dining'] },
    { shopType: 'furniture', category: 'Dining', name: 'Dining Chair', description: 'Single Dining Chair', defaultUnit: 'piece', tags: ['chair'] },
    { shopType: 'furniture', category: 'Dining', name: 'Bar Stool', description: 'Kitchen Bar Stool', defaultUnit: 'piece', tags: ['stool'] },
    { shopType: 'furniture', category: 'Dining', name: 'Crookery Cabinet', description: 'Glass Crookery Unit', defaultUnit: 'piece', tags: ['cabinet'] },
    { shopType: 'furniture', category: 'Dining', name: 'Buffet Table', description: 'Dining Buffet Table', defaultUnit: 'piece', tags: ['buffet'] },
    { shopType: 'furniture', category: 'Dining', name: 'Kitchen Trolley', description: 'Kitchen Storage Trolley', defaultUnit: 'piece', tags: ['trolley'] },
    { shopType: 'furniture', category: 'Dining', name: 'Bench', description: 'Dining Bench', defaultUnit: 'piece', tags: ['bench'] },
    { shopType: 'furniture', category: 'Dining', name: 'High Chair', description: 'Baby High Chair', defaultUnit: 'piece', tags: ['baby'] },

    // OFFICE FURNITURE - 15
    { shopType: 'furniture', category: 'Office', name: 'Office Chair', description: 'Executive Office Chair', defaultUnit: 'piece', tags: ['chair', 'office'] },
    { shopType: 'furniture', category: 'Office', name: 'Staff Chair', description: 'Staff Revolving Chair', defaultUnit: 'piece', tags: ['chair'] },
    { shopType: 'furniture', category: 'Office', name: 'Visitor Chair', description: 'Visitor Waiting Chair', defaultUnit: 'piece', tags: ['visitor'] },
    { shopType: 'furniture', category: 'Office', name: 'Office Table', description: 'Single Person Office Table', defaultUnit: 'piece', tags: ['table'] },
    { shopType: 'furniture', category: 'Office', name: 'Computer Table', description: 'Computer Workstation', defaultUnit: 'piece', tags: ['computer'] },
    { shopType: 'furniture', category: 'Office', name: 'Office Desk', description: 'L Shape Office Desk', defaultUnit: 'piece', tags: ['desk'] },
    { shopType: 'furniture', category: 'Office', name: 'Filing Cabinet', description: '4 Drawer Filing Cabinet', defaultUnit: 'piece', tags: ['cabinet'] },
    { shopType: 'furniture', category: 'Office', name: 'Office Almirah', description: 'Steel Office Almirah', defaultUnit: 'piece', tags: ['almirah'] },
    { shopType: 'furniture', category: 'Office', name: 'Conference Table', description: '10 Seater Conference Table', defaultUnit: 'piece', tags: ['conference'] },
    { shopType: 'furniture', category: 'Office', name: 'Reception Table', description: 'Reception Counter Table', defaultUnit: 'piece', tags: ['reception'] },
    { shopType: 'furniture', category: 'Office', name: 'Office Sofa', description: 'Office Waiting Sofa', defaultUnit: 'piece', tags: ['sofa'] },
    { shopType: 'furniture', category: 'Office', name: 'Printer Stand', description: 'Printer Table', defaultUnit: 'piece', tags: ['stand'] },
    { shopType: 'furniture', category: 'Office', name: 'Cabinet', description: 'Office Storage Cabinet', defaultUnit: 'piece', tags: ['cabinet'] },
    { shopType: 'furniture', category: 'Office', name: 'Partition', description: 'Office Partition Panel', defaultUnit: 'piece', tags: ['partition'] },
    { shopType: 'furniture', category: 'Office', name: 'White Board', description: 'Magnetic White Board', defaultUnit: 'piece', tags: ['board'] },

    // STORAGE & OTHER - 15
    { shopType: 'furniture', category: 'Storage', name: 'Plastic Almirah', description: 'Plastic Storage Almirah', defaultUnit: 'piece', tags: ['almirah', 'plastic'] },
    { shopType: 'furniture', category: 'Storage', name: 'Steel Almirah', description: '2 Door Steel Almirah', defaultUnit: 'piece', tags: ['almirah', 'steel'] },
    { shopType: 'furniture', category: 'Storage', name: 'Tool Box', description: 'Carpenter Tool Box', defaultUnit: 'piece', tags: ['tool'] },
    { shopType: 'furniture', category: 'Storage', name: 'Plastic Cabinet', description: 'Kitchen Storage Cabinet', defaultUnit: 'piece', tags: ['cabinet'] },
    { shopType: 'furniture', category: 'Storage', name: 'Cloth Rack', description: 'Metal Cloth Hanger', defaultUnit: 'piece', tags: ['rack'] },

    // OUTDOOR & GARDEN - 10
    { shopType: 'furniture', category: 'Outdoor', name: 'Garden Chair', description: 'Plastic Garden Chair', defaultUnit: 'piece', tags: ['garden'] },
    { shopType: 'furniture', category: 'Outdoor', name: 'Garden Table', description: 'Outdoor Garden Table', defaultUnit: 'piece', tags: ['garden'] },
    { shopType: 'furniture', category: 'Outdoor', name: 'Swing', description: 'Wooden Garden Swing', defaultUnit: 'piece', tags: ['swing'] },
    { shopType: 'furniture', category: 'Outdoor', name: 'Hammock', description: 'Cotton Hammock', defaultUnit: 'piece', tags: ['hammock'] },
    { shopType: 'furniture', category: 'Outdoor', name: 'Plastic Chair', description: 'White Plastic Chair', defaultUnit: 'piece', tags: ['plastic'] },
    { shopType: 'furniture', category: 'Outdoor', name: 'Patio Set', description: '4 Seater Patio Set', defaultUnit: 'set', tags: ['patio'] },
    { shopType: 'furniture', category: 'Outdoor', name: 'Umbrella', description: 'Garden Umbrella', defaultUnit: 'piece', tags: ['umbrella'] },
    { shopType: 'furniture', category: 'Outdoor', name: 'Bench Outdoor', description: 'Park Bench', defaultUnit: 'piece', tags: ['bench'] },
    { shopType: 'furniture', category: 'Outdoor', name: 'Planter Stand', description: 'Wooden Planter', defaultUnit: 'piece', tags: ['planter'] },
    { shopType: 'furniture', category: 'Outdoor', name: 'BBQ Grill Table', description: 'Outdoor BBQ Table', defaultUnit: 'piece', tags: ['bbq'] },

    // KIDS FURNITURE - 10
    { shopType: 'furniture', category: 'Kids', name: 'Kids Study Table', description: 'Kids Study Table with Chair', defaultUnit: 'set', tags: ['kids'] },
    { shopType: 'furniture', category: 'Kids', name: 'Kids Wardrobe', description: 'Kids Cartoon Wardrobe', defaultUnit: 'piece', tags: ['kids'] },
    { shopType: 'furniture', category: 'Kids', name: 'Toy Rack', description: 'Kids Toy Storage Rack', defaultUnit: 'piece', tags: ['toy'] },
    { shopType: 'furniture', category: 'Kids', name: 'Kids Sofa', description: 'Mini Kids Sofa', defaultUnit: 'piece', tags: ['kids'] },
    { shopType: 'furniture', category: 'Kids', name: 'Baby Crib', description: 'Wooden Baby Crib', defaultUnit: 'piece', tags: ['baby'] },
    { shopType: 'furniture', category: 'Kids', name: 'Changing Table', description: 'Baby Changing Table', defaultUnit: 'piece', tags: ['baby'] },
    { shopType: 'furniture', category: 'Kids', name: 'Kids Book Shelf', description: 'Low Height Book Shelf', defaultUnit: 'piece', tags: ['kids'] },
    { shopType: 'furniture', category: 'Kids', name: 'Study Desk', description: 'Kids Writing Desk', defaultUnit: 'piece', tags: ['study'] },
    { shopType: 'furniture', category: 'Kids', name: 'Bean Bag', description: 'Large Bean Bag', defaultUnit: 'piece', tags: ['beanbag'] },
    { shopType: 'furniture', category: 'Kids', name: 'Play Table', description: 'Kids Play Activity Table', defaultUnit: 'piece', tags: ['play'] },

    // ACCESSORIES & SERVICE - 15
    { shopType: 'furniture', category: 'Accessory', name: 'Cushion', description: 'Sofa Cushion', defaultUnit: 'piece', tags: ['cushion'] },
    { shopType: 'furniture', category: 'Accessory', name: 'Carpet', description: 'Living Room Carpet', defaultUnit: 'piece', tags: ['carpet'] },
    { shopType: 'furniture', category: 'Accessory', name: 'Curtain Rod', description: 'Metal Curtain Rod', defaultUnit: 'piece', tags: ['curtain'] },
    { shopType: 'furniture', category: 'Accessory', name: 'Wall Clock', description: 'Decorative Wall Clock', defaultUnit: 'piece', tags: ['clock'] },
    { shopType: 'furniture', category: 'Accessory', name: 'Lamp', description: 'Table Lamp', defaultUnit: 'piece', tags: ['lamp'] },
    { shopType: 'furniture', category: 'Accessory', name: 'Mirror', description: 'Wall Mirror', defaultUnit: 'piece', tags: ['mirror'] },
    { shopType: 'furniture', category: 'Accessory', name: 'Photo Frame', description: 'Large Photo Frame', defaultUnit: 'piece', tags: ['frame'] },
    { shopType: 'furniture', category: 'Material', name: 'Plywood', description: '18mm Plywood Sheet', defaultUnit: 'sheet', tags: ['plywood'] },
    { shopType: 'furniture', category: 'Material', name: 'MDF Board', description: 'MDF Board 8x4', defaultUnit: 'sheet', tags: ['mdf'] },
    { shopType: 'furniture', category: 'Hardware', name: 'Hinge', description: 'Door Hinge Set', defaultUnit: 'set', tags: ['hardware'] },
    { shopType: 'furniture', category: 'Hardware', name: 'Handle', description: 'Cabinet Handle', defaultUnit: 'piece', tags: ['handle'] },
    { shopType: 'furniture', category: 'Hardware', name: 'Lock', description: 'Cupboard Lock', defaultUnit: 'piece', tags: ['lock'] },
    { shopType: 'furniture', category: 'Service', name: 'Custom Furniture', description: 'Custom Made Furniture', defaultUnit: 'service', tags: ['custom'] },
    { shopType: 'furniture', category: 'Service', name: 'Furniture Repair', description: 'Furniture Repair Service', defaultUnit: 'service', tags: ['repair'] },
    { shopType: 'furniture', category: 'Service', name: 'Assembly', description: 'Furniture Assembly Service', defaultUnit: 'service', tags: ['assembly'] }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        await TemplateProduct.deleteMany({ shopType: 'furniture' });
        await TemplateProduct.insertMany(furnitureProducts);
        console.log(`✅ ${furnitureProducts.length} Furniture Products Added!`);
        process.exit();
    } catch(err) { console.error(err); process.exit(1); }
}
seed();
//<!-- TODO: Catalog Button Add Karna Hai -->
//<!-- API: /api/admin/shop/{shopId}/catalog/furniture -->
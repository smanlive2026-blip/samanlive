const mongoose = require('mongoose');
const TemplateProduct = require('../models/TemplateProduct');
require('dotenv').config();

const opticalProducts = [
    // EYEGLASS FRAMES - 25
    { shopType: 'optical', category: 'Frame', name: 'Metal Frame Full Rim', description: 'Titanium Full Rim', defaultUnit: 'piece', tags: ['metal', 'frame'] },
    { shopType: 'optical', category: 'Frame', name: 'Plastic Frame Full Rim', description: 'Acetate Full Rim', defaultUnit: 'piece', tags: ['plastic', 'frame'] },
    { shopType: 'optical', category: 'Frame', name: 'Semi Rimless Frame', description: 'Metal Semi Rimless', defaultUnit: 'piece', tags: ['semi', 'frame'] },
    { shopType: 'optical', category: 'Frame', name: 'Rimless Frame', description: 'Drill Rimless', defaultUnit: 'piece', tags: ['rimless'] },
    { shopType: 'optical', category: 'Frame', name: 'Kids Frame', description: 'Flexible Kids Frame', defaultUnit: 'piece', tags: ['kids'] },
    { shopType: 'optical', category: 'Frame', name: 'Sports Frame', description: 'Sports Eyewear', defaultUnit: 'piece', tags: ['sports'] },
    { shopType: 'optical', category: 'Frame', name: 'Designer Frame Rayban', description: 'Rayban Aviator', defaultUnit: 'piece', tags: ['rayban', 'designer'] },
    { shopType: 'optical', category: 'Frame', name: 'Designer Frame Oakley', description: 'Oakley Frame', defaultUnit: 'piece', tags: ['oakley'] },
    { shopType: 'optical', category: 'Frame', name: 'Women Frame Cat Eye', description: 'Cat Eye Frame', defaultUnit: 'piece', tags: ['women', 'cateye'] },
    { shopType: 'optical', category: 'Frame', name: 'Men Frame Rectangular', description: 'Rectangular Metal', defaultUnit: 'piece', tags: ['men'] },
    { shopType: 'optical', category: 'Frame', name: 'Titanium Frame', description: 'Lightweight Titanium', defaultUnit: 'piece', tags: ['titanium'] },
    { shopType: 'optical', category: 'Frame', name: 'TR90 Frame', description: 'Flexible TR90', defaultUnit: 'piece', tags: ['tr90'] },
    { shopType: 'optical', category: 'Frame', name: 'Reading Frame', description: 'Reading Glasses Frame', defaultUnit: 'piece', tags: ['reading'] },
    { shopType: 'optical', category: 'Frame', name: 'Computer Frame', description: 'Blue Light Frame', defaultUnit: 'piece', tags: ['computer', 'blue'] },
    { shopType: 'optical', category: 'Frame', name: 'Round Frame', description: 'John Lennon Round', defaultUnit: 'piece', tags: ['round'] },
    { shopType: 'optical', category: 'Frame', name: 'Square Frame', description: 'Square Acetate', defaultUnit: 'piece', tags: ['square'] },
    { shopType: 'optical', category: 'Frame', name: 'Oval Frame', description: 'Oval Metal Frame', defaultUnit: 'piece', tags: ['oval'] },
    { shopType: 'optical', category: 'Frame', name: 'Wayfarer Frame', description: 'Wayfarer Style', defaultUnit: 'piece', tags: ['wayfarer'] },
    { shopType: 'optical', category: 'Frame', name: 'Pilot Frame', description: 'Pilot Metal Frame', defaultUnit: 'piece', tags: ['pilot'] },
    { shopType: 'optical', category: 'Frame', name: 'Half Rim Frame', description: 'Half Rim Metal', defaultUnit: 'piece', tags: ['half rim'] },
    { shopType: 'optical', category: 'Frame', name: 'Bifocal Frame', description: 'Bifocal Frame', defaultUnit: 'piece', tags: ['bifocal'] },
    { shopType: 'optical', category: 'Frame', name: 'Progressive Frame', description: 'Progressive Frame', defaultUnit: 'piece', tags: ['progressive'] },
    { shopType: 'optical', category: 'Frame', name: 'Photochromic Frame', description: 'Transitions Frame', defaultUnit: 'piece', tags: ['photochromic'] },
    { shopType: 'optical', category: 'Frame', name: 'Safety Frame', description: 'Safety Glasses Frame', defaultUnit: 'piece', tags: ['safety'] },
    { shopType: 'optical', category: 'Frame', name: 'Premium Designer Frame', description: 'Gucci/Prada Frame', defaultUnit: 'piece', tags: ['premium'] },

    // SUNGLASSES - 15
    { shopType: 'optical', category: 'Sunglass', name: 'Aviator Sunglass', description: 'Metal Aviator UV400', defaultUnit: 'piece', tags: ['aviator', 'uv'] },
    { shopType: 'optical', category: 'Sunglass', name: 'Wayfarer Sunglass', description: 'Plastic Wayfarer', defaultUnit: 'piece', tags: ['wayfarer'] },
    { shopType: 'optical', category: 'Sunglass', name: 'Polarized Sunglass', description: 'Polarized Lens', defaultUnit: 'piece', tags: ['polarized'] },
    { shopType: 'optical', category: 'Sunglass', name: 'Sports Sunglass', description: 'Sports Wrap Around', defaultUnit: 'piece', tags: ['sports'] },
    { shopType: 'optical', category: 'Sunglass', name: 'Designer Sunglass', description: 'Rayban Sunglass', defaultUnit: 'piece', tags: ['rayban'] },
    { shopType: 'optical', category: 'Sunglass', name: 'Round Sunglass', description: 'Round Metal Sunglass', defaultUnit: 'piece', tags: ['round'] },
    { shopType: 'optical', category: 'Sunglass', name: 'Cat Eye Sunglass', description: 'Women Cat Eye', defaultUnit: 'piece', tags: ['cateye'] },
    { shopType: 'optical', category: 'Sunglass', name: 'Pilot Sunglass', description: 'Pilot UV400', defaultUnit: 'piece', tags: ['pilot'] },
    { shopType: 'optical', category: 'Sunglass', name: 'Mirror Sunglass', description: 'Mirror Coated', defaultUnit: 'piece', tags: ['mirror'] },
    { shopType: 'optical', category: 'Sunglass', name: 'Gradient Sunglass', description: 'Gradient Lens', defaultUnit: 'piece', tags: ['gradient'] },
    { shopType: 'optical', category: 'Sunglass', name: 'Kids Sunglass', description: 'Kids UV Sunglass', defaultUnit: 'piece', tags: ['kids'] },
    { shopType: 'optical', category: 'Sunglass', name: 'Driving Sunglass', description: 'Night Driving Glass', defaultUnit: 'piece', tags: ['driving'] },
    { shopType: 'optical', category: 'Sunglass', name: 'Clubmaster Sunglass', description: 'Clubmaster Style', defaultUnit: 'piece', tags: ['clubmaster'] },
    { shopType: 'optical', category: 'Sunglass', name: 'Oversized Sunglass', description: 'Oversized Frame', defaultUnit: 'piece', tags: ['oversized'] },
    { shopType: 'optical', category: 'Sunglass', name: 'Photochromic Sunglass', description: 'Transitions Sunglass', defaultUnit: 'piece', tags: ['photochromic'] },

    // CONTACT LENSES - 15
    { shopType: 'optical', category: 'Contact Lens', name: 'Monthly Disposable Lens', description: 'Monthly Soft Lens', defaultUnit: 'pair', tags: ['monthly'] },
    { shopType: 'optical', category: 'Contact Lens', name: 'Daily Disposable Lens', description: 'Daily Soft Lens', defaultUnit: 'box', tags: ['daily'] },
    { shopType: 'optical', category: 'Contact Lens', name: 'Colored Lens', description: 'Color Contact Lens', defaultUnit: 'pair', tags: ['colored'] },
    { shopType: 'optical', category: 'Contact Lens', name: 'Toric Lens', description: 'Astigmatism Lens', defaultUnit: 'pair', tags: ['toric'] },
    { shopType: 'optical', category: 'Contact Lens', name: 'Bifocal Contact Lens', description: 'Bifocal Soft Lens', defaultUnit: 'pair', tags: ['bifocal'] },
    { shopType: 'optical', category: 'Contact Lens', name: 'Silicone Hydrogel Lens', description: 'Premium Lens', defaultUnit: 'pair', tags: ['silicone'] },
    { shopType: 'optical', category: 'Contact Lens', name: 'UV Blocking Lens', description: 'UV Protection Lens', defaultUnit: 'pair', tags: ['uv'] },
    { shopType: 'optical', category: 'Contact Lens', name: 'Extended Wear Lens', description: '30 Days Wear', defaultUnit: 'pair', tags: ['extended'] },
    { shopType: 'optical', category: 'Contact Lens', name: 'Cosmetic Lens', description: 'Fancy Colored Lens', defaultUnit: 'pair', tags: ['cosmetic'] },
    { shopType: 'optical', category: 'Contact Lens', name: 'RGP Lens', description: 'Rigid Gas Permeable', defaultUnit: 'pair', tags: ['rgp'] },
    { shopType: 'optical', category: 'Contact Lens', name: 'Scleral Lens', description: 'Scleral Contact', defaultUnit: 'pair', tags: ['scleral'] },
    { shopType: 'optical', category: 'Contact Lens', name: 'Ortho-K Lens', description: 'Overnight Reshaping', defaultUnit: 'pair', tags: ['ortho'] },
    { shopType: 'optical', category: 'Contact Lens', name: 'Lens Solution 360ml', description: 'Multi-purpose Solution', defaultUnit: 'bottle', tags: ['solution'] },
    { shopType: 'optical', category: 'Contact Lens', name: 'Lens Case', description: 'Contact Lens Case', defaultUnit: 'piece', tags: ['case'] },
    { shopType: 'optical', category: 'Contact Lens', name: 'Lens Drops', description: 'Rewetting Drops', defaultUnit: 'bottle', tags: ['drops'] },

    // LENSES - 15
    { shopType: 'optical', category: 'Lens', name: 'Single Vision Lens', description: 'CR39 Single Vision', defaultUnit: 'pair', tags: ['single'] },
    { shopType: 'optical', category: 'Lens', name: 'Bifocal Lens', description: 'Flat Top Bifocal', defaultUnit: 'pair', tags: ['bifocal'] },
    { shopType: 'optical', category: 'Lens', name: 'Progressive Lens', description: 'No Line Progressive', defaultUnit: 'pair', tags: ['progressive'] },
    { shopType: 'optical', category: 'Lens', name: 'Blue Cut Lens', description: 'Blue Light Blocking', defaultUnit: 'pair', tags: ['blue'] },
    { shopType: 'optical', category: 'Lens', name: 'Photochromic Lens', description: 'Transitions Lens', defaultUnit: 'pair', tags: ['photochromic'] },
    { shopType: 'optical', category: 'Lens', name: 'Polarized Lens', description: 'Polarized Sun Lens', defaultUnit: 'pair', tags: ['polarized'] },
    { shopType: 'optical', category: 'Lens', name: 'High Index Lens', description: '1.67 High Index', defaultUnit: 'pair', tags: ['high index'] },
    { shopType: 'optical', category: 'Lens', name: 'Polycarbonate Lens', description: 'Impact Resistant', defaultUnit: 'pair', tags: ['polycarbonate'] },
    { shopType: 'optical', category: 'Lens', name: 'Anti-Glare Lens', description: 'AR Coated Lens', defaultUnit: 'pair', tags: ['ar'] },
    { shopType: 'optical', category: 'Lens', name: 'Tinted Lens', description: 'Color Tinted Lens', defaultUnit: 'pair', tags: ['tinted'] },
    { shopType: 'optical', category: 'Lens', name: 'UV Lens', description: '100% UV Protection', defaultUnit: 'pair', tags: ['uv'] },
    { shopType: 'optical', category: 'Lens', name: 'Digital Lens', description: 'Computer Lens', defaultUnit: 'pair', tags: ['digital'] },
    { shopType: 'optical', category: 'Lens', name: 'Reading Lens', description: 'Ready Made Reading', defaultUnit: 'pair', tags: ['reading'] },
    { shopType: 'optical', category: 'Lens', name: 'Safety Lens', description: 'Safety Glass Lens', defaultUnit: 'pair', tags: ['safety'] },
    { shopType: 'optical', category: 'Lens', name: 'Kids Lens', description: 'Impact Resistant Kids', defaultUnit: 'pair', tags: ['kids'] },

    // ACCESSORIES & SERVICES - 30
    { shopType: 'optical', category: 'Accessory', name: 'Eyeglass Case', description: 'Hard Case', defaultUnit: 'piece', tags: ['case'] },
    { shopType: 'optical', category: 'Accessory', name: 'Spectacle Cloth', description: 'Microfiber Cloth', defaultUnit: 'piece', tags: ['cloth'] },
    { shopType: 'optical', category: 'Accessory', name: 'Lens Cleaner Spray', description: '200ml Spray', defaultUnit: 'bottle', tags: ['cleaner'] },
    { shopType: 'optical', category: 'Accessory', name: 'Nose Pad', description: 'Silicone Nose Pad', defaultUnit: 'pair', tags: ['nose'] },
    { shopType: 'optical', category: 'Accessory', name: 'Temple Tip', description: 'Rubber Temple Tip', defaultUnit: 'pair', tags: ['temple'] },
    { shopType: 'optical', category: 'Accessory', name: 'Eyeglass Chain', description: 'Metal Chain', defaultUnit: 'piece', tags: ['chain'] },
    { shopType: 'optical', category: 'Accessory', name: 'Spectacle Cord', description: 'Sports Cord', defaultUnit: 'piece', tags: ['cord'] },
    { shopType: 'optical', category: 'Accessory', name: 'Screw Driver Kit', description: 'Mini Screwdriver', defaultUnit: 'kit', tags: ['kit'] },
    { shopType: 'optical', category: 'Accessory', name: 'Frame Repair Glue', description: 'Super Glue', defaultUnit: 'bottle', tags: ['glue'] },
    { shopType: 'optical', category: 'Accessory', name: 'Lens Cleaning Wipes', description: '30pc Wipes', defaultUnit: 'packet', tags: ['wipes'] },
    { shopType: 'optical', category: 'Testing', name: 'Eye Testing', description: 'Computerized Eye Test', defaultUnit: 'service', tags: ['test'] },
    { shopType: 'optical', category: 'Testing', name: 'Power Check', description: 'Lens Power Check', defaultUnit: 'service', tags: ['power'] },
    { shopType: 'optical', category: 'Service', name: 'Frame Fitting', description: 'Frame Adjustment', defaultUnit: 'service', tags: ['fitting'] },
    { shopType: 'optical', category: 'Service', name: 'Lens Fitting', description: 'Lens Cutting Fitting', defaultUnit: 'service', tags: ['fitting'] },
    { shopType: 'optical', category: 'Service', name: 'Frame Repair', description: 'Frame Repair Service', defaultUnit: 'service', tags: ['repair'] },
    { shopType: 'optical', category: 'Service', name: 'Lens Coating', description: 'AR Coating', defaultUnit: 'service', tags: ['coating'] },
    { shopType: 'optical', category: 'Service', name: 'Photochromic Coating', description: 'Transitions Coating', defaultUnit: 'service', tags: ['coating'] },
    { shopType: 'optical', category: 'Low Vision', name: 'Magnifier', description: 'Hand Magnifier', defaultUnit: 'piece', tags: ['magnifier'] },
    { shopType: 'optical', category: 'Low Vision', name: 'Telescope', description: 'Telescopic Lens', defaultUnit: 'piece', tags: ['telescope'] },
    { shopType: 'optical', category: 'Safety', name: 'Safety Goggles', description: 'Industrial Safety', defaultUnit: 'piece', tags: ['safety'] },
    { shopType: 'optical', category: 'Safety', name: 'Welding Glass', description: 'Welding Goggles', defaultUnit: 'piece', tags: ['welding'] },
    { shopType: 'optical', category: 'Child', name: 'Kids Sports Glasses', description: 'Kids Sports Frame', defaultUnit: 'piece', tags: ['kids'] },
    { shopType: 'optical', category: 'Child', name: 'Flexible Kids Frame', description: 'Unbreakable Frame', defaultUnit: 'piece', tags: ['kids'] },
    { shopType: 'optical', category: 'Premium', name: 'Premium Frame', description: 'Luxury Brand Frame', defaultUnit: 'piece', tags: ['premium'] },
    { shopType: 'optical', category: 'Premium', name: 'Titanium Premium', description: 'Premium Titanium', defaultUnit: 'piece', tags: ['titanium'] },
    { shopType: 'optical', category: 'Contact', name: 'Contact Lens Kit', description: 'Starter Kit', defaultUnit: 'kit', tags: ['kit'] },
    { shopType: 'optical', category: 'Contact', name: 'Lens Remover', description: 'Lens Inserter', defaultUnit: 'piece', tags: ['tool'] },
    { shopType: 'optical', category: 'Display', name: 'Display Stand', description: 'Frame Display', defaultUnit: 'piece', tags: ['display'] },
    { shopType: 'optical', category: 'Insurance', name: 'Warranty', description: '1 Year Warranty', defaultUnit: 'service', tags: ['warranty'] },
    { shopType: 'optical', category: 'Insurance', name: 'AMC', description: 'Annual Maintenance', defaultUnit: 'service', tags: ['amc'] }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        await TemplateProduct.deleteMany({ shopType: 'optical' });
        await TemplateProduct.insertMany(opticalProducts);
        console.log(`✅ ${opticalProducts.length} Optical Products Added!`);
        process.exit();
    } catch(err) { console.error(err); process.exit(1); }
}
seed();
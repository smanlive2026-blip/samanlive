const mongoose = require('mongoose');
const TemplateProduct = require('../models/TemplateProduct');
require('dotenv').config();

const stationeryProducts = [
    // NOTEBOOKS & COPIES - 20
    { shopType: 'stationery', category: 'Notebook', name: 'Single Line Notebook', description: '200 Pages Single Line', defaultUnit: 'piece', tags: ['notebook', 'single'] },
    { shopType: 'stationery', category: 'Notebook', name: 'Four Line Notebook', description: '200 Pages Four Line', defaultUnit: 'piece', tags: ['notebook', 'four'] },
    { shopType: 'stationery', category: 'Notebook', name: 'Square Notebook', description: 'Math Square Notebook', defaultUnit: 'piece', tags: ['notebook', 'math'] },
    { shopType: 'stationery', category: 'Notebook', name: 'Spiral Notebook', description: 'A4 Spiral 200 Pages', defaultUnit: 'piece', tags: ['spiral'] },
    { shopType: 'stationery', category: 'Notebook', name: 'Register', description: 'Long Register 400 Pages', defaultUnit: 'piece', tags: ['register'] },
    { shopType: 'stationery', category: 'Notebook', name: 'Drawing Book', description: 'A3 Drawing Book', defaultUnit: 'piece', tags: ['drawing'] },
    { shopType: 'stationery', category: 'Notebook', name: 'Practical File', description: 'Science Practical File', defaultUnit: 'piece', tags: ['practical'] },
    { shopType: 'stationery', category: 'Notebook', name: 'Journal', description: 'Hard Cover Journal', defaultUnit: 'piece', tags: ['journal'] },
    { shopType: 'stationery', category: 'Notebook', name: 'Diary', description: 'Daily Diary 2026', defaultUnit: 'piece', tags: ['diary'] },
    { shopType: 'stationery', category: 'Notebook', name: 'Graph Book', description: 'Graph Paper Notebook', defaultUnit: 'piece', tags: ['graph'] },
    { shopType: 'stationery', category: 'Notebook', name: 'Subject Notebook Set', description: '5 Subject Set', defaultUnit: 'set', tags: ['set'] },
    { shopType: 'stationery', category: 'Notebook', name: 'Memo Pad', description: 'Small Memo Pad', defaultUnit: 'piece', tags: ['memo'] },
    { shopType: 'stationery', category: 'Notebook', name: 'Sticky Notes', description: '3x3 Sticky Notes', defaultUnit: 'packet', tags: ['sticky'] },
    { shopType: 'stationery', category: 'Notebook', name: 'Index Cards', description: 'Index Flash Cards', defaultUnit: 'packet', tags: ['index'] },
    { shopType: 'stationery', category: 'Notebook', name: 'Loose Sheets', description: 'A4 Loose Sheets 100pc', defaultUnit: 'packet', tags: ['sheets'] },
    { shopType: 'stationery', category: 'Notebook', name: 'Assignment Copy', description: 'Assignment Notebook', defaultUnit: 'piece', tags: ['assignment'] },
    { shopType: 'stationery', category: 'Notebook', name: 'Comic Book', description: 'Comic Drawing Book', defaultUnit: 'piece', tags: ['comic'] },
    { shopType: 'stationery', category: 'Notebook', name: 'Rough Book', description: 'Rough Work Notebook', defaultUnit: 'piece', tags: ['rough'] },
    { shopType: 'stationery', category: 'Notebook', name: 'Attendance Register', description: 'Attendance Register', defaultUnit: 'piece', tags: ['attendance'] },
    { shopType: 'stationery', category: 'Notebook', name: 'Ledger Book', description: 'Account Ledger Book', defaultUnit: 'piece', tags: ['ledger'] },

    // PENS & WRITING - 20
    { shopType: 'stationery', category: 'Pen', name: 'Ball Pen Blue', description: 'Cello Ball Pen Blue', defaultUnit: 'piece', tags: ['pen', 'ball'] },
    { shopType: 'stationery', category: 'Pen', name: 'Ball Pen Black', description: 'Cello Ball Pen Black', defaultUnit: 'piece', tags: ['pen', 'ball'] },
    { shopType: 'stationery', category: 'Pen', name: 'Gel Pen', description: 'Reynolds Gel Pen', defaultUnit: 'piece', tags: ['pen', 'gel'] },
    { shopType: 'stationery', category: 'Pen', name: 'Roller Pen', description: 'Pilot Roller Pen', defaultUnit: 'piece', tags: ['pen', 'roller'] },
    { shopType: 'stationery', category: 'Pen', name: 'Fountain Pen', description: 'Parker Fountain Pen', defaultUnit: 'piece', tags: ['pen', 'fountain'] },
    { shopType: 'stationery', category: 'Pen', name: 'Marker Pen', description: 'Whiteboard Marker', defaultUnit: 'piece', tags: ['marker'] },
    { shopType: 'stationery', category: 'Pen', name: 'Permanent Marker', description: 'CD Marker', defaultUnit: 'piece', tags: ['marker'] },
    { shopType: 'stationery', category: 'Pen', name: 'Highlighter', description: 'Yellow Highlighter', defaultUnit: 'piece', tags: ['highlighter'] },
    { shopType: 'stationery', category: 'Pen', name: 'Sketch Pen', description: '12 Color Sketch Pen', defaultUnit: 'packet', tags: ['sketch'] },
    { shopType: 'stationery', category: 'Pen', name: 'Crayons', description: 'Wax Crayons 24pc', defaultUnit: 'box', tags: ['crayons'] },
    { shopType: 'stationery', category: 'Pen', name: 'Color Pencils', description: 'Color Pencils 12pc', defaultUnit: 'box', tags: ['pencil'] },
    { shopType: 'stationery', category: 'Pen', name: 'Wooden Pencil', description: 'HB Wooden Pencil', defaultUnit: 'piece', tags: ['pencil'] },
    { shopType: 'stationery', category: 'Pen', name: 'Mechanical Pencil', description: '0.7mm Mechanical', defaultUnit: 'piece', tags: ['mechanical'] },
    { shopType: 'stationery', category: 'Pen', name: 'Lead Refill', description: '0.7mm Lead Refill', defaultUnit: 'packet', tags: ['lead'] },
    { shopType: 'stationery', category: 'Pen', name: 'Eraser', description: 'Apsara Eraser', defaultUnit: 'piece', tags: ['eraser'] },
    { shopType: 'stationery', category: 'Pen', name: 'Sharpener', description: 'Single Hole Sharpener', defaultUnit: 'piece', tags: ['sharpener'] },
    { shopType: 'stationery', category: 'Pen', name: 'Pen Refill', description: 'Ball Pen Refill', defaultUnit: 'packet', tags: ['refill'] },
    { shopType: 'stationery', category: 'Pen', name: 'Whiteboard Pen', description: 'Board Marker 4pc', defaultUnit: 'set', tags: ['board'] },
    { shopType: 'stationery', category: 'Pen', name: 'Calligraphy Pen', description: 'Calligraphy Set', defaultUnit: 'set', tags: ['calligraphy'] },
    { shopType: 'stationery', category: 'Pen', name: 'Signature Pen', description: 'Executive Pen', defaultUnit: 'piece', tags: ['signature'] },

    // SCHOOL SUPPLIES - 15
    { shopType: 'stationery', category: 'School', name: 'School Bag', description: 'Kids School Bag', defaultUnit: 'piece', tags: ['bag'] },
    { shopType: 'stationery', category: 'School', name: 'Geometry Box', description: 'Nataraj Geometry Box', defaultUnit: 'piece', tags: ['geometry'] },
    { shopType: 'stationery', category: 'School', name: 'Scale', description: '15cm Plastic Scale', defaultUnit: 'piece', tags: ['scale'] },
    { shopType: 'stationery', category: 'School', name: 'Compass Box', description: 'Mathematical Compass', defaultUnit: 'piece', tags: ['compass'] },
    { shopType: 'stationery', category: 'School', name: 'Lunch Box', description: 'Steel Lunch Box', defaultUnit: 'piece', tags: ['lunch'] },
    { shopType: 'stationery', category: 'School', name: 'Water Bottle', description: '1L Water Bottle', defaultUnit: 'piece', tags: ['bottle'] },
    { shopType: 'stationery', category: 'School', name: 'Pencil Pouch', description: 'Zipper Pencil Pouch', defaultUnit: 'piece', tags: ['pouch'] },
    { shopType: 'stationery', category: 'School', name: 'Chart Paper', description: 'A3 Chart Paper 10pc', defaultUnit: 'packet', tags: ['chart'] },
    { shopType: 'stationery', category: 'School', name: 'Color Paper', description: 'Craft Color Paper', defaultUnit: 'packet', tags: ['craft'] },
    { shopType: 'stationery', category: 'School', name: 'Glue Stick', description: 'Fevicol Glue Stick', defaultUnit: 'piece', tags: ['glue'] },
    { shopType: 'stationery', category: 'School', name: 'Scissors', description: 'Student Scissors', defaultUnit: 'piece', tags: ['scissors'] },
    { shopType: 'stationery', category: 'School', name: 'Tape', description: 'Cellotape 1 inch', defaultUnit: 'piece', tags: ['tape'] },
    { shopType: 'stationery', category: 'School', name: 'Stapler', description: 'Small Stapler', defaultUnit: 'piece', tags: ['stapler'] },
    { shopType: 'stationery', category: 'School', name: 'Stapler Pins', description: 'Stapler Pin Box', defaultUnit: 'box', tags: ['pins'] },
    { shopType: 'stationery', category: 'School', name: 'Paper Clip', description: 'Paper Clip Box', defaultUnit: 'box', tags: ['clip'] },

    // OFFICE SUPPLIES - 15
    { shopType: 'stationery', category: 'Office', name: 'File Folder', description: 'L Folder A4', defaultUnit: 'piece', tags: ['folder'] },
    { shopType: 'stationery', category: 'Office', name: 'Ring File', description: '2 Ring File', defaultUnit: 'piece', tags: ['file'] },
    { shopType: 'stationery', category: 'Office', name: 'Document File', description: 'Expandable File', defaultUnit: 'piece', tags: ['document'] },
    { shopType: 'stationery', category: 'Office', name: 'Calculator', description: 'Scientific Calculator', defaultUnit: 'piece', tags: ['calculator'] },
    { shopType: 'stationery', category: 'Office', name: 'Stapler Big', description: 'Heavy Duty Stapler', defaultUnit: 'piece', tags: ['stapler'] },
    { shopType: 'stationery', category: 'Office', name: 'Hole Puncher', description: '2 Hole Puncher', defaultUnit: 'piece', tags: ['puncher'] },
    { shopType: 'stationery', category: 'Office', name: 'Paper Weight', description: 'Glass Paper Weight', defaultUnit: 'piece', tags: ['weight'] },
    { shopType: 'stationery', category: 'Office', name: 'Desk Organizer', description: '5 Compartment Organizer', defaultUnit: 'piece', tags: ['organizer'] },
    { shopType: 'stationery', category: 'Office', name: 'Name Plate', description: 'Table Name Plate', defaultUnit: 'piece', tags: ['nameplate'] },
    { shopType: 'stationery', category: 'Office', name: 'Rubber Stamp', description: 'Custom Rubber Stamp', defaultUnit: 'piece', tags: ['stamp'] },
    { shopType: 'stationery', category: 'Office', name: 'Ink Pad', description: 'Stamp Ink Pad', defaultUnit: 'piece', tags: ['ink'] },
    { shopType: 'stationery', category: 'Office', name: 'Pin Cushion', description: 'Magnetic Pin Holder', defaultUnit: 'piece', tags: ['pin'] },
    { shopType: 'stationery', category: 'Office', name: 'Calendar', description: 'Wall Calendar 2026', defaultUnit: 'piece', tags: ['calendar'] },
    { shopType: 'stationery', category: 'Office', name: 'Diary Office', description: 'Executive Diary', defaultUnit: 'piece', tags: ['diary'] },
    { shopType: 'stationery', category: 'Office', name: 'Visitor Book', description: 'Visitor Entry Book', defaultUnit: 'piece', tags: ['visitor'] },

    // ART & CRAFT - 15
    { shopType: 'stationery', category: 'Art', name: 'Water Colors', description: 'Water Color 12pc', defaultUnit: 'box', tags: ['watercolor'] },
    { shopType: 'stationery', category: 'Art', name: 'Oil Pastels', description: 'Oil Pastel 24pc', defaultUnit: 'box', tags: ['pastel'] },
    { shopType: 'stationery', category: 'Art', name: 'Paint Brush', description: 'Brush Set 5pc', defaultUnit: 'set', tags: ['brush'] },
    { shopType: 'stationery', category: 'Art', name: 'Canvas', description: '10x12 Canvas', defaultUnit: 'piece', tags: ['canvas'] },
    { shopType: 'stationery', category: 'Art', name: 'Clay', description: 'Modelling Clay', defaultUnit: 'packet', tags: ['clay'] },
    { shopType: 'stationery', category: 'Art', name: 'Thermocol Sheet', description: 'Thermocol A4', defaultUnit: 'piece', tags: ['thermocol'] },
    { shopType: 'stationery', category: 'Art', name: 'Glitter Paper', description: 'Glitter Craft Paper', defaultUnit: 'packet', tags: ['glitter'] },
    { shopType: 'stationery', category: 'Art', name: 'Origami Paper', description: 'Origami Sheet 100pc', defaultUnit: 'packet', tags: ['origami'] },
    { shopType: 'stationery', category: 'Art', name: 'Fevi Quick', description: 'Fevi Quick 3g', defaultUnit: 'piece', tags: ['fevi'] },
    { shopType: 'stationery', category: 'Art', name: 'Fevi Bond', description: 'Fevi Bond 500ml', defaultUnit: 'bottle', tags: ['fevicol'] },
    { shopType: 'stationery', category: 'Art', name: 'Double Tape', description: 'Double Sided Tape', defaultUnit: 'piece', tags: ['tape'] },
    { shopType: 'stationery', category: 'Art', name: 'Masking Tape', description: 'Masking Tape Roll', defaultUnit: 'piece', tags: ['masking'] },
    { shopType: 'stationery', category: 'Art', name: 'Poster Colors', description: 'Poster Color 6pc', defaultUnit: 'box', tags: ['poster'] },
    { shopType: 'stationery', category: 'Art', name: 'Palette', description: 'Paint Palette', defaultUnit: 'piece', tags: ['palette'] },
    { shopType: 'stationery', category: 'Art', name: 'Apron', description: 'Art Apron for Kids', defaultUnit: 'piece', tags: ['apron'] },

    // PRINTING & PAPER - 15
    { shopType: 'stationery', category: 'Paper', name: 'A4 Paper', description: 'A4 Copier Paper 500 Sheets', defaultUnit: 'ream', tags: ['a4', 'paper'] },
    { shopType: 'stationery', category: 'Paper', name: 'Legal Paper', description: 'Legal Size Paper', defaultUnit: 'ream', tags: ['legal'] },
    { shopType: 'stationery', category: 'Paper', name: 'Photo Paper', description: 'Glossy Photo Paper', defaultUnit: 'packet', tags: ['photo'] },
    { shopType: 'stationery', category: 'Paper', name: 'Carbon Paper', description: 'Carbon Paper 100pc', defaultUnit: 'packet', tags: ['carbon'] },
    { shopType: 'stationery', category: 'Paper', name: 'Tracing Paper', description: 'Tracing Paper Roll', defaultUnit: 'roll', tags: ['tracing'] },
    { shopType: 'stationery', category: 'Printing', name: 'Printer Cartridge', description: 'HP Black Cartridge', defaultUnit: 'piece', tags: ['cartridge'] },
    { shopType: 'stationery', category: 'Printing', name: 'Ink Bottle', description: 'Printer Ink 70ml', defaultUnit: 'bottle', tags: ['ink'] },
    { shopType: 'stationery', category: 'Printing', name: 'Toner', description: 'Laser Printer Toner', defaultUnit: 'piece', tags: ['toner'] },
    { shopType: 'stationery', category: 'Printing', name: 'Printout', description: 'Black & White Printout', defaultUnit: 'page', tags: ['print'] },
    { shopType: 'stationery', category: 'Printing', name: 'Color Printout', description: 'Color Printout A4', defaultUnit: 'page', tags: ['color'] },
    { shopType: 'stationery', category: 'Printing', name: 'Lamintion', description: 'A4 Lamination', defaultUnit: 'page', tags: ['lamination'] },
    { shopType: 'stationery', category: 'Printing', name: 'Spiral Binding', description: 'Spiral Binding Service', defaultUnit: 'service', tags: ['binding'] },
    { shopType: 'stationery', category: 'Printing', name: 'Xerox', description: 'Photocopy A4', defaultUnit: 'page', tags: ['xerox'] },
    { shopType: 'stationery', category: 'Printing', name: 'ID Card', description: 'PVC ID Card', defaultUnit: 'piece', tags: ['id'] },
    { shopType: 'stationery', category: 'Printing', name: 'Visiting Card', description: '100 Visiting Cards', defaultUnit: 'box', tags: ['visiting'] },

    // ACCESSORIES & OTHER - 10
    { shopType: 'stationery', category: 'Accessory', name: 'Book Cover', description: 'Plastic Book Cover', defaultUnit: 'packet', tags: ['cover'] },
    { shopType: 'stationery', category: 'Accessory', name: 'Label Sticker', description: 'Name Label Sticker', defaultUnit: 'packet', tags: ['label'] },
    { shopType: 'stationery', category: 'Accessory', name: 'Envelope', description: 'A4 Envelope 10pc', defaultUnit: 'packet', tags: ['envelope'] },
    { shopType: 'stationery', category: 'Accessory', name: 'Rubber Band', description: 'Rubber Band 100g', defaultUnit: 'packet', tags: ['rubber'] },
    { shopType: 'stationery', category: 'Accessory', name: 'Thumb Pin', description: 'Color Thumb Pin', defaultUnit: 'packet', tags: ['pin'] },
    { shopType: 'stationery', category: 'Accessory', name: 'File Tag', description: 'File Tag 50pc', defaultUnit: 'packet', tags: ['tag'] },
    { shopType: 'stationery', category: 'Accessory', name: 'Correction Pen', description: 'Correction Fluid Pen', defaultUnit: 'piece', tags: ['correction'] },
    { shopType: 'stationery', category: 'Gift', name: 'Gift Pen', description: 'Executive Gift Pen', defaultUnit: 'piece', tags: ['gift'] },
    { shopType: 'stationery', category: 'Gift', name: 'Gift Set', description: 'Pen Diary Gift Set', defaultUnit: 'set', tags: ['gift'] },
    { shopType: 'stationery', category: 'Service', name: 'Photo Print', description: 'Passport Size Photo', defaultUnit: 'set', tags: ['photo'] }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        await TemplateProduct.deleteMany({ shopType: 'stationery' });
        await TemplateProduct.insertMany(stationeryProducts);
        console.log(`✅ ${stationeryProducts.length} Stationery Products Added!`);
        process.exit();
    } catch(err) { console.error(err); process.exit(1); }
}
seed();
// <!-- TODO: Catalog Button Add Karna Hai -->
//<!-- API: /api/admin/shop/{shopId}/catalog/stationery -->
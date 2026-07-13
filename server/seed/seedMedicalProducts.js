const mongoose = require('mongoose');
const TemplateProduct = require('../models/TemplateProduct');
require('dotenv').config();

const medicalProducts = [
    // TABLET - 20
    { shopType: 'medical', category: 'Tablet', name: 'Crocin 500mg', description: 'Fever, Headache', defaultUnit: 'strip', tags: ['fever', 'pain'] },
    { shopType: 'medical', category: 'Tablet', name: 'Dolo 650', description: 'Fever, Body Pain', defaultUnit: 'strip', tags: ['fever'] },
    { shopType: 'medical', category: 'Tablet', name: 'Paracetamol 500', description: 'General Pain', defaultUnit: 'strip', tags: ['pain'] },
    { shopType: 'medical', category: 'Tablet', name: 'Combiflam', description: 'Pain, Fever', defaultUnit: 'strip', tags: ['pain'] },
    { shopType: 'medical', category: 'Tablet', name: 'Meftal Spas', description: 'Stomach Pain', defaultUnit: 'strip', tags: ['pain'] },
    { shopType: 'medical', category: 'Tablet', name: 'Azithromycin 500', description: 'Antibiotic', defaultUnit: 'strip', tags: ['antibiotic'] },
    { shopType: 'medical', category: 'Tablet', name: 'Amoxicillin 500', description: 'Antibiotic', defaultUnit: 'strip', tags: ['antibiotic'] },
    { shopType: 'medical', category: 'Tablet', name: 'Cetrizine 10mg', description: 'Allergy', defaultUnit: 'strip', tags: ['allergy'] },
    { shopType: 'medical', category: 'Tablet', name: 'Cough Cold Tablet', description: 'Cold & Cough', defaultUnit: 'strip', tags: ['cough'] },
    { shopType: 'medical', category: 'Tablet', name: 'Ondem 4mg', description: 'Vomiting', defaultUnit: 'strip', tags: ['vomit'] },
    { shopType: 'medical', category: 'Tablet', name: 'Pantop 40', description: 'Acidity', defaultUnit: 'strip', tags: ['acidity'] },
    { shopType: 'medical', category: 'Tablet', name: 'Rantac 150', description: 'Gas, Acidity', defaultUnit: 'strip', tags: ['gas'] },
    { shopType: 'medical', category: 'Tablet', name: 'Metformin 500', description: 'Sugar', defaultUnit: 'strip', tags: ['sugar', 'diabetes'] },
    { shopType: 'medical', category: 'Tablet', name: 'Glycomet GP1', description: 'Diabetes', defaultUnit: 'strip', tags: ['diabetes'] },
    { shopType: 'medical', category: 'Tablet', name: 'Telma 40', description: 'BP', defaultUnit: 'strip', tags: ['bp'] },
    { shopType: 'medical', category: 'Tablet', name: 'Amlodipine 5mg', description: 'BP', defaultUnit: 'strip', tags: ['bp'] },
    { shopType: 'medical', category: 'Tablet', name: 'Atorva 10', description: 'Cholesterol', defaultUnit: 'strip', tags: ['cholesterol'] },
    { shopType: 'medical', category: 'Tablet', name: 'Calpol 650', description: 'Fever', defaultUnit: 'strip', tags: ['fever'] },
    { shopType: 'medical', category: 'Tablet', name: 'Zincovit', description: 'Multivitamin', defaultUnit: 'strip', tags: ['vitamin'] },
    { shopType: 'medical', category: 'Tablet', name: 'Becosules', description: 'Vitamin B Complex', defaultUnit: 'strip', tags: ['vitamin'] },

    // SYRUP - 15
    { shopType: 'medical', category: 'Syrup', name: 'Cofsils Syrup', description: 'Cough Syrup 100ml', defaultUnit: 'bottle', tags: ['cough'] },
    { shopType: 'medical', category: 'Syrup', name: 'Benadryl Syrup', description: 'Dry Cough 100ml', defaultUnit: 'bottle', tags: ['cough'] },
    { shopType: 'medical', category: 'Syrup', name: 'Corex Syrup', description: 'Cough 100ml', defaultUnit: 'bottle', tags: ['cough'] },
    { shopType: 'medical', category: 'Syrup', name: 'Grilinctus Syrup', description: 'Cough 100ml', defaultUnit: 'bottle', tags: ['cough'] },
    { shopType: 'medical', category: 'Syrup', name: 'Digene Syrup', description: 'Acidity 200ml', defaultUnit: 'bottle', tags: ['acidity'] },
    { shopType: 'medical', category: 'Syrup', name: 'Gelusil Syrup', description: 'Gas 170ml', defaultUnit: 'bottle', tags: ['gas'] },
    { shopType: 'medical', category: 'Syrup', name: 'Zandopa Syrup', description: 'Tonic 200ml', defaultUnit: 'bottle', tags: ['tonic'] },
    { shopType: 'medical', category: 'Syrup', name: 'Dexorange Syrup', description: 'Iron Syrup 200ml', defaultUnit: 'bottle', tags: ['iron'] },
    { shopType: 'medical', category: 'Syrup', name: 'Liv52 Syrup', description: 'Liver Tonic 100ml', defaultUnit: 'bottle', tags: ['liver'] },
    { shopType: 'medical', category: 'Syrup', name: 'ORS', description: 'ORS Packet', defaultUnit: 'packet', tags: ['dehydration'] },
    { shopType: 'medical', category: 'Syrup', name: 'Electral', description: 'Electrolyte 1pc', defaultUnit: 'packet', tags: ['dehydration'] },
    { shopType: 'medical', category: 'Syrup', name: 'Zinc Syrup', description: 'Zinc 100ml', defaultUnit: 'bottle', tags: ['zinc'] },
    { shopType: 'medical', category: 'Syrup', name: 'Vitamin C Syrup', description: 'Vit C 200ml', defaultUnit: 'bottle', tags: ['vitamin'] },
    { shopType: 'medical', category: 'Syrup', name: 'Calcium Syrup', description: 'Calcium 200ml', defaultUnit: 'bottle', tags: ['calcium'] },
    { shopType: 'medical', category: 'Syrup', name: 'B Complex Syrup', description: 'B Complex 200ml', defaultUnit: 'bottle', tags: ['vitamin'] },

    // FIRST AID - 15
    { shopType: 'medical', category: 'First Aid', name: 'Band Aid', description: 'Bandage 10pc', defaultUnit: 'packet', tags: ['bandage'] },
    { shopType: 'medical', category: 'First Aid', name: 'Cotton Roll', description: 'Cotton 100gm', defaultUnit: 'roll', tags: ['cotton'] },
    { shopType: 'medical', category: 'First Aid', name: 'Bandage Roll', description: 'Bandage 4 inch', defaultUnit: 'piece', tags: ['bandage'] },
    { shopType: 'medical', category: 'First Aid', name: 'Dettol', description: 'Antiseptic 100ml', defaultUnit: 'bottle', tags: ['antiseptic'] },
    { shopType: 'medical', category: 'First Aid', name: 'Savlon', description: 'Antiseptic Liquid 100ml', defaultUnit: 'bottle', tags: ['antiseptic'] },
    { shopType: 'medical', category: 'First Aid', name: 'Betadine', description: 'Povidone Iodine 100ml', defaultUnit: 'bottle', tags: ['antiseptic'] },
    { shopType: 'medical', category: 'First Aid', name: 'Thermometer', description: 'Digital Thermometer', defaultUnit: 'piece', tags: ['device'] },
    { shopType: 'medical', category: 'First Aid', name: 'BP Machine', description: 'Digital BP Monitor', defaultUnit: 'piece', tags: ['device'] },
    { shopType: 'medical', category: 'First Aid', name: 'Glucometer', description: 'Sugar Checking Machine', defaultUnit: 'piece', tags: ['device'] },
    { shopType: 'medical', category: 'First Aid', name: 'Test Strips', description: 'Glucometer Strips 50pc', defaultUnit: 'box', tags: ['strips'] },
    { shopType: 'medical', category: 'First Aid', name: 'Mask', description: 'Surgical Mask 3ply', defaultUnit: 'piece', tags: ['mask'] },
    { shopType: 'medical', category: 'First Aid', name: 'Gloves', description: 'Hand Gloves 1pair', defaultUnit: 'pair', tags: ['gloves'] },
    { shopType: 'medical', category: 'First Aid', name: 'Sanitizer', description: 'Hand Sanitizer 500ml', defaultUnit: 'bottle', tags: ['sanitizer'] },
    { shopType: 'medical', category: 'First Aid', name: 'Ice Pack', description: 'Cold Pack', defaultUnit: 'piece', tags: ['pack'] },
    { shopType: 'medical', category: 'First Aid', name: 'Hot Water Bag', description: 'Hot Bag', defaultUnit: 'piece', tags: ['bag'] },

    // SKIN CREAM - 15
    { shopType: 'medical', category: 'Cream', name: 'Betnovate Cream', description: 'Skin Cream 20gm', defaultUnit: 'tube', tags: ['cream'] },
    { shopType: 'medical', category: 'Cream', name: 'Soframycin', description: 'Antibiotic Cream 10gm', defaultUnit: 'tube', tags: ['cream'] },
    { shopType: 'medical', category: 'Cream', name: 'Volini Gel', description: 'Pain Relief Gel 30gm', defaultUnit: 'tube', tags: ['gel'] },
    { shopType: 'medical', category: 'Cream', name: 'Moov', description: 'Pain Balm', defaultUnit: 'tube', tags: ['balm'] },
    { shopType: 'medical', category: 'Cream', name: 'Vicks', description: 'Vaporub 50gm', defaultUnit: 'jar', tags: ['balm'] },
    { shopType: 'medical', category: 'Cream', name: 'Fair & Lovely', description: 'Face Cream 50gm', defaultUnit: 'jar', tags: ['cream'] },
    { shopType: 'medical', category: 'Cream', name: 'Pond\'s Cream', description: 'Moisturizer 100gm', defaultUnit: 'jar', tags: ['cream'] },
    { shopType: 'medical', category: 'Cream', name: 'Nivea Cream', description: 'Nivea 100ml', defaultUnit: 'bottle', tags: ['cream'] },
    { shopType: 'medical', category: 'Cream', name: 'Aloe Vera Gel', description: 'Aloe Gel 100ml', defaultUnit: 'tube', tags: ['gel'] },
    { shopType: 'medical', category: 'Cream', name: 'Neosporin', description: 'Antibiotic Ointment', defaultUnit: 'tube', tags: ['ointment'] },
    { shopType: 'medical', category: 'Cream', name: 'Candid Cream', description: 'Antifungal Cream', defaultUnit: 'tube', tags: ['cream'] },
    { shopType: 'medical', category: 'Cream', name: 'Itch Guard', description: 'Itching Cream', defaultUnit: 'tube', tags: ['cream'] },
    { shopType: 'medical', category: 'Cream', name: 'Boroline', description: 'Antiseptic Cream', defaultUnit: 'tube', tags: ['cream'] },
    { shopType: 'medical', category: 'Cream', name: 'Sunscreen', description: 'SPF 50 50ml', defaultUnit: 'tube', tags: ['sunscreen'] },
    { shopType: 'medical', category: 'Cream', name: 'Face Wash', description: 'Himalaya Face Wash', defaultUnit: 'bottle', tags: ['facewash'] },

    // OTHER - 35
    { shopType: 'medical', category: 'Other', name: 'Pregnancy Test Kit', description: 'Prega News', defaultUnit: 'kit', tags: ['test'] },
    { shopType: 'medical', category: 'Other', name: 'Condoms', description: 'Condoms 3pc', defaultUnit: 'packet', tags: ['protection'] },
    { shopType: 'medical', category: 'Other', name: 'Sanitary Pad', description: 'Whisper XL', defaultUnit: 'packet', tags: ['pad'] },
    { shopType: 'medical', category: 'Other', name: 'Inhaler', description: 'Vicks Inhaler', defaultUnit: 'piece', tags: ['inhaler'] },
    { shopType: 'medical', category: 'Other', name: 'Nebulizer', description: 'Nebulizer Machine', defaultUnit: 'piece', tags: ['device'] },
    { shopType: 'medical', category: 'Other', name: 'Wheelchair', description: 'Wheelchair', defaultUnit: 'piece', tags: ['device'] },
    { shopType: 'medical', category: 'Other', name: 'Walking Stick', description: 'Walking Stick', defaultUnit: 'piece', tags: ['support'] },
    { shopType: 'medical', category: 'Other', name: 'Knee Cap', description: 'Knee Support', defaultUnit: 'piece', tags: ['support'] },
    { shopType: 'medical', category: 'Other', name: 'Wrist Band', description: 'Wrist Support', defaultUnit: 'piece', tags: ['support'] },
    { shopType: 'medical', category: 'Other', name: 'Eye Drops', description: 'Zincfrin Eye Drop', defaultUnit: 'bottle', tags: ['eye'] },
    { shopType: 'medical', category: 'Other', name: 'Ear Drops', description: 'Ear Drop', defaultUnit: 'bottle', tags: ['ear'] },
    { shopType: 'medical', category: 'Other', name: 'Nasal Spray', description: 'Nasal Spray', defaultUnit: 'bottle', tags: ['nasal'] },
    { shopType: 'medical', category: 'Other', name: 'Protein Powder', description: 'Health Drink 500gm', defaultUnit: 'jar', tags: ['protein'] },
    { shopType: 'medical', category: 'Other', name: 'Horlicks', description: 'Horlicks 500gm', defaultUnit: 'jar', tags: ['health drink'] },
    { shopType: 'medical', category: 'Other', name: 'Complan', description: 'Complan 500gm', defaultUnit: 'jar', tags: ['health drink'] },
    { shopType: 'medical', category: 'Other', name: 'Bournvita', description: 'Bournvita 500gm', defaultUnit: 'jar', tags: ['health drink'] },
    { shopType: 'medical', category: 'Other', name: 'Dabur Chyawanprash', description: 'Chyawanprash 500gm', defaultUnit: 'jar', tags: ['immunity'] },
    { shopType: 'medical', category: 'Other', name: 'Honey', description: 'Dabur Honey 500gm', defaultUnit: 'bottle', tags: ['honey'] },
    { shopType: 'medical', category: 'Other', name: 'Gripe Water', description: 'Baby Gripe Water', defaultUnit: 'bottle', tags: ['baby'] },
    { shopType: 'medical', category: 'Other', name: 'Baby Oil', description: 'Johnson Baby Oil', defaultUnit: 'bottle', tags: ['baby'] },
    { shopType: 'medical', category: 'Other', name: 'Baby Powder', description: 'Baby Powder', defaultUnit: 'bottle', tags: ['baby'] },
    { shopType: 'medical', category: 'Other', name: 'Diaper', description: 'Pampers', defaultUnit: 'packet', tags: ['baby'] },
    { shopType: 'medical', category: 'Other', name: 'Wipes', description: 'Baby Wipes', defaultUnit: 'packet', tags: ['baby'] },
    { shopType: 'medical', category: 'Other', name: 'Handwash', description: 'Dettol Handwash', defaultUnit: 'bottle', tags: ['handwash'] },
    { shopType: 'medical', category: 'Other', name: 'Soap', description: 'Dettol Soap', defaultUnit: 'piece', tags: ['soap'] },
    { shopType: 'medical', category: 'Other', name: 'Shampoo', description: 'Medicated Shampoo', defaultUnit: 'bottle', tags: ['shampoo'] },
    { shopType: 'medical', category: 'Other', name: 'Toothpaste', description: 'Sensodyne', defaultUnit: 'tube', tags: ['toothpaste'] },
    { shopType: 'medical', category: 'Other', name: 'Mouthwash', description: 'Listerine', defaultUnit: 'bottle', tags: ['mouthwash'] },
    { shopType: 'medical', category: 'Other', name: 'Deodorant', description: 'Deo Spray', defaultUnit: 'bottle', tags: ['deo'] },
    { shopType: 'medical', category: 'Other', name: 'Perfume', description: 'Perfume', defaultUnit: 'bottle', tags: ['perfume'] },
    { shopType: 'medical', category: 'Other', name: 'Comb', description: 'Comb', defaultUnit: 'piece', tags: ['comb'] },
    { shopType: 'medical', category: 'Other', name: 'Hair Oil', description: 'Coconut Oil', defaultUnit: 'bottle', tags: ['oil'] },
    { shopType: 'medical', category: 'Other', name: 'Talcum Powder', description: 'Talcum Powder', defaultUnit: 'bottle', tags: ['powder'] },
    { shopType: 'medical', category: 'Other', name: 'Lip Balm', description: 'Lip Balm', defaultUnit: 'piece', tags: ['lip'] },
    { shopType: 'medical', category: 'Other', name: 'Pain Spray', description: 'Pain Spray', defaultUnit: 'bottle', tags: ['spray'] }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        await TemplateProduct.deleteMany({ shopType: 'medical' });
        await TemplateProduct.insertMany(medicalProducts);
        console.log(`✅ ${medicalProducts.length} Medical Products Added!`);
        process.exit();
    } catch(err) { console.error(err); process.exit(1); }
}
seed();
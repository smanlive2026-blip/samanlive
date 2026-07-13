const mongoose = require('mongoose');
const TemplateProduct = require('../models/TemplateProduct');
require('dotenv').config();

const jewelleryProducts = [
    // GOLD RING - 15
    { shopType: 'jewellery', category: 'Ring', name: 'Gold Ring 22K', description: '1 Gram Gold Ring', defaultUnit: 'piece', tags: ['gold', 'ring'] },
    { shopType: 'jewellery', category: 'Ring', name: 'Diamond Ring', description: 'Solitaire Diamond Ring', defaultUnit: 'piece', tags: ['diamond', 'ring'] },
    { shopType: 'jewellery', category: 'Ring', name: 'Couple Ring Set', description: 'Gold Couple Rings', defaultUnit: 'set', tags: ['gold', 'couple'] },
    { shopType: 'jewellery', category: 'Ring', name: 'Engagement Ring', description: 'Diamond Engagement Ring', defaultUnit: 'piece', tags: ['diamond', 'engagement'] },
    { shopType: 'jewellery', category: 'Ring', name: 'Gemstone Ring', description: 'Ruby Gemstone Ring', defaultUnit: 'piece', tags: ['gemstone', 'ring'] },
    { shopType: 'jewellery', category: 'Ring', name: 'Men Gold Ring', description: 'Mens 22K Gold Ring', defaultUnit: 'piece', tags: ['gold', 'men'] },
    { shopType: 'jewellery', category: 'Ring', name: 'Kids Ring', description: 'Gold Kids Ring', defaultUnit: 'piece', tags: ['gold', 'kids'] },
    { shopType: 'jewellery', category: 'Ring', name: 'Platinum Ring', description: 'Platinum Band Ring', defaultUnit: 'piece', tags: ['platinum'] },
    { shopType: 'jewellery', category: 'Ring', name: 'Kundan Ring', description: 'Kundan Gold Ring', defaultUnit: 'piece', tags: ['kundan'] },
    { shopType: 'jewellery', category: 'Ring', name: 'Meenakari Ring', description: 'Meenakari Gold Ring', defaultUnit: 'piece', tags: ['meenakari'] },
    { shopType: 'jewellery', category: 'Ring', name: 'Rose Gold Ring', description: 'Rose Gold Ring', defaultUnit: 'piece', tags: ['rose gold'] },
    { shopType: 'jewellery', category: 'Ring', name: 'Silver Ring', description: '925 Silver Ring', defaultUnit: 'piece', tags: ['silver'] },
    { shopType: 'jewellery', category: 'Ring', name: 'Toe Ring', description: 'Silver Toe Ring Pair', defaultUnit: 'pair', tags: ['silver', 'toe'] },
    { shopType: 'jewellery', category: 'Ring', name: 'Nose Ring', description: 'Gold Nose Pin', defaultUnit: 'piece', tags: ['gold', 'nose'] },
    { shopType: 'jewellery', category: 'Ring', name: 'Oxidised Ring', description: 'Oxidised Silver Ring', defaultUnit: 'piece', tags: ['oxidised'] },

    // NECKLACE - 15
    { shopType: 'jewellery', category: 'Necklace', name: 'Gold Necklace 22K', description: '10 Gram Gold Necklace', defaultUnit: 'piece', tags: ['gold', 'necklace'] },
    { shopType: 'jewellery', category: 'Necklace', name: 'Diamond Necklace', description: 'Diamond Choker', defaultUnit: 'piece', tags: ['diamond'] },
    { shopType: 'jewellery', category: 'Necklace', name: 'Kundan Necklace', description: 'Kundan Set', defaultUnit: 'set', tags: ['kundan'] },
    { shopType: 'jewellery', category: 'Necklace', name: 'Pearl Necklace', description: 'Real Pearl Mala', defaultUnit: 'piece', tags: ['pearl'] },
    { shopType: 'jewellery', category: 'Necklace', name: 'Mangalsutra', description: 'Gold Mangalsutra', defaultUnit: 'piece', tags: ['gold', 'mangalsutra'] },
    { shopType: 'jewellery', category: 'Necklace', name: 'Long Chain', description: 'Gold Long Chain', defaultUnit: 'piece', tags: ['gold', 'chain'] },
    { shopType: 'jewellery', category: 'Necklace', name: 'Bead Necklace', description: 'Designer Bead Necklace', defaultUnit: 'piece', tags: ['bead'] },
    { shopType: 'jewellery', category: 'Necklace', name: 'Temple Necklace', description: 'Temple Gold Necklace', defaultUnit: 'piece', tags: ['temple'] },
    { shopType: 'jewellery', category: 'Necklace', name: 'Antique Necklace', description: 'Antique Gold Set', defaultUnit: 'set', tags: ['antique'] },
    { shopType: 'jewellery', category: 'Necklace', name: 'Silver Necklace', description: '925 Silver Chain', defaultUnit: 'piece', tags: ['silver'] },
    { shopType: 'jewellery', category: 'Necklace', name: 'Pendant Chain', description: 'Gold Pendant Chain', defaultUnit: 'piece', tags: ['pendant'] },
    { shopType: 'jewellery', category: 'Necklace', name: 'Ruby Necklace', description: 'Ruby Gold Necklace', defaultUnit: 'piece', tags: ['ruby'] },
    { shopType: 'jewellery', category: 'Necklace', name: 'Emerald Necklace', description: 'Emerald Set', defaultUnit: 'set', tags: ['emerald'] },
    { shopType: 'jewellery', category: 'Necklace', name: 'Fashion Necklace', description: 'Oxidised Necklace', defaultUnit: 'piece', tags: ['fashion'] },
    { shopType: 'jewellery', category: 'Necklace', name: 'Bridal Necklace', description: 'Bridal Gold Set', defaultUnit: 'set', tags: ['bridal'] },

    // EARRINGS - 15
    { shopType: 'jewellery', category: 'Earrings', name: 'Gold Earrings', description: '22K Gold Earrings', defaultUnit: 'pair', tags: ['gold'] },
    { shopType: 'jewellery', category: 'Earrings', name: 'Diamond Earrings', description: 'Diamond Stud Earrings', defaultUnit: 'pair', tags: ['diamond'] },
    { shopType: 'jewellery', category: 'Earrings', name: 'Jhumka', description: 'Gold Jhumka', defaultUnit: 'pair', tags: ['jhumka'] },
    { shopType: 'jewellery', category: 'Earrings', name: 'Chandbali', description: 'Kundan Chandbali', defaultUnit: 'pair', tags: ['chandbali'] },
    { shopType: 'jewellery', category: 'Earrings', name: 'Tops', description: 'Gold Tops', defaultUnit: 'pair', tags: ['tops'] },
    { shopType: 'jewellery', category: 'Earrings', name: 'Hoops', description: 'Silver Hoops', defaultUnit: 'pair', tags: ['hoops'] },
    { shopType: 'jewellery', category: 'Earrings', name: 'Pearl Earrings', description: 'Pearl Drop Earrings', defaultUnit: 'pair', tags: ['pearl'] },
    { shopType: 'jewellery', category: 'Earrings', name: 'Oxidised Earrings', description: 'Oxidised Jhumka', defaultUnit: 'pair', tags: ['oxidised'] },
    { shopType: 'jewellery', category: 'Earrings', name: 'Men Earring', description: 'Gold Men Earring', defaultUnit: 'piece', tags: ['men'] },
    { shopType: 'jewellery', category: 'Earrings', name: 'Kids Earrings', description: 'Gold Kids Earrings', defaultUnit: 'pair', tags: ['kids'] },
    { shopType: 'jewellery', category: 'Earrings', name: 'Ruby Earrings', description: 'Ruby Gold Earrings', defaultUnit: 'pair', tags: ['ruby'] },
    { shopType: 'jewellery', category: 'Earrings', name: 'Emerald Earrings', description: 'Emerald Earrings', defaultUnit: 'pair', tags: ['emerald'] },
    { shopType: 'jewellery', category: 'Earrings', name: 'Platinum Earrings', description: 'Platinum Earrings', defaultUnit: 'pair', tags: ['platinum'] },
    { shopType: 'jewellery', category: 'Earrings', name: 'Fashion Earrings', description: 'Designer Earrings', defaultUnit: 'pair', tags: ['fashion'] },
    { shopType: 'jewellery', category: 'Earrings', name: 'Bridal Earrings', description: 'Bridal Kundan Earrings', defaultUnit: 'pair', tags: ['bridal'] },

    // BANGLES BRACELET - 15
    { shopType: 'jewellery', category: 'Bangles', name: 'Gold Bangles', description: '22K Gold Bangles Pair', defaultUnit: 'pair', tags: ['gold', 'bangles'] },
    { shopType: 'jewellery', category: 'Bangles', name: 'Diamond Bangles', description: 'Diamond Bangles', defaultUnit: 'pair', tags: ['diamond'] },
    { shopType: 'jewellery', category: 'Bangles', name: 'Glass Bangles', description: 'Glass Bangles Set', defaultUnit: 'set', tags: ['glass'] },
    { shopType: 'jewellery', category: 'Bangles', name: 'Kada', description: 'Gold Kada', defaultUnit: 'piece', tags: ['kada'] },
    { shopType: 'jewellery', category: 'Bangles', name: 'Bracelet', description: 'Gold Bracelet', defaultUnit: 'piece', tags: ['bracelet'] },
    { shopType: 'jewellery', category: 'Bangles', name: 'Diamond Bracelet', description: 'Diamond Tennis Bracelet', defaultUnit: 'piece', tags: ['diamond'] },
    { shopType: 'jewellery', category: 'Bangles', name: 'Silver Kada', description: 'Silver Kada', defaultUnit: 'piece', tags: ['silver'] },
    { shopType: 'jewellery', category: 'Bangles', name: 'Platinum Bracelet', description: 'Platinum Bracelet', defaultUnit: 'piece', tags: ['platinum'] },
    { shopType: 'jewellery', category: 'Bangles', name: 'Kids Bangles', description: 'Gold Kids Bangles', defaultUnit: 'pair', tags: ['kids'] },
    { shopType: 'jewellery', category: 'Bangles', name: 'Men Bracelet', description: 'Gold Men Bracelet', defaultUnit: 'piece', tags: ['men'] },
    { shopType: 'jewellery', category: 'Bangles', name: 'Ruby Bracelet', description: 'Ruby Bracelet', defaultUnit: 'piece', tags: ['ruby'] },
    { shopType: 'jewellery', category: 'Bangles', name: 'Emerald Bangles', description: 'Emerald Bangles', defaultUnit: 'pair', tags: ['emerald'] },
    { shopType: 'jewellery', category: 'Bangles', name: 'Oxidised Bangles', description: 'Oxidised Bangles', defaultUnit: 'set', tags: ['oxidised'] },
    { shopType: 'jewellery', category: 'Bangles', name: 'Fashion Bracelet', description: 'Designer Bracelet', defaultUnit: 'piece', tags: ['fashion'] },
    { shopType: 'jewellery', category: 'Bangles', name: 'Bridal Chuda', description: 'Bridal Chuda Set', defaultUnit: 'set', tags: ['bridal'] },

    // OTHER - 40
    { shopType: 'jewellery', category: 'Pendant', name: 'Gold Pendant', description: 'Gold Pendant', defaultUnit: 'piece', tags: ['pendant'] },
    { shopType: 'jewellery', category: 'Pendant', name: 'Diamond Pendant', description: 'Diamond Pendant', defaultUnit: 'piece', tags: ['diamond'] },
    { shopType: 'jewellery', category: 'Pendant', name: 'Locket', description: 'Gold Locket', defaultUnit: 'piece', tags: ['locket'] },
    { shopType: 'jewellery', category: 'Pendant', name: 'Religious Pendant', description: 'God Pendant', defaultUnit: 'piece', tags: ['religious'] },
    { shopType: 'jewellery', category: 'Anklet', name: 'Gold Anklet', description: 'Gold Anklet Pair', defaultUnit: 'pair', tags: ['anklet'] },
    { shopType: 'jewellery', category: 'Anklet', name: 'Silver Anklet', description: 'Silver Payal', defaultUnit: 'pair', tags: ['silver'] },
    { shopType: 'jewellery', category: 'Nose Pin', name: 'Gold Nose Pin', description: 'Gold Nose Pin', defaultUnit: 'piece', tags: ['nose'] },
    { shopType: 'jewellery', category: 'Nose Pin', name: 'Diamond Nose Pin', description: 'Diamond Nose Pin', defaultUnit: 'piece', tags: ['diamond'] },
    { shopType: 'jewellery', category: 'Brooch', name: 'Brooch', description: 'Designer Brooch', defaultUnit: 'piece', tags: ['brooch'] },
    { shopType: 'jewellery', category: 'Watch', name: 'Gold Watch', description: 'Gold Plated Watch', defaultUnit: 'piece', tags: ['watch'] },
    { shopType: 'jewellery', category: 'Watch', name: 'Diamond Watch', description: 'Diamond Watch', defaultUnit: 'piece', tags: ['diamond'] },
    { shopType: 'jewellery', category: 'Hair Accessory', name: 'Maang Tikka', description: 'Gold Maang Tikka', defaultUnit: 'piece', tags: ['maang tikka'] },
    { shopType: 'jewellery', category: 'Hair Accessory', name: 'Hair Pin', description: 'Designer Hair Pin', defaultUnit: 'piece', tags: ['hair'] },
    { shopType: 'jewellery', category: 'Gifting', name: 'Coin', description: 'Gold Coin 1 Gram', defaultUnit: 'piece', tags: ['coin'] },
    { shopType: 'jewellery', category: 'Gifting', name: 'Biscuit', description: 'Gold Biscuit 10 Gram', defaultUnit: 'piece', tags: ['biscuit'] },
    { shopType: 'jewellery', category: 'Gifting', name: 'Gift Set', description: 'Jewellery Gift Set', defaultUnit: 'set', tags: ['gift'] },
    { shopType: 'jewellery', category: 'Repair', name: 'Cleaning', description: 'Jewellery Cleaning', defaultUnit: 'service', tags: ['service'] },
    { shopType: 'jewellery', category: 'Repair', name: 'Polishing', description: 'Gold Polishing', defaultUnit: 'service', tags: ['service'] },
    { shopType: 'jewellery', category: 'Repair', name: 'Ring Resizing', description: 'Ring Size Adjustment', defaultUnit: 'service', tags: ['service'] },
    { shopType: 'jewellery', category: 'Silver', name: 'Silver Set', description: 'Silver Jewellery Set', defaultUnit: 'set', tags: ['silver'] },
    { shopType: 'jewellery', category: 'Silver', name: 'Silver Payal', description: 'Silver Anklet', defaultUnit: 'pair', tags: ['silver'] },
    { shopType: 'jewellery', category: 'Silver', name: 'Silver Chain', description: 'Silver Chain', defaultUnit: 'piece', tags: ['silver'] },
    { shopType: 'jewellery', category: 'Platinum', name: 'Platinum Band', description: 'Platinum Ring', defaultUnit: 'piece', tags: ['platinum'] },
    { shopType: 'jewellery', category: 'Platinum', name: 'Platinum Chain', description: 'Platinum Chain', defaultUnit: 'piece', tags: ['platinum'] },
    { shopType: 'jewellery', category: 'Kids', name: 'Kids Set', description: 'Kids Gold Set', defaultUnit: 'set', tags: ['kids'] },
    { shopType: 'jewellery', category: 'Kids', name: 'Baby Bracelet', description: 'Baby Gold Bracelet', defaultUnit: 'piece', tags: ['baby'] },
    { shopType: 'jewellery', category: 'Men', name: 'Men Chain', description: 'Gold Men Chain', defaultUnit: 'piece', tags: ['men'] },
    { shopType: 'jewellery', category: 'Men', name: 'Men Bracelet', description: 'Men Gold Bracelet', defaultUnit: 'piece', tags: ['men'] },
    { shopType: 'jewellery', category: 'Bridal', name: 'Bridal Set', description: 'Complete Bridal Set', defaultUnit: 'set', tags: ['bridal'] },
    { shopType: 'jewellery', category: 'Bridal', name: 'Bridal Kada', description: 'Bridal Gold Kada', defaultUnit: 'pair', tags: ['bridal'] },
    { shopType: 'jewellery', category: 'Antique', name: 'Antique Set', description: 'Antique Jewellery Set', defaultUnit: 'set', tags: ['antique'] },
    { shopType: 'jewellery', category: 'Kundan', name: 'Kundan Set', description: 'Kundan Jewellery Set', defaultUnit: 'set', tags: ['kundan'] },
    { shopType: 'jewellery', category: 'Polki', name: 'Polki Set', description: 'Polki Jewellery Set', defaultUnit: 'set', tags: ['polki'] },
    { shopType: 'jewellery', category: 'Meenakari', name: 'Meenakari Set', description: 'Meenakari Set', defaultUnit: 'set', tags: ['meenakari'] },
    { shopType: 'jewellery', category: 'Temple', name: 'Temple Set', description: 'Temple Jewellery Set', defaultUnit: 'set', tags: ['temple'] },
    { shopType: 'jewellery', category: 'Oxidised', name: 'Oxidised Set', description: 'Oxidised Jewellery Set', defaultUnit: 'set', tags: ['oxidised'] },
    { shopType: 'jewellery', category: 'Fashion', name: 'Fashion Set', description: 'Designer Fashion Set', defaultUnit: 'set', tags: ['fashion'] },
    { shopType: 'jewellery', category: 'Wedding', name: 'Wedding Ring', description: 'Wedding Band', defaultUnit: 'pair', tags: ['wedding'] },
    { shopType: 'jewellery', category: 'Wedding', name: 'Wedding Necklace', description: 'Wedding Necklace', defaultUnit: 'piece', tags: ['wedding'] },
    { shopType: 'jewellery', category: 'Festival', name: 'Festival Set', description: 'Festival Jewellery Set', defaultUnit: 'set', tags: ['festival'] }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        await TemplateProduct.deleteMany({ shopType: 'jewellery' });
        await TemplateProduct.insertMany(jewelleryProducts);
        console.log(`✅ ${jewelleryProducts.length} Jewellery Products Added!`);
        process.exit();
    } catch(err) { console.error(err); process.exit(1); }
}
seed();
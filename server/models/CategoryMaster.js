const mongoose = require('mongoose');

const templateProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, default: 'General' }, // Aata, Dal
    price: { type: Number, default: 0 },
    stock: { type: Number, default: 100 },
    image: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

const categoryMasterSchema = new mongoose.Schema({
    category: { type: String, required: true, unique: true }, // kirana, cloth, medical
    products: [templateProductSchema]
}, { timestamps: true });

module.exports = mongoose.model('CategoryMaster', categoryMasterSchema);
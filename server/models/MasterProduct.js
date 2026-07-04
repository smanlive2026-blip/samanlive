const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    name: String,
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    brand: String,
    description: String,
    image: String,
    photos: [String],
    createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('MasterProduct', schema);
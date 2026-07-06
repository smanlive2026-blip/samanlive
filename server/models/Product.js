const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    shopName: { type: String },
    name: { type: String, required: true },
    category: { type: String, default: 'General' },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    image: { type: String },
    description: { type: String },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager' }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
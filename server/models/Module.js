const mongoose = require('mongoose');

// Area ka sub-schema - Module kis area me active hai
const areaSchema = new mongoose.Schema({
    areaId: { type: String, required: true }, // "area-1", "area-2"
    status: { type: Boolean, default: true } // Active/Inactive
}, { _id: false });

// Category ke andar Area ka sub-schema
const categoryAreaSchema = new mongoose.Schema({
    areaId: { type: String, required: true }, // "area-1", "area-2"
    status: { type: Boolean, default: true } // Category is area me ON/OFF
}, { _id: false });

// Category ka sub-schema - Har module ke andar categories
const categorySchema = new mongoose.Schema({
    id: { type: String, required: true }, // "grocery-123456"
    name: { type: String, required: true }, // "Grocery Store"
    icon: { type: String, default: '📦' }, // Emoji
    color: { type: String, default: '#10b981' }, // Color
    group: { type: String, default: 'General' }, // Group name
    status: { type: Boolean, default: true }, // Category ON/OFF
    desc: { type: String, default: '' }, // Description
    areas: [categoryAreaSchema] // Kis area me active hai
}, { _id: false });

// Main Module Schema
const moduleSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // "market"
    name: { type: String, required: true }, // "MARKET"
    icon: { type: String, required: true }, // "🛒"
    color: { type: String, required: true }, // "#6366f1"
    link: { type: String, required: true }, // "/modules/market"
    desc: { type: String, default: '' }, // Description
    banner: { type: String, default: '' }, // Banner image URL
    status: { type: Boolean, default: true }, // Module ON/OFF
    priority: { type: Number, default: 1 }, // Sorting
    areas: [areaSchema], // Module kis area me active hai
    categories: [categorySchema], // Module ki categories
    mongoId: { type: String } // JSON se sync ke liye
}, {
    timestamps: true // createdAt, updatedAt auto add hoga
});

// Index for faster queries
moduleSchema.index({ id: 1 });
moduleSchema.index({ status: 1 });
moduleSchema.index({ priority: 1 });

module.exports = mongoose.models.Module || mongoose.model('Module', moduleSchema);
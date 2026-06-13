const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    icon: { type: String, default: '📦' },
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
    status: { type: String, enum: ['active', 'hidden'], default: 'active' },
    priority: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
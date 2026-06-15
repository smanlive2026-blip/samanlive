const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    icon: { type: String },
    priority: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Module', ModuleSchema);
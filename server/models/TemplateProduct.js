const mongoose = require('mongoose');

const templateProductSchema = new mongoose.Schema({
    shopType: { 
        type: String, 
        required: true,
        index: true // 'kirana', 'medical', 'electronics' etc
    },
    category: { 
        type: String, 
        default: 'General' 
    },
    name: { 
        type: String, 
        required: true,
        trim: true
    },
    description: { 
        type: String, 
        default: '' 
    },
    image: { 
        type: String, 
        default: '/assets/img/no-image.png' 
    },
    defaultUnit: { 
        type: String, 
        default: 'piece' // kg, ltr, piece, packet
    },
    tags: [{ type: String }], // search ke liye
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

// search fast ho isliye
templateProductSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('TemplateProduct', templateProductSchema);
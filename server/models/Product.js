const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    shopId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Shop',
        required: true,
        index: true
    },
    templateId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'TemplateProduct',
        default: null // agar manual add kiya to null rahega
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
    category: { 
        type: String, 
        default: 'General' 
    },
    price: { 
        type: Number, 
        required: true,
        default: 0 // shop owner set karega
    },
    mrp: { 
        type: Number, 
        default: 0 
    },
    stock: { 
        type: Number, 
        default: 0 
    },
    unit: { 
        type: String, 
        default: 'piece' 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

productSchema.index({ shopId: 1, name: 1 });

module.exports = mongoose.model('Product', productSchema);
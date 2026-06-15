const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
    id: { 
        type: String, 
        required: true, 
        unique: true,
        index: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    icon: { 
        type: String, 
        required: true 
    },
    color: { 
        type: String, 
        default: '#6366f1' 
    },
    link: { 
        type: String, 
        required: true 
    },
    desc: { 
        type: String, 
        default: '' 
    },
    priority: { 
        type: Number, 
        default: 0 
    },
    status: { 
        type: String, 
        enum: ['active', 'hidden'], 
        default: 'active' 
    },
    banner: { 
        type: String, 
        default: '' 
    },
    areas: [{
        name: { type: String },
        type: { type: String, enum: ['circle', 'polygon'] },
        coordinates: [{ 
            lat: Number, 
            lng: Number 
        }],
        center: { 
            lat: Number, 
            lng: Number 
        },
        radius: { type: Number },
        status: { type: Boolean, default: true }
    }],
    categoryDetails: [{
        id: { type: String },
        name: { type: String },
        icon: { type: String },
        color: { type: String },
        group: { type: String, default: 'General' }
    }]
}, { 
    timestamps: true 
});

// Index for faster queries
moduleSchema.index({ priority: 1 });
moduleSchema.index({ status: 1 });

module.exports = mongoose.model('Module', moduleSchema);
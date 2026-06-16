const mongoose = require('mongoose');

const areaSchema = new mongoose.Schema({
    areaCode: { 
        type: String, 
        unique: true, 
        required: true,
        uppercase: true // Auto uppercase: suratgu → SURATGU
    },
    areaName: { 
        type: String, 
        required: true 
    },
    city: { 
        type: String, 
        required: true 
    },
    state: { 
        type: String, 
        required: true 
    },
    centerLat: { 
        type: Number, 
        required: true 
    },
    centerLng: { 
        type: Number, 
        required: true 
    },
    radius: { 
        type: Number, 
        required: true,
        default: 50,
        min: [1, 'Radius must be at least 1 km'],
        max: [500, 'Radius cannot exceed 500 km']
    },
    status: { 
        type: Boolean, 
        default: true 
    }
}, { 
    timestamps: true 
});

// Indexes for fast search
areaSchema.index({ areaCode: 1 });
areaSchema.index({ city: 1, state: 1 });
areaSchema.index({ status: 1 });
areaSchema.index({ centerLat: 1, centerLng: 1 });

module.exports = mongoose.model('Area', areaSchema);
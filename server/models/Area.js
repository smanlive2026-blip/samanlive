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
        default: 50 // 50km fixed
    },
    status: { 
        type: Boolean, 
        default: true 
    }
}, { 
    timestamps: true 
});

// Index for fast search
areaSchema.index({ areaCode: 1 });
areaSchema.index({ city: 1, state: 1 });

module.exports = mongoose.model('Area', areaSchema);
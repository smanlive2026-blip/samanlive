const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: {
        type: String,
        enum: ['ad', 'video', 'campaign', 'banner'],
        default: 'ad'
    },
    area: { type: String, default: 'all' },
    status: {
        type: String,
        enum: ['active', 'hidden', 'inactive'],
        default: 'active'
    },
    // Image/Video URLs
    image: { type: String, default: '' },
    video: { type: String, default: '' },
    url: { type: String, default: '' }, // Video URL ke liye

    // Text content
    description: { type: String, default: '' },

    // Button details - Ads/Campaigns ke liye
    buttonText: { type: String, default: '' },
    buttonLink: { type: String, default: '' },

    // Styling
    color: { type: String, default: '#3b82f6' },
    priority: { type: Number, default: 0 },

    // Extra
    link: { type: String, default: '' }, // Legacy field, optional
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Content', contentSchema);
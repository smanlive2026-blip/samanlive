// server/models/Media.js
const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
    shopId: { type: String, required: true, index: true }, // ✅ OBJECTID HATA DIYA
    template: { type: String, required: true }, // 'kirana', 'achar', 'medical'
    type: { type: String, required: true }, // 'banner', 'logo', 'product', 'offer'
    refId: { type: String, default: null }, 
    url: { type: String, required: true }, 
    localBackup: { type: String, default: null },
    createdAt: { type: Date, default: Date.now }
});

// RULE: 1 shop ka 1 hi banner/logo hoga
MediaSchema.index({ shopId: 1, type: 1 }, { unique: true, partialFilterExpression: { refId: null } });
// RULE: 1 product ke multiple photo ho sakte
MediaSchema.index({ shopId: 1, refId: 1, type: 1 });

module.exports = mongoose.model('Media', MediaSchema);
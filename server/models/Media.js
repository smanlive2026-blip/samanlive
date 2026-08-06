// server/models/Media.js
// LOCATION: Sabhi shop ki photo ka single source of truth
const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true }, // kis shop ki hai
    template: { type: String, required: true }, // 'kirana', 'achar', 'medical'
    type: { type: String, required: true }, // 'banner', 'logo', 'product', 'offer'
    refId: { type: String, default: null }, // product ka _id. banner/logo ke liye null
    url: { type: String, required: true }, // Cloudinary URL
    localBackup: { type: String, default: null }, // base64 backup
    createdAt: { type: Date, default: Date.now }
});

// RULE: 1 shop ka 1 hi banner/logo hoga
MediaSchema.index({ shopId: 1, type: 1 }, { unique: true, partialFilterExpression: { refId: null } });
// RULE: 1 product ke multiple photo ho sakte
MediaSchema.index({ shopId: 1, refId: 1, type: 1 });

module.exports = mongoose.model('Media', MediaSchema);
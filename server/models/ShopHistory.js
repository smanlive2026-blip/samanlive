const mongoose = require('mongoose');

const shopHistorySchema = new mongoose.Schema({
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager', required: true },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    shopName: { type: String },
    action: { type: String, enum: ['create', 'edit', 'delete'], required: true },
    oldData: { type: Object, default: {} },
    newData: { type: Object, default: {} },
    area: { type: String },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('ShopHistory', shopHistorySchema);
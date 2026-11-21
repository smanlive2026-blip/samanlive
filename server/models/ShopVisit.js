// LOCATION: server/models/ShopVisit.js - NAYI FILE - VISITOR TRACKING ON - FULL CODE
// KAAM: Customer ne shop kholi toh 1 Visit yahan save hoga.
// RULE: Ek hi banda baar-baar refresh kare toh baar-baar Visitor nahi ginega - Wo kaam Customer-View wala FILE 3 karega, jo ek tab me 1 hi baar bhejega.
// FLOW: Customer-View -> POST /api/common/analytics/:shopId/track -> ShopVisit.create() -> Visitor page pe Total Visitors badhega
// INDEX: shopId + createdAt pe index hai, taaki Today / Week / Month wala hisaab tez nikle, poora table scan na ho.
const mongoose = require('mongoose');

const shopVisitSchema = new mongoose.Schema({
  shopId: { type: String, required: true, index: true },
  shopType: { type: String, default: '' },
  device: { type: String, default: 'Unknown' },
  page: { type: String, default: '/shop' },
  source: { type: String, default: 'Direct' },
  createdAt: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.models.ShopVisit || mongoose.model('ShopVisit', shopVisitSchema);
// LOCATION: server/routes/common/analytics.routes.js - V4 - REAL + DOUBLE-ANALYTICS FIX + TRACKING ON/OFF - FULL CODE
// FIX V3: Is file ke andar /analytics/:shopId NAHI likhna hai - Sirf /:shopId likhna hai.
// Kyunki server/routes/common/index.js pehle se hi isko /analytics pe mount karta hai + server.js usko /api/common pe mount karta hai.
// Pehle: /api/common + /analytics + /analytics/:shopId = /api/common/analytics/analytics/:shopId - Frontend wahan kabhi jaata hi nahi tha, isliye sab 0 dikhta tha.
// Ab: /api/common + /analytics + /:shopId = /api/common/analytics/:shopId - Frontend wahi maangta hai, ab milega.
// FIX V4 TRACKING ON/OFF: Analytics wale page pe jo Tracking ON/OFF button hai, wo isi file se chalega.
//   GET /api/common/analytics/:shopId/tracking-setting -> { success: true, enabled: true/false }
//   POST /api/common/analytics/:shopId/tracking-setting { enabled: true/false } -> DB me save hoga
//   OFF hai toh POST /:shopId/track aayega bhi toh Visit save NAHI hoga - Isliye Visitor badhega hi nahi. ON karte hi fir se save hone lagega.
//   Setting ke liye alag file nahi chahiye - ShopTrackingSetting isi file ke andar bana hai, taaki 1 hi file paste karni pade.
// RULE: Koi nakli number NAHI - Sab Order + ShopVisit se aayega.
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// TRACKING SETTING - V4 - Har dukaan ki alag setting - Default ON hai, kyunki Tracking pehle se chal rahi hai
// shopId unique hai - Ek dukaan ki 1 hi setting hogi, dobara ON/OFF karne pe wahi update hogi, nayi row nahi banegi
const trackingSettingSchema = new mongoose.Schema({
  shopId: { type: String, required: true, unique: true, index: true },
  enabled: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now }
});
const ShopTrackingSetting = mongoose.models.ShopTrackingSetting || mongoose.model('ShopTrackingSetting', trackingSettingSchema);

// Tracking ON hai ya OFF - Koi setting nahi mili toh ON maanenge, kyunki pehle se Tracking chal rahi hai
async function isTrackingOn(shopId){
  try{
    var s = await ShopTrackingSetting.findOne({ shopId: shopId }).lean();
    if(!s) return true;
    return s.enabled !== false;
  }catch(e){ return true; }
}

function orderAmount(o){
  var v = Number(o.totalAmount !== undefined && o.totalAmount !== null ? o.totalAmount : o.total);
  if(!v || isNaN(v)) return 0;
  return v;
}
function periodStart(period){
  var d = new Date();
  if(period === 'today'){ d.setHours(0, 0, 0, 0); return d; }
  if(period === 'week'){ d.setDate(d.getDate() - 6); d.setHours(0, 0, 0, 0); return d; }
  if(period === 'year'){ d.setDate(d.getDate() - 364); d.setHours(0, 0, 0, 0); return d; }
  d.setDate(d.getDate() - 29); d.setHours(0, 0, 0, 0); return d;
}
function prevRange(period){
  var end = periodStart(period);
  var start = new Date(end);
  if(period === 'today'){ start.setDate(start.getDate() - 1); return { start: start, end: end }; }
  if(period === 'week'){ start.setDate(start.getDate() - 7); return { start: start, end: end }; }
  if(period === 'year'){ start.setDate(start.getDate() - 365); return { start: start, end: end }; }
  start.setDate(start.getDate() - 30); return { start: start, end: end };
}
function growthPct(nowVal, prevVal){
  if(!prevVal || prevVal === 0) return 0;
  return Math.round(((nowVal - prevVal) / prevVal) * 100);
}

// 0. TRACKING SETTING - GET /api/common/analytics/:shopId/tracking-setting - Button ko pehle ye puchna hai ki ON hai ya OFF
router.get('/:shopId/tracking-setting', async (req, res) => {
  try{
    var shopId = req.params.shopId;
    var enabled = await isTrackingOn(shopId);
    return res.json({ success: true, enabled: enabled });
  }catch(e){ return res.json({ success: true, enabled: true }); }
});

// 0B. TRACKING SETTING SAVE - POST /api/common/analytics/:shopId/tracking-setting { enabled: true/false } - Button dabate hi ye chalega
router.post('/:shopId/tracking-setting', async (req, res) => {
  try{
    var shopId = req.params.shopId;
    if(!shopId) return res.json({ success: false, message: 'shopId chahiye' });
    var enabled = req.body && typeof req.body.enabled !== 'undefined' ? !!req.body.enabled : true;
    await ShopTrackingSetting.findOneAndUpdate(
      { shopId: shopId },
      { $set: { enabled: enabled, updatedAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.json({ success: true, enabled: enabled });
  }catch(e){ return res.status(500).json({ success: false, message: e.message }); }
});

// 1. MAIN - GET /api/common/analytics/:shopId?period=today/week/month/year
router.get('/:shopId', async (req, res) => {
  try{
    var shopId = req.params.shopId;
    var period = req.query.period || 'month';
    var Order = require('../../models/Order');
    var start = periodStart(period);
    var prev = prevRange(period);
    var orders = await Order.find({
      $or: [{ supplierId: shopId }, { shopId: shopId }, { supplierShopId: shopId }],
      createdAt: { $gte: start },
      orderStatus: { $ne: 'cancelled' }
    }).lean();
    var revenue = 0, delivered = 0, pending = 0;
    var byDay = {}, byHour = {}, byPayment = {}, byProduct = {};
    for(var i = 0; i < orders.length; i++){
      var o = orders[i];
      var amt = orderAmount(o);
      revenue += amt;
      if(o.orderStatus === 'delivered') delivered++; else pending++;
      var d = o.createdAt ? new Date(o.createdAt) : new Date();
      var dayKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      if(!byDay[dayKey]) byDay[dayKey] = { date: dayKey, orders: 0, revenue: 0 };
      byDay[dayKey].orders++; byDay[dayKey].revenue += amt;
      var h = d.getHours(); byHour[h] = (byHour[h] || 0) + 1;
      var pay = (o.paymentMethod || o.payment || 'cod').toString().toLowerCase();
      if(!byPayment[pay]) byPayment[pay] = { method: pay, orders: 0, revenue: 0 };
      byPayment[pay].orders++; byPayment[pay].revenue += amt;
      var items = o.items || [];
      for(var j = 0; j < items.length; j++){
        var it = items[j] || {};
        var name = (it.name || it.productName || 'Product').toString();
        var qty = Number(it.qty || it.quantity || 1) || 1;
        var price = Number(it.price || 0) || 0;
        if(!byProduct[name]) byProduct[name] = { name: name, sales: 0, revenue: 0 };
        byProduct[name].sales += qty; byProduct[name].revenue += price * qty;
      }
    }
    var prevOrders = await Order.find({
      $or: [{ supplierId: shopId }, { shopId: shopId }, { supplierShopId: shopId }],
      createdAt: { $gte: prev.start, $lt: prev.end },
      orderStatus: { $ne: 'cancelled' }
    }).lean();
    var prevRevenue = 0;
    for(var k = 0; k < prevOrders.length; k++){ prevRevenue += orderAmount(prevOrders[k]); }
    var dailySales = Object.keys(byDay).sort().map(function(key){ return byDay[key]; });
    var topProducts = Object.keys(byProduct).map(function(key){ return byProduct[key]; });
    topProducts.sort(function(a, b){ return b.sales - a.sales; });
    var paymentMethods = Object.keys(byPayment).map(function(key){ return byPayment[key]; });
    paymentMethods.sort(function(a, b){ return b.orders - a.orders; });
    var hourly = [];
    for(var hh = 0; hh < 24; hh++){ hourly.push({ hour: hh, orders: byHour[hh] || 0 }); }
    var totalOrders = orders.length;
    var aov = totalOrders > 0 ? Math.round(revenue / totalOrders) : 0;
    var visitCount = 0;
    try{ var ShopVisit = require('../../models/ShopVisit'); visitCount = await ShopVisit.countDocuments({ shopId: shopId, createdAt: { $gte: start } }); }catch(e){ visitCount = 0; }
    var conversion = visitCount > 0 ? Math.round((totalOrders / visitCount) * 1000) / 10 : 0;
    var trackingOn = await isTrackingOn(shopId);
    return res.json({ success: true, analytics: {
      visitors: visitCount, visitorsGrowth: 0,
      orders: totalOrders, ordersGrowth: growthPct(totalOrders, prevOrders.length),
      revenue: revenue, revenueGrowth: growthPct(revenue, prevRevenue),
      conversion: conversion, aov: aov, delivered: delivered, pending: pending, period: period,
      trackingEnabled: trackingOn,
      dailySales: dailySales, revenueByDay: dailySales, salesByDay: dailySales,
      topProducts: topProducts.slice(0, 10), paymentMethods: paymentMethods, hourly: hourly, salesByHour: hourly, trafficSources: [], heatmap: []
    }});
  }catch(e){ return res.status(500).json({ success: false, message: e.message }); }
});

// 2. SALES REPORT - GET /api/common/analytics/:shopId/sales-report?period=month&format=csv
router.get('/:shopId/sales-report', async (req, res) => {
  try{
    var shopId = req.params.shopId;
    var period = req.query.period || 'month';
    var Order = require('../../models/Order');
    var start = periodStart(period);
    var orders = await Order.find({
      $or: [{ supplierId: shopId }, { shopId: shopId }, { supplierShopId: shopId }],
      createdAt: { $gte: start }, orderStatus: { $ne: 'cancelled' }
    }).lean();
    var byDay = {}, byProduct = {}, byPayment = {}, totalRevenue = 0;
    for(var i = 0; i < orders.length; i++){
      var o = orders[i]; var amt = orderAmount(o); totalRevenue += amt;
      var d = o.createdAt ? new Date(o.createdAt) : new Date();
      var dayKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      if(!byDay[dayKey]) byDay[dayKey] = { date: dayKey, orders: 0, revenue: 0 };
      byDay[dayKey].orders++; byDay[dayKey].revenue += amt;
      var pay = (o.paymentMethod || o.payment || 'cod').toString().toLowerCase();
      byPayment[pay] = (byPayment[pay] || 0) + 1;
      var items = o.items || [];
      for(var j = 0; j < items.length; j++){
        var it = items[j] || {};
        var name = (it.name || it.productName || 'Product').toString();
        var qty = Number(it.qty || it.quantity || 1) || 1;
        if(!byProduct[name]) byProduct[name] = { name: name, sales: 0, revenue: 0 };
        byProduct[name].sales += qty; byProduct[name].revenue += (Number(it.price || 0) || 0) * qty;
      }
    }
    var report = Object.keys(byDay).sort().map(function(key){ return byDay[key]; });
    var topProducts = Object.keys(byProduct).map(function(key){ return byProduct[key]; });
    topProducts.sort(function(a, b){ return b.sales - a.sales; });
    if(req.query.format === 'csv'){
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=sales-report-' + shopId + '.csv');
      var csv = 'Date,Orders,Revenue\n';
      for(var c = 0; c < report.length; c++){ csv += report[c].date + ',' + report[c].orders + ',' + report[c].revenue + '\n'; }
      return res.send(csv);
    }
    return res.json({ success: true, report: report, totalOrders: orders.length, totalRevenue: totalRevenue, aov: orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0, topProducts: topProducts.slice(0, 10), topProduct: topProducts.length > 0 ? topProducts[0].name : '', paymentMethods: byPayment, period: period });
  }catch(e){ return res.status(500).json({ success: false, message: e.message }); }
});

// 3. VISITORS - GET /api/common/analytics/:shopId/visitors?period=today/week/month/year - AB ASLI HAI
router.get('/:shopId/visitors', async (req, res) => {
  try{
    var shopId = req.params.shopId;
    var period = req.query.period || 'today';
    var ShopVisit = require('../../models/ShopVisit');
    var start = periodStart(period);
    var visits = await ShopVisit.find({ shopId: shopId, createdAt: { $gte: start } }).sort({ createdAt: -1 }).limit(200).lean();
    var bySource = {}, byDevice = {};
    visits.forEach(function(v){ var s = v.source || 'Direct'; var d = v.device || 'Unknown'; bySource[s] = (bySource[s] || 0) + 1; byDevice[d] = (byDevice[d] || 0) + 1; });
    var total = visits.length;
    var traffic = Object.keys(bySource).map(function(k){ return { source: k, count: bySource[k], percent: total > 0 ? Math.round((bySource[k] / total) * 100) : 0 }; });
    var devices = Object.keys(byDevice).map(function(k){ return { device: k, count: byDevice[k], percent: total > 0 ? Math.round((byDevice[k] / total) * 100) : 0 }; });
    var trackingOn = await isTrackingOn(shopId);
    return res.json({ success: true, visitors: visits, total: total, liveVisitors: visits.slice(0, 10), trafficSources: traffic, devices: devices, trackingEnabled: trackingOn });
  }catch(e){ return res.json({ success: true, visitors: [], total: 0 }); }
});

// 4. HEATMAP - Click ka data nahi hai, isliye khaali - Nakli nahi
router.get('/:shopId/heatmap', async (req, res) => {
  return res.json({ success: true, heatmap: [], clicks: [], views: [] });
});

// 5. SALES CHART - GET /api/common/analytics/:shopId/sales-chart?period=month
router.get('/:shopId/sales-chart', async (req, res) => {
  try{
    var shopId = req.params.shopId;
    var period = req.query.period || 'month';
    var Order = require('../../models/Order');
    var start = periodStart(period);
    var orders = await Order.find({ $or: [{ supplierId: shopId }, { shopId: shopId }, { supplierShopId: shopId }], createdAt: { $gte: start }, orderStatus: { $ne: 'cancelled' } }).lean();
    var byDay = {};
    for(var i = 0; i < orders.length; i++){
      var o = orders[i];
      var d = o.createdAt ? new Date(o.createdAt) : new Date();
      var dayKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      if(!byDay[dayKey]) byDay[dayKey] = { label: dayKey, revenue: 0, orders: 0 };
      byDay[dayKey].revenue += orderAmount(o); byDay[dayKey].orders++;
    }
    var keys = Object.keys(byDay).sort();
    return res.json({ success: true, sales: { labels: keys, revenue: keys.map(function(k){ return byDay[k].revenue; }), orders: keys.map(function(k){ return byDay[k].orders; }), visitors: keys.map(function(){ return 0; }), aov: keys.map(function(k){ return byDay[k].orders > 0 ? Math.round(byDay[k].revenue / byDay[k].orders) : 0; }) } });
  }catch(e){ return res.status(500).json({ success: false, message: e.message }); }
});

// 6. TRACK - POST /api/common/analytics/:shopId/track - AB ASLI ME SAVE HOGA - PAR OFF HAI TOH SAVE NAHI HOGA
router.post('/:shopId/track', async (req, res) => {
  try{
    var shopId = req.params.shopId;
    if(!shopId) return res.json({ success: false });
    if(req.body && req.body.event && req.body.event !== 'visit' && req.body.event !== 'page_view') return res.json({ success: true });
    // V4 - Tracking OFF hai toh Visit save hi nahi karenge - Customer-View se aayega bhi toh yahin ruk jayega
    var trackingOn = await isTrackingOn(shopId);
    if(!trackingOn) return res.json({ success: true, tracked: false, reason: 'tracking-off' });
    var ShopVisit = require('../../models/ShopVisit');
    await ShopVisit.create({ shopId: shopId, shopType: req.body.shopType || '', device: req.body.device || 'Unknown', page: req.body.page || req.body.url || '/shop', source: req.body.source || 'Direct' });
    return res.json({ success: true, tracked: true });
  }catch(e){ return res.json({ success: true }); }
});
router.post('/:shopId/track-click', async (req, res) => {
  return res.json({ success: true });
});

module.exports = router;
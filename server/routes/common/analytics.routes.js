// LOCATION: server/routes/common/analytics.routes.js - V2 - REAL ANALYTICS - FULL CODE
// RULE: Koi nakli number NAHI hoga - 1250 Visitors / 89 Orders / 24500 Revenue wala purana dhokha hata diya.
// Ab sab kuch Order model se aayega - Shop ki asli sale se. Jo data hai hi nahi (jaise Visitors), usko 0 dikhayenge, nakli nahi banayenge.
// FLOW: Frontend -> GET /api/common/analytics/:shopId?period=today/week/month/year -> Order.find({ supplierId / shopId }) -> Hisab -> Bhejo
// MOUNT: server/routes/common/index.js se mount hota hai -> /api/common/analytics/...
// PERIOD: today = aaj, week = pichhle 7 din, month = pichhle 30 din, year = pichhle 365 din
const express = require('express');
const router = express.Router();

// Order ka paisa - totalAmount hai toh wahi, nahi toh total - Dono me se jo mile
function orderAmount(o){
  var v = Number(o.totalAmount !== undefined && o.totalAmount !== null ? o.totalAmount : o.total);
  if(!v || isNaN(v)) return 0;
  return v;
}

// Period ka start date - today / week / month / year
function periodStart(period){
  var now = new Date();
  var d = new Date(now);
  if(period === 'today'){ d.setHours(0, 0, 0, 0); return d; }
  if(period === 'week'){ d.setDate(d.getDate() - 6); d.setHours(0, 0, 0, 0); return d; }
  if(period === 'year'){ d.setDate(d.getDate() - 364); d.setHours(0, 0, 0, 0); return d; }
  // month = default - pichhle 30 din
  d.setDate(d.getDate() - 29); d.setHours(0, 0, 0, 0); return d;
}

// Pichhle period ka start - Growth nikalne ke liye - Is period se pehle wala utna hi lamba period
function prevPeriodRange(period){
  var now = new Date();
  var end = periodStart(period);
  var start = new Date(end);
  if(period === 'today'){ start.setDate(start.getDate() - 1); return { start: start, end: end }; }
  if(period === 'week'){ start.setDate(start.getDate() - 7); return { start: start, end: end }; }
  if(period === 'year'){ start.setDate(start.getDate() - 365); return { start: start, end: end }; }
  start.setDate(start.getDate() - 30); return { start: start, end: end };
}

// Growth % - Pehle wale period se kitna badha / gira - Pehle 0 tha toh 0 hi dikhayenge, nakli 12% nahi
function growthPct(nowVal, prevVal){
  if(!prevVal || prevVal === 0) return 0;
  return Math.round(((nowVal - prevVal) / prevVal) * 100);
}

// 1. MAIN ANALYTICS - Dashboard / analytics.html isi se chalega
// GET /api/common/analytics/:shopId?period=today/week/month/year
router.get('/analytics/:shopId', async (req, res) => {
  try{
    var shopId = req.params.shopId;
    var period = req.query.period || 'month';
    if(!shopId) return res.status(400).json({ success: false, message: 'shopId chahiye' });

    var Order = require('../../models/Order');
    var start = periodStart(period);
    var prev = prevPeriodRange(period);

    // Shop ki Order - supplierId / shopId / supplierShopId - Teenon me se kisi me bhi ho toh uski hai
    // Cancelled wali ko nahi ginenge - Warna sale badh ke dikhegi
    var query = {
      $or: [{ supplierId: shopId }, { shopId: shopId }, { supplierShopId: shopId }],
      createdAt: { $gte: start },
      orderStatus: { $ne: 'cancelled' }
    };
    var orders = await Order.find(query).lean();

    var revenue = 0;
    var delivered = 0;
    var pending = 0;
    var byDay = {}; // '2026-11-21' -> { orders, revenue }
    var byHour = {}; // 0-23 -> orders
    var byPayment = {}; // cod / upi / online -> { orders, revenue }
    var byProduct = {}; // naam -> { name, sales (qty), revenue }

    for(var i = 0; i < orders.length; i++){
      var o = orders[i];
      var amt = orderAmount(o);
      revenue += amt;
      if(o.orderStatus === 'delivered') delivered++;
      else pending++;

      // Din ka hisab - Chart ke liye
      var d = o.createdAt ? new Date(o.createdAt) : new Date();
      var dayKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      if(!byDay[dayKey]) byDay[dayKey] = { date: dayKey, orders: 0, revenue: 0 };
      byDay[dayKey].orders++;
      byDay[dayKey].revenue += amt;

      // Ghante ka hisab - Kab sabse zyada order aata hai
      var h = d.getHours();
      byHour[h] = (byHour[h] || 0) + 1;

      // Payment ka hisab
      var pay = (o.paymentMethod || o.payment || 'cod').toString().toLowerCase();
      if(!byPayment[pay]) byPayment[pay] = { method: pay, orders: 0, revenue: 0 };
      byPayment[pay].orders++;
      byPayment[pay].revenue += amt;

      // Top Product ka hisab - items ke andar se
      var items = o.items || [];
      for(var j = 0; j < items.length; j++){
        var it = items[j] || {};
        var name = (it.name || it.productName || 'Product').toString();
        var qty = Number(it.qty || it.quantity || 1) || 1;
        var price = Number(it.price || 0) || 0;
        if(!byProduct[name]) byProduct[name] = { name: name, sales: 0, revenue: 0 };
        byProduct[name].sales += qty;
        byProduct[name].revenue += price * qty;
      }
    }

    // Pichhle period ka hisab - Growth ke liye
    var prevQuery = {
      $or: [{ supplierId: shopId }, { shopId: shopId }, { supplierShopId: shopId }],
      createdAt: { $gte: prev.start, $lt: prev.end },
      orderStatus: { $ne: 'cancelled' }
    };
    var prevOrders = await Order.find(prevQuery).lean();
    var prevRevenue = 0;
    for(var k = 0; k < prevOrders.length; k++){ prevRevenue += orderAmount(prevOrders[k]); }

    // Din wali list - Date ke hisab se chhoti se badi
    var dailySales = Object.keys(byDay).sort().map(function(key){ return byDay[key]; });

    // Top Product - Sabse zyada bika pehle
    var topProducts = Object.keys(byProduct).map(function(key){ return byProduct[key]; });
    topProducts.sort(function(a, b){ return b.sales - a.sales; });

    // Payment wali list
    var paymentMethods = Object.keys(byPayment).map(function(key){ return byPayment[key]; });
    paymentMethods.sort(function(a, b){ return b.orders - a.orders; });

    // Ghante wali list - 0 se 23 tak
    var hourly = [];
    for(var hh = 0; hh < 24; hh++){ hourly.push({ hour: hh, orders: byHour[hh] || 0 }); }

    var totalOrders = orders.length;
    var aov = totalOrders > 0 ? Math.round(revenue / totalOrders) : 0;

    return res.json({
      success: true,
      analytics: {
        // Visitors ka koi Model hai hi nahi, isliye 0 dikhayenge - Nakli 1250 nahi banayenge
        visitors: 0,
        visitorsGrowth: 0,
        orders: totalOrders,
        ordersGrowth: growthPct(totalOrders, prevOrders.length),
        revenue: revenue,
        revenueGrowth: growthPct(revenue, prevRevenue),
        // Conversion bina Visitors ke nikal hi nahi sakta, isliye 0 - Nakli 7.1% nahi
        conversion: 0,
        aov: aov,
        delivered: delivered,
        pending: pending,
        period: period,
        dailySales: dailySales,
        revenueByDay: dailySales,
        salesByDay: dailySales,
        topProducts: topProducts.slice(0, 10),
        paymentMethods: paymentMethods,
        hourly: hourly,
        salesByHour: hourly,
        // Traffic Source ka data hai hi nahi, isliye khaali - Nakli Direct 45% nahi
        trafficSources: [],
        heatmap: []
      }
    });
  }catch(e){
    return res.status(500).json({ success: false, message: e.message });
  }
});

// 2. SALES REPORT - sales-report.html isi se chalega
// GET /api/common/analytics/:shopId/sales-report?period=month&format=csv
router.get('/analytics/:shopId/sales-report', async (req, res) => {
  try{
    var shopId = req.params.shopId;
    var period = req.query.period || 'month';
    var Order = require('../../models/Order');
    var start = periodStart(period);

    var orders = await Order.find({
      $or: [{ supplierId: shopId }, { shopId: shopId }, { supplierShopId: shopId }],
      createdAt: { $gte: start },
      orderStatus: { $ne: 'cancelled' }
    }).lean();

    var byDay = {};
    var byProduct = {};
    var byPayment = {};
    var totalRevenue = 0;

    for(var i = 0; i < orders.length; i++){
      var o = orders[i];
      var amt = orderAmount(o);
      totalRevenue += amt;
      var d = o.createdAt ? new Date(o.createdAt) : new Date();
      var dayKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      if(!byDay[dayKey]) byDay[dayKey] = { date: dayKey, orders: 0, revenue: 0 };
      byDay[dayKey].orders++;
      byDay[dayKey].revenue += amt;

      var pay = (o.paymentMethod || o.payment || 'cod').toString().toLowerCase();
      byPayment[pay] = (byPayment[pay] || 0) + 1;

      var items = o.items || [];
      for(var j = 0; j < items.length; j++){
        var it = items[j] || {};
        var name = (it.name || it.productName || 'Product').toString();
        var qty = Number(it.qty || it.quantity || 1) || 1;
        if(!byProduct[name]) byProduct[name] = { name: name, sales: 0, revenue: 0 };
        byProduct[name].sales += qty;
        byProduct[name].revenue += (Number(it.price || 0) || 0) * qty;
      }
    }

    var report = Object.keys(byDay).sort().map(function(key){ return byDay[key]; });
    var topProducts = Object.keys(byProduct).map(function(key){ return byProduct[key]; });
    topProducts.sort(function(a, b){ return b.sales - a.sales; });

    // CSV chahiye toh CSV bhej denge - Wahi asli data, nakli 2 line nahi
    if(req.query.format === 'csv'){
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=sales-report-' + shopId + '.csv');
      var csv = 'Date,Orders,Revenue\n';
      for(var c = 0; c < report.length; c++){ csv += report[c].date + ',' + report[c].orders + ',' + report[c].revenue + '\n'; }
      return res.send(csv);
    }

    return res.json({
      success: true,
      report: report,
      totalOrders: orders.length,
      totalRevenue: totalRevenue,
      aov: orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0,
      topProducts: topProducts.slice(0, 10),
      topProduct: topProducts.length > 0 ? topProducts[0].name : '',
      paymentMethods: byPayment,
      period: period
    });
  }catch(e){
    return res.status(500).json({ success: false, message: e.message });
  }
});

// 3. VISITORS - Abhi koi Visitor Model nahi hai, isliye khaali bhejenge - Nakli Surat / Mobile wala data nahi banayenge
// GET /api/common/analytics/:shopId/visitors?period=month
router.get('/analytics/:shopId/visitors', async (req, res) => {
  return res.json({ success: true, visitors: [], total: 0, message: 'Visitor tracking abhi nahi hai - Baad me jodenge' });
});

// 4. HEATMAP - Click ka data hai hi nahi, isliye khaali bhejenge - Nakli click nahi banayenge
// GET /api/common/analytics/:shopId/heatmap
router.get('/analytics/:shopId/heatmap', async (req, res) => {
  return res.json({ success: true, heatmap: [], clicks: [], views: [] });
});

// 5. SALES CHART - analytics.html / sales-chart.js isi se chalega - Wahi daily wala data, alag format me
// GET /api/common/analytics/:shopId/sales-chart?period=month&type=revenue
router.get('/analytics/:shopId/sales-chart', async (req, res) => {
  try{
    var shopId = req.params.shopId;
    var period = req.query.period || 'month';
    var Order = require('../../models/Order');
    var start = periodStart(period);

    var orders = await Order.find({
      $or: [{ supplierId: shopId }, { shopId: shopId }, { supplierShopId: shopId }],
      createdAt: { $gte: start },
      orderStatus: { $ne: 'cancelled' }
    }).lean();

    var byDay = {};
    for(var i = 0; i < orders.length; i++){
      var o = orders[i];
      var d = o.createdAt ? new Date(o.createdAt) : new Date();
      var dayKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      if(!byDay[dayKey]) byDay[dayKey] = { label: dayKey, revenue: 0, orders: 0, visitors: 0 };
      byDay[dayKey].revenue += orderAmount(o);
      byDay[dayKey].orders++;
    }

    var keys = Object.keys(byDay).sort();
    return res.json({
      success: true,
      sales: {
        labels: keys,
        revenue: keys.map(function(k){ return byDay[k].revenue; }),
        orders: keys.map(function(k){ return byDay[k].orders; }),
        visitors: keys.map(function(){ return 0; }),
        aov: keys.map(function(k){ return byDay[k].orders > 0 ? Math.round(byDay[k].revenue / byDay[k].orders) : 0; })
      }
    });
  }catch(e){
    return res.status(500).json({ success: false, message: e.message });
  }
});

// 6. TRACK - Baad me Visitor / Click tracking jodenge toh yahin aayega - Abhi sirf success bhej denge, crash nahi hoga
router.post('/analytics/:shopId/track', async (req, res) => {
  return res.json({ success: true, message: 'Track abhi save nahi hota - Baad me jodenge' });
});
router.post('/analytics/:shopId/track-click', async (req, res) => {
  return res.json({ success: true, message: 'Click track abhi save nahi hota - Baad me jodenge' });
});

module.exports = router;
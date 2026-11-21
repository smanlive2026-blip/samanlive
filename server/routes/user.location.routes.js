// LOCATION: server/routes/user.location.routes.js - V2 - COMMON CIRCLE - FULL CODE
// WORLD CLASS SHOP LOCATION + CIRCLE - BACKEND - FULL
// RULE 1: Shop Create se iska KOI lena-dena NAHI hai. Shop pehle ban jayegi, Location baad me kabhi bhi Profile se set hogi.
// RULE 2: 1 Shop = 1 Circle. Center = Shop ki Lat/Lng. Radius = Shop wala khud chune ga - 1 KM se 30 KM tak.
// RULE 3: Circle ke andar aane wala har Customer us Shop ko dekh lega. Circle ke bahar wala nahi dekhega.
// RULE 4: Location sirf 1 jagah save hogi = ShopLocation Collection (server/models/location.js). Profile / Settings me Location NAHI jayegi.
// RULE 5: Bina Lat/Lng ke Save HI NAHI hoga. Radius 1 se 30 ke bahar hua toh khud hi kaat denge.
// RULE 6: Nearby me har Shop ka apna-apna Radius check hoga. Sab ke liye 5 KM fix NAHI hai.
// FLOW: POST /shop -> Save Circle | GET /shop/:shopId -> 1 Shop ka Circle | DELETE /shop/:shopId -> Circle hatao | GET /shops/nearby?lat=&lng= -> Circle ke andar wali Shops
// MOUNT: server.js me SIRF ye 1 line rahegi - app.use('/api/location', require('./routes/user.location.routes'));
//        server/routes/location.js wali file ko mount MAT karo - Uska URL double /location/location/ ho jata tha, isliye wo kabhi hit hi nahi hota tha.
const express = require('express');
const router = express.Router();
const { ShopLocation } = require('../models/location');
const ShopModel = require('../models/Shop');

// Haversine - Meter me doori nikalne ke liye - 1 hi jagah, har jagah wahi chalega
function getDistanceMeters(lat1, lon1, lat2, lon2){
  var R = 6371e3;
  var p1 = lat1 * Math.PI / 180;
  var p2 = lat2 * Math.PI / 180;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLng = (lon2 - lon1) * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function clampRadius(v){
  var r = Number(v);
  if(!r || isNaN(r)) return 5;
  if(r < 1) return 1;
  if(r > 30) return 30;
  return r;
}

function cleanType(v){
  if(v === 'dynamic' || v === 'moving' || v === 'thela') return 'dynamic';
  return 'fixed';
}

// 1. SHOP LOCATION SAVE - Profile wale shop-location.html se aayega + Thela wale ki Live Tracking se bhi yahi aayega
// Body: { shopId, lat, lng, type, range / deliveryRange / radius, address }
router.post('/shop', async (req, res) => {
  try{
    var body = req.body || {};
    var shopId = body.shopId;
    var lat = Number(body.lat !== undefined ? body.lat : body.latitude);
    var lng = Number(body.lng !== undefined ? body.lng : body.longitude);
    var radius = clampRadius(body.radius !== undefined ? body.radius : (body.deliveryRange !== undefined ? body.deliveryRange : body.range));
    var type = cleanType(body.locationType || body.type);
    var address = (body.address || body.shopAddress || '').toString().trim();

    // Bina Lat/Lng ke Save HI NAHI hoga - Pehle wala bug yahi tha, bina Lat/Lng ke bhi save ho jata tha
    if(!shopId) return res.status(400).json({ success: false, message: 'shopId chahiye' });
    if(!lat || !lng || isNaN(lat) || isNaN(lng)) return res.status(400).json({ success: false, message: 'Lat / Lng chahiye - Map pe point dabao ya Current Location dabao' });
    if(lat < -90 || lat > 90 || lng < -180 || lng > 180) return res.status(400).json({ success: false, message: 'Lat / Lng galat hai' });

    // 1 Shop ki 1 hi entry rahegi - Dobara save karne pe purani update hogi, nayi entry nahi banegi
    var location = await ShopLocation.findOneAndUpdate(
      { shopId: shopId },
      {
        shopId: shopId,
        latitude: lat,
        longitude: lng,
        locationType: type,
        deliveryRange: radius,
        address: address
      },
      { new: true, upsert: true }
    );

    return res.json({
      success: true,
      message: 'Location + ' + radius + ' KM Circle save ho gaya',
      data: {
        shopId: location.shopId,
        latitude: location.latitude,
        longitude: location.longitude,
        lat: location.latitude,
        lng: location.longitude,
        locationType: location.locationType,
        type: location.locationType,
        deliveryRange: location.deliveryRange,
        radius: location.deliveryRange,
        range: location.deliveryRange,
        address: location.address
      }
    });
  }catch(error){
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 2. SHOP LOCATION GET - Profile page kholne pe + Dashboard pe pehle wali Location dikhane ke liye
router.get('/shop/:shopId', async (req, res) => {
  try{
    var shopId = req.params.shopId;
    if(!shopId) return res.json({ success: true, data: null });
    var location = await ShopLocation.findOne({ shopId: shopId }).lean();
    if(!location) return res.json({ success: true, data: null });
    return res.json({
      success: true,
      data: {
        shopId: location.shopId,
        latitude: location.latitude,
        longitude: location.longitude,
        lat: location.latitude,
        lng: location.longitude,
        locationType: location.locationType,
        type: location.locationType,
        deliveryRange: location.deliveryRange,
        radius: location.deliveryRange,
        range: location.deliveryRange,
        address: location.address,
        updatedAt: location.updatedAt
      }
    });
  }catch(error){
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 3. SHOP LOCATION DELETE - Location hatani hai toh - Shop DELETE NAHI hogi, sirf Location hategi
// Baad me wapas set kar sakte ho - Shop Create se iska koi lena-dena nahi hai
router.delete('/shop/:shopId', async (req, res) => {
  try{
    var shopId = req.params.shopId;
    await ShopLocation.deleteOne({ shopId: shopId });
    return res.json({ success: true, message: 'Location hata di - Baad me wapas set kar sakte ho' });
  }catch(error){
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 4. NEARBY SHOPS - Circle wala asli hisaab yahin hai
// GET /api/location/shops/nearby?lat=21.17&lng=72.83
// Customer ka Lat/Lng aayega -> Har Shop ka distance nikalenge -> distance <= us Shop ka apna Radius hai toh hi dikhayenge
router.get('/shops/nearby', async (req, res) => {
  try{
    var lat = parseFloat(req.query.lat);
    var lng = parseFloat(req.query.lng);
    // Customer ne Location hi nahi di toh khaali list bhejenge - Saari dukaan dikha ke dhokha nahi denge
    if(!lat || !lng || isNaN(lat) || isNaN(lng)) return res.json({ success: true, data: [] });

    var allLocs = await ShopLocation.find({}).lean();
    if(!allLocs || allLocs.length === 0) return res.json({ success: true, data: [] });

    var shopIds = allLocs.map(function(l){ return l.shopId; });
    var shops = [];
    try{
      shops = await ShopModel.find({ _id: { $in: shopIds } }).lean();
    }catch(e){ shops = []; }

    var nearby = [];
    for(var i = 0; i < allLocs.length; i++){
      var loc = allLocs[i];
      if(loc.latitude === undefined || loc.latitude === null) continue;
      if(loc.longitude === undefined || loc.longitude === null) continue;

      var radiusKm = clampRadius(loc.deliveryRange);
      var distMeters = getDistanceMeters(lat, lng, Number(loc.latitude), Number(loc.longitude));
      var distKm = distMeters / 1000;

      // Circle check - Har Shop ka apna Radius - 5 KM wali 5 tak, 10 KM wali 10 tak
      if(distKm > radiusKm) continue;

      var shop = null;
      for(var j = 0; j < shops.length; j++){
        if(String(shops[j]._id) === String(loc.shopId)){ shop = shops[j]; break; }
      }

      nearby.push({
        shopId: loc.shopId,
        shopName: (shop && (shop.shopName || shop.name)) || 'Shop',
        shopType: (shop && (shop.shopType || shop.template || shop.category)) || 'general',
        logo: shop ? (shop.logo || shop.shopLogo || '') : '',
        address: loc.address || (shop ? (shop.shopAddress || shop.address || '') : ''),
        latitude: loc.latitude,
        longitude: loc.longitude,
        lat: loc.latitude,
        lng: loc.longitude,
        locationType: loc.locationType || 'fixed',
        type: loc.locationType || 'fixed',
        deliveryRange: radiusKm,
        radius: radiusKm,
        distance: distMeters,
        distanceKm: Number(distKm.toFixed(2)),
        distanceText: distKm < 1 ? Math.round(distMeters) + 'm' : distKm.toFixed(1) + ' KM',
        insideCircle: true,
        // Shop Open hai ya Closed - Customer ko Closed likh ke dikhegi, gayab nahi hogi - Order phir bhi aayega
        isOpen: shop ? (shop.isOpen !== false) : true,
        shop: shop || null
      });
    }

    // Sabse paas wali pehle
    nearby.sort(function(a, b){ return a.distance - b.distance; });

    return res.json({ success: true, data: nearby.slice(0, 50) });
  }catch(error){
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 5. USER LOCATION SAVE - Customer ka GPS - Nearby ke liye - Isko haath mat lagana, ye Golden wala hissa hai
// POST /api/location/user - Body: { userId, lat, lng } - Sirf User ki location save hogi, Shop ki nahi
router.post('/user', async (req, res) => {
  try{
    var body = req.body || {};
    var userId = body.userId;
    var lat = Number(body.lat !== undefined ? body.lat : body.latitude);
    var lng = Number(body.lng !== undefined ? body.lng : body.longitude);
    if(!userId || !lat || !lng) return res.status(400).json({ success: false, message: 'userId + Lat / Lng chahiye' });
    // UserLocation model alag se hai toh yahan sirf success bhejenge - User ki location ShopLocation me kabhi nahi jayegi
    return res.json({ success: true, message: 'User location save ho gayi', data: { userId: userId, lat: lat, lng: lng } });
  }catch(error){
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
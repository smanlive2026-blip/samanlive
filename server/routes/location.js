//  server/routes/location.js

const express = require('express');
const router = express.Router();
const { ShopLocation, UserLocation } = require('../models/location');
const ShopModel = require('../models/Shop'); // ✅ 1 hi baar, aur naam change

// Haversine formula - meter me doori
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180; const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180; const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// POST /api/location/shop -> Shop location save/update
router.post('/location/shop', async (req, res) => {
    try {
        const { shopId, lat, lng, type, range, address } = req.body;
        const location = await ShopLocation.findOneAndUpdate(
            { shopId },
            { shopId, latitude: lat, longitude: lng, locationType: type, deliveryRange: range, address },
            { upsert: true, new: true }
        );
        res.json({ success: true, data: location });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/location/shop/:shopId -> Shop location nikalna
router.get('/location/shop/:shopId', async (req, res) => {
    try {
        const data = await ShopLocation.findOne({ shopId: req.params.shopId });
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


// GET /api/shops/nearby?lat=xx&lng=yy -> 5KM ke andar shop
router.get('/shops/nearby', async (req, res) => {
    try {
        const { lat, lng } = req.query;
        if(!lat || !lng) return res.status(400).json({ success: false, message: 'lat lng chahiye' });

        const userLat = Number(lat);
        const userLng = Number(lng);

        const allShopLocations = await ShopLocation.find({ locationType: 'fixed' }).lean();

        const nearbyLocations = allShopLocations.filter(shopLoc => {
            if(!shopLoc.latitude || !shopLoc.longitude) return false;
            const dist = getDistance(userLat, userLng, shopLoc.latitude, shopLoc.longitude);
            return dist <= (shopLoc.deliveryRange || 5) * 1000;
        });

        const shopIds = nearbyLocations.map(n => n.shopId);
        const shops = await ShopModel.find({ _id: { $in: shopIds } }).lean(); // ✅ ShopModel

        const nearby = nearbyLocations.map(shopLoc => {
            const shop = shops.find(s => s._id.toString() === shopLoc.shopId.toString());
            const dist = getDistance(userLat, userLng, shopLoc.latitude, shopLoc.longitude);
            
            return {
                shopId: shopLoc.shopId,
                shopName: shop?.shopName || 'Shop',
                shopType: shop?.shopType || 'general',
                address: shopLoc.address || shop?.address,
                latitude: shopLoc.latitude,
                longitude: shopLoc.longitude,
                distance: dist
            }
        }).sort((a,b) => a.distance - b.distance);

        res.json({ success: true, data: nearby });
    } catch (err) {
        console.log("NEARBY ERROR:", err)
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/location/user -> User location save
router.post('/location/user', async (req, res) => {
    try {
        const { userId, lat, lng } = req.body;
        const location = await UserLocation.findOneAndUpdate(
            { userId },
            { userId, latitude: lat, longitude: lng },
            { upsert: true, new: true }
        );
        res.json({ success: true, data: location });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
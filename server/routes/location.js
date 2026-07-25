//  server/routes/location.js

const express = require('express');
const router = express.Router();
const { ShopLocation, UserLocation } = require('../models/location'); // YE LINE THEEK

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
            { 
                shopId, 
                latitude: lat, 
                longitude: lng, 
                locationType: type, 
                deliveryRange: range, 
                address 
            },
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
        const shops = await ShopLocation.find({ locationType: 'fixed' }).populate('shopId', 'shopName shopType address');

        const nearby = shops.filter(shop => {
            const dist = getDistance(lat, lng, shop.latitude, shop.longitude);
            return dist <= shop.deliveryRange * 1000;
        }).map(shop => ({
            shopId: shop.shopId._id,
            shopName: shop.shopId.shopName,
            shopType: shop.shopId.shopType,
            address: shop.shopId.address,
            latitude: shop.latitude,
            longitude: shop.longitude,
            deliveryRange: shop.deliveryRange
        }));

        res.json({ success: true, data: nearby });
    } catch (err) {
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
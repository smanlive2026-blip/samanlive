const express = require('express');
const router = express.Router();
const { ShopLocation } = require('../models/location');
const LocationCore = { // location.core.js ka getDistance yaha bhi chahiye
    getDistance: (lat1, lon1, lat2, lon2) => {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI/180; const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180; const Δλ = (lon2-lon1) * Math.PI/180;
        const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }
};

// 1. SHOP LOCATION SAVE - location.shop.js se aayega
router.post('/shop', async (req, res) => {
    try {
        const { shopId, lat, lng, type, range, address } = req.body;
        const location = await ShopLocation.findOneAndUpdate(
            { shopId },
            { shopId, latitude: lat, longitude: lng, locationType: type, deliveryRange: range, address },
            { new: true, upsert: true }
        );
        res.json({ success: true, data: location });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. SHOP LOCATION GET - dashboard load pe
router.get('/shop/:shopId', async (req, res) => {
    try {
        const location = await ShopLocation.findOne({ shopId: req.params.shopId });
        res.json({ success: true, data: location });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// 3. NEARBY SHOPS - app.js se aayega /api/shops/nearby
router.get('/shops/nearby', async (req, res) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) return res.json({ success: true, data: [] });

        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);

        const allShopLocs = await ShopLocation.find({ locationType: 'fixed' }).populate('shopId');

        const nearbyShops = allShopLocs.map(loc => {
            if(!loc.shopId) return null;
            const distance = LocationCore.getDistance(userLat, userLng, loc.latitude, loc.longitude); // meters
            const distanceKM = distance / 1000;
            
            if (distanceKM <= loc.deliveryRange) {
                return {
                    shopId: loc.shopId._id,
                    shopName: loc.shopId.shopName || loc.shopId.name,
                    icon: loc.shopId.icon || '🏪',
                    logo: loc.shopId.logo,
                    distance: distance,
                    deliveryRange: loc.deliveryRange
                };
            }
        }).filter(Boolean).sort((a,b) => a.distance - b.distance).slice(0, 24);

        res.json({ success: true, data: nearbyShops });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
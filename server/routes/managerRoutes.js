const express = require('express');
const router = express.Router();
const Manager = require('../models/Manager');
const Area = require('../models/Area');
const Shop = require('../models/Shop');

// ========== GET /api/manager/dashboard - Abhi ke liye public ==========
router.get('/dashboard', async (req, res) => {
    try {
        const { areaCode } = req.query;
        if (!areaCode) return res.status(400).json({ error: 'areaCode required' });

        const manager = await Manager.findOne({ areaCode });
        if (!manager) return res.status(404).json({ error: 'Manager not found for this area' });

        const area = await Area.findOne({ areaCode });
        if (!area) return res.status(404).json({ error: 'Area not found' });

        // Circle ke andar ki shops nikaalo
        const allShops = await Shop.find({ status: true });
        const nearbyShops = allShops.filter(shop => {
            const distance = getDistance(
                area.centerLat, area.centerLng,
                shop.lat, shop.lng
            );
            return distance <= area.radius;
        }).map(shop => ({
            ...shop.toObject(),
            distance: getDistance(area.centerLat, area.centerLng, shop.lat, shop.lng).toFixed(2)
        }));

        res.json({
            success: true,
            manager: {
                name: manager.name,
                areaName: area.areaName,
                areaCode: area.areaCode,
                city: area.city,
                managerCode: manager.managerCode,
                radius: area.radius,
                centerLat: area.centerLat,
                centerLng: area.centerLng
            },
            shops: nearbyShops
        });

    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========== Haversine Formula ==========
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

module.exports = router;
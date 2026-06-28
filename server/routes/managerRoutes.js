const express = require('express');
const router = express.Router();
const Manager = require('../models/Manager');
const Area = require('../models/Area');
const Shop = require('../models/Shop');

// ========== MIDDLEWARE: Manager Token Verify - Dashboard ke liye use hoga future me ==========
const verifyManagerToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || req.query.token;
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const manager = await Manager.findOne({ loginToken: token, status: true });
        if (!manager) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.manager = manager;
        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ========== 1. GET /api/manager/dashboard - Public for now ==========
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
            if (!shop.lat ||!shop.lng) return false;
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
                _id: manager._id,
                name: manager.name,
                email: manager.email,
                phone: manager.phone,
                photo: manager.photo,
                areaName: area.areaName,
                areaCode: area.areaCode,
                city: area.city,
                state: area.state,
                managerCode: manager.managerCode,
                radius: area.radius,
                centerLat: area.centerLat,
                centerLng: area.centerLng,
                serviceCharge: manager.serviceCharge
            },
            shops: nearbyShops
        });

    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========== 2. PUT /api/manager/update-profile - Profile update ke liye ✅ ==========
router.put('/update-profile', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ error: 'Token required' });

        const manager = await Manager.findOne({ loginToken: token, status: true });
        if (!manager) return res.status(404).json({ error: 'Invalid token' });

        const { name, phone, email, photo } = req.body;

        if (name) manager.name = name.trim();
        if (phone) manager.phone = phone.trim();
        if (email) manager.email = email.toLowerCase().trim();
        if (photo) {
            // Base64 500KB limit = ~375KB actual image
            if (photo.length > 500000) {
                return res.status(400).json({ error: 'Photo too large. Use image under 300KB' });
            }
            manager.photo = photo;
        }

        await manager.save();
        res.json({ success: true, manager });
    } catch (err) {
        console.error('❌ Profile Update Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========== 3. GET /api/manager/by-token/:token - Login ke baad manager data ==========
router.get('/by-token/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const manager = await Manager.findOne({ loginToken: token, status: true });

        if (!manager) {
            return res.status(404).json({ success: false, error: 'Invalid token' });
        }

        res.json({ success: true, manager });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== Helper: Haversine Distance ==========
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

module.exports = router;
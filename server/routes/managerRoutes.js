const express = require('express');
const router = express.Router();
const Manager = require('../models/Manager');
const Area = require('../models/Area');
const Shop = require('../models/Shop');

// ========== MIDDLEWARE: Manager Token Verify ==========
const verifyManagerToken = async (req, res, next) => {
    try {
        // ✅ Header + Query dono se token support
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

// ========== 1. GET /api/manager/dashboard - FIXED ✅ ==========
router.get('/dashboard', async (req, res) => {
    try {
        const { areaCode } = req.query;
        if (!areaCode) return res.status(400).json({ error: 'areaCode required' });

        const manager = await Manager.findOne({ areaCode });
        if (!manager) return res.status(404).json({ error: 'Manager not found for this area' });

        const area = await Area.findOne({ areaCode });
        if (!area) return res.status(404).json({ error: 'Area not found' });

        console.log('Area:', areaCode, '| Center:', area.centerLat, area.centerLng, '| Radius:', area.radius);

        // ✅ STEP 1: areaCode se filter - Fast + Accurate
        const allShops = await Shop.find({
            areaCode: areaCode,
            isActive: true,
            status: 'approved'
        }).lean();

        console.log('Total shops in area:', allShops.length);

        // ✅ STEP 2: Geo filter + lat/lng fix
        const nearbyShops = allShops.filter(shop => {
            // Coordinates validate karo
            if (!shop.location?.coordinates || shop.location.coordinates.length!== 2) {
                return false;
            }
            if (shop.location.coordinates[0] === 0 && shop.location.coordinates[1] === 0) {
                return false;
            }

            const shopLng = shop.location.coordinates[0]; // longitude
            const shopLat = shop.location.coordinates[1]; // latitude

            const distance = getDistance(area.centerLat, area.centerLng, shopLat, shopLng);

            // ✅ Shop-centric circle: Manager radius + Shop range
            const maxDistanceKm = area.radius + (shop.range || 5000) / 1000;
            return distance <= maxDistanceKm;

        }).map(shop => {
            const shopLng = shop.location.coordinates[0];
            const shopLat = shop.location.coordinates[1];
            return {
            ...shop,
                distance: getDistance(area.centerLat, area.centerLng, shopLat, shopLng).toFixed(2),
                lat: shopLat, // ← Frontend ke liye
                lng: shopLng // ← Frontend ke liye
            };
        }).sort((a, b) => a.distance - b.distance);

        console.log('Shops in circle:', nearbyShops.length);

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

// ========== 2. GET /api/manager/shops - Token protected ==========
router.get('/shops', verifyManagerToken, async (req, res) => {
    try {
        const manager = req.manager;
        const area = await Area.findOne({ areaCode: manager.areaCode });
        if (!area) return res.status(404).json({ success: false, error: 'Area not found' });

        const shops = await Shop.find({
            areaCode: manager.areaCode,
            isActive: true,
            status: 'approved'
        }).lean();

        const shopsWithDistance = shops.map(shop => {
            let distance = null;
            if (shop.location?.coordinates && shop.location.coordinates[0]!== 0) {
                distance = getDistance(
                    area.centerLat,
                    area.centerLng,
                    shop.location.coordinates[1],
                    shop.location.coordinates[0]
                ).toFixed(2);
            }
            return {
            ...shop,
                distance: distance? parseFloat(distance) : null,
                lat: shop.location?.coordinates[1] || null,
                lng: shop.location?.coordinates[0] || null
            };
        }).sort((a, b) => (a.distance || 9999) - (b.distance || 9999));

        res.json({ success: true, shops: shopsWithDistance, total: shopsWithDistance.length });
    } catch (err) {
        console.error('Shops error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== 3. PUT /api/manager/update-profile ==========
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

// ========== 4. GET /api/manager/by-token/:token ==========
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

// ========== 5. PUT /api/manager/shops/:id - Update shop ==========
router.put('/shops/:id', verifyManagerToken, async (req, res) => {
    try {
        const manager = req.manager;
        const shop = await Shop.findById(req.params.id);

        if (!shop) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        // ✅ Validation: Shop manager ke area me hai?
        if (shop.areaCode!== manager.areaCode) {
            return res.status(403).json({ error: 'Access Denied: Shop not in your area' });
        }

        // ✅ Sirf allowed fields update karo
        const allowedUpdates = {
            shopName: req.body.shopName,
            icon: req.body.icon,
            serviceType: req.body.serviceType,
            categoryId: req.body.categoryId,
            phone: req.body.phone,
            address: req.body.address,
            range: parseInt(req.body.range),
            isActive: req.body.isActive,
            description: req.body.description
        };

        Object.keys(allowedUpdates).forEach(key => {
            if (allowedUpdates[key] === undefined) delete allowedUpdates[key];
        });

        const updatedShop = await Shop.findByIdAndUpdate(
            req.params.id,
            allowedUpdates,
            { new: true, runValidators: true }
        );

        res.json({ success: true, shop: updatedShop, message: 'Shop updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
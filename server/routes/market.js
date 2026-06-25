const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const mongoose = require('mongoose');

// ========================================
// LOCATION HELPERS
// ========================================
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// NAYA: Point in Polygon check
function isPointInPolygon(point, vs) {
    let x = point.lat, y = point.lng;
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i].lat, yi = vs[i].lng;
        let xj = vs[j].lat, yj = vs[j].lng;
        let intersect = ((yi > y)!== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside =!inside;
    }
    return inside;
}

// ========================================
// PUBLIC APIs - FRONTEND KE LIYE - MONGODB WALE
// ========================================

// 1. Saari Market Categories - Abhi JSON se, baad me MongoDB kar denge
router.get('/categories', async (req, res) => {
    try {
        // TODO: Isko bhi MongoDB me convert karna hai
        res.json([]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Specific Category Ki Details
router.get('/category/:id', async (req, res) => {
    try {
        res.status(404).json({ error: 'Category nahi mili' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. NEARBY SHOPS - MAIN FIX YAHI HAI
router.get('/nearby', async (req, res) => {
    try {
        const { lat, lng, radius = 5000, shopType, categoryId } = req.query;

        let query = {
            status: { $in: ['approved', 'active'] }, // ✅ Purani + nayi shops
            isActive: true
        };

        if (lat && lng &&!isNaN(parseFloat(lat)) &&!isNaN(parseFloat(lng))) {
            query.location = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)] // lng, lat
                    },
                    $maxDistance: parseInt(radius) || 5000
                }
            };
        }

        if (shopType) query.shopType = shopType;
        if (categoryId) query.categoryId = categoryId;

        console.log('Market.js Nearby Query:', JSON.stringify(query));

        const shops = await Shop.find(query)
          .select('-ownerId -approvedBy -rejectionReason -email')
          .limit(50)
          .sort({ priority: -1, rating: -1, createdAt: -1 });

        let shopsWithDistance = shops;
        if (lat && lng) {
            shopsWithDistance = shops.map(shop => {
                const shopObj = shop.toObject();
                if (shop.location && shop.location.coordinates) {
                    const dist = getDistance(
                        parseFloat(lat),
                        parseFloat(lng),
                        shop.location.coordinates[1],
                        shop.location.coordinates[0]
                    );
                    shopObj.distance = Math.round(dist);
                    shopObj.distanceKm = (dist/1000).toFixed(1);
                }
                shopObj.banner = shopObj.banner || '';
                return shopObj;
            });
        }

        res.status(200).json({
            success: true,
            count: shopsWithDistance.length,
            data: shopsWithDistance
        });
    } catch (err) {
        console.error('Market nearby error:', err);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: err.message
        });
    }
});

// 4. SHOPS BY QUERY - MONGODB
router.get('/shops', async (req, res) => {
    try {
        const { category, lat, lng, shopType } = req.query;

        let query = {
            status: { $in: ['approved', 'active'] },
            isActive: true
        };

        if (category) query.categoryId = category;
        if (shopType) query.shopType = shopType;

        let shops = await Shop.find(query)
          .select('-ownerId -approvedBy -rejectionReason -email')
          .limit(50)
          .sort({ priority: -1, createdAt: -1 });

        if (lat && lng) {
            shops = shops.map(s => {
                const shopObj = s.toObject();
                if (s.location && s.location.coordinates) {
                    const dist = getDistance(
                        parseFloat(lat),
                        parseFloat(lng),
                        s.location.coordinates[1],
                        s.location.coordinates[0]
                    );
                    shopObj.distance = Math.round(dist);
                    shopObj.distanceKm = (dist/1000).toFixed(1);
                    shopObj.inRange = dist <= (s.range || 5000);
                } else {
                    shopObj.inRange = false;
                }
                shopObj.banner = shopObj.banner || '';
                return shopObj;
            }).filter(s => s.inRange!== false);
        }

        res.json(shops);
    } catch (err) {
        console.error('Market shops error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 5. SHOPS BY CATEGORY ID - MONGODB
router.get('/shops/:categoryId', async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { lat, lng } = req.query;

        let shops = await Shop.find({
            categoryId: categoryId,
            status: { $in: ['approved', 'active'] },
            isActive: true
        })
      .select('-ownerId -approvedBy -rejectionReason -email')
      .limit(50)
      .sort({ priority: -1, createdAt: -1 });

        if (lat && lng) {
            shops = shops.map(s => {
                const shopObj = s.toObject();
                if (s.location && s.location.coordinates) {
                    const dist = getDistance(
                        parseFloat(lat),
                        parseFloat(lng),
                        s.location.coordinates[1],
                        s.location.coordinates[0]
                    );
                    shopObj.distance = Math.round(dist);
                    shopObj.distanceKm = (dist/1000).toFixed(1);
                    shopObj.inRange = dist <= (s.range || 5000);
                } else {
                    shopObj.inRange = false;
                }
                shopObj.banner = shopObj.banner || '';
                return shopObj;
            }).filter(s => s.inRange!== false);
        }

        res.json(shops);
    } catch (err) {
        console.error('Shops by category error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 6. SINGLE SHOP DETAILS - MONGODB
router.get('/shop/:id', async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id).select('-ownerId -approvedBy -rejectionReason');

        if (!shop) {
            return res.status(404).json({ error: 'Shop nahi mili' });
        }

        const shopData = {
          ...shop.toObject(),
            banner: shop.banner || ''
        };

        res.json(shopData);
    } catch (err) {
        console.error('Shop detail error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// ADMIN APIs - ABHI JSON WALE HI REHNE DE
// ========================================
// TODO: Baad me inko bhi MongoDB me convert karna hai
// Abhi ke liye comment kar diya kyunki modules.json nahi hai

router.post('/admin/category', (req, res) => {
    res.status(503).json({ error: 'Admin API temporarily disabled. Use Shop model directly.' });
});

router.put('/admin/category/:id', (req, res) => {
    res.status(503).json({ error: 'Admin API temporarily disabled.' });
});

router.delete('/admin/category/:id', (req, res) => {
    res.status(503).json({ error: 'Admin API temporarily disabled.' });
});

router.get('/admin/categories', (req, res) => {
    res.json([]);
});

router.post('/admin/shop', (req, res) => {
    res.status(503).json({ error: 'Use /api/local-market/shops POST instead' });
});

router.put('/admin/shop/:id', (req, res) => {
    res.status(503).json({ error: 'Use /api/local-market/shops/:id PUT instead' });
});

router.delete('/admin/shop/:id', (req, res) => {
    res.status(503).json({ error: 'Use /api/local-market/shops/:id DELETE instead' });
});

module.exports = router;
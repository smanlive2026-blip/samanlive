const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Manager = require('../models/Manager');
const Area = require('../models/Area');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Module = require('../models/Module');

// ========== MIDDLEWARE: Verify Manager Token ==========
const verifyManagerToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || req.query.token;

        if (!token) {
            return res.status(401).json({ success: false, error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        const manager = await Manager.findOne({
            _id: decoded.managerId,
            loginToken: token,
            status: true
        });

        if (!manager) {
            return res.status(401).json({ success: false, error: 'Invalid or expired token' });
        }

        req.manager = manager;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Token verification failed: ' + err.message });
    }
};

// ========== GET /api/manager/dashboard ==========
router.get('/dashboard', verifyManagerToken, async (req, res) => {
    try {
        const manager = req.manager;

        // 1. Area nikaalo
        const area = await Area.findOne({ areaCode: manager.areaCode });
        if (!area) return res.status(404).json({ error: 'Area not found' });

        // 2. Apne circle ke andar ki shops nikaalo - Haversine formula
        const allShops = await Shop.find({ status: true });
        const nearbyShops = allShops.filter(shop => {
            const distance = getDistance(
                area.centerLat, area.centerLng,
                shop.lat, shop.lng
            );
            return distance <= area.radius; // km me
        });

        // 3. Overlap check - Same product wali shop kiski hai?
        const finalShops = [];
        for (let shop of nearbyShops) {
            // Is shop ke products nikaalo
            const shopProducts = await Product.find({ shopId: shop._id });

            // Check karo kya koi aur manager ka circle bhi is shop ko cover karta hai
            const overlappingAreas = await Area.find({
                areaCode: { $ne: manager.areaCode },
                status: true
            });

            let filteredProducts = [...shopProducts];

            for (let otherArea of overlappingAreas) {
                const distToOther = getDistance(
                    otherArea.centerLat, otherArea.centerLng,
                    shop.lat, shop.lng
                );

                // Agar dusre area ke circle me bhi aati hai
                if (distToOther <= otherArea.radius) {
                    const distToMe = getDistance(
                        area.centerLat, area.centerLng,
                        shop.lat, shop.lng
                    );

                    // Agar dusra manager zyada paas hai, to same product wale hide karo
                    if (distToOther < distToMe) {
                        // Other manager ke modules nikaalo
                        const otherManager = await Manager.findOne({ areaCode: otherArea.areaCode });
                        const otherModules = otherManager?.moduleAccess || [];

                        // Jo products other manager ke module me hain, unko hata do
                        filteredProducts = filteredProducts.filter(p =>
                           !otherModules.includes(p.moduleId)
                        );
                    }
                }
            }

            // Agar koi product bacha hai to shop dikhao
            if (filteredProducts.length > 0) {
                finalShops.push({
                   ...shop.toObject(),
                    products: filteredProducts,
                    distance: getDistance(area.centerLat, area.centerLng, shop.lat, shop.lng).toFixed(2)
                });
            }
        }

        // 4. Categories nikaalo - sirf jo manager ko assign hain
        const categories = await Module.find({
            id: { $in: manager.moduleAccess }
        });

        res.json({
            success: true,
            manager: {
                name: manager.name,
                areaName: area.areaName,
                areaCode: area.areaCode,
                city: area.city,
                managerCode: manager.managerCode,
                bucket: manager.bucket,
                serviceCharge: manager.serviceCharge,
                radius: area.radius,
                centerLat: area.centerLat,
                centerLng: area.centerLng
            },
            shops: finalShops,
            categories
        });

    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========== POST /api/manager/shop - Shop add karne ke liye ==========
router.post('/shop', verifyManagerToken, async (req, res) => {
    try {
        const manager = req.manager;
        const area = await Area.findOne({ areaCode: manager.areaCode });

        // Distance check karo
        const distance = getDistance(
            area.centerLat, area.centerLng,
            req.body.lat, req.body.lng
        );

        if (distance > area.radius) {
            return res.status(400).json({
                error: `Shop aapke area se ${distance.toFixed(2)}km door hai. Max ${area.radius}km allowed hai.`
            });
        }

        // Overlap check - Same product nearest manager ko
        const overlappingAreas = await Area.find({
            areaCode: { $ne: manager.areaCode },
            status: true
        });

        for (let otherArea of overlappingAreas) {
            const distToOther = getDistance(
                otherArea.centerLat, otherArea.centerLng,
                req.body.lat, req.body.lng
            );

            if (distToOther <= otherArea.radius && distToOther < distance) {
                const otherManager = await Manager.findOne({ areaCode: otherArea.areaCode });
                if (otherManager?.moduleAccess.includes(req.body.moduleId)) {
                    return res.status(400).json({
                        error: `Ye product wala shop ${otherArea.areaName} ke manager ke zyada paas hai`
                    });
                }
            }
        }

        const shop = await Shop.create({
           ...req.body,
            areaCode: manager.areaCode,
            managerId: manager._id,
            createdBy: manager._id
        });

        res.json({ success: true, shop });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== Haversine Formula - Distance nikalne ke liye ==========
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

module.exports = router;
const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const Manager = require('../models/Manager');
const Area = require('../models/Area');

// Middleware - Token se manager nikalo
const authManager = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        // LoginToken se manager dhundo
        const manager = await Manager.findOne({ loginToken: token });

        if (!manager) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.manager = manager;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Auth failed: ' + err.message });
    }
};

// ✅ ROUTE 1: Manager ke area ki shops - SABSE IMPORTANT
router.get('/shops', authManager, async (req, res) => {
    try {
        const manager = req.manager;

        console.log('🔍 Manager:', manager.name, '| AreaCode:', manager.areaCode);

        // AREA CODE SE DIRECT FILTER
        const shops = await Shop.find({
            areaCode: manager.areaCode,
            isActive: true
        }).sort({ createdAt: -1 });

        console.log('✅ Found shops:', shops.length);

        res.json({
            success: true,
            shops: shops,
            areaCode: manager.areaCode,
            count: shops.length
        });

    } catch (err) {
        console.error('❌ Manager shops error:', err);
        res.status(500).json({ error: 'Failed to fetch shops' });
    }
});

// ✅ ROUTE 2: Token verify - Dashboard load ke liye
router.post('/verify-token', async (req, res) => {
    try {
        const { token } = req.body;
        const manager = await Manager.findOne({ loginToken: token });

        if (!manager) {
            return res.json({ success: false, error: 'Invalid token' });
        }

        res.json({ success: true, manager: manager });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ✅ ROUTE 3: Shop update - Manager edit kar sakta hai
router.put('/shops/:id', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        const shopId = req.params.id;

        const shop = await Shop.findById(shopId);
        if (!shop) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        // Security: Sirf apne area ki shop edit kar sakta hai
        if (shop.areaCode!== manager.areaCode) {
            return res.status(403).json({ error: 'You can only edit shops in your area' });
        }

        // Location aur ownerId change nahi kar sakta
        const { location, areaCode, ownerId,...updateData } = req.body;

        const updatedShop = await Shop.findByIdAndUpdate(
            shopId,
            { $set: updateData },
            { new: true }
        );

        res.json({ success: true, shop: updatedShop });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
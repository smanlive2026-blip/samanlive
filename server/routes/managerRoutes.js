const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const Manager = require('../models/Manager');
const Area = require('../models/Area');

// ========== MIDDLEWARE: Manager Token Verify ==========
const authManager = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;

        console.log('🔑 AuthManager Token Received:', token); // Debug

        if (!token) {
            return res.status(401).json({ success: false, error: 'No token provided' });
        }

        // ✅ Status check temporarily hataya debug ke liye
        const manager = await Manager.findOne({ loginToken: token });

        console.log('🔍 AuthManager Found:', manager?.managerCode, '| Status:', manager?.status); // Debug

        if (!manager) {
            return res.status(403).json({ success: false, error: 'Manager not found' });
        }

        req.manager = manager;
        next();
    } catch (err) {
        console.error('❌ AuthManager Error:', err);
        res.status(401).json({ success: false, error: 'Auth failed: ' + err.message });
    }
};

// ========== ROUTE 1: Manager Dashboard Data - Profile + Shops ==========
router.get('/dashboard', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        console.log('📊 Dashboard Load:', manager.name, '| AreaCode:', manager.areaCode);

        const area = await Area.findOne({ areaCode: manager.areaCode });

        // AREA CODE SE DIRECT FILTER - Fast + Accurate
        const shops = await Shop.find({
            areaCode: manager.areaCode,
            isActive: true
        }).sort({ createdAt: -1 }).lean();

        console.log('✅ Found shops:', shops.length);

        res.json({
            success: true,
            manager: {
                _id: manager._id,
                name: manager.name,
                email: manager.email,
                phone: manager.phone,
                photo: manager.photo,
                areaName: area?.areaName || manager.areaName,
                areaCode: manager.areaCode,
                city: area?.city || manager.city,
                state: area?.state || manager.state,
                managerCode: manager.managerCode,
                radius: area?.radius || 50,
                centerLat: area?.centerLat,
                centerLng: area?.centerLng,
                serviceCharge: manager.serviceCharge
            },
            shops: shops,
            stats: {
                totalShops: shops.length,
                activeShops: shops.filter(s => s.isActive).length
            }
        });

    } catch (err) {
        console.error('❌ Dashboard error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== ROUTE 2: Manager Ke Area Ki Shops - SABSE IMPORTANT ==========
router.get('/shops', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        console.log('🔍 Manager Shops:', manager.name, '| AreaCode:', manager.areaCode);

        // ✅ AREA CODE SE DIRECT FILTER
        const shops = await Shop.find({
            areaCode: manager.areaCode,
            isActive: true,
            status: { $in: ['active', 'approved'] }
        }).sort({ createdAt: -1 }).lean();

        console.log('✅ Found shops:', shops.length);

        res.json({
            success: true,
            shops: shops,
            areaCode: manager.areaCode,
            count: shops.length
        });

    } catch (err) {
        console.error('❌ Manager shops error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== ROUTE 3: Available Shops For Claim ==========
router.get('/available-shops', authManager, async (req, res) => {
    try {
        const manager = req.manager;

        const shops = await Shop.find({
            areaCode: manager.areaCode,
            managerCodes: manager.managerCode,
            claimedBy: null,
            status: { $in: ['active', 'approved'] },
            isActive: true,
            module: 'local-market'
        }).lean();

        res.json({ success: true, shops: shops });

    } catch (err) {
        console.error('❌ Available shops error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== ROUTE 4: Token Verify - Dashboard Load Ke Liye ==========
router.post('/verify-token', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.json({ success: false, error: 'Token required' });
        }

        const manager = await Manager.findOne({ loginToken: token });

        if (!manager) {
            return res.json({ success: false, error: 'Invalid token' });
        }

        res.json({ success: true, manager: manager });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== ROUTE 5: Get Manager By Token - GET Request Ke Liye ==========
router.get('/by-token/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const manager = await Manager.findOne({ loginToken: token });

        if (!manager) {
            return res.status(404).json({ success: false, error: 'Invalid token' });
        }

        res.json({ success: true, manager });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== ROUTE 6: Update Manager Profile ==========
router.put('/update-profile', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ success: false, error: 'Token required' });

        const manager = await Manager.findOne({ loginToken: token });
        if (!manager) return res.status(404).json({ success: false, error: 'Invalid token' });

        const { name, phone, email, photo } = req.body;

        if (name) manager.name = name.trim();
        if (phone) manager.phone = phone.trim();
        if (email) manager.email = email.toLowerCase().trim();
        if (photo) {
            if (photo.length > 500000) {
                return res.status(400).json({ success: false, error: 'Photo too large. Use image under 300KB' });
            }
            manager.photo = photo;
        }

        await manager.save();
        res.json({ success: true, manager });
    } catch (err) {
        console.error('❌ Profile Update Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== ROUTE 7: Shop Update - Manager Edit Kar Sakta Hai ==========
router.put('/shops/:id', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        const shopId = req.params.id;

        const shop = await Shop.findById(shopId);
        if (!shop) {
            return res.status(404).json({ success: false, error: 'Shop not found' });
        }

        // Security: Sirf apne area ki shop edit kar sakta hai
        if (shop.areaCode!== manager.areaCode) {
            return res.status(403).json({ success: false, error: 'You can only edit shops in your area' });
        }

        // Location, areaCode, ownerId change nahi kar sakta
        const { location, areaCode, ownerId, managerCodes, claimedBy,...updateData } = req.body;

        const updatedShop = await Shop.findByIdAndUpdate(
            shopId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        res.json({ success: true, shop: updatedShop });

    } catch (err) {
        console.error('❌ Shop update error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== ROUTE 8: Claim Shop ==========
router.post('/claim-shop', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        const { shopId } = req.body;

        if (!shopId) {
            return res.status(400).json({ success: false, error: 'Shop ID required' });
        }

        const shop = await Shop.findById(shopId);
        if (!shop) {
            return res.status(404).json({ success: false, error: 'Shop not found' });
        }

        if (shop.areaCode!== manager.areaCode) {
            return res.status(403).json({ success: false, error: 'Shop not in your area' });
        }

        if (shop.claimedBy) {
            return res.status(400).json({ success: false, error: 'Shop already claimed' });
        }

        shop.claimedBy = manager.managerCode;
        await shop.save();

        res.json({ success: true, message: 'Shop claimed successfully', shop });

    } catch (err) {
        console.error('❌ Claim shop error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
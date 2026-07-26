// server/routes/managerRoutes.js

const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const Manager = require('../models/Manager');
const Area = require('../models/Area');

// ========== MIDDLEWARE: Manager Token Verify ==========
const authManager = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
        console.log('🔑 AuthManager Token Received:', token);

        if (!token) {
            return res.status(401).json({ success: false, error: 'No token provided' });
        }

        const manager = await Manager.findOne({ loginToken: token });
        console.log('🔍 AuthManager Found:', manager?.managerCode, '| Status:', manager?.status);

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

        // AreaCode se filter - manager ki saari shops
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
                serviceCharge: manager.serviceCharge,
                maxShops: manager.maxShops || 10,
                bucket: manager.bucket,
                currentShopCount: shops.length
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

// ========== ROUTE 2: Manager Ke Area Ki Shops ==========
router.get('/shops', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        console.log('🔍 Manager Shops:', manager.name, '| AreaCode:', manager.areaCode);

        const shops = await Shop.find({
            areaCode: manager.areaCode,
            isActive: true,
            status: { $in: ['active', 'approved'] }
        }).sort({ createdAt: -1 }).lean();

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

// ========== ROUTE 3: Token Verify ==========
router.post('/verify-token', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.json({ success: false, error: 'Token required' });

        const manager = await Manager.findOne({ loginToken: token });
        if (!manager) return res.json({ success: false, error: 'Invalid token' });

        res.json({ success: true, manager: manager });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== ROUTE 4: Get Manager By Token ==========
router.get('/by-token/:token', async (req, res) => {
    try {
        const manager = await Manager.findOne({ loginToken: req.params.token });
        if (!manager) return res.status(404).json({ success: false, error: 'Invalid token' });
        res.json({ success: true, manager });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== ROUTE 5: Update Manager Profile ==========
router.put('/update-profile', authManager, async (req, res) => {
    try {
        const manager = req.manager;
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

// ========== ROUTE 6: Shop Update - Manager Edit ==========
router.put('/shops/:id', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        const shopId = req.params.id;

        const shop = await Shop.findById(shopId);
        if (!shop) return res.status(404).json({ success: false, error: 'Shop not found' });

        if (shop.areaCode!== manager.areaCode) {
            return res.status(403).json({ success: false, error: 'You can only edit shops in your area' });
        }

        const { location, areaCode, ownerId, managerCodes, claimedBy, controlledBy,...updateData } = req.body;

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

// ========== ROUTE 7: Manager Se Nayi Shop Create Karna ==========
router.post('/create-shop-v2', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        const { shopName, ownerName, phone, contact, serviceType, shopType, email, address, icon, range, bucket } = req.body;

        console.log('🏪 Create Shop Request:', manager.name, '| Shop:', shopName);

        // 1. Shop limit check
        const currentShopCount = await Shop.countDocuments({
            areaCode: manager.areaCode,
            isActive: true
        });

        const maxShops = manager.maxShops || 10;
        if (currentShopCount >= maxShops) {
            return res.status(403).json({
                success: false,
                error: `Shop limit reached. Max allowed: ${maxShops}. Contact admin to increase limit.`
            });
        }

        // 2. Duplicate check
        const existingShop = await Shop.findOne({
            shopName: shopName.trim(),
            areaCode: manager.areaCode
        });

        if (existingShop) {
            return res.status(400).json({
                success: false,
                error: 'Shop with this name already exists in your area'
            });
        }

        // 3. Area details
        const area = await Area.findOne({ areaCode: manager.areaCode });

        // 4. Shop Create
        const newShop = new Shop({
            shopName: shopName.trim(),
            ownerName: ownerName || manager.name,
            phone: phone || contact,
            contact: contact,
            email: email || '',
            address: {
                line1: address,
                city: area?.city || manager.city || 'Surat',
                state: area?.state || manager.state || 'Gujarat',
                pincode: area?.pincode || '395007'
            },
            icon: icon || '🏪',
            range: parseInt(range) || 5000,

            serviceType: serviceType,
            shopType: mapShopType(serviceType),
            bucket: bucket || manager.bucket || 'EVERY NEW MORNING NEW WAY',
            areaCode: manager.areaCode,
            areaName: area?.areaName || manager.areaName,
            city: area?.city || manager.city,
            state: area?.state || manager.state,
            managerCodes: [manager.managerCode],

            // ✅ CLAIM SYSTEM - Auto assign to manager
            claimedBy: manager.managerCode,
            controlledBy: manager._id,
            ownerId: manager._id,
            createdBy: manager._id,

            location: {
                type: 'Point',
                coordinates: [area?.centerLng || 72.8311, area?.centerLat || 20.3974]
            },

            module: 'local-market',
            status: 'approved',
            isActive: true,
            isVerified: true
        });

        await newShop.save();

        // Manager ka count update
        await Manager.findByIdAndUpdate(manager._id, { $inc: { currentShopCount: 1 } });

        console.log('✅ New shop created:', shopName, '| By:', manager.name);

        res.json({
            success: true,
            message: 'Shop created successfully',
            shop: newShop,
            currentCount: currentShopCount + 1,
            maxShops: maxShops
        });

    } catch (err) {
        console.error('❌ Create shop error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== HELPER FUNCTION ==========
function mapShopType(module) {
    return module || 'general';
}

// File: server/routes/adminRoutes.js
router.get('/admin/all-delivery-managers', async (req, res) => {
    try {
        const managers = await Manager.find({ role: 'delivery-manager' })
        .populate('parentManager', 'name managerCode') // AM ka naam nikalne ke liye
        .select('-loginToken -password');
        
        res.json({ success: true, managers: managers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
// DM LOCATION UPDATE   delevery managery ke liye location 
router.post('/manager/update-location', async (req, res) => {
  try {
    const { token, lat, lng } = req.body;
    await Manager.findOneAndUpdate({ loginToken: token }, { lastLat: lat, lastLng: lng });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
// ========================================
// FILE: routes/manager.js - COMPLETE CODE
// ========================================
const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop'); // Apna Shop model ka path
const Manager = require('../models/Manager'); // Apna Manager model
const Area = require('../models/Area'); // Apna Area model
const authManager = require('../middleware/authManager'); // Middleware

// ✅ ROUTE 1: Manager ke area ki shops - SABSE IMPORTANT
router.get('/manager/shops', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        
        console.log('🔍 Manager Request:', manager.name, '| AreaCode:', manager.areaCode);
        
        // AREA CODE SE DIRECT FILTER - Lat/Lng nahi
        const shops = await Shop.find({ 
            areaCode: manager.areaCode,
            isActive: true
        }).sort({ createdAt: -1 });
        
        console.log('✅ Found shops for', manager.areaCode, ':', shops.length);
        
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

// ✅ ROUTE 2: Token se manager verify karna
router.post('/manager-by-token/:token', async (req, res) => {
    try {
        const { token } = req.params;
        
        // Token se manager nikalo - ye tumhara existing logic
        const manager = await Manager.findOne({ loginToken: token });
        
        if (!manager) {
            return res.status(404).json({ success: false, error: 'Invalid token' });
        }
        
        res.json({ 
            success: true, 
            manager: manager 
        });
        
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ✅ ROUTE 3: Area info + stats
router.get('/manager/area-info', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        const area = await Area.findOne({ areaCode: manager.areaCode });
        const shopCount = await Shop.countDocuments({ areaCode: manager.areaCode });
        
        res.json({
            success: true,
            area: area,
            totalShops: shopCount,
            managerCode: manager.managerCode
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch area info' });
    }
});

// ✅ ROUTE 4: Shop update - Manager edit kar sakta hai
router.put('/manager/shops/:id', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        const shopId = req.params.id;
        
        // Check karo shop isi manager ke area me hai ya nahi
        const shop = await Shop.findById(shopId);
        if (!shop) {
            return res.status(404).json({ error: 'Shop not found' });
        }
        
        if (shop.areaCode !== manager.areaCode) {
            return res.status(403).json({ error: 'You can only edit shops in your area' });
        }
        
        // Update karo - location change nahi kar sakta
        const { location, areaCode, ownerId, ...updateData } = req.body;
        
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

// ✅ ROUTE 5: Manager profile update
router.put('/manager/update-profile', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        const { name, phone, email, photo } = req.body;
        
        const updated = await Manager.findByIdAndUpdate(
            manager._id,
            { 
                $set: { 
                    name, 
                    phone, 
                    email, 
                    photo,
                    updatedAt: new Date()
                } 
            },
            { new: true }
        );
        
        res.json({ success: true, manager: updated });
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
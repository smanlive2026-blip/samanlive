// ========================================
// FILE: routes/manager.js - COMPLETE CODE WITH CLAIM SYSTEM
// ========================================
const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop'); // Apna Shop model ka path
const Manager = require('../models/Manager'); // Apna Manager model
const Area = require('../models/Area'); // Apna Area model
const authManager = require('../middleware/authManager'); // Middleware

// ✅ ROUTE 1: Manager ke CLAIMED shops - UPDATED FOR CLAIM SYSTEM
router.get('/manager/shops', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        
        console.log('🔍 Manager Request:', manager.name, '| ManagerId:', manager._id);
        
        // ✅ CLAIMED SHOPS ONLY - controlledBy se filter
        const shops = await Shop.find({ 
            controlledBy: manager._id,
            isActive: true
        }).sort({ claimedAt: -1 });
        
        console.log('✅ Found claimed shops for', manager.managerCode, ':', shops.length);
        
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

// ✅ ROUTE 2: AVAILABLE SHOPS FOR CLAIM - NEW ROUTE
router.get('/manager/available-shops', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        
        console.log('🔍 Fetching available shops for:', manager.managerCode, '| Area:', manager.areaCode);
        
        // Unclaimed shops in same areaCode with status pending
        const shops = await Shop.find({
            areaCode: manager.areaCode,
            claimedBy: null,
            status: 'pending',
            isActive: true
        }).sort({ createdAt: -1 });
        
        console.log('✅ Found available shops:', shops.length);
        
        res.json({ 
            success: true, 
            shops: shops,
            count: shops.length
        });
        
    } catch (err) {
        console.error('❌ Available shops error:', err);
        res.status(500).json({ error: 'Failed to fetch available shops' });
    }
});

// ✅ ROUTE 3: CLAIM SHOP - NEW ROUTE
router.post('/manager/claim-shop', authManager, async (req, res) => {
    try {
        const { shopId } = req.body;
        const manager = req.manager;

        if (!shopId) {
            return res.status(400).json({ error: 'shopId is required' });
        }

        const shop = await Shop.findById(shopId);
        if (!shop) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        // Check if already claimed
        if (shop.claimedBy) {
            return res.status(400).json({ error: 'Shop already claimed by another manager' });
        }

        // Check if shop is in manager's area
        if (shop.areaCode!== manager.areaCode) {
            return res.status(403).json({ error: 'This shop is not in your area' });
        }

        // Check if manager is in availableForManagers
        if (shop.availableForManagers && shop.availableForManagers.length > 0) {
            if (!shop.availableForManagers.includes(manager.managerCode)) {
                return res.status(403).json({ error: 'You are not assigned to this shop' });
            }
        }

        // Claim the shop
        shop.claimedBy = manager._id;
        shop.claimedAt = new Date();
        shop.controlledBy = manager._id;
        shop.status = 'approved';
        shop.isVerified = true;
        shop.assignedManagerCode = manager.managerCode;
        shop.assignedManagerName = manager.name;
        shop.assignedManagerPhone = manager.phone;
        await shop.save();

        console.log(`✅ Shop claimed: ${shop.shopName} by ${manager.name} [${manager.managerCode}]`);

        res.json({
            success: true,
            message: 'Shop claimed successfully',
            shop: shop
        });
        
    } catch (err) {
        console.error('❌ Claim shop error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ ROUTE 4: Token se manager verify karna
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

// ✅ ROUTE 5: Area info + stats
router.get('/manager/area-info', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        const area = await Area.findOne({ areaCode: manager.areaCode });
        const shopCount = await Shop.countDocuments({ areaCode: manager.areaCode });
        const claimedCount = await Shop.countDocuments({ controlledBy: manager._id });
        
        res.json({
            success: true,
            area: area,
            totalShops: shopCount,
            claimedShops: claimedCount,
            managerCode: manager.managerCode
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch area info' });
    }
});

// ✅ ROUTE 6: Shop update - Manager edit kar sakta hai - UPDATED FOR CLAIM SYSTEM
router.put('/manager/shops/:id', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        const shopId = req.params.id;
        
        // Check karo shop isi manager ke control me hai ya nahi
        const shop = await Shop.findById(shopId);
        if (!shop) {
            return res.status(404).json({ error: 'Shop not found' });
        }
        
        // ✅ CLAIM SYSTEM CHECK: controlledBy check karo
        if (shop.controlledBy?.toString() !== manager._id.toString()) {
            return res.status(403).json({ error: 'You can only edit shops you have claimed' });
        }
        
        // Update karo - location, areaCode, ownerId change nahi kar sakta
        const { location, areaCode, ownerId, claimedBy, controlledBy, ...updateData } = req.body;
        
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

// ✅ ROUTE 7: Manager profile update
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
const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const Area = require('../models/Area');
const authManager = require('../middleware/authManager'); // ✅ Auth middleware

// GET all local-market shops with filters - PUBLIC
router.get('/shops', async (req, res) => {
    try {
        const { category, status, search } = req.query;
        let query = { module: 'local-market' };
        
        if(category) query.category = category;
        if(status) query.status = status;
        else query.status = { $in: ['approved', 'active'] }; // ✅ Default: sirf live shops
        if(search) query.shopName = { $regex: search, $options: 'i' };
        
        const shops = await Shop.find(query).populate('area', 'name').lean();
        const result = shops.map(s => ({ ...s, areaName: s.area?.name }));
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ NEW: GET shops for Area Manager - CLAIMED + AVAILABLE
router.get('/manager/shops', authManager, async (req, res) => {
    try {
        const managerCode = req.manager.managerCode;
        console.log('📍 Fetching shops for manager:', managerCode);

        // 1. Claimed shops - jo is manager ne claim ki hain
        const claimedShops = await Shop.find({
            claimedBy: managerCode,
            module: 'local-market'
        }).lean();

        // 2. Available shops - jo is manager ke area me hain aur pending hain
        const availableShops = await Shop.find({
            availableForManagers: managerCode, // ✅ Is manager ko dikhni chahiye
            claimedBy: null, // ✅ Abhi claim nahi hui
            status: 'pending', // ✅ Pending shops
            module: 'local-market'
        }).lean();

        const allShops = [...claimedShops, ...availableShops];
        console.log(`✅ Found ${claimedShops.length} claimed + ${availableShops.length} available`);

        res.json({ shops: allShops });
    } catch (err) {
        console.error('❌ Manager shops error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ NEW: GET available shops for claim
router.get('/manager/available-shops', authManager, async (req, res) => {
    try {
        const managerCode = req.manager.managerCode;
        
        const shops = await Shop.find({
            availableForManagers: managerCode,
            claimedBy: null,
            status: 'pending',
            module: 'local-market'
        }).populate('area', 'name').lean();

        res.json({ shops });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single shop
router.get('/shops/:id', async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id);
        res.json(shop);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create shop - ✅ LIVE ON CREATE
router.post('/shops', async (req, res) => {
    try {
        const shopData = {
            ...req.body,
            module: 'local-market',
            status: 'approved', // ✅ DIRECT LIVE
            isActive: true, // ✅ ACTIVE
            isVerified: true, // ✅ VERIFIED
            createdAt: new Date()
        };

        const shop = new Shop(shopData);
        await shop.save();
        
        console.log('✅ Shop created LIVE:', shop.shopName);
        res.json(shop);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update shop
router.put('/shops/:id', async (req, res) => {
    try {
        const shop = await Shop.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(shop);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE shop
router.delete('/shops/:id', async (req, res) => {
    try {
        await Shop.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
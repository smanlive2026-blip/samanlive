// ========================================
// FILE: routes/manager.js - ONLY MANAGER DASHBOARD
// Claim system HATA DIYA
// ========================================
const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const Manager = require('../models/Manager');
const Area = require('../models/Area');
const authManager = require('../middleware/authManager');

// 1. OLD LINK REDIRECT
router.get('/shop-dashboard.html', async (req, res) => {
    const shop = await Shop.findById(req.query.shopId).lean();
    if (!shop) return res.status(404).send(`<h1>Shop Not Found</h1>`);
    const shopType = shop.serviceType || shop.shopType || 'common';
    res.redirect(301, `/shop-templates/${shopType}/dashboard.html?shopId=${req.query.shopId}`);
});

// 2. Manager ke shops - Dashboard me list
router.get('/manager/shops', authManager, async (req, res) => {
    const shops = await Shop.find({ 
        controlledBy: req.manager._id, // Banane wala hi owner
        isActive: true
    }).sort({ createdAt: -1 });
    res.json({ success: true, shops: shops });
});

// 3. Token verify
router.post('/manager-by-token/:token', async (req, res) => {
    const manager = await Manager.findOne({ loginToken: req.params.token });
    if (!manager) return res.status(404).json({ success: false, error: 'Invalid token' });
    res.json({ success: true, manager });
});

// 4. Area info
router.get('/manager/area-info', authManager, async (req, res) => {
    const area = await Area.findOne({ areaCode: req.manager.areaCode });
    const shopCount = await Shop.countDocuments({ areaCode: req.manager.areaCode });
    const claimedCount = await Shop.countDocuments({ controlledBy: req.manager._id });
    res.json({ success: true, area, totalShops: shopCount, claimedShops: claimedCount });
});

// 5. Profile update
router.put('/manager/update-profile', authManager, async (req, res) => {
    const updated = await Manager.findByIdAndUpdate(req.manager._id, { $set: req.body }, { new: true });
    res.json({ success: true, manager: updated });
});

module.exports = router;
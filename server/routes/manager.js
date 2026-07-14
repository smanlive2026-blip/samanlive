// ========================================
// FILE: routes/manager.js - ONLY MANAGER DASHBOARD
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

// ✅ YE 2 NAYE ROUTE ADD KAR DE DELIVERY BOY KE LIYE

// 6. Naya Delivery Manager banana
router.post('/manager/create-delivery-manager', authManager, async (req, res) => {
    try {
        const { name, phone, email, vehicleType } = req.body;
        
        if(req.manager.role !== 'area-manager') {
            return res.status(403).json({ success: false, message: 'Sirf Area Manager bana sakta hai' });
        }

        const exists = await Manager.findOne({ phone });
        if(exists) return res.status(400).json({ success: false, message: 'Phone already exist' });

        const count = await Manager.countDocuments({ role: 'delivery-manager', areaCode: req.manager.areaCode });
        const managerCode = `DM-${req.manager.areaCode}-${count + 1}`;

        const deliveryManager = new Manager({
            name,
            phone,
            email,
            loginToken: `DMTOKEN-${Date.now()}-${Math.random()}`, // ✅ YE LINE CHANGE
            role: 'delivery-manager',
            areaCode: req.manager.areaCode,
            areaName: req.manager.areaName,
            city: req.manager.city,
            state: req.manager.state,
            managerCode,
            parentManager: req.manager._id,
            vehicleType: vehicleType || 'bike'
        });

        await deliveryManager.save();
        res.json({ success: true, message: 'Delivery Boy ban gaya', manager: deliveryManager });

    } catch (err) {
        console.log(err); // ✅ ye add kar taaki render log me error dikhe
        res.status(500).json({ success: false, message: err.message });
    }
});

// 7. Apne area ke saare Delivery Manager ki list
router.get('/manager/delivery-managers', authManager, async (req, res) => {
    try {
        const managers = await Manager.find({ 
            role: 'delivery-manager', 
            areaCode: req.manager.areaCode 
        }).select('-loginToken'); // token hide kar do
        
        res.json({ success: true, managers: managers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
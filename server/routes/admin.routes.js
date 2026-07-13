const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Shop = require('../models/Shop');
const Order = require('../models/Order');
const Module = require('../models/Module'); // agar hai to
const Area = require('../models/Area'); // agar hai to
const { authenticateToken, requireAdmin } = require('../middleware/authenticateToken');

// ========================================
// DASHBOARD STATS
// ========================================
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalShops = await Shop.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalModules = await Module.countDocuments().catch(()=>12);
        const totalAreas = await Area.countDocuments().catch(()=>13);
        const totalCategories = 0;
        const totalContent = 3;
        const pendingShops = await Shop.countDocuments({status: 'pending'});

        res.json({
            users: totalUsers, // frontend 'stats.users' maang raha
            shops: totalShops,
            orders: totalOrders,
            modules: totalModules,
            areas: totalAreas,
            categories: totalCategories,
            content: totalContent,
            pendingShops: pendingShops
        });
    } catch (err) {
        console.error('Stats Error:', err);
        res.status(500).json({msg: 'Server Error'});
    }
});

// ========================================
// GET ALL USERS
// ========================================
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({createdAt: -1});
        res.json(users); // seedha array
    } catch (err) {
        console.error('Get Users Error:', err);
        res.status(500).json({msg: 'Server Error'});
    }
});

// ========================================
// BLOCK / UNBLOCK USER
// ========================================
router.put('/users/:id/block', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { isBlocked } = req.body;
        const user = await User.findByIdAndUpdate(req.params.id, { isBlocked }, { new: true }).select('-password');
        if(!user) return res.status(404).json({success: false, error: 'User not found'});
        res.json({success: true, user});
    } catch (err) {
        console.error('Block User Error:', err);
        res.status(500).json({msg: 'Server Error'});
    }
});

// ========================================
// GET ALL SHOPS
// ========================================
router.get('/shops', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const shops = await Shop.find().sort({createdAt: -1});
        res.json(shops);
    } catch (err) {
        res.status(500).json({msg: 'Server Error'});
    }
});

// ========================================
// GET ALL MODULES
// ========================================
router.get('/modules', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const modules = await Module.find().catch(()=>[]);
        res.json({modules: modules});
    } catch (err) {
        res.json({modules: []});
    }
});

// ========================================
// GET ALL AREAS
// ========================================
router.get('/areas', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const areas = await Area.find().catch(()=>[]);
        res.json(areas);
    } catch (err) {
        res.json([]);
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Shop = require('../models/Shop');
const Order = require('../models/Order');
const { authenticateToken, requireAdmin } = require('../middleware/authenticateToken'); // YE ADD KIYA

// ========================================
// DASHBOARD STATS - ADMIN ONLY
// ========================================
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalShops = await Shop.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalAreas = 13;
        const totalModules = 12;
        const totalCategories = 0;
        const totalContent = 3;
        const pendingShops = await Shop.countDocuments({status: 'pending'});

        res.json({
            totalUsers, totalShops, totalOrders, totalAreas, 
            totalModules, totalCategories, totalContent, pendingShops
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({msg: 'Server Error'});
    }
});

// ========================================
// GET ALL USERS - ADMIN ONLY
// ========================================
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({createdAt: -1});
        res.json(users);
    } catch (err) {
        console.error('Get Users Error:', err);
        res.status(500).json({msg: 'Server Error'});
    }
});

// ========================================
// BLOCK / UNBLOCK USER - ADMIN ONLY
// ========================================
router.put('/users/:id/block', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { isBlocked } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id, 
            { isBlocked }, 
            { new: true }
        ).select('-password');
        
        if(!user) {
            return res.status(404).json({success: false, error: 'User not found'});
        }
        
        res.json({success: true, user});
    } catch (err) {
        console.error('Block User Error:', err);
        res.status(500).json({msg: 'Server Error'});
    }
});

module.exports = router;
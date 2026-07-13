const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Shop = require('../models/Shop');
const Order = require('../models/Order');

// ========================================
// DASHBOARD STATS
// ========================================
router.get('/admin/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalShops = await Shop.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalAreas = 13; // tu hardcode kar raha tha
        const totalModules = 12;
        const totalCategories = 0;
        const totalContent = 3;
        const pendingShops = await Shop.countDocuments({status: 'pending'});

        res.json({
            totalUsers,
            totalShops,
            totalOrders,
            totalAreas,
            totalModules,
            totalCategories,
            totalContent,
            pendingShops
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({msg: 'Server Error'});
    }
});

// ========================================
// GET ALL USERS - ADMIN PAGE KE LIYE
// ========================================
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({createdAt: -1});
        res.json(users); // seedha array bhej raha
    } catch (err) {
        console.error('Get Users Error:', err);
        res.status(500).json({msg: 'Server Error'});
    }
});

// ========================================
// BLOCK / UNBLOCK USER
// ========================================
router.put('/users/:id/block', async (req, res) => {
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

// ========================================
// GET SINGLE USER DETAILS
// ========================================
router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if(!user) {
            return res.status(404).json({success: false, error: 'User not found'});
        }
        res.json(user);
    } catch (err) {
        console.error('Get User Error:', err);
        res.status(500).json({msg: 'Server Error'});
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken } = require('../middleware/authenticateToken');

// Middleware: Sirf admin check
const isAdmin = (req, res, next) => {
    if(req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access only' });
    }
    next();
};

// ========================================
// GET /api/admin/users - GET ALL USERS
// ========================================
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { search = '', status = 'all', role = 'all' } = req.query;
        
        let query = { status: { $ne: 'deleted' } };

        // Search
        if(search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Status filter
        if(status !== 'all') {
            query.status = status;
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(500)
            .lean();

        // Frontend ke format me convert
        const formatted = users.map(u => ({
            _id: u._id,
            name: u.name,
            phone: u.phone,
            email: u.email,
            role: 'user', // tere model me role nahi hai isliye default user
            isBlocked: u.status === 'blocked',
            orderCount: u.totalOrders || 0,
            walletBalance: 0,
            createdAt: u.createdAt,
            addresses: u.addresses?.map(a => ({
                fullAddress: `${a.line1}, ${a.city}, ${a.state} - ${a.pincode}`
            }))
        }));

        res.json({ success: true, users: formatted });
    } catch(err) {
        console.error('Get Users Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========================================
// PUT /api/admin/users/:id/block - BLOCK/UNBLOCK
// ========================================
router.put('/users/:id/block', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { isBlocked } = req.body;
        const status = isBlocked ? 'blocked' : 'active';

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).select('-password');

        if(!user) return res.status(404).json({ success: false, error: 'User not found' });

        res.json({ success: true, user });
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
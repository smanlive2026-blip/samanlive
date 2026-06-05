const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const User = require('../models/User');
const auth = require('../middleware/auth');

// POST /api/shop/create - Create new shop
router.post('/shop/create', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        // Check if user already has a shop
        if (user.shopId) {
            return res.status(400).json({ success: false, error: 'You already have a shop' });
        }

        const shopData = {
            ownerId: req.userId,
            shopName: req.body.shopName,
            ownerName: req.body.ownerName,
            phone: req.body.phone,
            email: req.body.email,
            address: req.body.address,
            serviceType: req.body.serviceType,
            description: req.body.description,
            location: req.body.location
        };

        const shop = new Shop(shopData);
        await shop.save();

        // Update user with shopId
        user.shopId = shop._id;
        await user.save();

        // Send notification
        user.notifications.push({
            type: 'shop',
            title: 'Shop Created Successfully!',
            message: `Your shop "${shop.shopName}" is under review. We'll notify you once approved.`,
            actionUrl: '/shop/dashboard'
        });
        await user.save();

        res.json({ success: true, shop, message: 'Shop created, pending approval' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/shop/my-shop - Get user's shop
router.get('/shop/my-shop', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user.shopId) {
            return res.json({ success: false, error: 'No shop found' });
        }

        const shop = await Shop.findById(user.shopId);
        res.json({ success: true, shop });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
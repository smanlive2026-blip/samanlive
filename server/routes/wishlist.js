const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/authenticateToken');

// GET /api/user/wishlist - Get all wishlist items with product details
router.get('/user/wishlist', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .populate({
                path: 'wishlist',
                select: 'name price oldPrice image shopName',
                populate: { path: 'shopId', select: 'shopName' }
            });

        const items = user.wishlist.map(product => ({
            _id: product._id,
            name: product.name,
            price: product.price,
            oldPrice: product.oldPrice,
            image: product.image,
            shopName: product.shopId?.shopName || 'SAMANLIVE Store'
        }));

        res.json({ success: true, items });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/user/wishlist/:productId - Add to wishlist
router.post('/user/wishlist/:productId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const productId = req.params.productId;

        // Check if already in wishlist
        if (user.wishlist.includes(productId)) {
            return res.status(400).json({ success: false, error: 'Already in wishlist' });
        }

        user.wishlist.push(productId);
        await user.save();

        res.json({ success: true, message: 'Added to wishlist' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/user/wishlist/:productId - Remove from wishlist
router.delete('/user/wishlist/:productId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const productId = req.params.productId;

        user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
        await user.save();

        res.json({ success: true, message: 'Removed from wishlist' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
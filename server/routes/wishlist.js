const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product'); // ← Ye add kiya
const auth = require('../middleware/authenticateToken');

// ==================== GET /api/user/wishlist ====================
// Get all wishlist items with product details
router.get('/user/wishlist', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId)
           .populate({
                path: 'wishlist',
                select: 'name price oldPrice images shopName stock',
                populate: { path: 'shopId', select: 'shopName icon' }
            });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const items = user.wishlist.map(product => ({
            _id: product._id,
            name: product.name,
            price: product.price,
            oldPrice: product.oldPrice,
            image: product.images && product.images.length > 0? product.images[0] : '',
            shopName: product.shopId?.shopName || product.shopName || 'SAMANLIVE Store',
            shopIcon: product.shopId?.icon || '🏪',
            inStock: product.stock > 0
        }));

        res.json({
            success: true,
            items,
            count: items.length
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== POST /api/user/wishlist/:productId ====================
// Add to wishlist
router.post('/user/wishlist/:productId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const productId = req.params.productId;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        // Check if already in wishlist
        if (user.wishlist.includes(productId)) {
            return res.status(400).json({ success: false, error: 'Already in wishlist' });
        }

        user.wishlist.push(productId);
        await user.save();

        res.json({
            success: true,
            message: 'Added to wishlist',
            wishlistCount: user.wishlist.length
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== DELETE /api/user/wishlist/:productId ====================
// Remove from wishlist
router.delete('/user/wishlist/:productId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const productId = req.params.productId;
        const initialLength = user.wishlist.length;

        user.wishlist = user.wishlist.filter(id => id.toString()!== productId);

        if (user.wishlist.length === initialLength) {
            return res.status(404).json({ success: false, error: 'Product not in wishlist' });
        }

        await user.save();

        res.json({
            success: true,
            message: 'Removed from wishlist',
            wishlistCount: user.wishlist.length
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== GET /api/user/wishlist/check/:productId ====================
// Check if product is in wishlist - NAYA ROUTE
router.get('/user/wishlist/check/:productId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('wishlist');
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const isInWishlist = user.wishlist.includes(req.params.productId);

        res.json({
            success: true,
            isInWishlist
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== DELETE /api/user/wishlist ====================
// Clear entire wishlist - NAYA ROUTE
router.delete('/user/wishlist', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        user.wishlist = [];
        await user.save();

        res.json({
            success: true,
            message: 'Wishlist cleared',
            wishlistCount: 0
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

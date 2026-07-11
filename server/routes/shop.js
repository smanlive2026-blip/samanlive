const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const Order = require('../models/Order');
const auth = require('../middleware/authenticateToken');

// ========================================
// 1. PUBLIC SHOPS - Customer app/website
// Location filter hata diya. Ye ab locationRoutes.js se aayega
// ========================================
router.get('/public', async (req, res) => {
    try {
        const { shopType, categoryId, serviceType } = req.query;
        let query = { status: { $in: ['approved', 'active'] }, isActive: true };

        if (shopType) query.shopType = shopType;
        if (categoryId) query.categoryId = categoryId;
        if (serviceType) query.serviceType = serviceType;

        const shops = await Shop.find(query)
            .select('-ownerId -approvedBy -rejectionReason -email')
            .limit(100)
            .sort({ priority: -1, rating: -1 });
        res.json({ success: true, count: shops.length, data: shops });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========================================
// 2. NEARBY SHOPS - DELETE KIYA
// Ab ye kaam /api/location/nearby-shops karega
// ========================================
// router.get('/nearby', ...)  // PURA DELETE

// ========================================
// 3. SHOP DETAILS
// ========================================
router.get('/shops/:id', async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id).lean();
        if (!shop) return res.status(404).json({ error: 'Shop not found' });
        res.json(shop);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// 4. DASHBOARD STATS
// ========================================
router.get('/shops/:shopId/stats', auth, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.user.id || shop.createdBy?.toString() === req.user.id;
        const isManager = shop.controlledBy?.toString() === req.user.id;
        if (!isOwner && !isManager && req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

        const products = shop.items || [];
        const today = new Date(); 
        today.setHours(0, 0, 0, 0);
        const todayOrders = await Order.countDocuments({ shopId: shop._id, createdAt: { $gte: today } });

        let stats = { totalProducts: products.length, todayOrders };
        if (shop.shopType === 'kirana') stats.lowStock = products.filter(p => p.stock && p.stock < 10).length;
        if (['restaurant','service','rental'].includes(shop.shopType)) {
            stats.activeOrders = await Order.countDocuments({ shopId: shop._id, status: { $in: ['pending', 'preparing', 'in-progress'] } });
        }
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// 5. PRODUCTS CRUD
// ========================================
router.get('/shops/:shopId/products', async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });
        res.json(shop.items || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/products', auth, async (req, res) => {
    try {
        const { shopId, ...productData } = req.body;
        const shop = await Shop.findById(shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.user.id || shop.createdBy?.toString() === req.user.id;
        const isManager = shop.controlledBy?.toString() === req.user.id;
        if (!isOwner && !isManager && req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

        shop.items.push(productData);
        await shop.save();
        res.status(201).json(shop.items[shop.items.length - 1]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/products/:shopId/:productId', auth, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });
        const product = shop.items.id(req.params.productId);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        Object.assign(product, req.body);
        await shop.save();
        res.json(product);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/products/:shopId/:productId', auth, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });
        shop.items.pull({ _id: req.params.productId });
        await shop.save();
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// 6. UPDATE SHOP
// Location update wala code hata diya. Ab sirf normal info update hoga
// ========================================
router.put('/shops/:id', auth, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.user.id || shop.createdBy?.toString() === req.user.id;
        const isManager = shop.controlledBy?.toString() === req.user.id;
        if (!isOwner && !isManager && req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

        // location wala if block delete kar diya
        Object.assign(shop, req.body);
        shop.updatedAt = new Date();
        await shop.save();
        res.json(shop);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
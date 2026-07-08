const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const Order = require('../models/Order');
const auth = require('../middleware/authenticateToken');

// ========================================
// 1. PUBLIC SHOPS - Customer app/website
// ========================================
router.get('/public', async (req, res) => {
    try {
        const { lat, lng, radius = 5000, shopType, categoryId, serviceType } = req.query;
        let query = { status: { $in: ['approved', 'active'] }, isActive: true };

        if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
            query.location = { 
                $near: { 
                    $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] }, 
                    $maxDistance: parseInt(radius) 
                } 
            };
        }
        if (shopType) query.shopType = shopType;
        if (categoryId) query.categoryId = categoryId;
        if (serviceType) query.serviceType = serviceType;

        const shops = await Shop.find(query)
            .select('-ownerId -approvedBy -rejectionReason -email')
            .limit(50)
            .sort({ priority: -1, rating: -1 });
        res.json({ success: true, count: shops.length, data: shops });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========================================
// 2. NEARBY SHOPS
// ========================================
router.get('/nearby', async (req, res) => {
    try {
        const { lat, lng, radius = 5000, type } = req.query;
        if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

        const query = { 
            status: { $in: ['approved', 'active'] }, 
            isActive: true, 
            location: { 
                $near: { 
                    $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] }, 
                    $maxDistance: parseInt(radius) 
                } 
            } 
        };
        if (type) query.shopType = type;

        const shops = await Shop.find(query).limit(50);
        res.json(shops);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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
// ========================================
router.put('/shops/:id', auth, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.user.id || shop.createdBy?.toString() === req.user.id;
        const isManager = shop.controlledBy?.toString() === req.user.id;
        if (!isOwner && !isManager && req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

        if (req.body.location?.coordinates) {
            req.body.location = { type: 'Point', coordinates: [parseFloat(req.body.location.coordinates[0]), parseFloat(req.body.location.coordinates[1])] };
        }
        Object.assign(shop, req.body);
        shop.updatedAt = new Date();
        await shop.save();
        res.json(shop);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
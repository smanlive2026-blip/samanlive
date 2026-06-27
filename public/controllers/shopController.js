const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Shop = require('../models/Shop');
const Order = require('../models/Order');
const auth = require('../middleware/authenticateToken');

// ✅ CREATE SHOP - Frontend se call ho raha hai
router.post('/shops', auth, async (req, res) => {
    try {
        const shopData = {
           ...req.body,
            ownerId: req.user.id,
            createdBy: req.user.id,
            status: 'approved',
            isActive: true,
            logo: req.body.logo || '',
            locationType: req.body.locationType || 'fixed',
            range: req.body.range || 5000,
            lastLocationUpdate: req.body.locationType === 'dynamic'? new Date() : null
        };

        const shop = new Shop(shopData);
        await shop.save();
        console.log(`✅ Shop created: ${shop.shopName} [${shop.locationType}] Range: ${shop.range}m`);
        res.status(201).json(shop);
    } catch (err) {
        console.error('Create shop error:', err);
        res.status(400).json({ error: err.message });
    }
});

// ✅ GET MY SHOPS - Check karne ke liye user ki shop hai ya nahi
router.get('/my-shops', auth, async (req, res) => {
    try {
        const shops = await Shop.find({
            $or: [
                { ownerId: req.user.id },
                { createdBy: req.user.id }
            ]
        });
        res.json(shops);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ FIXED: PUBLIC SHOPS - LOCATION FILTER HATA DIYA, SAB SHOPS LIVE
router.get('/public', async (req, res) => {
    try {
        const { shopType, categoryId, serviceType } = req.query;

        let query = {
            status: { $in: ['approved', 'active'] },
            isActive: true
        };

        if (shopType) query.shopType = shopType;
        if (categoryId) query.categoryId = categoryId;
        if (serviceType) query.serviceType = serviceType;

        console.log('🔍 Fetching ALL public shops - No location filter');

        const shops = await Shop.find(query)
           .select('-ownerId -approvedBy -rejectionReason -email -phone')
           .limit(100)
           .sort({ rating: -1, totalOrders: -1, createdAt: -1 });

        res.status(200).json({
            success: true,
            count: shops.length,
            data: shops
        });
    } catch (err) {
        console.error('Get public shops error:', err);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: err.message
        });
    }
});

// ===== SHOP DETAILS - Ye /public ke BAAD aana chahiye =====
router.get('/shops/:id', async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id).lean();
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        if (!shop.logo) shop.logo = '';

        res.json(shop);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== DASHBOARD STATS =====
router.get('/shops/:shopId/stats', auth, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.user.id || shop.createdBy?.toString() === req.user.id;
        const isManager = shop.managerId?.toString() === req.user.id;

        if (!isOwner &&!isManager && req.user.role!== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const products = shop.items || [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayOrders = await Order.countDocuments({
            shopId: shop._id,
            createdAt: { $gte: today }
        });

        let stats = {
            totalProducts: products.length,
            todayOrders
        };

        switch(shop.shopType) {
            case 'kirana':
                stats.lowStock = products.filter(p => p.stock && p.stock < 10).length;
                break;
            case 'cloth':
                stats.totalVariants = products.length;
                break;
            case 'restaurant':
                stats.activeOrders = await Order.countDocuments({
                    shopId: shop._id,
                    status: { $in: ['pending', 'preparing'] }
                });
                break;
            case 'service':
            case 'rental':
                stats.activeOrders = await Order.countDocuments({
                    shopId: shop._id,
                    status: { $in: ['pending', 'in-progress'] }
                });
                break;
        }

        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== GET PRODUCTS - From items[] array =====
router.get('/shops/:shopId/products', async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const products = (shop.items || []).map((item, index) => ({
            _id: item._id || index,
           ...item.toObject? item.toObject() : item
        }));

        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== GET SINGLE PRODUCT =====
router.get('/products/:shopId/:productId', auth, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const product = shop.items.id(req.params.productId);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== CREATE PRODUCT - Push to items[] =====
router.post('/products', auth, async (req, res) => {
    try {
        const { shopId,...productData } = req.body;

        const shop = await Shop.findById(shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.user.id || shop.createdBy?.toString() === req.user.id;
        const isManager = shop.managerId?.toString() === req.user.id;

        if (!isOwner &&!isManager && req.user.role!== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        shop.items.push(productData);
        await shop.save();

        const newProduct = shop.items[shop.items.length - 1];
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ===== UPDATE PRODUCT - Update in items[] =====
router.put('/products/:shopId/:productId', auth, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.user.id || shop.createdBy?.toString() === req.user.id;
        const isManager = shop.managerId?.toString() === req.user.id;

        if (!isOwner &&!isManager && req.user.role!== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const product = shop.items.id(req.params.productId);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        Object.assign(product, req.body);
        await shop.save();

        res.json(product);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ===== DELETE PRODUCT - Remove from items[] =====
router.delete('/products/:shopId/:productId', auth, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.user.id || shop.createdBy?.toString() === req.user.id;
        const isManager = shop.managerId?.toString() === req.user.id;

        if (!isOwner &&!isManager && req.user.role!== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        shop.items.pull({ _id: req.params.productId });
        await shop.save();

        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== UPDATE SHOP - Logo support added =====
router.put('/shops/:id', auth, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.user.id || shop.createdBy?.toString() === req.user.id;
        const isManager = shop.managerId?.toString() === req.user.id;

        if (!isOwner &&!isManager && req.user.role!== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (req.body.location && req.body.location.coordinates) {
            req.body.location = {
                type: 'Point',
                coordinates: [
                    parseFloat(req.body.location.coordinates[0]),
                    parseFloat(req.body.location.coordinates[1])
                ]
            };
        }

        if (req.body.logo!== undefined) {
            req.body.logo = req.body.logo;
        }

        Object.assign(shop, req.body);
        shop.updatedAt = new Date();
        await shop.save();

        res.json(shop);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ✅ FIXED: NEARBY SHOPS - AB YE BHI SAB SHOPS RETURN KAREGA, LOCATION FILTER NAHI
router.get('/nearby', async (req, res) => {
    try {
        const { type } = req.query;

        console.log('🔍 Fetching ALL shops from /nearby - No location filter');

        let query = {
            status: { $in: ['approved', 'active'] },
            isActive: true
        };

        if (type) query.shopType = type;

        const shops = await Shop.find(query)
       .select('-ownerId -approvedBy -rejectionReason -email')
       .sort({ rating: -1, totalOrders: -1, createdAt: -1 })
       .limit(100)
       .lean();

        console.log(`✅ Returning ${shops.length} shops from /nearby`);

        res.json({
            success: true,
            count: shops.length,
            data: shops
        });

    } catch (err) {
        console.error('❌ Nearby shops error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
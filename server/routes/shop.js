// ========================================
// Ye API shop-create.html ke form submit ke liye bani hai
// shop-create.html -> POST /api/local-market/shops
// ========================================
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Shop = require('../models/Shop');
const Order = require('../models/Order');
const auth = require('../middleware/authenticateToken');

// ✅ FIXED: CREATE SHOP - managerCodes explicitly save karo
// Ye API shop-create.html ke liye hai - User shop create karta hai
router.post('/shops', auth, async (req, res) => {
    try {
        const { managerCodes,...restData } = req.body;

        // ✅ Validation: managerCodes required hai
        if (!managerCodes ||!Array.isArray(managerCodes) || managerCodes.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Please select at least one Area Manager'
            });
        }

        const shopData = {
           ...restData,
            managerCodes: managerCodes, // ✅ Explicitly save karo
            ownerId: req.user.id,
            createdBy: req.user.id,
            status: 'approved',
            isActive: true,
            logo: req.body.logo || ''
        };

        const shop = new Shop(shopData);
        await shop.save();
        res.status(201).json(shop);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ✅ GET MY SHOPS - User apni shops check karne ke liye
// Ye API profile.html ya user dashboard ke liye hai
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

// ✅ PUBLIC SHOPS - Customer app/website ke liye
// Ye API user-view.html ya public shop listing ke liye hai
router.get('/public', async (req, res) => {
    try {
        const { lat, lng, radius = 5000, shopType, categoryId, serviceType } = req.query;

        let query = {
            status: { $in: ['approved', 'active'] },
            isActive: true
        };

        if (lat && lng &&!isNaN(parseFloat(lat)) &&!isNaN(parseFloat(lng))) {
            query.location = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)] // LNG pehle
                    },
                    $maxDistance: parseInt(radius) || 5000
                }
            };
        }

        if (shopType) query.shopType = shopType;
        if (categoryId) query.categoryId = categoryId;
        if (serviceType) query.serviceType = serviceType;

        console.log('Public Shops Query:', JSON.stringify(query));

        const shops = await Shop.find(query)
           .select('-ownerId -approvedBy -rejectionReason -email')
           .limit(50)
           .sort({ priority: -1, rating: -1, createdAt: -1 });

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

// ===== SHOP DETAILS - Public shop details ke liye =====
// Ye API user-view.html me single shop details ke liye hai
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

// ===== DASHBOARD STATS - Shop dashboard ke liye =====
// Ye API shop-templates/*/dashboard.html ke liye hai
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

// ===== GET PRODUCTS - Shop products list ke liye =====
// Ye API shop-templates/*/dashboard.html aur user-view.html ke liye hai
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

// ===== GET SINGLE PRODUCT - Product edit ke liye =====
// Ye API shop-templates/*/dashboard.html me edit product ke liye hai
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

// ===== CREATE PRODUCT - Product add karne ke liye =====
// Ye API shop-templates/*/dashboard.html me add product ke liye hai
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

// ===== UPDATE PRODUCT - Product update ke liye =====
// Ye API shop-templates/*/dashboard.html me edit product ke liye hai
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

// ===== DELETE PRODUCT - Product delete ke liye =====
// Ye API shop-templates/*/dashboard.html me delete product ke liye hai
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

// ===== UPDATE SHOP - Shop edit karne ke liye =====
// Ye API area-manager.html aur shop dashboard se shop edit ke liye hai
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

// ===== NEARBY SHOPS - Customer app ke liye =====
// Ye API customer app me nearby shops dikhane ke liye hai
router.get('/nearby', async (req, res) => {
    try {
        const { lat, lng, radius = 5000, type } = req.query;

        if (!lat ||!lng) {
            return res.status(400).json({ error: 'lat and lng required' });
        }

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

module.exports = router;
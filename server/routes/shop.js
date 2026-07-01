// ========================================
// FILE: routes/shop.js - FINAL CLAIM SYSTEM READY
// Shop bante hi LIVE + Manager ko dikhegi
// ========================================
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Shop = require('../models/Shop');
const Order = require('../models/Order');
const Manager = require('../models/Manager');
const auth = require('../middleware/authenticateToken');

const JWT_SECRET = process.env.JWT_SECRET || 'samanlive_secret_key_2026_change_this';

// ✅ CREATE SHOP - LIVE ON CREATE + CLAIM SYSTEM
router.post('/shops', async (req, res) => {
    let userId = null;

    // Token hai to user nikalo, nahi to null - shop phir bhi banegi
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            userId = decoded.id || decoded.userId;
        } catch (err) {
            console.log('Token invalid, creating shop without owner');
        }
    }

    try {
        const { managerCodes, areaCode,...restData } = req.body;

        // ✅ Validation 1: managerCodes required hai
        if (!managerCodes ||!Array.isArray(managerCodes) || managerCodes.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Please select at least one Area Manager'
            });
        }

        // ✅ Validation 2: areaCode required hai
        if (!areaCode || areaCode.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Area code is required. Please select a valid area.'
            });
        }

        const shopData = {
           ...restData,
            managerCodes: managerCodes,
            areaCode: areaCode.trim().toUpperCase(),
            ownerId: userId,
            createdBy: userId,

            // ✅ LIVE ON CREATE - Teri requirement
            status: 'active', // 'pending' nahi, direct 'active'
            isActive: true,
            isVerified: true,

            // ✅ CLAIM SYSTEM SPECIFIC FIELDS
            availableForManagers: managerCodes, // In managers ko shop dikhegi
            assignedManagerCode: managerCodes[0] || null, // Primary manager
            assignedManagerName: restData.assignedManagerName || null,
            assignedManagerPhone: restData.assignedManagerPhone || null,
            claimedBy: null, // Abhi kisi ne claim nahi ki
            claimedAt: null,
            controlledBy: null,

            logo: req.body.logo || '',
            locationType: req.body.locationType || 'fixed',
            range: req.body.range || 5000,
            lastLocationUpdate: req.body.locationType === 'dynamic'? new Date() : null,
            createdAt: new Date()
        };

        console.log('📤 Creating shop LIVE:', shopData.shopName, '| areaCode:', shopData.areaCode, '| status:', shopData.status, '| managers:', shopData.managerCodes);

        const shop = new Shop(shopData);
        await shop.save();

        console.log('✅ Shop created LIVE:', shop.shopName, '| ID:', shop._id, '| areaCode:', shop.areaCode, '| Status:', shop.status);

        res.status(201).json({
            success: true,
            shop: shop,
            _id: shop._id
        });
    } catch (err) {
        console.error('❌ Shop create error:', err);
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
});

// ✅ GET SHOPS FOR AREA MANAGER - CLAIMED + AVAILABLE
router.get('/manager/shops', auth, async (req, res) => {
    try {
        const manager = await Manager.findById(req.user.id);
        if (!manager) {
            return res.status(403).json({ success: false, error: 'Manager not found' });
        }

        const managerCode = manager.managerCode;
        console.log('📍 Fetching shops for manager:', managerCode);

        // 1. Claimed shops - jo is manager ne claim ki hain
        const claimedShops = await Shop.find({
            claimedBy: managerCode,
            module: 'local-market'
        }).lean();

        // 2. Available shops - jo is manager ke liye available hain
        const availableShops = await Shop.find({
            availableForManagers: managerCode, // ✅ Array me managerCode hai
            claimedBy: null, // ✅ Abhi claim nahi hui
            status: 'active', // ✅ Live shops
            module: 'local-market'
        }).lean();

        const allShops = [...claimedShops,...availableShops];
        console.log(`✅ Found ${claimedShops.length} claimed + ${availableShops.length} available`);

        res.json({ shops: allShops });
    } catch (err) {
        console.error('❌ Manager shops error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ GET AVAILABLE SHOPS FOR CLAIM
router.get('/manager/available-shops', auth, async (req, res) => {
    try {
        const manager = await Manager.findById(req.user.id);
        if (!manager) {
            return res.status(403).json({ success: false, error: 'Manager not found' });
        }

        const managerCode = manager.managerCode;

        const shops = await Shop.find({
            availableForManagers: managerCode,
            claimedBy: null,
            status: 'active',
            module: 'local-market'
        }).populate('area', 'name').lean();

        res.json({ shops });
    } catch (err) {
        console.error('❌ Available shops error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ CLAIM SHOP - Area Manager ke liye - NAYA ROUTE
router.post('/manager/claim-shop', auth, async (req, res) => {
    try {
        const { shopId } = req.body;

        const manager = await Manager.findById(req.user.id);
        if (!manager) {
            return res.status(403).json({ success: false, error: 'Manager not found' });
        }

        const shop = await Shop.findById(shopId);
        if (!shop) {
            return res.status(404).json({ success: false, error: 'Shop not found' });
        }

        // Check if shop is available for this manager
        if (!shop.availableForManagers.includes(manager.managerCode)) {
            return res.status(403).json({ success: false, error: 'Shop not available for you' });
        }

        // Check if already claimed
        if (shop.claimedBy) {
            return res.status(400).json({ success: false, error: 'Shop already claimed' });
        }

        // Claim the shop
        shop.claimedBy = manager.managerCode;
        shop.claimedAt = new Date();
        shop.controlledBy = manager.managerCode;
        shop.status = 'active';
        shop.isVerified = true;

        await shop.save();

        console.log(`✅ Shop claimed: ${shop.shopName} by ${manager.managerCode}`);
        res.json({ success: true, shop });
    } catch (err) {
        console.error('Claim shop error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ✅ UPDATE SHOP - Manager ke liye
router.put('/manager/shops/:shopId', auth, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ success: false, error: 'Shop not found' });

        const manager = await Manager.findById(req.user.id);
        if (!manager) return res.status(403).json({ success: false, error: 'Manager not found' });

        // Check if manager owns this shop
        if (shop.claimedBy!== manager.managerCode && shop.controlledBy!== manager.managerCode) {
            return res.status(403).json({ success: false, error: 'Access denied' });
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

        Object.assign(shop, req.body);
        shop.updatedAt = new Date();
        await shop.save();

        res.json({ success: true, shop });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// ✅ GET MY SHOPS - User apni shops check karne ke liye
router.get('/my-shops', auth, async (req, res) => {
    try {
        const shops = await Shop.find({
            $or: [
                { ownerId: req.user.id },
                { createdBy: req.user.id }
            ]
        }).sort({ createdAt: -1 });
        res.json(shops);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ PUBLIC SHOPS - Customer app/website ke liye
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
                        coordinates: [parseFloat(lng), parseFloat(lat)]
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
router.get('/shops/:shopId/stats', auth, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.user.id || shop.createdBy?.toString() === req.user.id;
        const isManager = shop.managerId?.toString() === req.user.id || shop.controlledBy?.toString() === req.user.id || shop.claimedBy === req.user.id;

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
router.post('/products', auth, async (req, res) => {
    try {
        const { shopId,...productData } = req.body;

        const shop = await Shop.findById(shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.user.id || shop.createdBy?.toString() === req.user.id;
        const isManager = shop.managerId?.toString() === req.user.id || shop.controlledBy?.toString() === req.user.id || shop.claimedBy === req.user.id;

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
router.put('/products/:shopId/:productId', auth, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.user.id || shop.createdBy?.toString() === req.user.id;
        const isManager = shop.managerId?.toString() === req.user.id || shop.controlledBy?.toString() === req.user.id || shop.claimedBy === req.user.id;

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
router.delete('/products/:shopId/:productId', auth, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.user.id || shop.createdBy?.toString() === req.user.id;
        const isManager = shop.managerId?.toString() === req.user.id || shop.controlledBy?.toString() === req.user.id || shop.claimedBy === req.user.id;

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
router.put('/shops/:id', auth, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.user.id || shop.createdBy?.toString() === req.user.id;
        const isManager = shop.managerId?.toString() === req.user.id || shop.controlledBy?.toString() === req.user.id || shop.claimedBy === req.user.id;

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
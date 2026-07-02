const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Shop = require('../models/Shop');
const Order = require('../models/Order');
const Manager = require('../models/Manager');
const { authenticateToken } = require('../middleware/authenticateToken');
const authManager = require('../middleware/authManager');

// ✅ CREATE SHOP V2 - Manager se create hone wala - NAYA ROUTE
router.post('/manager/create-shop-v2', authenticateToken, async (req, res) => {
    try {
        const { shopName, shopType, contact, email, address, icon, range } = req.body;
        const manager = req.user;

        if (!shopName ||!shopType ||!contact ||!address) {
            return res.status(400).json({
                success: false,
                error: 'Required fields missing: shopName, shopType, contact, address'
            });
        }

        // Manager ka count check karo
        if (manager.currentShopCount >= manager.maxShops) {
            return res.status(400).json({
                success: false,
                error: `Shop limit reached! Max allowed: ${manager.maxShops}`
            });
        }

        const shopData = {
            shopName: shopName.trim(),
            serviceType: shopType,
            shopType: shopType,
            ownerName: manager.name,
            ownerId: req.userId,
            createdBy: req.userId,
            areaCode: manager.areaCode,
            managerCodes: [manager.managerCode],
            contact: contact,
            email: email || manager.email || '',
            address: {
                line1: address,
                city: manager.city || 'Surat',
                state: manager.state || 'Gujarat',
                pincode: manager.pincode || '395007'
            },
            icon: icon || '🏪',
            range: parseInt(range) || 5000,
            status: 'active',
            isActive: true,
            isVerified: true,
            module: 'local-market',
            locationType: 'fixed',
            location: {
                type: 'Point',
                coordinates: [72.8311, 21.1702] // Default Surat
            },
            createdAt: new Date()
        };

        console.log(`📤 Creating shop via V2: ${shopData.shopName} | areaCode: ${shopData.areaCode}`);

        const shop = new Shop(shopData);
        await shop.save();

        // Manager ka count update karo
        await Manager.findByIdAndUpdate(manager._id, {
            $inc: { currentShopCount: 1 }
        });

        console.log(`✅ Shop created LIVE: ${shop.shopName} | ID: ${shop._id}`);

        res.status(201).json({
            success: true,
            shop: shop,
            currentCount: manager.currentShopCount + 1,
            maxShops: manager.maxShops
        });
    } catch (err) {
        console.error('❌ Create shop V2 error:', err);
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
});

// ✅ CREATE SHOP - LIVE ON CREATE + areaCode + managerCodes
router.post('/shops', authenticateToken, async (req, res) => {
    try {
        const { areaCode, managerCodes,...restData } = req.body;

        if (!areaCode || areaCode.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Area code is required. Please select a valid area.'
            });
        }

        if (!managerCodes ||!Array.isArray(managerCodes) || managerCodes.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Please select at least one Area Manager'
            });
        }

        const shopData = {
        ...restData,
            ownerId: req.userId,
            createdBy: req.userId,
            areaCode: areaCode.trim().toUpperCase(),
            managerCodes: managerCodes,
            status: 'active',
            isActive: true,
            isVerified: true,
            module: 'local-market',
            locationType: req.body.locationType || 'fixed',
            range: req.body.range || 5000,
            lastLocationUpdate: req.body.locationType === 'dynamic'? new Date() : null,
            createdAt: new Date()
        };

        console.log(`📤 Creating shop: ${shopData.shopName} | areaCode: ${shopData.areaCode} | managers: ${shopData.managerCodes}`);

        const shop = new Shop(shopData);
        await shop.save();

        console.log(`✅ Shop created LIVE: ${shop.shopName} | ID: ${shop._id} | areaCode: ${shop.areaCode}`);

        res.status(201).json({
            success: true,
            shop: shop,
            _id: shop._id
        });
    } catch (err) {
        console.error('❌ Create shop error:', err);
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
});

// ✅ GET MY SHOPS - User ki shop check karne ke liye
router.get('/my-shops', authenticateToken, async (req, res) => {
    try {
        const shops = await Shop.find({
            $or: [
                { ownerId: req.userId },
                { createdBy: req.userId }
            ]
        }).sort({ createdAt: -1 });
        res.json(shops);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ GET SHOPS FOR AREA MANAGER - CLAIMED + AVAILABLE
router.get('/manager/shops', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        if (!manager) {
            return res.status(403).json({ success: false, error: 'Manager not found' });
        }

        const managerCode = manager.managerCode;
        const areaCode = manager.areaCode;
        console.log('📍 Fetching shops for manager:', managerCode, '| Area:', areaCode);

        const claimedShops = await Shop.find({
            claimedBy: managerCode,
            module: 'local-market'
        }).lean();

        const availableShops = await Shop.find({
            areaCode: areaCode,
            managerCodes: managerCode,
            claimedBy: null,
            status: 'active',
            isActive: true,
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
router.get('/manager/available-shops', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        if (!manager) {
            return res.status(403).json({ success: false, error: 'Manager not found' });
        }

        const managerCode = manager.managerCode;
        const areaCode = manager.areaCode;

        const shops = await Shop.find({
            areaCode: areaCode,
            managerCodes: managerCode,
            claimedBy: null,
            status: 'active',
            isActive: true,
            module: 'local-market'
        }).populate('area', 'name').lean();

        res.json({ shops });
    } catch (err) {
        console.error('❌ Available shops error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ ASSIGNED MANAGERS FETCH KARNE KA ROUTE
router.get('/shops/:shopId/managers', async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) {
            return res.status(404).json({ success: false, error: 'Shop not found' });
        }

        const managers = await Manager.find({
            managerCode: { $in: shop.managerCodes || [] },
            status: true
        }).select('name managerCode phone email photo areaCode city');

        res.json({ success: true, managers });
    } catch (err) {
        console.error('Get managers error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ✅ PUBLIC SHOPS - Frontend ke liye
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

        const shops = await Shop.find(query)
        .select('-ownerId -approvedBy -rejectionReason -email -phone')
        .sort({ rating: -1, totalOrders: -1, createdAt: -1 })
        .limit(100)
        .lean();

        res.json({
            success: true,
            count: shops.length,
            data: shops
        });

    } catch (err) {
        console.error('❌ Public shops error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ NEARBY SHOPS - Sab shops return karega
router.get('/nearby', async (req, res) => {
    try {
        const { type } = req.query;

        let query = {
            status: { $in: ['active', 'approved'] },
            isActive: true
        };

        if (type) query.shopType = type;

        console.log('🔍 Fetching ALL shops - No location filter');

        const shops = await Shop.find(query)
        .select('-ownerId -approvedBy -rejectionReason -email')
        .sort({ rating: -1, totalOrders: -1, createdAt: -1 })
        .limit(100)
        .lean();

        console.log(`✅ Returning ${shops.length} shops`);

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

// ===== SHOP DETAILS =====
router.get('/shops/:id', async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });
        res.json(shop);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== DASHBOARD STATS =====
router.get('/shops/:shopId/stats', authenticateToken, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.userId || shop.createdBy?.toString() === req.userId;
        const isManager = shop.managerId?.toString() === req.userId || shop.claimedBy === req.userId;

        if (!isOwner &&!isManager && req.user?.role!== 'admin') {
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

// ===== GET PRODUCTS =====
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
router.get('/products/:shopId/:productId', authenticateToken, async (req, res) => {
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

// ===== CREATE PRODUCT =====
router.post('/products', authenticateToken, async (req, res) => {
    try {
        const { shopId,...productData } = req.body;

        const shop = await Shop.findById(shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.userId || shop.createdBy?.toString() === req.userId;
        const isManager = shop.managerId?.toString() === req.userId || shop.claimedBy === req.userId;

        if (!isOwner &&!isManager && req.user?.role!== 'admin') {
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

// ===== UPDATE PRODUCT =====
router.put('/products/:shopId/:productId', authenticateToken, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.userId || shop.createdBy?.toString() === req.userId;
        const isManager = shop.managerId?.toString() === req.userId || shop.claimedBy === req.userId;

        if (!isOwner &&!isManager && req.user?.role!== 'admin') {
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

// ===== DELETE PRODUCT =====
router.delete('/products/:shopId/:productId', authenticateToken, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.userId || shop.createdBy?.toString() === req.userId;
        const isManager = shop.managerId?.toString() === req.userId || shop.claimedBy === req.userId;

        if (!isOwner &&!isManager && req.user?.role!== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        shop.items.pull({ _id: req.params.productId });
        await shop.save();

        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== UPDATE SHOP =====
router.put('/shops/:id', authenticateToken, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.userId || shop.createdBy?.toString() === req.userId;
        const isManager = shop.managerId?.toString() === req.userId || shop.claimedBy === req.userId;

        if (!isOwner &&!isManager && req.user?.role!== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (req.body.range!== undefined) {
            const userRole = req.user?.role || 'user';
            const newRange = parseInt(req.body.range);

            if (userRole!== 'admin' && userRole!== 'area_manager' && newRange > 5000) {
                return res.status(403).json({
                    error: 'Only Admin/Area Manager can set range above 5KM'
                });
            }
        }

        if (req.body.location && req.body.location.coordinates) {
            req.body.location = {
                type: 'Point',
                coordinates: [
                    parseFloat(req.body.location.coordinates[0]),
                    parseFloat(req.body.location.coordinates[1])
                ]
            };
            if (shop.locationType === 'dynamic') {
                req.body.lastLocationUpdate = new Date();
            }
        }

        Object.assign(shop, req.body);
        shop.updatedAt = new Date();
        await shop.save();

        res.json(shop);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ✅ Dynamic shop location update
router.put('/shops/:id/update-location', authenticateToken, async (req, res) => {
    try {
        const { coordinates } = req.body;

        if (!coordinates || coordinates.length!== 2) {
            return res.status(400).json({ error: 'coordinates [lng, lat] required' });
        }

        const shop = await Shop.findById(req.params.id);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.userId || shop.createdBy?.toString() === req.userId;
        if (!isOwner && req.user?.role!== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (shop.locationType!== 'dynamic') {
            return res.status(400).json({ error: 'Shop is not dynamic type' });
        }

        shop.location = {
            type: 'Point',
            coordinates: [parseFloat(coordinates[0]), parseFloat(coordinates[1])]
        };
        shop.lastLocationUpdate = new Date();

        await shop.save();

        console.log(`📍 Dynamic shop ${shop.shopName} updated:`, coordinates);
        res.json({
            success: true,
            message: 'Location updated',
            location: shop.location,
            updatedAt: shop.lastLocationUpdate
        });
    } catch (err) {
        console.error('Update location error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Shop = require('../models/Shop');
const Order = require('../models/Order');
const Manager = require('../models/Manager'); // ✅ ADDED: Manager model import
// ✅ Fix: Destructure karke import kiya
const { authenticateToken } = require('../middleware/authenticateToken');

// ✅ CREATE SHOP - UPDATED WITH CLAIM SYSTEM FIELDS
router.post('/shops', authenticateToken, async (req, res) => {
    try {
        const shopData = {
        ...req.body,
            ownerId: req.userId, // ✅ req.userId use kiya
            createdBy: req.userId,

            // ✅ CLAIM SYSTEM FIELDS - YE ADD KIYE
            status: 'pending', // Manager claim karke approve karega
            isActive: true,
            isVerified: false, // Manager verify karega claim ke baad
            logo: req.body.logo || '',
            locationType: req.body.locationType || 'fixed',
            range: req.body.range || 5000, // 5KM default
            lastLocationUpdate: req.body.locationType === 'dynamic'? new Date() : null,

            // ✅ CLAIM SYSTEM SPECIFIC FIELDS
            managerCodes: req.body.managerCodes || [], // Backward compatibility
            availableForManagers: req.body.managerCodes || [], // In managers ko shop dikhegi
            assignedManagerCode: req.body.managerCodes?.[0] || null, // Primary manager
            assignedManagerName: req.body.assignedManagerName || null,
            assignedManagerPhone: req.body.assignedManagerPhone || null,
            claimedBy: null, // Abhi kisi ne claim nahi ki
            claimedAt: null,
            controlledBy: null
        };

        const shop = new Shop(shopData);
        await shop.save();
        console.log(`✅ Shop created: ${shop.shopName} [${shop.locationType}] Range: ${shop.range}m | Status: ${shop.status} | Area: ${shop.areaCode} | Managers: ${shop.availableForManagers?.length || 0}`);
        res.status(201).json(shop);
    } catch (err) {
        console.error('Create shop error:', err);
        res.status(400).json({ error: err.message });
    }
});

// ✅ GET MY SHOPS - Check karne ke liye user ki shop hai ya nahi
router.get('/my-shops', authenticateToken, async (req, res) => {
    try {
        const shops = await Shop.find({
            $or: [
                { ownerId: req.userId },
                { createdBy: req.userId }
            ]
        });
        res.json(shops);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ ASSIGNED MANAGERS FETCH KARNE KA ROUTE - NAYA ROUTE
router.get('/shops/:shopId/managers', async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) {
            return res.status(404).json({ success: false, error: 'Shop not found' });
        }

        // Shop ke managerCodes array se sare managers nikalo
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

// ✅ PUBLIC SHOPS - Frontend ke liye simple endpoint - UPAR MOVE KIYA
router.get('/public', async (req, res) => {
    try {
        const { shopType, categoryId, serviceType } = req.query;

        let query = {
            status: { $in: ['approved', 'active'] }, // ✅ Purani-nayi dono
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

// ===== NEARBY SHOPS - ✅ LOCATION FILTER HATA DIYA, SAB SHOPS RETURN KAREGA
router.get('/nearby', async (req, res) => {
    try {
        const { type } = req.query;

        // ✅ Base query - sab approved + active shops
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

// ===== SHOP DETAILS ===== YE AB /public KE BAAD HAI
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

        // Verify owner/manager
        const isOwner = shop.ownerId?.toString() === req.userId || shop.createdBy?.toString() === req.userId;
        const isManager = shop.managerId?.toString() === req.userId || shop.controlledBy?.toString() === req.userId;

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

        // Shop type specific stats
        switch(shop.shopType) {
            case 'kirana': // Kirana
                stats.lowStock = products.filter(p => p.stock && p.stock < 10).length;
                break;
            case 'cloth': // Cloth
                stats.totalVariants = products.length;
                break;
            case 'restaurant': // Restaurant
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

// ===== CREATE PRODUCT - Push to items[] =====
router.post('/products', authenticateToken, async (req, res) => {
    try {
        const { shopId,...productData } = req.body;

        const shop = await Shop.findById(shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        // Verify ownership
        const isOwner = shop.ownerId?.toString() === req.userId || shop.createdBy?.toString() === req.userId;
        const isManager = shop.managerId?.toString() === req.userId || shop.controlledBy?.toString() === req.userId;

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

// ===== UPDATE PRODUCT - Update in items[] =====
router.put('/products/:shopId/:productId', authenticateToken, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.userId || shop.createdBy?.toString() === req.userId;
        const isManager = shop.managerId?.toString() === req.userId || shop.controlledBy?.toString() === req.userId;

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

// ===== DELETE PRODUCT - Remove from items[] =====
router.delete('/products/:shopId/:productId', authenticateToken, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.userId || shop.createdBy?.toString() === req.userId;
        const isManager = shop.managerId?.toString() === req.userId || shop.controlledBy?.toString() === req.userId;

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
        const isManager = shop.managerId?.toString() === req.userId || shop.controlledBy?.toString() === req.userId;

        if (!isOwner &&!isManager && req.user?.role!== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        // ✅ Range validation - Only Admin/Area Manager can increase above 5000
        if (req.body.range!== undefined) {
            const userRole = req.user?.role || 'user';
            const newRange = parseInt(req.body.range);

            if (userRole!== 'admin' && userRole!== 'area_manager' && newRange > 5000) {
                return res.status(403).json({
                    error: 'Only Admin/Area Manager can set range above 5KM'
                });
            }
        }

        // ✅ Location update for dynamic shops
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

// ✅ Dynamic shop location update - 50m tracking ke liye
router.put('/shops/:id/update-location', authenticateToken, async (req, res) => {
    try {
        const { coordinates } = req.body; // [lng, lat]

        if (!coordinates || coordinates.length!== 2) {
            return res.status(400).json({ error: 'coordinates [lng, lat] required' });
        }

        const shop = await Shop.findById(req.params.id);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        // Verify owner
        const isOwner = shop.ownerId?.toString() === req.userId || shop.createdBy?.toString() === req.userId;
        if (!isOwner && req.user?.role!== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Only update if dynamic
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
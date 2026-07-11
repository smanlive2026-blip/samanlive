const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const Order = require('../models/Order');
const { authenticateToken } = require('../middleware/authenticateToken');

// ========================================
// 1. CREATE SHOP - Admin/User ke liye
// locationType aur range rakh diya, par coordinates nahi
// ========================================
router.post('/shops', authenticateToken, async (req, res) => {
    try {
        const { areaCode, managerCodes,...restData } = req.body;

        if (!areaCode || areaCode.trim() === '') {
            return res.status(400).json({ success: false, error: 'Area code is required' });
        }

        if (!managerCodes ||!Array.isArray(managerCodes) || managerCodes.length === 0) {
            return res.status(400).json({ success: false, error: 'Please select at least one Area Manager' });
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
            locationType: req.body.locationType || 'fixed', // ye rahega info ke liye
            range: req.body.range || 5000, // ye bhi rahega
            createdAt: new Date()
        };

        const shop = new Shop(shopData);
        await shop.save();

        res.status(201).json({ success: true, shop: shop, _id: shop._id });
    } catch (err) {
        console.error('❌ Create shop error:', err);
        res.status(400).json({ success: false, error: err.message });
    }
});

// ========================================
// 2. GET MY SHOPS - User/Owner ki shops
// ========================================
router.get('/my-shops', authenticateToken, async (req, res) => {
    try {
        const shops = await Shop.find({
            $or: [{ ownerId: req.userId }, { createdBy: req.userId }]
        }).sort({ createdAt: -1 });
        res.json(shops);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// 3. PUBLIC SHOPS - Website/App ke liye
// ========================================
router.get('/public', async (req, res) => {
    try {
        const { shopType, categoryId, serviceType } = req.query;
        let query = { status: { $in: ['approved', 'active'] }, isActive: true };

        if (shopType) query.shopType = shopType;
        if (categoryId) query.categoryId = categoryId;
        if (serviceType) query.serviceType = serviceType;

        const shops = await Shop.find(query)
       .select('-ownerId -approvedBy -rejectionReason -email -phone')
       .sort({ rating: -1, totalOrders: -1, createdAt: -1 })
       .limit(100)
       .lean();

        res.json({ success: true, count: shops.length, data: shops });
    } catch (err) {
        console.error('❌ Public shops error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// 4. NEARBY SHOPS - DELETE KIYA
// Ab ye kaam /api/location/nearby-shops karega
// ========================================
// router.get('/nearby', ...)  // PURA DELETE

// ========================================
// 5. SHOP DETAILS
// ========================================
router.get('/shops/:id', async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });
        res.json(shop);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// 6. DASHBOARD STATS - Shop Owner ke liye
// ========================================
router.get('/shops/:shopId/stats', authenticateToken, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.userId || shop.createdBy?.toString() === req.userId;
        const isManager = shop.controlledBy?.toString() === req.userId;

        if (!isOwner &&!isManager && req.user?.role!== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const products = shop.items || [];
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const todayOrders = await Order.countDocuments({ shopId: shop._id, createdAt: { $gte: today } });

        let stats = { totalProducts: products.length, todayOrders };
        if (shop.shopType === 'kirana') stats.lowStock = products.filter(p => p.stock && p.stock < 10).length;
        if (shop.shopType === 'cloth') stats.totalVariants = products.length;
        if (['restaurant','service','rental'].includes(shop.shopType)) {
            stats.activeOrders = await Order.countDocuments({ shopId: shop._id, status: { $in: ['pending', 'preparing', 'in-progress'] } });
        }

        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// 7. PRODUCTS CRUD - Shop Owner ke liye
// ========================================
router.get('/shops/:shopId/products', async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });
        const products = (shop.items || []).map((item, index) => ({ _id: item._id || index,...(item.toObject? item.toObject() : item) }));
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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

router.post('/products', authenticateToken, async (req, res) => {
    try {
        const { shopId,...productData } = req.body;
        const shop = await Shop.findById(shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.userId || shop.createdBy?.toString() === req.userId;
        const isManager = shop.controlledBy?.toString() === req.userId;
        if (!isOwner &&!isManager && req.user?.role!== 'admin') return res.status(403).json({ error: 'Access denied' });

        shop.items.push(productData);
        await shop.save();
        res.status(201).json(shop.items[shop.items.length - 1]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/products/:shopId/:productId', authenticateToken, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.userId || shop.createdBy?.toString() === req.userId;
        const isManager = shop.controlledBy?.toString() === req.userId;
        if (!isOwner &&!isManager && req.user?.role!== 'admin') return res.status(403).json({ error: 'Access denied' });

        const product = shop.items.id(req.params.productId);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        Object.assign(product, req.body);
        await shop.save();
        res.json(product);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/products/:shopId/:productId', authenticateToken, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.userId || shop.createdBy?.toString() === req.userId;
        const isManager = shop.controlledBy?.toString() === req.userId;
        if (!isOwner &&!isManager && req.user?.role!== 'admin') return res.status(403).json({ error: 'Access denied' });

        shop.items.pull({ _id: req.params.productId });
        await shop.save();
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// 8. UPDATE SHOP - Owner/Manager
// location update wala code hata diya
// ========================================
router.put('/shops/:id', authenticateToken, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.userId || shop.createdBy?.toString() === req.userId;
        const isManager = shop.controlledBy?.toString() === req.userId;
        if (!isOwner &&!isManager && req.user?.role!== 'admin') return res.status(403).json({ error: 'Access denied' });

        if (req.body.range!== undefined) {
            const userRole = req.user?.role || 'user';
            if (userRole!== 'admin' && userRole!== 'area_manager' && parseInt(req.body.range) > 5000) {
                return res.status(403).json({ error: 'Only Admin/Area Manager can set range above 5KM' });
            }
        }

        // location wala if block delete kar diya
        Object.assign(shop, req.body);
        shop.updatedAt = new Date();
        await shop.save();
        res.json(shop);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ========================================
// 9. DYNAMIC LOCATION UPDATE - DELETE KIYA
// Ab ye kaam /api/location/shop karega
// ========================================
// router.put('/shops/:id/update-location', ...)  // PURA DELETE

module.exports = router;
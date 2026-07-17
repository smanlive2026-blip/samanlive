const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const Order = require('../models/Order');
const auth = require('../middleware/authenticateToken');
const path = require('path');  // shop template user view ke liye 
const fs = require('fs');   // shop view ke liye   
// REDIS ADD
const redis = require('redis');
const client = redis.createClient();
client.connect().catch(console.error);

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
        // CACHE CLEAR - jab shop update ho to purana view delete kar de
        await client.del(`shop_view:${req.params.id}`);

        res.json(shop);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// SHOP USER VIEW - 70 TEMPLATES + CACHE
router.get('/view/:shopId', async (req, res) => {
    try {
        const cacheKey = `shop_view:${req.params.shopId}`;
        
        // 1. Cache check
        const cachedFile = await client.get(cacheKey);
        if(cachedFile && fs.existsSync(cachedFile)){
            return res.sendFile(cachedFile);
        }

        // 2. DB se shop nikal
        const shop = await Shop.findById(req.params.shopId).lean();
        if(!shop) return res.status(404).send("Shop not found");

        // 3. Template naam fix - seedha folder ka naam use kar
        let template = shop.template || shop.shopType || 'general';
        template = template.toLowerCase().trim().replace(/\s+/g, '-'); // "fruit shop" -> "fruit-shop"

        const templatePath = path.join(__dirname, '../../public/shop-templates', template);
        const possibleFiles = ['customer-view.html', 'user-view.html', 'shop-view.html'];
        let viewFile = null;

        // 4. Folder me file dhoond
        for(let file of possibleFiles) {
            const filePath = path.join(templatePath, file);
            if(fs.existsSync(filePath)) {
                viewFile = filePath;
                break;
            }
        }

        // 5. Nahi mila to general pe daal de
        if(!viewFile) {
            viewFile = path.join(__dirname, '../../public/shop-templates/general/user-view.html');
        }

        // 6. Cache me daal 30 sec
        await client.setex(cacheKey, 30, viewFile);
        
        res.sendFile(viewFile);
    } catch(err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});
module.exports = router;
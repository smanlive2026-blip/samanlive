const Shop = require('../models/Shop');
const Manager = require('../models/Manager');
const Area = require('../models/Area');

// ========================================
// CREATE SHOP - Claim System Ready
// ========================================
exports.createShop = async (req, res) => {
    try {
        const shopData = {
         ...req.body,
            ownerId: req.user.id,
            createdBy: req.user.id,

            // ✅ CLAIM SYSTEM FIELDS
            status: 'pending', // Manager claim karke approve karega
            isActive: true,
            isVerified: false, // Manager verify karega
            logo: req.body.logo || '',
            locationType: req.body.locationType || 'fixed',
            range: req.body.range || 5000,
            lastLocationUpdate: req.body.locationType === 'dynamic'? new Date() : null,

            // ✅ CLAIM SYSTEM SPECIFIC
            availableForManagers: req.body.managerCodes || [],
            assignedManagerCode: req.body.managerCodes?.[0] || null,
            assignedManagerName: req.body.assignedManagerName || null,
            assignedManagerPhone: req.body.assignedManagerPhone || null,
            claimedBy: null,
            claimedAt: null,
            controlledBy: null
        };

        // Location format fix
        if (req.body.location && req.body.location.coordinates) {
            shopData.location = {
                type: 'Point',
                coordinates: [
                    parseFloat(req.body.location.coordinates[0]),
                    parseFloat(req.body.location.coordinates[1])
                ]
            };
        }

        const shop = new Shop(shopData);
        await shop.save();

        console.log(`✅ Shop created: ${shop.shopName} | Area: ${shop.areaCode} | Status: ${shop.status}`);
        res.status(201).json(shop);
    } catch (err) {
        console.error('Create shop error:', err);
        res.status(400).json({ error: err.message });
    }
};

// ========================================
// GET MY SHOPS - User ki shops
// ========================================
exports.getMyShops = async (req, res) => {
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
};

// ========================================
// GET PUBLIC SHOPS - User app ke liye
// ========================================
exports.getPublicShops = async (req, res) => {
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
};

// ========================================
// GET SHOP BY ID
// ========================================
exports.getShopById = async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id).lean();
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        if (!shop.logo) shop.logo = '';
        res.json(shop);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ========================================
// UPDATE SHOP
// ========================================
exports.updateShop = async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.user.id || shop.createdBy?.toString() === req.user.id;
        const isManager = shop.managerId?.toString() === req.user.id || shop.controlledBy?.toString() === req.user.id;

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

        Object.assign(shop, req.body);
        shop.updatedAt = new Date();
        await shop.save();

        res.json(shop);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// ========================================
// DELETE SHOP
// ========================================
exports.deleteShop = async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.user.id || shop.createdBy?.toString() === req.user.id;

        if (!isOwner && req.user.role!== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        await Shop.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Shop deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ========================================
// GET SHOP STATS
// ========================================
exports.getShopStats = async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.user.id || shop.createdBy?.toString() === req.user.id;
        const isManager = shop.managerId?.toString() === req.user.id || shop.controlledBy?.toString() === req.user.id;

        if (!isOwner &&!isManager && req.user.role!== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const products = shop.items || [];
        const Order = require('../models/Order');
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
};

// ========================================
// PRODUCTS CRUD - Items Array
// ========================================

exports.getProducts = async (req, res) => {
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
};

exports.getProductById = async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const product = shop.items.id(req.params.productId);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { shopId,...productData } = req.body;

        const shop = await Shop.findById(shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.user.id || shop.createdBy?.toString() === req.user.id;
        const isManager = shop.managerId?.toString() === req.user.id || shop.controlledBy?.toString() === req.user.id;

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
};

exports.updateProduct = async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.user.id || shop.createdBy?.toString() === req.user.id;
        const isManager = shop.managerId?.toString() === req.user.id || shop.controlledBy?.toString() === req.user.id;

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
};

exports.deleteProduct = async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.user.id || shop.createdBy?.toString() === req.user.id;
        const isManager = shop.managerId?.toString() === req.user.id || shop.controlledBy?.toString() === req.user.id;

        if (!isOwner &&!isManager && req.user.role!== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        shop.items.pull({ _id: req.params.productId });
        await shop.save();

        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ========================================
// NEARBY SHOPS
// ========================================
exports.getNearbyShops = async (req, res) => {
    try {
        const { type } = req.query;

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

        res.json({
            success: true,
            count: shops.length,
            data: shops
        });

    } catch (err) {
        console.error('❌ Nearby shops error:', err);
        res.status(500).json({ error: err.message });
    }
};
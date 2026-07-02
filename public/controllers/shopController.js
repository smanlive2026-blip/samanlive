const Shop = require('../models/Shop');
const Manager = require('../models/Manager');
const Area = require('../models/Area');

// ========================================
// CREATE SHOP - Manager ke liye Auto Approved
// ========================================
exports.createShop = async (req, res) => {
    console.log('=== SHOP CREATE REQUEST ===');
    console.log('Headers:', req.headers['content-type']);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user?.id, req.user?.managerCode);
    console.log('==========================');

    try {
        const manager = req.user; // managerAuth se aata hai

        const shopData = {
           ...req.body,
            ownerId: manager._id,
            createdBy: manager._id,
            managerId: manager._id, // ✅ Manager ka ID
            managerCodes: [manager.managerCode], // ✅ Manager code array

            // ✅ AUTO APPROVED - Manager khud bana raha hai
            status: 'approved', // pending nahi, direct approved
            isActive: true,
            isVerified: true, // Manager ne verify kar diya
            approvedBy: manager._id, // Manager ne khud approve kiya
            approvedAt: new Date(),

            logo: req.body.logo || '',
            locationType: req.body.locationType || 'fixed',
            range: req.body.range || 5000,
            lastLocationUpdate: req.body.locationType === 'dynamic'? new Date() : null,

            // ✅ CLAIM SYSTEM - Auto claimed by creator manager
            availableForManagers: [manager.managerCode],
            assignedManagerCode: manager.managerCode,
            assignedManagerName: manager.name,
            assignedManagerPhone: manager.phone,
            claimedBy: manager.managerCode, // ✅ Auto claimed
            claimedAt: new Date(),
            controlledBy: manager.managerCode // ✅ Auto controlled
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

        // ✅ Manager ka shop count update kar
        await Manager.findByIdAndUpdate(manager._id, {
            $inc: { currentShopCount: 1 }
        });

        console.log(`✅ Shop created: ${shop.shopName} | ID: ${shop._id} | Area: ${shop.areaCode} | Status: ${shop.status}`);

        // ✅ FIXED: success flag ke saath response bhejo
        res.status(201).json({
            success: true,
            message: 'Shop created successfully',
            shop: shop,
            shopId: shop._id,
            shopLink: `${req.protocol}://${req.get('host')}/shop-dashboard.html?shopId=${shop._id}`
        });

    } catch (err) {
        console.error('Create shop error:', err);
        res.status(400).json({
            success: false,
            error: err.message,
            receivedData: req.body // Debug ke liye
        });
    }
};

// ========================================
// GET MY SHOPS - Manager ki shops
// ========================================
exports.getMyShops = async (req, res) => {
    try {
        const shops = await Shop.find({
            $or: [
                { ownerId: req.user.id },
                { createdBy: req.user.id },
                { managerId: req.user.id },
                { controlledBy: req.user.managerCode } // ✅ Manager code se bhi
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
        res.json({ success: true, shop }); // ✅ success flag add kiya
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ========================================
// UPDATE SHOP
// ========================================
exports.updateShop = async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id);
        if (!shop) return res.status(404).json({ success: false, error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.user.id || shop.createdBy?.toString() === req.user.id;
        const isManager = shop.managerId?.toString() === req.user.id || shop.controlledBy === req.user.managerCode;

        if (!isOwner &&!isManager && req.user.role!== 'admin') {
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

        res.json({ success: true, shop, message: 'Shop updated successfully' });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// ========================================
// DELETE SHOP
// ========================================
exports.deleteShop = async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id);
        if (!shop) return res.status(404).json({ success: false, error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.user.id || shop.createdBy?.toString() === req.user.id;

        if (!isOwner && req.user.role!== 'admin') {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        await Shop.findByIdAndDelete(req.params.id);

        // Manager ka count kam kar
        if (shop.managerId) {
            await Manager.findByIdAndUpdate(shop.managerId, {
                $inc: { currentShopCount: -1 }
            });
        }

        res.json({ success: true, message: 'Shop deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ========================================
// GET SHOP STATS
// ========================================
exports.getShopStats = async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ success: false, error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.user.id || shop.createdBy?.toString() === req.user.id;
        const isManager = shop.managerId?.toString() === req.user.id || shop.controlledBy === req.user.managerCode;

        if (!isOwner &&!isManager && req.user.role!== 'admin') {
            return res.status(403).json({ success: false, error: 'Access denied' });
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

        res.json({ success: true, stats });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ========================================
// PRODUCTS CRUD - Items Array
// ========================================

exports.getProducts = async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ success: false, error: 'Shop not found' });

        const products = (shop.items || []).map((item, index) => ({
            _id: item._id || index,
           ...item.toObject? item.toObject() : item
        }));

        res.json({ success: true, products });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ success: false, error: 'Shop not found' });

        const product = shop.items.id(req.params.productId);
        if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

        res.json({ success: true, product });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { shopId,...productData } = req.body;

        const shop = await Shop.findById(shopId);
        if (!shop) return res.status(404).json({ success: false, error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.user.id || shop.createdBy?.toString() === req.user.id;
        const isManager = shop.managerId?.toString() === req.user.id || shop.controlledBy === req.user.managerCode;

        if (!isOwner &&!isManager && req.user.role!== 'admin') {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        shop.items.push(productData);
        await shop.save();

        const newProduct = shop.items[shop.items.length - 1];
        res.status(201).json({ success: true, product: newProduct });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ success: false, error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.user.id || shop.createdBy?.toString() === req.user.id;
        const isManager = shop.managerId?.toString() === req.user.id || shop.controlledBy === req.user.managerCode;

        if (!isOwner &&!isManager && req.user.role!== 'admin') {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const product = shop.items.id(req.params.productId);
        if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

        Object.assign(product, req.body);
        await shop.save();

        res.json({ success: true, product });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ success: false, error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.user.id || shop.createdBy?.toString() === req.user.id;
        const isManager = shop.managerId?.toString() === req.user.id || shop.controlledBy === req.user.managerCode;

        if (!isOwner &&!isManager && req.user.role!== 'admin') {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        shop.items.pull({ _id: req.params.productId });
        await shop.save();

        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
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
        res.status(500).json({ success: false, error: err.message });
    }
};
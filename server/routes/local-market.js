const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Shop = require('../models/Shop');
const Order = require('../models/Order');
const { authenticateToken } = require('../middleware/authenticateToken');

// ✅ CREATE SHOP - Multiple Managers Support
router.post('/shops', authenticateToken, async (req, res) => {
    try {
        const { managerCodes,...restBody } = req.body;

        if (!managerCodes ||!Array.isArray(managerCodes) || managerCodes.length === 0) {
            return res.status(400).json({ error: 'Select at least one Area Manager' });
        }

        const shopData = {
           ...restBody,
            ownerId: req.userId,
            createdBy: req.userId,
            managerCodes: managerCodes, // ✅ Multiple managers
            status: 'active',
            isActive: true,
            locationType: req.body.locationType || 'fixed',
            range: req.body.range || 5000,
            lastLocationUpdate: req.body.locationType === 'dynamic'? new Date() : null
        };

        const shop = new Shop(shopData);
        await shop.save();
        console.log(`✅ Shop created: ${shop.shopName} [${shop.locationType}] Managers: ${managerCodes.join(', ')} Range: ${shop.range}m`);
        res.status(201).json(shop);
    } catch (err) {
        console.error('Create shop error:', err);
        res.status(400).json({ error: err.message });
    }
});

// ✅ GET MY SHOPS
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

// ===== SHOP DETAILS =====
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

// ===== DASHBOARD STATS - Multi-Manager Support =====
router.get('/shops/:shopId/stats', authenticateToken, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.userId || shop.createdBy?.toString() === req.userId;
        const isManager = shop.managerCodes?.includes(req.user?.managerCode) || shop.managerId?.toString() === req.userId;

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

// ===== CREATE PRODUCT - Multi-Manager Support =====
router.post('/products', authenticateToken, async (req, res) => {
    try {
        const { shopId,...productData } = req.body;

        const shop = await Shop.findById(shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.userId || shop.createdBy?.toString() === req.userId;
        const isManager = shop.managerCodes?.includes(req.user?.managerCode) || shop.managerId?.toString() === req.userId;

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

// ===== UPDATE PRODUCT - Multi-Manager Support =====
router.put('/products/:shopId/:productId', authenticateToken, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.userId || shop.createdBy?.toString() === req.userId;
        const isManager = shop.managerCodes?.includes(req.user?.managerCode) || shop.managerId?.toString() === req.userId;

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

// ===== DELETE PRODUCT - Multi-Manager Support =====
router.delete('/products/:shopId/:productId', authenticateToken, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.userId || shop.createdBy?.toString() === req.userId;
        const isManager = shop.managerCodes?.includes(req.user?.managerCode) || shop.managerId?.toString() === req.userId;

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

// ===== UPDATE SHOP - Multi-Manager Support =====
router.put('/shops/:id', authenticateToken, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const isOwner = shop.ownerId?.toString() === req.userId || shop.createdBy?.toString() === req.userId;
        const isManager = shop.managerCodes?.includes(req.user?.managerCode) || shop.managerId?.toString() === req.userId;

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

// ===== NEARBY SHOPS - Range Filter + LocationType =====
router.get('/nearby', async (req, res) => {
    try {
        const { lat, lng, radius = 10000, type } = req.query;

        if (!lat ||!lng) {
            return res.status(400).json({ error: 'lat and lng required' });
        }

        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const maxRadius = parseInt(radius) || 10000;

        const query = {
            status: { $in: ['active', 'approved'] },
            isActive: true,
            location: {
                $near: {
                    $geometry: { type: 'Point', coordinates: [userLng, userLat] },
                    $maxDistance: maxRadius
                }
            }
        };

        if (type) query.shopType = type;

        console.log('🔍 Fetching within', maxRadius, 'meters');

        const shops = await Shop.find(query)
       .select('-ownerId -approvedBy -rejectionReason -email')
       .limit(100)
       .lean();

        const filteredShops = shops.filter(shop => {
            if (!shop.location?.coordinates || shop.location.coordinates.length!== 2) {
                return false;
            }

            const [shopLng, shopLat] = shop.location.coordinates;

            const R = 6371e3;
            const φ1 = userLat * Math.PI / 180;
            const φ2 = shopLat * Math.PI / 180;
            const Δφ = (shopLat - userLat) * Math.PI / 180;
            const Δλ = (shopLng - userLng) * Math.PI / 180;

            const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                      Math.cos(φ1) * Math.cos(φ2) *
                      Math.sin(Δλ/2) * Math.sin(Δλ/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distanceMeters = R * c;

            const shopRange = shop.range || 5000;
            const isInRange = distanceMeters <= shopRange;

            shop.distance = Math.round(distanceMeters);
            shop.distanceKm = (distanceMeters / 1000).toFixed(2);

            if (isInRange) {
                console.log(`✅ ${shop.shopName} [${shop.locationType}]: ${shop.distance}m <= ${shopRange}m`);
            }

            return isInRange;
        });

        filteredShops.sort((a, b) => a.distance - b.distance);

        console.log(`✅ Returning ${filteredShops.length} shops out of ${shops.length}`);

        res.json({
            success: true,
            count: filteredShops.length,
            data: filteredShops
        });

    } catch (err) {
        console.error('❌ Nearby shops error:', err);
        res.status(500).json({ error: err.message });
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
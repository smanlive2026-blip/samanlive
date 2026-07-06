// ========================================
// FILE: routes/managerShopCreate.js - DEDICATED SHOP CREATE FOR MANAGER
// ========================================
const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const Manager = require('../models/Manager');
const Area = require('../models/Area');
const Product = require('../models/Product'); // ✅ UPAR LE AA GAYA

// ========== MIDDLEWARE: Manager Token Verify ==========
const authManager = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
        if (!token) {
            return res.status(401).json({ success: false, error: 'No token provided' });
        }
        const manager = await Manager.findOne({ loginToken: token });
        if (!manager) {
            return res.status(403).json({ success: false, error: 'Manager not found' });
        }
        req.manager = manager; // ✅ manager object yaha save hota hai
        next();
    } catch (err) {
        console.error('❌ AuthManager Error:', err);
        res.status(401).json({ success: false, error: 'Auth failed: ' + err.message });
    }
};

// ========== ROUTE: Manager Se Nayi Shop Create Karna ==========
router.post('/create-shop-v2', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        const { shopName, shopType, contact, email, address, icon, range } = req.body;

        console.log('🏪 Create Shop Request:', manager.name, '| Shop:', shopName, '| Type:', shopType);

        const currentShopCount = await Shop.countDocuments({
            areaCode: manager.areaCode,
            isActive: true
        });

        const maxShops = manager.maxShops || 10;
        if (currentShopCount >= maxShops) {
            return res.status(403).json({
                success: false,
                error: `Shop limit reached. Max allowed: ${maxShops}. Contact admin to increase limit.`
            });
        }

        const existingShop = await Shop.findOne({
            shopName: shopName.trim(),
            areaCode: manager.areaCode
        });

        if (existingShop) {
            return res.status(400).json({
                success: false,
                error: 'Shop with this name already exists in your area'
            });
        }

        const area = await Area.findOne({ areaCode: manager.areaCode });
        const shopTypeMap = {
            'kirana': 'product','cloth': 'fashion','medical': 'product','restaurant': 'food',
            'electronics': 'product','hardware': 'product','salon': 'service','stationery': 'product',
            'service': 'service','rental': 'rental','common': 'product'
        };
        const mappedShopType = shopTypeMap[shopType] || 'product';

        const newShop = new Shop({
            shopName: shopName.trim(),
            shopType: mappedShopType,
            serviceType: shopType,
            ownerName: manager.name,
            phone: contact,
            contact: contact,
            email: email || '',
            address: { line1: address },
            icon: icon || '🏪',
            range: range || 5000,
            areaCode: manager.areaCode,
            areaName: area?.areaName || manager.areaName || manager.city,
            city: area?.city || manager.city || 'Surat',
            state: area?.state || manager.state || 'Gujarat',
            pincode: area?.pincode || manager.pincode || '395007',
            bucket: manager.bucket || 'DEFAULT',
            managerCodes: [manager.managerCode],
            claimedBy: manager.managerCode,
            assignedManagerCode: manager.managerCode, // ✅ Yahi field se filter karenge
            assignedManagerName: manager.name,
            assignedManagerPhone: manager.phone,
            location: {
                type: 'Point',
                coordinates: [
                    parseFloat(area?.centerLng || manager.centerLng || 72.8311),
                    parseFloat(area?.centerLat || manager.centerLat || 21.1702)
                ]
            },
            module: 'local-market',
            status: 'active',
            isActive: true,
            isVerified: true,
            createdBy: manager._id,
            ownerId: null,
            createdAt: new Date()
        });

        await newShop.save();
        res.json({
            success: true,
            message: 'Shop created successfully',
            shop: newShop,
            currentCount: currentShopCount + 1,
            maxShops: maxShops
        });

    } catch (err) {
        console.error('❌ Create shop error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 1. MANAGER KI SAARI SHOPS
router.get('/my-shops', authManager, async (req, res) => {
    try {
        const shops = await Shop.find({
            assignedManagerCode: req.manager.managerCode, // ✅ FIX
            isActive: true
        }).sort({ createdAt: -1 });
        res.json({ success: true, shops });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. KISI SHOP KE PRODUCT LIST
router.get('/shop/:shopId/products', authManager, async (req, res) => {
    try {
        const shop = await Shop.findOne({_id: req.params.shopId, assignedManagerCode: req.managerCode}); // ✅ FIX
        if(!shop) return res.status(403).json({success:false, error: 'Shop not found'});

        const products = await Product.find({ shopId: req.params.shopId }).sort({ createdAt: -1 });
        res.json({ success: true, products });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. PRODUCT ADD
router.post('/shop/:shopId/add-product', authManager, async (req, res) => {
    try {
        const { name, price, stock, category, image, description } = req.body;
        const shop = await Shop.findOne({_id: req.params.shopId, assignedManagerCode: req.managerCode}); // ✅ FIX
        if(!shop) return res.status(403).json({success:false, error: 'Shop not found'});

        const product = new Product({
            shopId: req.params.shopId,
            shopName: shop.shopName,
            name, price, stock, category,
            image: image || 'https://via.placeholder.com/150',
            description: description || '',
            status: 'active',
            createdBy: req.manager._id
        });
        await product.save();
        res.json({ success: true, message: 'Product added', product });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 4. PRODUCT UPDATE
router.put('/shop/:shopId/product/:id', authManager, async (req, res) => {
    try {
        const product = await Product.findOneAndUpdate(
            {_id: req.params.id, shopId: req.params.shopId},
            req.body,
            {new: true}
        );
        res.json({ success: true, product });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5. PRODUCT DELETE
router.delete('/shop/:shopId/product/:id', authManager, async (req, res) => {
    try {
        await Product.findOneAndDelete({_id: req.params.id, shopId: req.params.shopId});
        res.json({ success: true, message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
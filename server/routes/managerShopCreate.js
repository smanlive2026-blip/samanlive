// ========================================
// FILE: routes/managerShopCreate.js - DEDICATED SHOP CREATE FOR MANAGER
// Match with /public/assets/js/shop-create.js
// ========================================
const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const Manager = require('../models/Manager');
const Area = require('../models/Area');

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

        req.manager = manager;
        next();
    } catch (err) {
        console.error('❌ AuthManager Error:', err);
        res.status(401).json({ success: false, error: 'Auth failed: ' + err.message });
    }
};

// ========== ROUTE: Manager Se Nayi Shop Create Karna ==========
// Frontend se 7 fields aati hain: shopName, shopType, contact, email, address, icon, range
router.post('/create-shop-v2', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        const { shopName, shopType, contact, email, address, icon, range } = req.body;

        console.log('🏪 Create Shop Request:', manager.name, '| Shop:', shopName, '| Type:', shopType);

        // ✅ Check 1: Manager ka shop limit check kar
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

        // ✅ Check 2: Same naam ki shop already to nahi
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

        // ✅ Check 3: Area details nikal
        const area = await Area.findOne({ areaCode: manager.areaCode });

        // ✅ FIX 1: shopType mapping - kirana → product enum ke liye
        const shopTypeMap = {
            'kirana': 'product',
            'cloth': 'fashion',
            'medical': 'product',
            'restaurant': 'food',
            'electronics': 'product',
            'hardware': 'product',
            'salon': 'service',
            'stationery': 'product',
            'service': 'service',
            'rental': 'rental',
            'common': 'product'
        };

        const mappedShopType = shopTypeMap[shopType] || 'product';

        // ✅ FIX 2: Saare required fields auto fill karo Shop Model ke liye
        const newShop = new Shop({
            shopName: shopName.trim(),
            shopType: mappedShopType, // ✅ Enum: product/fashion/food/service/rental
            serviceType: shopType, // ✅ Required: kirana/cloth/etc original value
            ownerName: manager.name, // ✅ Required: Manager ka naam
            phone: contact, // ✅ Required: contact → phone
            contact: contact,
            email: email || '',
            address: { line1: address },
            icon: icon || '🏪',
            range: range || 5000,

            // Auto fields - Manager ke hisaab se
            areaCode: manager.areaCode,
            areaName: area?.areaName || manager.areaName || manager.city,
            city: area?.city || manager.city || 'Surat',
            state: area?.state || manager.state || 'Gujarat',
            pincode: area?.pincode || manager.pincode || '395007',
            bucket: manager.bucket || 'DEFAULT', // ✅ Required
            managerCodes: [manager.managerCode],
            claimedBy: manager.managerCode, // Auto claimed
            assignedManagerCode: manager.managerCode,
            assignedManagerName: manager.name,
            assignedManagerPhone: manager.phone,

            // Location - Area ka center use karo
            location: {
                type: 'Point',
                coordinates: [
                    parseFloat(area?.centerLng || manager.centerLng || 72.8311),
                    parseFloat(area?.centerLat || manager.centerLat || 21.1702)
                ]
            },

            module: 'local-market',
            status: 'active', // Direct approved - LIVE
            isActive: true,
            isVerified: true,
            createdBy: manager._id,
            ownerId: null, // Manager baad me owner assign karega
            createdAt: new Date()
        });

        await newShop.save();

        console.log('✅ New shop created by manager:', manager.name, '| Shop:', shopName, '| ID:', newShop._id, '| Total:', currentShopCount + 1);

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

const Product = require('../models/Product'); // upar require kar lena

// 1. MANAGER KI SAARI SHOPS
router.get('/my-shops', authManager, async (req, res) => {
    try {
        const shops = await Shop.find({ 
            assignedManagerCode: req.managerCode,
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
        const shop = await Shop.findOne({_id: req.params.shopId, assignedManagerCode: req.manager.managerCode});
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
        const shop = await Shop.findOne({_id: req.params.shopId, assignedManagerCode: req.manager.managerCode});
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
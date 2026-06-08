const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const Manager = require('../models/Manager');
const Shop = require('../models/Shop');
const ShopHistory = require('../models/ShopHistory');
const Category = require('../models/Category');
const router = express.Router();

// ==================== MANAGER CRUD ====================

// GET ALL MANAGERS
router.get('/api/managers', async (req, res) => {
    try {
        const managers = await Manager.find().sort({ createdAt: -1 });
        res.json(managers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE NEW MANAGER
router.post('/api/admin/create-manager', async (req, res) => {
    try {
        const { name, area, email, phone, serviceCharge, status, moduleAccess, documents } = req.body;

        if (!moduleAccess || moduleAccess.length === 0) {
            return res.json({ success: false, error: 'Kam se kam 1 Module select karo' });
        }

        const exists = await Manager.findOne({ email });
        if (exists) {
            return res.json({ success: false, error: 'Email already registered' });
        }

        const loginToken = crypto.randomBytes(32).toString('hex');
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const manager = new Manager({
            name,
            area,
            email,
            phone,
            password: hashedPassword,
            serviceCharge,
            status,
            moduleAccess,
            documents,
            loginToken,
            tempPassword
        });

        await manager.save();

        const baseUrl = process.env.BASE_URL || 'https://samanlive.onrender.com';
        const loginLink = `${baseUrl}/area-manager.html?token=${loginToken}`;

        res.json({
            success: true,
            message: 'Manager created',
            loginLink,
            tempPassword,
            manager
        });

    } catch (err) {
        console.error(err);
        res.json({ success: false, error: err.message });
    }
});

// UPDATE MANAGER
router.put('/api/managers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (updateData.moduleAccess && updateData.moduleAccess.length === 0) {
            return res.json({ success: false, error: 'Kam se kam 1 Module select karo' });
        }

        const manager = await Manager.findByIdAndUpdate(id, updateData, { new: true });

        if (!manager) {
            return res.json({ success: false, error: 'Manager not found' });
        }

        res.json({ success: true, manager });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// DELETE MANAGER
router.delete('/api/managers/:id', async (req, res) => {
    try {
        await Manager.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// ==================== MANAGER LOGIN ====================

// MANAGER LOGIN
router.post('/api/area-manager/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const manager = await Manager.findOne({ email });

        if (!manager) {
            return res.json({ success: false, error: 'Manager not found' });
        }

        if (!manager.status) {
            return res.json({ success: false, error: 'Manager is inactive' });
        }

        const isMatch = await bcrypt.compare(password, manager.password);
        if (!isMatch) {
            return res.json({ success: false, error: 'Invalid password' });
        }

        // Update last login
        manager.lastLogin = new Date();
        await manager.save();

        res.json({
            success: true,
            token: manager.loginToken,
            manager: {
                _id: manager._id,
                name: manager.name,
                area: manager.area,
                modules: manager.moduleAccess,
                email: manager.email
            }
        });

    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// ==================== MANAGER DASHBOARD ====================

// MANAGER DASHBOARD - TOKEN VERIFY
router.get('/api/area-manager/dashboard', async (req, res) => {
    try {
        const { token } = req.query;
        const manager = await Manager.findOne({ loginToken: token, status: true });

        if (!manager) {
            return res.json({ success: false, error: 'Invalid or inactive manager' });
        }

        // Update last login
        manager.lastLogin = new Date();
        await manager.save();

        // Shops filter by area + moduleAccess
        const shops = await Shop.find({
            area: manager.area,
            moduleId: { $in: manager.moduleAccess }
        });

        // Categories bhi bhej do
        const categories = await Category.find();

        res.json({
            success: true,
            manager: {
                _id: manager._id,
                name: manager.name,
                area: manager.area,
                modules: manager.moduleAccess,
                serviceCharge: manager.serviceCharge,
                email: manager.email
            },
            shops,
            categories
        });

    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// ==================== SHOP CRUD BY MANAGER ====================

// CREATE SHOP - WITH HISTORY
router.post('/api/area-manager/shop', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const manager = await Manager.findOne({ loginToken: token, status: true });

        if (!manager) {
            return res.json({ success: false, error: 'Unauthorized' });
        }

        const shopData = {
            ...req.body,
            area: manager.area,
            managerId: manager._id,
            status: true
        };

        // Check: Category manager ke access me hai ya nahi
        if (!manager.moduleAccess.includes(shopData.moduleId)) {
            return res.json({ success: false, error: 'You dont have access to this category' });
        }

        const shop = new Shop(shopData);
        await shop.save();

        // History me save karo
        await ShopHistory.create({
            managerId: manager._id,
            shopId: shop._id,
            shopName: shop.name,
            action: 'create',
            oldData: {},
            newData: shop.toObject(),
            area: manager.area
        });

        res.json({ success: true, shop });

    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// UPDATE SHOP - WITH HISTORY
router.put('/api/area-manager/shop/:id', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const manager = await Manager.findOne({ loginToken: token, status: true });

        if (!manager) {
            return res.json({ success: false, error: 'Unauthorized' });
        }

        const shopId = req.params.id;
        const updateData = req.body;

        // Purana data nikalo history ke liye
        const oldShop = await Shop.findById(shopId);
        if (!oldShop) {
            return res.json({ success: false, error: 'Shop not found' });
        }

        // Check: Shop manager ke area + module me hai ya nahi
        if (oldShop.area !== manager.area || !manager.moduleAccess.includes(oldShop.moduleId)) {
            return res.json({ success: false, error: 'You dont have access to this shop' });
        }

        // Banner change hua to pending kar do
        if (updateData.banner && updateData.banner !== oldShop.banner) {
            updateData.bannerStatus = 'pending';
        }

        // Update shop
        const updatedShop = await Shop.findByIdAndUpdate(shopId, updateData, { new: true });

        // History me save karo
        await ShopHistory.create({
            managerId: manager._id,
            shopId: shopId,
            shopName: oldShop.name,
            action: 'edit',
            oldData: oldShop.toObject(),
            newData: updatedShop.toObject(),
            area: manager.area
        });

        res.json({ success: true, shop: updatedShop });

    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// DELETE SHOP - WITH HISTORY
router.delete('/api/area-manager/shop/:id', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const manager = await Manager.findOne({ loginToken: token, status: true });

        if (!manager) {
            return res.json({ success: false, error: 'Unauthorized' });
        }

        const shopId = req.params.id;
        const shop = await Shop.findById(shopId);

        if (!shop) {
            return res.json({ success: false, error: 'Shop not found' });
        }

        // Check access
        if (shop.area !== manager.area || !manager.moduleAccess.includes(shop.moduleId)) {
            return res.json({ success: false, error: 'You dont have access to this shop' });
        }

        // History me save karo delete se pehle
        await ShopHistory.create({
            managerId: manager._id,
            shopId: shopId,
            shopName: shop.name,
            action: 'delete',
            oldData: shop.toObject(),
            newData: {},
            area: manager.area
        });

        // Delete karo
        await Shop.findByIdAndDelete(shopId);

        res.json({ success: true, message: 'Shop deleted' });

    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// ==================== ADMIN APIS ====================

// GET SHOP HISTORY - Admin ke liye
router.get('/api/admin/shop-history', async (req, res) => {
    try {
        const history = await ShopHistory.find()
            .populate('managerId', 'name email area')
            .sort({ createdAt: -1 })
            .limit(200);
        res.json({ success: true, history });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// GET PENDING BANNERS - Admin ke liye
router.get('/api/admin/pending-banners', async (req, res) => {
    try {
        const shops = await Shop.find({ bannerStatus: 'pending' })
            .populate('managerId', 'name area')
            .sort({ updatedAt: -1 });
        res.json({ success: true, shops });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// APPROVE BANNER
router.post('/api/admin/approve-banner/:id', async (req, res) => {
    try {
        const shop = await Shop.findByIdAndUpdate(
            req.params.id,
            { bannerStatus: 'approved' },
            { new: true }
        );
        if (!shop) {
            return res.json({ success: false, error: 'Shop not found' });
        }
        res.json({ success: true, shop });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// REJECT BANNER
router.post('/api/admin/reject-banner/:id', async (req, res) => {
    try {
        const shop = await Shop.findByIdAndUpdate(
            req.params.id,
            { banner: '', bannerStatus: '' },
            { new: true }
        );
        if (!shop) {
            return res.json({ success: false, error: 'Shop not found' });
        }
        res.json({ success: true, shop });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// UPLOAD DOCUMENT - Cloudinary ya local
router.post('/api/admin/upload', async (req, res) => {
    try {
        // Tera upload logic yahan
        // Example: return { success: true, url: 'https://...' }
        res.json({ success: true, url: '/uploads/dummy.jpg' });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

module.exports = router;
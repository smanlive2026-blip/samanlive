const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Manager = require('../models/Manager');
const Shop = require('../models/Shop');
const Module = require('../models/Module'); // ← 'module' se 'Module' kiya
const ShopHistory = require('../models/ShopHistory'); // ← 'shophistory' se 'ShopHistory' kiya

const JWT_SECRET = process.env.JWT_SECRET || 'samanlive-area-manager-secret-2026';

// ========================================
// AUTH MIDDLEWARE - Manager Token Check
// ========================================
async function authManager(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token nahi mila' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const manager = await Manager.findById(decoded.id);
        if (!manager ||!manager.status) {
            return res.status(401).json({ error: 'Manager inactive ya nahi mila' });
        }
        req.manager = manager;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

// ========================================
// LOGIN - Email/Password YA LoginToken se
// ========================================
router.post('/login', async (req, res) => {
    const { email, password, loginToken } = req.body;

    try {
        let manager;

        // Method 1: LoginToken se login - Admin se generate hua link
        if (loginToken) {
            manager = await Manager.findOne({ loginToken, status: true });
            if (!manager) return res.status(401).json({ error: 'Invalid ya expired link' });
        }
        // Method 2: Email/Password se login
        else {
            if (!email ||!password) {
                return res.status(400).json({ error: 'Email aur Password zaruri hai' });
            }
            manager = await Manager.findOne({ email: email.toLowerCase(), status: true });
            if (!manager) return res.status(401).json({ error: 'Manager nahi mila ya inactive hai' });

            const validPass = await bcrypt.compare(password, manager.password);
            if (!validPass) return res.status(401).json({ error: 'Password galat hai' });
        }

        // Update last login
        manager.lastLogin = new Date();
        await manager.save();

        const token = jwt.sign({
            id: manager._id,
            email: manager.email,
            name: manager.name,
            area: manager.area
        }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            token,
            manager: {
                id: manager._id,
                name: manager.name,
                email: manager.email,
                area: manager.area,
                serviceCharge: manager.serviceCharge,
                moduleAccess: manager.moduleAccess
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// DASHBOARD - Sirf apne area ki shops
// ========================================
router.get('/dashboard', authManager, async (req, res) => {
    try {
        const managerArea = req.manager.area;

        // Apne area ki shops
        const areaShops = await Shop.find({
            area: managerArea
        }).lean();

        // Categories - modules se ya Module collection se
        const modules = await Module.find({ status: true });
        const categories = modules.flatMap(m => m.categories || []);

        res.json({
            success: true,
            area: managerArea,
            stats: {
                totalShops: areaShops.length,
                activeShops: areaShops.filter(s => s.status).length,
                pendingBanners: areaShops.filter(s => s.banner &&!s.bannerApproved).length
            },
            shops: areaShops,
            categories: categories
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// SHOP CREATE - Manager bana sakta hai apne area me
// ========================================
router.post('/shop', authManager, async (req, res) => {
    try {
        const managerArea = req.manager.area;
        const { name, icon, categoryId, phone, address, lat, lng, range, banner } = req.body;

        if (!name ||!categoryId ||!lat ||!lng) {
            return res.status(400).json({ error: 'Name, Category, Lat, Lng required hai' });
        }

        // Check if manager has access to this category
        if (req.manager.moduleAccess &&!req.manager.moduleAccess.includes(categoryId)) {
            return res.status(403).json({ error: 'Is category ka access nahi hai' });
        }

        const shop = new Shop({
            name,
            icon: icon || '🏪',
            categoryId,
            phone,
            address,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            range: range || 5000,
            banner: banner || '',
            bannerApproved: false, // NAYA - Default pending, admin approve karega
            area: managerArea, // Auto assign manager ka area
            managerId: req.manager._id,
            status: true
        });

        await shop.save();

        // Log activity
        await ShopHistory.create({
            managerId: req.manager._id,
            shopId: shop._id,
            action: 'create',
            shopName: shop.name,
            area: shop.area,
            newData: shop.toObject()
        });

        res.json({ success: true, data: shop });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// SHOP UPDATE - Sirf apne area ki shop edit kar sakta hai
// ========================================
router.put('/shop/:id', authManager, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id);

        if (!shop) return res.status(404).json({ error: 'Shop nahi mili' });

        // Check: Shop is manager ke area ki hai ya nahi
        if (shop.area!== req.manager.area) {
            return res.status(403).json({ error: 'Ye shop aapke area ki nahi hai' });
        }

        const oldData = shop.toObject();

        // Allowed fields manager ke liye
        const allowedFields = ['name', 'phone', 'address', 'lat', 'lng', 'range', 'icon', 'banner', 'status'];
        const updateData = {};

        allowedFields.forEach(field => {
            if (req.body[field]!== undefined) {
                updateData[field] = req.body[field];
            }
        });

        // Agar banner change hua to approval reset karo
        if (req.body.banner && req.body.banner!== shop.banner) {
            updateData.bannerApproved = false; // Admin firse approve karega
        }

        const updatedShop = await Shop.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        // Log activity
        await ShopHistory.create({
            managerId: req.manager._id,
            shopId: shop._id,
            action: 'edit',
            shopName: shop.name,
            area: shop.area,
            oldData: oldData,
            newData: updatedShop.toObject()
        });

        res.json({ success: true, data: updatedShop });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// SHOP DELETE - Sirf apne area ki
// ========================================
router.delete('/shop/:id', authManager, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id);

        if (!shop) return res.status(404).json({ error: 'Shop nahi mili' });

        if (shop.area!== req.manager.area) {
            return res.status(403).json({ error: 'Ye shop aapke area ki nahi hai' });
        }

        // Log before delete
        await ShopHistory.create({
            managerId: req.manager._id,
            shopId: shop._id,
            action: 'delete',
            shopName: shop.name,
            area: shop.area,
            oldData: shop.toObject()
        });

        await Shop.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// GET SINGLE SHOP - Detail ke liye
// ========================================
router.get('/shop/:id', authManager, async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id);

        if (!shop) return res.status(404).json({ error: 'Shop nahi mili' });

        if (shop.area!== req.manager.area) {
            return res.status(403).json({ error: 'Ye shop aapke area ki nahi hai' });
        }

        res.json({ success: true, data: shop });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
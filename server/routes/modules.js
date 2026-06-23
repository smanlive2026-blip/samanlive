const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Module = require('../models/Module');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Delivery = require('../models/Delivery');
const Coupon = require('../models/Coupon');
const modulesData = require('../seed/seed-modules.json');
const localMarketCategoriesPath = path.join(__dirname, '../../public/local-market/shopCategories.json');

// ========== MODULES ==========
router.get('/modules', async (req, res) => {
    try {
        res.json(modulesData.modules);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/modules/nearby', async (req, res) => {
    try {
        const { lat, lng } = req.body;
        res.json(modulesData.modules);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/modules', async (req, res) => {
    try {
        const module = new Module(req.body);
        await module.save();
        res.json({ success: true, module });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/modules/:id', async (req, res) => {
    try {
        const module = await Module.findByIdAndUpdate(
            req.params.id, 
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!module) return res.status(404).json({ error: 'Module not found' });
        res.json({ success: true, module });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/modules/:id', async (req, res) => {
    try {
        await Module.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== LOCAL MARKET CATEGORIES - FOR ADMIN PANEL ==========
// GET - Sab local market categories dikhao admin me
router.get('/local-market/categories', (req, res) => {
    try {
        const data = fs.readFileSync(localMarketCategoriesPath, 'utf8');
        const json = JSON.parse(data);
        // Admin panel ko modules format me chahiye
        const localMarketModule = {
            _id: 'local_market_module',
            name: 'Local Market',
            icon: '🏪',
            categoryDetails: json.categories.map(c => ({
                id: c._id,
                name: c.name,
                icon: c.icon,
                color: c.color,
                group: c.slug,
                priority: c.priority
            }))
        };
        res.json({ modules: [localMarketModule] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT - Local market category update karo
router.put('/local-market/categories/:catId', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(localMarketCategoriesPath, 'utf8'));
        const catIndex = data.categories.findIndex(c => c._id === req.params.catId);

        if (catIndex === -1) return res.status(404).json({ error: 'Category not found' });

        // Update fields from admin
        data.categories[catIndex] = {
            ...data.categories[catIndex],
            name: req.body.name || data.categories[catIndex].name,
            icon: req.body.icon || data.categories[catIndex].icon,
            color: req.body.color || data.categories[catIndex].color,
            slug: req.body.group || data.categories[catIndex].slug,
            priority: req.body.priority !== undefined ? parseInt(req.body.priority) : data.categories[catIndex].priority
        };
        data.lastUpdated = new Date().toISOString().split('T')[0];

        fs.writeFileSync(localMarketCategoriesPath, JSON.stringify(data, null, 2));
        res.json({ success: true, category: data.categories[catIndex] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST - Nayi local market category add karo
router.post('/local-market/categories', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(localMarketCategoriesPath, 'utf8'));
        const newCat = {
            _id: 'cat' + Date.now(),
            name: req.body.name,
            slug: req.body.group || req.body.name.toLowerCase().replace(/\s+/g, '-'),
            icon: req.body.icon,
            shopType: 'product',
            parentCategory: null,
            description: req.body.name,
            popularTags: [req.body.name.toLowerCase()],
            priority: req.body.priority || 50,
            status: 'active',
            showInApp: true,
            color: req.body.color || '#6366f1'
        };

        data.categories.push(newCat);
        data.lastUpdated = new Date().toISOString().split('T')[0];

        fs.writeFileSync(localMarketCategoriesPath, JSON.stringify(data, null, 2));
        res.json({ success: true, category: newCat });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE - Local market category delete karo
router.delete('/local-market/categories/:catId', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(localMarketCategoriesPath, 'utf8'));
        const catIndex = data.categories.findIndex(c => c._id === req.params.catId);

        if (catIndex === -1) return res.status(404).json({ error: 'Category not found' });

        data.categories.splice(catIndex, 1);
        data.lastUpdated = new Date().toISOString().split('T')[0];

        fs.writeFileSync(localMarketCategoriesPath, JSON.stringify(data, null, 2));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== CATEGORIES - OLD DB BASED ==========
router.get('/categories', async (req, res) => {
    try {
        const filter = { status: 'active' };
        if (req.query.moduleId) filter.moduleId = req.query.moduleId;
        if (req.query.group) filter.group = req.query.group;
        
        const categories = await Category.find(filter)
            .sort({ priority: -1, name: 1 })
            .populate('moduleId', 'name icon');
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/categories', async (req, res) => {
    try {
        const category = new Category(req.body);
        await category.save();
        res.json({ success: true, category });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Category with this name already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

router.put('/categories/:id', async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!category) return res.status(404).json({ error: 'Category not found' });
        res.json({ success: true, category });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/categories/:id', async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) return res.status(404).json({ error: 'Category not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== ORDERS ==========
router.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find().populate('userId shopId').sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/orders/:id/status', async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== PRODUCTS ==========
router.get('/products', async (req, res) => {
    try {
        const products = await Product.find().populate('shopId categoryId');
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/products', async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.json({ success: true, product });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/products/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        res.json({ success: true, product });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== USERS ==========
router.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/users/:id/block', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: req.body.isBlocked }, { new: true });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== DELIVERY ==========
router.get('/delivery', async (req, res) => {
    try {
        const partners = await Delivery.find();
        res.json(partners);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/delivery', async (req, res) => {
    try {
        const partner = new Delivery(req.body);
        await partner.save();
        res.json({ success: true, partner });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/delivery/:id/verify', async (req, res) => {
    try {
        const partner = await Delivery.findByIdAndUpdate(req.params.id, { isVerified: req.body.isVerified }, { new: true });
        res.json({ success: true, partner });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/delivery/:id', async (req, res) => {
    try {
        await Delivery.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== COUPONS ==========
router.get('/coupons', async (req, res) => {
    try {
        const coupons = await Coupon.find();
        res.json(coupons);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/coupons', async (req, res) => {
    try {
        const coupon = new Coupon(req.body);
        await coupon.save();
        res.json({ success: true, coupon });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/coupons/:id', async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        res.json({ success: true, coupon });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== REPORTS ==========
router.get('/reports', async (req, res) => {
    try {
        const period = req.query.period || 'week';
        const now = new Date();
        let startDate;
        
        if (period === 'today') startDate = new Date(now.setHours(0,0,0,0));
        else if (period === 'week') startDate = new Date(now.setDate(now.getDate() - 7));
        else if (period === 'month') startDate = new Date(now.setMonth(now.getMonth() - 1));
        else startDate = new Date(0);

        const orders = await Order.find({ createdAt: { $gte: startDate } });
        const users = await User.countDocuments({ createdAt: { $gte: startDate } });
        
        const revenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        
        res.json({
            stats: {
                revenue,
                orders: orders.length,
                users,
                avgRating: 4.5,
                revenueChange: 12,
                ordersChange: 8,
                usersChange: 15
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
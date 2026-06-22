const express = require('express');
const router = express.Router();
const Module = require('../models/Module');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Delivery = require('../models/Delivery');
const Coupon = require('../models/Coupon');
const modulesData = require('../seed/seed-modules.json'); // ADDED: JSON file load

// ========== MODULES ==========
router.get('/modules', async (req, res) => {
    try {
        // CHANGED: DB ki jagah JSON file se bhej raha hu
        res.json(modulesData.modules);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ADDED: Location based modules - naya route
router.post('/modules/nearby', async (req, res) => {
    try {
        const { lat, lng } = req.body;
        // CHANGED: modulesData.modules bhej raha hu taaki frontend me direct array mile
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

// ========== CATEGORIES - NEW SECTION ==========
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
    } catch (err) { {
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
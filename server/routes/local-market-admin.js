const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const Area = require('../models/Area');

// GET all local-market shops with filters
router.get('/shops', async (req, res) => {
    try {
        const { category, status, search } = req.query;
        let query = { module: 'local-market' };
        
        if(category) query.category = category;
        if(status) query.status = status;
        if(search) query.shopName = { $regex: search, $options: 'i' };
        
        const shops = await Shop.find(query).populate('area', 'name').lean();
        const result = shops.map(s => ({ ...s, areaName: s.area?.name }));
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single shop
router.get('/shops/:id', async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id);
        res.json(shop);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create shop
router.post('/shops', async (req, res) => {
    try {
        const shop = new Shop({ ...req.body, module: 'local-market' });
        await shop.save();
        res.json(shop);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update shop
router.put('/shops/:id', async (req, res) => {
    try {
        const shop = await Shop.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(shop);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE shop
router.delete('/shops/:id', async (req, res) => {
    try {
        await Shop.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

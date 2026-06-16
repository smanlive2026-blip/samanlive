const express = require('express');
const Area = require('../models/Area'); // Capital A
const Manager = require('../models/Manager');
const User = require('../models/User');
const Shop = require('../models/Shop');
const router = express.Router();

// Get all areas
router.get('/areas', async (req, res) => {
    try {
        const areas = await Area.find().sort({ createdAt: -1 });
        res.json(areas);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create area
router.post('/areas', async (req, res) => {
    try {
        const area = new Area(req.body);
        await area.save();
        res.json({ success: true, area });
    } catch (err) {
        if (err.code === 11000) {
            res.status(400).json({ error: 'Area Code already exists' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

// Update area
router.put('/areas/:id', async (req, res) => {
    try {
        const area = await Area.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, area });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete area
router.delete('/areas/:id', async (req, res) => {
    try {
        await Area.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get area stats - for popup
router.get('/areas/:id/stats', async (req, res) => {
    try {
        const area = await Area.findById(req.params.id);
        const managers = await Manager.countDocuments({ areaCode: area.areaCode });
        const shops = await Shop.countDocuments({ areaCode: area.areaCode });
        const users = await User.countDocuments({ areaCode: area.areaCode });
        
        res.json({
            area,
            stats: { managers, shops, users }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
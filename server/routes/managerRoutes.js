const express = require('express');
const router = express.Router();
const Manager = require('../models/Manager');

// Sirf GET route rakhenge yahan taaki public API me use ho sake
// Baaki sab adminRoutes.js me hai

// GET ALL MANAGERS - Public ke liye without auth
router.get('/', async (req, res) => {
    try {
        const managers = await Manager.find({ status: true }).select('name area email phone').sort({ name: 1 }).lean();
        res.json({ success: true, managers });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
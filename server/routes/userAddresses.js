const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// GET /api/user/addresses - Get all addresses
router.get('/user/addresses', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        res.json({ success: true, addresses: user.addresses || [] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/user/addresses - Add new address
router.post('/user/addresses', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        // Agar default set kiya to baaki sabko false kar do
        if (req.body.isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        // Agar pehla address hai to auto default
        if (user.addresses.length === 0) {
            req.body.isDefault = true;
        }

        user.addresses.push(req.body);
        await user.save();

        res.json({ success: true, addresses: user.addresses });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/user/addresses/:id - Update address
router.put('/user/addresses/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const address = user.addresses.id(req.params.id);

        if (!address) {
            return res.status(404).json({ success: false, error: 'Address not found' });
        }

        // Agar default set kiya to baaki sabko false kar do
        if (req.body.isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        Object.assign(address, req.body);
        await user.save();

        res.json({ success: true, addresses: user.addresses });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/user/addresses/:id - Delete address
router.delete('/user/addresses/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const address = user.addresses.id(req.params.id);

        if (!address) {
            return res.status(404).json({ success: false, error: 'Address not found' });
        }

        const wasDefault = address.isDefault;
        user.addresses.pull(req.params.id);

        // Agar default delete hua to pehla wala default bana do
        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }

        await user.save();
        res.json({ success: true, addresses: user.addresses });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/user/addresses/:id/default - Set default address
router.put('/user/addresses/:id/default', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        user.addresses.forEach(addr => {
            addr.isDefault = addr._id.toString() === req.params.id;
        });

        await user.save();
        res.json({ success: true, addresses: user.addresses });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
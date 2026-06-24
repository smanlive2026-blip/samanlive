const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/authenticateToken');

// ==================== GET /api/user/addresses ====================
router.get('/user/addresses', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('addresses');
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.json({ success: true, addresses: user.addresses || [] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== POST /api/user/addresses ====================
router.post('/user/addresses', auth, async (req, res) => {
    try {
        const { name, phone, line1, line2, city, state, pincode, location, isDefault } = req.body;

        // Validation
        if (!name ||!phone ||!line1 ||!city ||!state ||!pincode) {
            return res.status(400).json({
                success: false,
                error: 'Name, phone, line1, city, state, pincode are required'
            });
        }

        // Location validation - GeoJSON Point
        if (location && (!location.coordinates || location.coordinates.length!== 2)) {
            return res.status(400).json({
                success: false,
                error: 'Location must have [longitude, latitude] coordinates'
            });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Agar default set kiya to baaki sabko false kar do
        if (isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        // Agar pehla address hai to auto default
        const newAddress = {
            name,
            phone,
            line1,
            line2: line2 || '',
            city,
            state,
            pincode,
            location: location? {
                type: 'Point',
                coordinates: [parseFloat(location.coordinates[0]), parseFloat(location.coordinates[1])]
            } : undefined,
            isDefault: isDefault || user.addresses.length === 0
        };

        user.addresses.push(newAddress);
        await user.save();

        res.json({
            success: true,
            addresses: user.addresses,
            message: 'Address added successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== PUT /api/user/addresses/:id ====================
router.put('/user/addresses/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const address = user.addresses.id(req.params.id);
        if (!address) {
            return res.status(404).json({ success: false, error: 'Address not found' });
        }

        // Agar default set kiya to baaki sabko false kar do
        if (req.body.isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        // Location update handle karo
        if (req.body.location) {
            if (!req.body.location.coordinates || req.body.location.coordinates.length!== 2) {
                return res.status(400).json({
                    success: false,
                    error: 'Location must have [longitude, latitude] coordinates'
                });
            }
            req.body.location = {
                type: 'Point',
                coordinates: [
                    parseFloat(req.body.location.coordinates[0]),
                    parseFloat(req.body.location.coordinates[1])
                ]
            };
        }

        Object.assign(address, req.body);
        await user.save();

        res.json({
            success: true,
            addresses: user.addresses,
            message: 'Address updated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== DELETE /api/user/addresses/:id ====================
router.delete('/user/addresses/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

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
        res.json({
            success: true,
            addresses: user.addresses,
            message: 'Address deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== PUT /api/user/addresses/:id/default ====================
router.put('/user/addresses/:id/default', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const address = user.addresses.id(req.params.id);
        if (!address) {
            return res.status(404).json({ success: false, error: 'Address not found' });
        }

        user.addresses.forEach(addr => {
            addr.isDefault = addr._id.toString() === req.params.id;
        });

        await user.save();
        res.json({
            success: true,
            addresses: user.addresses,
            message: 'Default address updated'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== GET /api/user/addresses/default ====================
router.get('/user/addresses/default', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('addresses');
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const defaultAddress = user.addresses.find(addr => addr.isDefault);

        res.json({
            success: true,
            address: defaultAddress || null
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

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

// Create area - DYNAMIC RADIUS
router.post('/areas', async (req, res) => {
    try {
        const { areaCode, areaName, city, state, centerLat, centerLng, radius, status } = req.body;

        // Validation
        if (!areaCode || !areaName || !city || !state || !centerLat || !centerLng) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const radiusValue = parseInt(radius) || 50;
        if (radiusValue < 1 || radiusValue > 500) {
            return res.status(400).json({ error: 'Radius must be between 1 and 500 km' });
        }

        const area = new Area({
            areaCode: areaCode.toUpperCase(),
            areaName,
            city,
            state,
            centerLat: parseFloat(centerLat),
            centerLng: parseFloat(centerLng),
            radius: radiusValue,
            status: status !== undefined ? status : true
        });

        await area.save();

        // ========== AUTO MANAGER CREATE - SIRF YE BLOCK ADD KIYA HAI ==========
        // Tere purane code me manager create nahi ho raha tha
        // Ab area banne ke baad automatic manager ban jayega
        try {
            const baseUrl = req.protocol + '://' + req.get('host');
            const managerRes = await fetch(`${baseUrl}/api/admin/auto-create-manager`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ areaCode: area.areaCode })
            });
            
            const managerResult = await managerRes.json();
            
            if (managerResult.success) {
                console.log(`✅ Auto Manager created: ${managerResult.manager.email}`);
                console.log(`🔗 Login Link: ${managerResult.loginLink}`);
                console.log(`🔑 Temp Password: ${managerResult.tempPassword}`);
            } else {
                console.error(`⚠️ Manager auto-create failed:`, managerResult.error || managerResult.message);
            }
        } catch (managerErr) {
            console.error(`⚠️ Manager auto-create API failed:`, managerErr.message);
            // Area ban gaya hai, manager fail hua to bhi error nahi denge
            // Admin baad me manager.html se manually sync kar sakta hai
        }
        // ========== AUTO MANAGER CREATE - END ==========

        res.status(201).json({ success: true, area });
    } catch (err) {
        if (err.code === 11000) {
            res.status(400).json({ error: 'Area Code already exists' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

// Update area - DYNAMIC RADIUS
router.put('/areas/:id', async (req, res) => {
    try {
        const { radius, ...updateData } = req.body;

        // Radius validation
        if (radius !== undefined) {
            const radiusValue = parseInt(radius);
            if (radiusValue < 1 || radiusValue > 500) {
                return res.status(400).json({ error: 'Radius must be between 1 and 500 km' });
            }
            updateData.radius = radiusValue;
        }

        const area = await Area.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            { new: true, runValidators: true }
        );

        if (!area) {
            return res.status(404).json({ error: 'Area not found' });
        }

        res.json({ success: true, area });
    } catch (err) {
        if (err.code === 11000) {
            res.status(400).json({ error: 'Area Code already exists' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

// Delete area
router.delete('/areas/:id', async (req, res) => {
    try {
        const area = await Area.findById(req.params.id);
        if (!area) {
            return res.status(404).json({ error: 'Area not found' });
        }

        // Check if managers exist
        const managerCount = await Manager.countDocuments({ areaCode: area.areaCode });
        if (managerCount > 0) {
            return res.status(400).json({ 
                error: `Cannot delete! ${managerCount} managers exist in this area. Delete them first.` 
            });
        }

        await Area.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Area deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get area stats - for popup
router.get('/areas/:id/stats', async (req, res) => {
    try {
        const area = await Area.findById(req.params.id);
        if (!area) {
            return res.status(404).json({ error: 'Area not found' });
        }

        const [managers, shops, users] = await Promise.all([
            Manager.countDocuments({ areaCode: area.areaCode }),
            Shop.countDocuments({ areaCode: area.areaCode }),
            User.countDocuments({ areaCode: area.areaCode })
        ]);
        
        res.json({
            area,
            stats: { managers, shops, users }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
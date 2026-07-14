const express = require('express');
const router = express.Router();
const Manager = require('../models/Manager');
const authManager = require('../middleware/auth');
// const { authManager } = require('../middleware/auth'); // ✅ YE LINE IMPORTANT HAI

// 1. Naya Delivery Manager banana
router.post('/manager/create-delivery-manager', authManager, async (req, res) => {
    try {
        const { name, phone, email, vehicleType } = req.body;
        
        if(req.manager.role !== 'area-manager') {
            return res.status(403).json({ success: false, message: 'Sirf Area Manager bana sakta hai' });
        }

        const exists = await Manager.findOne({ phone });
        if(exists) return res.status(400).json({ success: false, message: 'Phone already exist' });

        const count = await Manager.countDocuments({ role: 'delivery-manager', areaCode: req.manager.areaCode });
        const managerCode = `DM-${req.manager.areaCode}-${count + 1}`;

        const deliveryManager = new Manager({
            name,
            phone,
            email: email || `${managerCode}@samanlive.local`,
            loginToken: `DMTOKEN-${Date.now()}-${Math.random()}`,
            role: 'delivery-manager',
            areaCode: req.manager.areaCode,
            areaName: req.manager.areaName,
            city: req.manager.city,
            state: req.manager.state,
            managerCode,
            parentManager: req.manager._id,
            vehicleType: vehicleType || 'bike'
        });

        await deliveryManager.save();
        res.json({ success: true, message: 'Delivery Boy ban gaya', manager: deliveryManager });

    } catch (err) {
        console.log("CREATE DM ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});


// 2. Apne area ke Delivery Managers ki list
router.get('/manager/delivery-managers', authManager, async (req, res) => {
    try {
        if(req.manager.role !== 'area-manager') {
            return res.status(403).json({ success: false, message: 'Access Denied' });
        }

        const managers = await Manager.find({ 
            role: 'delivery-manager', 
            parentManager: req.manager._id 
        }).select('-loginToken -password');
        
        res.json({ success: true, managers: managers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
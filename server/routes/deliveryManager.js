// LOCATION: server/routes/deliveryManager.js

const express = require('express');
const router = express.Router();
const Manager = require('../models/Manager');

// ========== MIDDLEWARE: DB TOKEN WALA - JWT NAHI ==========
const authDelivery = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, message: 'Token missing' });

    // ✅ DB me loginToken se dhundo, JWT verify mat karo
    const manager = await Manager.findOne({ loginToken: token, status: true });
    
    if(!manager) return res.status(401).json({ success: false, message: 'Manager not found' });

    req.manager = manager;
    next();
  } catch (err) {
    console.log("DELIVERY AUTH ERROR:", err.message);
    res.status(401).json({ success: false, message: 'Token is not valid' });
  }
};

// 1. Naya Delivery Manager banana - Sirf Area Manager bana sakta hai
router.post('/manager/create-delivery-manager', authDelivery, async (req, res) => {
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
            name, phone, role: 'delivery-manager', areaCode: req.manager.areaCode,
            email: email || `${managerCode}@samanlive.local`,
            loginToken: `DMTOKEN-${Date.now()}-${Math.random()}`,
            areaName: req.manager.areaName, city: req.manager.city, state: req.manager.state,
            managerCode, parentManager: req.manager._id, vehicleType: vehicleType || 'bike'
        });

        await deliveryManager.save();
        res.json({ success: true, message: 'Delivery Boy ban gaya', manager: deliveryManager });

    } catch (err) {
        console.log("CREATE DM ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 2. List
router.get('/manager/delivery-managers', authDelivery, async (req, res) => {
    try {
        if(req.manager.role !== 'area-manager') return res.status(403).json({ success: false, message: 'Access Denied' });
        const managers = await Manager.find({ role: 'delivery-manager', parentManager: req.manager._id }).select('-loginToken -password');
        res.json({ success: true, managers: managers });
    } catch (err) {
        console.log("GET DM ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
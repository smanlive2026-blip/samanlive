// File: server/controllers/managerController.js
const Manager = require('../models/Manager');
const bcrypt = require('bcryptjs');

// NAYA DELIVERY MANAGER BANANA - Sirf Area Manager kar sakta
exports.createDeliveryManager = async (req, res) => {
    try {
        const { name, phone, email, vehicleType } = req.body;
        const areaManager = req.manager; // authManager se aayega

        if(areaManager.role !== 'area-manager') {
            return res.status(403).json({ success: false, message: 'Sirf Area Manager bana sakta hai' });
        }

        const exists = await Manager.findOne({ phone });
        if(exists) return res.status(400).json({ success: false, message: 'Phone already exist' });

        // ManagerCode banayenge: DM + areaCode + count
        const count = await Manager.countDocuments({ role: 'delivery-manager', areaCode: areaManager.areaCode });
        const managerCode = `DM-${areaManager.areaCode}-${count + 1}`;

        const deliveryManager = new Manager({
            name,
            phone,
            email,
            password: await bcrypt.hash(phone, 10), // default password = phone
            role: 'delivery-manager',
            areaCode: areaManager.areaCode,
            managerCode,
            parentManager: areaManager._id,
            vehicleType
        });

        await deliveryManager.save();
        res.json({ success: true, message: 'Delivery Manager ban gaya', data: deliveryManager });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// LIST NIKALNA - Area Manager ko apne area ke DM dikhe
exports.getDeliveryManagers = async (req, res) => {
    try {
        const areaManager = req.manager;
        const managers = await Manager.find({ 
            role: 'delivery-manager', 
            areaCode: areaManager.areaCode 
        }).select('-password');
        
        res.json({ success: true, data: managers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
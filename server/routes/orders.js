// File: server/routes/orders.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Manager = require('../models/Manager');

// Helper: Order ID generate
function generateOrderId() {
    const date = new Date().toISOString().slice(0,10).replace(/-/g, '');
    const rand = Math.floor(Math.random() * 1000);
    return `ORD-${date}-${rand}`;
}

// ========== 1. GET ORDERS - DM KE LIYE ==========
router.get('/', async (req, res) => {
    try {
        const { assignedTo, status } = req.query;
        let query = {};

        if(assignedTo) query.assignedTo = assignedTo; // DM ke orders
        if(status) query.status = { $in: status.split(',') }; // pending,assigned

        const orders = await Order.find(query).sort({ createdAt: -1 }).lean();
        res.json({ success: true, orders });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== 2. CREATE ORDER - TEST KE LIYE / SHOP SE AAYEGA ==========
router.post('/create', async (req, res) => {
    try {
        const { shopId, customerName, customerPhone, customerAddress, areaCode, total } = req.body;

        const newOrder = new Order({
            orderId: generateOrderId(),
            shopId,
            customerName,
            customerPhone,
            customerAddress,
            areaCode,
            total: total || 0,
            status: 'pending'
        });

        await newOrder.save();
        res.json({ success: true, message: 'Order Created', order: newOrder });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== 3. ASSIGN ORDER TO DM - AREA MANAGER KAREGA ==========
router.put('/:id/assign', async (req, res) => {
    try {
        const { dmCode } = req.body; // DM ka managerCode
        const order = await Order.findByIdAndUpdate(req.params.id, {
            assignedTo: dmCode,
            status: 'assigned',
            assignedAt: new Date()
        }, { new: true });

        res.json({ success: true, message: 'Order Assigned', order });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== 4. DM PICK ORDER ==========
router.put('/:id/pick', async (req, res) => {
    try {
        const { dmCode } = req.body;
        const order = await Order.findOneAndUpdate(
            { _id: req.params.id, assignedTo: dmCode },
            { status: 'picked', pickedAt: new Date() },
            { new: true }
        );
        if(!order) return res.status(403).json({ success: false, error: 'Not your order' });
        res.json({ success: true, message: 'Order Picked', order });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== 5. DM DELIVER ORDER ==========
router.put('/:id/deliver', async (req, res) => {
    try {
        const { dmCode } = req.body;
        const order = await Order.findOneAndUpdate(
            { _id: req.params.id, assignedTo: dmCode },
            { status: 'delivered', deliveredAt: new Date() },
            { new: true }
        );
        if(!order) return res.status(403).json({ success: false, error: 'Not your order' });
        res.json({ success: true, message: 'Order Delivered', order });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
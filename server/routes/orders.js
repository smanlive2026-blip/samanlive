const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const auth = require('../middleware/authenticateToken');

// GET /api/orders/my-orders - Get user orders
router.get('/orders/my-orders', auth, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.userId })
            .populate('shopId', 'shopName')
            .sort({ createdAt: -1 });

        const formattedOrders = orders.map(order => ({
            _id: order._id,
            shopName: order.shopId?.shopName || 'SAMANLIVE Store',
            items: order.items,
            totalAmount: order.totalAmount,
            orderStatus: order.orderStatus,
            paymentStatus: order.paymentStatus,
            createdAt: order.createdAt,
            deliveryDate: order.deliveryDate
        }));

        res.json({ success: true, orders: formattedOrders });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/orders/:id - Get single order details
router.get('/orders/:id', auth, async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, userId: req.userId })
            .populate('shopId', 'shopName phone');

        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/orders/:id/cancel - Cancel order
router.post('/orders/:id/cancel', auth, async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, userId: req.userId });

        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        if (['shipped', 'out_for_delivery', 'delivered'].includes(order.orderStatus)) {
            return res.status(400).json({ success: false, error: 'Cannot cancel this order' });
        }

        order.orderStatus = 'cancelled';
        await order.save();

        res.json({ success: true, message: 'Order cancelled successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// GET /api/user/payments - Get all payment methods
router.get('/user/payments', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        res.json({ success: true, payments: user.payments || [] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/user/payments - Add payment method
router.post('/user/payments', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        // Card number mask kar do
        if (req.body.type === 'card' && req.body.cardNumber) {
            req.body.cardLast4 = req.body.cardNumber.slice(-4);
            delete req.body.cardNumber; // Full number store nahi karna
            delete req.body.cardCvv; // CVV store nahi karna
        }

        if (req.body.isDefault) {
            user.payments.forEach(p => p.isDefault = false);
        }

        if (user.payments.length === 0) {
            req.body.isDefault = true;
        }

        user.payments.push(req.body);
        await user.save();

        res.json({ success: true, payments: user.payments });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/user/payments/:id - Delete payment
router.delete('/user/payments/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const payment = user.payments.id(req.params.id);

        if (!payment) {
            return res.status(404).json({ success: false, error: 'Payment method not found' });
        }

        const wasDefault = payment.isDefault;
        user.payments.pull(req.params.id);

        if (wasDefault && user.payments.length > 0) {
            user.payments[0].isDefault = true;
        }

        await user.save();
        res.json({ success: true, payments: user.payments });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/user/payments/:id/default - Set default
router.put('/user/payments/:id/default', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        user.payments.forEach(p => {
            p.isDefault = p._id.toString() === req.params.id;
        });

        await user.save();
        res.json({ success: true, payments: user.payments });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
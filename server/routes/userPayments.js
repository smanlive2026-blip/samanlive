const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/authenticateToken');

// ==================== GET /api/user/payments ====================
// Get all payment methods - NEVER return full card details
router.get('/user/payments', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('payments');
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Sensitive data already removed, bas send kar do
        res.json({
            success: true,
            payments: user.payments || [],
            count: user.payments?.length || 0
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== POST /api/user/payments ====================
// Add payment method - PCI COMPLIANT
router.post('/user/payments', auth, async (req, res) => {
    try {
        const { type, upiId, bankName, accountLast4, ifsc } = req.body;

        // Validation
        if (!type) {
            return res.status(400).json({
                success: false,
                error: 'Payment type is required'
            });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        let paymentData = { type, isDefault: false };

        // UPI Payment
        if (type === 'upi') {
            if (!upiId) {
                return res.status(400).json({
                    success: false,
                    error: 'UPI ID is required'
                });
            }
            // Basic UPI format check
            if (!upiId.includes('@')) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid UPI ID format'
                });
            }
            paymentData.upiId = upiId.trim();
            paymentData.displayName = upiId.split('@')[0];
        }

        // Bank Account - ONLY LAST 4 DIGITS
        else if (type === 'bank') {
            if (!accountLast4 ||!bankName ||!ifsc) {
                return res.status(400).json({
                    success: false,
                    error: 'Bank name, IFSC, and last 4 digits required'
                });
            }
            paymentData.bankName = bankName;
            paymentData.accountLast4 = accountLast4.slice(-4); // Only last 4
            paymentData.ifsc = ifsc.toUpperCase();
            paymentData.displayName = `${bankName} - ****${accountLast4.slice(-4)}`;
        }

        // Card - PCI DSS: NEVER STORE FULL CARD
        else if (type === 'card') {
            const { cardLast4, cardType, expiryMonth, expiryYear, cardHolderName } = req.body;

            if (!cardLast4 ||!cardType ||!expiryMonth ||!expiryYear) {
                return res.status(400).json({
                    success: false,
                    error: 'Card last 4 digits, type, and expiry required'
                });
            }

            // Security: Agar koi full card number bhej raha hai to reject
            if (req.body.cardNumber || req.body.cardCvv) {
                return res.status(400).json({
                    success: false,
                    error: 'Never send full card number or CVV to server. Only last 4 digits allowed.'
                });
            }

            paymentData.cardLast4 = cardLast4.slice(-4);
            paymentData.cardType = cardType; // Visa, Mastercard, RuPay
            paymentData.expiryMonth = expiryMonth;
            paymentData.expiryYear = expiryYear;
            paymentData.cardHolderName = cardHolderName || '';
            paymentData.displayName = `${cardType} ****${cardLast4.slice(-4)}`;
        }

        // Cash on Delivery
        else if (type === 'cod') {
            paymentData.displayName = 'Cash on Delivery';
            paymentData.isDefault = false; // COD default nahi hona chahiye
        }

        else {
            return res.status(400).json({
                success: false,
                error: 'Invalid payment type. Use: upi, bank, card, cod'
            });
        }

        // Agar default set kiya to baaki sabko false kar do
        if (req.body.isDefault && type!== 'cod') {
            user.payments.forEach(p => p.isDefault = false);
            paymentData.isDefault = true;
        }

        // Agar pehla payment hai to auto default - COD nahi
        if (user.payments.length === 0 && type!== 'cod') {
            paymentData.isDefault = true;
        }

        user.payments.push(paymentData);
        await user.save();

        res.json({
            success: true,
            payments: user.payments,
            message: 'Payment method added successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== PUT /api/user/payments/:id ====================
// Update payment method - only expiry for cards
router.put('/user/payments/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const payment = user.payments.id(req.params.id);
        if (!payment) {
            return res.status(404).json({ success: false, error: 'Payment method not found' });
        }

        // Only allow expiry update for cards
        if (payment.type === 'card') {
            if (req.body.expiryMonth) payment.expiryMonth = req.body.expiryMonth;
            if (req.body.expiryYear) payment.expiryYear = req.body.expiryYear;
            if (req.body.cardHolderName) payment.cardHolderName = req.body.cardHolderName;
        }

        // Update UPI ID
        if (payment.type === 'upi' && req.body.upiId) {
            if (!req.body.upiId.includes('@')) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid UPI ID format'
                });
            }
            payment.upiId = req.body.upiId;
            payment.displayName = req.body.upiId.split('@')[0];
        }

        await user.save();
        res.json({
            success: true,
            payments: user.payments,
            message: 'Payment method updated'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== DELETE /api/user/payments/:id ====================
router.delete('/user/payments/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const payment = user.payments.id(req.params.id);
        if (!payment) {
            return res.status(404).json({ success: false, error: 'Payment method not found' });
        }

        const wasDefault = payment.isDefault;
        user.payments.pull(req.params.id);

        // Agar default delete hua to pehla wala default bana do - COD skip karo
        if (wasDefault && user.payments.length > 0) {
            const nonCodPayment = user.payments.find(p => p.type!== 'cod');
            if (nonCodPayment) {
                nonCodPayment.isDefault = true;
            } else {
                user.payments[0].isDefault = true;
            }
        }

        await user.save();
        res.json({
            success: true,
            payments: user.payments,
            message: 'Payment method deleted'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== PUT /api/user/payments/:id/default ====================
router.put('/user/payments/:id/default', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const payment = user.payments.id(req.params.id);
        if (!payment) {
            return res.status(404).json({ success: false, error: 'Payment method not found' });
        }

        // COD ko default nahi bana sakte
        if (payment.type === 'cod') {
            return res.status(400).json({
                success: false,
                error: 'Cash on Delivery cannot be set as default'
            });
        }

        user.payments.forEach(p => {
            p.isDefault = p._id.toString() === req.params.id;
        });

        await user.save();
        res.json({
            success: true,
            payments: user.payments,
            message: 'Default payment method updated'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

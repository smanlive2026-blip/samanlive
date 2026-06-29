const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/authenticateToken');
const router = express.Router();

// ========================================
// POST /api/auth/login-phone - PUBLIC
// ========================================
router.post('/login-phone', async (req, res) => {
    try {
        const { phone, name } = req.body;

        if(!phone || phone.length!== 10) {
            return res.status(400).json({ success: false, error: 'Valid 10 digit phone dalo' });
        }
        if(!name || name.trim() === '') {
            return res.status(400).json({ success: false, error: 'Name dalo' });
        }

        let user = await User.findOne({ phone });

        if(!user) {
            const dummyEmail = phone + '@samanlive.local';
            const dummyPassword = 'OTP_LOGIN_' + Date.now();

            user = await User.create({
                phone,
                name: name.trim(),
                email: dummyEmail,
                password: dummyPassword,
                avatar: '',
                status: 'active',
                isVerified: true,
                loginCount: 1,
                lastLogin: new Date()
            });
        } else {
            user.name = name.trim();
            user.loginCount = (user.loginCount || 0) + 1;
            user.lastLogin = new Date();
            await user.save();
        }

        // ✅ FIX: Dono id aur userId bhejo taaki kabhi issue na aaye
        const token = jwt.sign(
            { id: user._id, userId: user._id, type: 'user' },
            process.env.JWT_SECRET || 'samanlive_secret_key_2026_change_this',
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                userId: 'SL' + user._id.toString().slice(-6).toUpperCase(),
                profilePic: user.avatar || '/assets/default-avatar.png',
                qrCodeData: JSON.stringify({
                    phone: user.phone,
                    name: user.name,
                    userId: 'SL' + user._id.toString().slice(-6).toUpperCase()
                }),
                hasShop: false,
                language: user.preferences?.language || 'hi'
            }
        });

    } catch(err) {
        console.error('Login Error:', err);
        if(err.code === 11000) {
            return res.status(400).json({ success: false, error: 'Ye phone ya email already registered hai' });
        }
        res.status(500).json({ success: false, error: 'Server error: ' + err.message });
    }
});

// ========================================
// GET /api/auth/me - PROTECTED
// ========================================
router.get('/me', authenticateToken, async (req, res) => {
    try {
        res.json({
            success: true,
            user: {
                _id: req.user._id,
                name: req.user.name,
                phone: req.user.phone,
                email: req.user.email,
                userId: 'SL' + req.user._id.toString().slice(-6).toUpperCase(),
                profilePic: req.user.avatar || '/assets/default-avatar.png',
                qrCodeData: JSON.stringify({
                    phone: req.user.phone,
                    name: req.user.name,
                    userId: 'SL' + req.user._id.toString().slice(-6).toUpperCase()
                }),
                hasShop: false,
                language: req.user.preferences?.language || 'hi',
                address: req.user.addresses?.find(a => a.isDefault)?.line1 || ''
            }
        });
    } catch(err) {
        console.error('Get User Error:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
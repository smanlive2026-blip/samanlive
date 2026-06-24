const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// ========================================
// POST /api/auth/login-phone - OTP/Login
// ========================================
router.post('/login-phone', async (req, res) => {
    try {
        const { phone, name } = req.body;
        
        // Validation
        if(!phone || phone.length !== 10) {
            return res.status(400).json({ success: false, error: 'Valid 10 digit phone dalo' });
        }
        if(!name || name.trim() === '') {
            return res.status(400).json({ success: false, error: 'Name dalo' });
        }

        // User dhundo ya naya banao
        let user = await User.findOne({ phone });
        const isNewUser = !user;
        
        if(!user) {
            // Naya user banao - email aur password dummy daal do kyunki required hai
            const dummyEmail = phone + '@samanlive.local';
            const dummyPassword = 'OTP_LOGIN_' + Date.now(); // Password select:false hai to chalega
            
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
            // Existing user - name update kar do aur login count badhao
            user.name = name.trim();
            user.loginCount = (user.loginCount || 0) + 1;
            user.lastLogin = new Date();
            await user.save();
        }

        // JWT token banao - middleware ke hisaab se userId bhejna hai
        const token = jwt.sign(
            { 
                userId: user._id,  // middleware me req.user.userId milega
                phone: user.phone 
            }, 
            process.env.JWT_SECRET, // .env se aayega
            { expiresIn: '30d' }
        );

        // Response me frontend ko jo chahiye wo bhejo
        res.json({ 
            success: true, 
            token, 
            user: {
                _id: user._id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                userId: 'SL' + user._id.toString().slice(-6).toUpperCase(), // Unique ID
                profilePic: user.avatar || '/assets/default-avatar.png', // avatar ko profilePic banao
                qrCodeData: JSON.stringify({ 
                    phone: user.phone, 
                    name: user.name, 
                    userId: 'SL' + user._id.toString().slice(-6).toUpperCase() 
                }),
                hasShop: false, // Abhi default false, baad me Shop model se check karenge
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
// GET /api/auth/me - Current User Data
// ========================================
router.get('/me', verifyToken, async (req, res) => {
    try {
        // verifyToken me req.user = { userId, phone } set hua hai
        // Ab DB se full user data nikalna padega
        const user = await User.findById(req.user.userId).select('-password -otp');
        
        if(!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        if(user.status !== 'active') {
            return res.status(403).json({ success: false, error: 'Account blocked or deleted' });
        }

        // Frontend ko jo format chahiye
        res.json({ 
            success: true, 
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
                hasShop: false, // TODO: Shop model se check karna
                language: user.preferences?.language || 'hi',
                address: user.addresses?.find(a => a.isDefault)?.line1 || ''
            }
        });

    } catch(err) {
        console.error('Get User Error:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
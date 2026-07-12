const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// ========================================
// PUT /api/user/update - UPDATE USER DETAILS
// ========================================
router.put('/update', auth, async (req, res) => {
  try {
    const { name, email, phone, address, language, profilePic } = req.body;

    // Banane do update object
    const updateData = {};
    
    if(name) updateData.name = name;
    if(email) updateData.email = email;
    if(phone) updateData.phone = phone;
    if(address) updateData.address = address;
    if(language) updateData.language = language;
    
    // FIX: profilePic ko DB me avatar me save karo
    if(profilePic) {
        updateData.avatar = profilePic;
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user.id, 
        updateData, 
        {new: true, runValidators: true}
    ).select('-password'); // password mat bhejna

    if(!updatedUser) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Frontend ko profilePic naam se bhejo taaki confusion na ho
    res.json({ 
        success: true, 
        user: {
            _id: updatedUser._id,
            name: updatedUser.name,
            phone: updatedUser.phone,
            email: updatedUser.email,
            userId: 'SL' + updatedUser._id.toString().slice(-6).toUpperCase(),
            profilePic: updatedUser.avatar || '/assets/default-avatar.png', // <-- IMPORTANT
            address: updatedUser.address,
            language: updatedUser.language || 'hi'
        }
    });
  } catch (err) {
    console.error('Update Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
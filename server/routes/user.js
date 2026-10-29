// LOCATION: server/routes/user.js - V2 WORLD CLASS - MAIN APP + COMMON CONNECTED + CLOUDINARY
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// ========================================
// PUT /api/user/update - UPDATE USER DETAILS
// ========================================
router.put('/update', auth, async (req, res) => {
  try {
    const { name, email, phone, address, language, profilePic, avatar } = req.body;

    // Banane do update object
    const updateData = {};
    
    if(name) updateData.name = name.trim();
    if(email) updateData.email = email.trim().toLowerCase();
    if(phone) updateData.phone = phone.trim();
    
    // address can be object or string - V2 FIX
    if(address){
      if(typeof address === 'string'){
        updateData.city = address;
      } else if(typeof address === 'object'){
        if(address.city) updateData.city = address.city;
        if(address.street) updateData.city = address.city || address.street;
      }
      // purane code ka address field bhi support rakho
      if(!updateData.city){
        updateData.address = address;
      }
    }
    
    if(language) {
      updateData.language = language;
      updateData['preferences.language'] = language;
    }
    
    // FIX: profilePic ko DB me avatar me save karo - CLOUDINARY MANDATORY
    if(profilePic || avatar) {
        const picUrl = profilePic || avatar;
        // Cloudinary URL check - agar http se start hai to direct save
        if(picUrl && (picUrl.startsWith('http') || picUrl.startsWith('https://res.cloudinary.com') || picUrl.startsWith('/uploads/') === false)){
          updateData.avatar = picUrl;
        } else if(picUrl){
          updateData.avatar = picUrl;
        }
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user.id, 
        updateData, 
        {new: true, runValidators: false}
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
            avatar: updatedUser.avatar || '/assets/default-avatar.png',
            address: updatedUser.address || updatedUser.city || updatedUser.addresses?.[0] || '',
            addresses: updatedUser.addresses || [],
            language: updatedUser.language || updatedUser.preferences?.language || 'hi'
        }
    });
  } catch (err) {
    console.error('Update Error:', err);
    if(err.code===11000){
      return res.status(400).json({ success: false, message: 'Phone or email already exists' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/user/me - shortcut
router.get('/me', auth, async (req,res)=>{
  try{
    const user = await User.findById(req.user.id).select('-password');
    if(!user) return res.status(404).json({ success:false, message:'User not found' });
    res.json({
      success:true,
      user:{
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        profilePic: user.avatar || '/assets/default-avatar.png',
        avatar: user.avatar || '',
        addresses: user.addresses || [],
        language: user.preferences?.language || 'hi'
      }
    });
  }catch(e){ res.status(500).json({ success:false, message:e.message }); }
});

module.exports = router;
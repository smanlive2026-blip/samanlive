// LOCATION: server/routes/common/profile.routes.js - COMMON PROFILE - CUSTOMER + SHOP OWNER - FULL WORKING
const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const Shop = require('../../models/Shop');
const { authenticateToken } = require('../../middleware/authenticateToken');

// GET /api/common/profile/:shopId - Shop owner profile + Customer ke liye bhi fallback
router.get('/:shopId', async (req,res)=>{
  try{
    const shopId = req.params.shopId;
    if(!shopId || shopId==='undefined'){
      return res.json({ success: false, message: 'shopId required' });
    }
    // 1. Shop model se
    let shop = null;
    try{
      if(shopId.length===24){
        shop = await Shop.findById(shopId);
      }
      if(!shop){
        shop = await Shop.findOne({ shopId: shopId }) || await Shop.findOne({ _id: shopId });
      }
    }catch(e){}

    // 2. Agar shop nahi mila toh User se (customer profile bhi common se khulega)
    if(!shop){
      let user = null;
      try{
        if(shopId.length===24) user = await User.findById(shopId);
        if(!user) user = await User.findOne({ phone: shopId.slice(-10) });
      }catch(e){}
      if(user){
        return res.json({ 
          success: true, 
          shop: {
            _id: user._id,
            name: user.name,
            shopName: user.name,
            phone: user.phone,
            email: user.email,
            avatar: user.avatar,
            shopImage: user.avatar,
            address: user.addresses?.[0]?.line1 || '',
            city: user.addresses?.[0]?.city || 'Surat',
            category: 'customer',
            role: 'customer',
            verified: true
          },
          profile: {
            _id: user._id,
            name: user.name,
            phone: user.phone
          }
        });
      }
      return res.json({ success: true, shop: { _id: shopId, shopId, name: 'My Shop', shopName: 'My Shop', category: 'general', address: 'Surat', verified: false } });
    }

    res.json({ success: true, shop, profile: shop });
  }catch(e){
    console.error('GET common profile error', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// PUT /api/common/profile/:shopId - Update shop info (dashboard se connected)
router.put('/:shopId', async (req,res)=>{
  try{
    const shopId = req.params.shopId;
    const updates = req.body;
    // dono field rakho taaki dashboard + profile dono me dikhe
    if(updates.name && !updates.shopName) updates.shopName = updates.name;
    if(updates.shopName && !updates.name) updates.name = updates.shopName;
    if(updates.avatar && !updates.shopImage) updates.shopImage = updates.avatar;
    if(updates.shopImage && !updates.avatar) updates.avatar = updates.shopImage;

    let shop = null;
    if(shopId.length===24){
      shop = await Shop.findByIdAndUpdate(shopId, { $set: updates }, { new: true, upsert: false });
    }
    if(!shop){
      shop = await Shop.findOneAndUpdate({ shopId: shopId }, { $set: updates }, { new: true, upsert: true });
    }

    res.json({ success: true, shop, message: 'Shop profile updated', profile: shop });
  }catch(e){
    console.error('PUT common profile error', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/common/profile/:shopId/avatar
router.post('/:shopId/avatar', async (req,res)=>{
  try{
    const { avatar } = req.body;
    const shopId = req.params.shopId;
    let shop = null;
    if(shopId.length===24) shop = await Shop.findByIdAndUpdate(shopId, { avatar, shopImage: avatar }, { new: true });
    if(!shop) shop = await Shop.findOneAndUpdate({ shopId }, { avatar, shopImage: avatar }, { new: true });
    res.json({ success: true, shop, avatar });
  }catch(e){ res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/common/profile/:shopId/cover
router.post('/:shopId/cover', async (req,res)=>{
  try{
    const { cover } = req.body;
    const shopId = req.params.shopId;
    let shop = null;
    if(shopId.length===24) shop = await Shop.findByIdAndUpdate(shopId, { cover, banner: cover }, { new: true });
    if(!shop) shop = await Shop.findOneAndUpdate({ shopId }, { cover, banner: cover }, { new: true });
    res.json({ success: true, shop, cover });
  }catch(e){ res.status(500).json({ success: false, message: e.message }); }
});

// PUT /api/common/profile/:shopId/timing
router.put('/:shopId/timing', async (req,res)=>{
  try{
    const shopId = req.params.shopId;
    const timing = req.body;
    let shop = null;
    if(shopId.length===24) shop = await Shop.findByIdAndUpdate(shopId, { timing, isOpen: timing.isOpen, openingTime: timing.openingTime, closingTime: timing.closingTime }, { new: true });
    if(!shop) shop = await Shop.findOneAndUpdate({ shopId }, { timing, isOpen: timing.isOpen }, { new: true });
    res.json({ success: true, timing, shop });
  }catch(e){ res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
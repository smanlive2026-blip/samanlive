// LOCATION: server/routes/user.address.routes.js - MAIN APP ADDRESS API - USER MODEL CONNECTED
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken } = require('../middleware/authenticateToken');

// Helper - buyerId se user nikalo (x-buyer-id header + token)
async function getUserFromReq(req){
  // 1. token se
  if(req.user && req.user._id) return req.user;
  // 2. x-buyer-id header se - guest_xxx ya user_xxx ya direct userId
  let buyerId = req.headers['x-buyer-id'] || req.query.buyerId || req.body.buyerId;
  if(!buyerId) return null;
  // guest hai toh null
  if(buyerId.startsWith('guest_')) return null;
  // user_xxx format
  if(buyerId.startsWith('user_')) buyerId = buyerId.replace('user_','');
  // sidha mongo id ho sakta hai
  try{
    const user = await User.findById(buyerId);
    return user;
  }catch(e){
    // phone se try karo (tere screenshot me 93162817764_7jgb5i1 jaisa tha)
    try{
      const phone = buyerId.split('_')[0];
      if(phone.length>=10){
        return await User.findOne({ phone: phone.slice(-10) });
      }
    }catch(e2){}
    return null;
  }
}

// GET /api/user/addresses?buyerId=xxx
router.get('/', async (req,res)=>{
  try{
    const user = await getUserFromReq(req);
    if(!user){
      // guest ke liye localStorage fallback - empty bhejo taaki frontend local use kar le
      return res.json({ success: true, addresses: [] });
    }
    res.json({ success: true, addresses: user.addresses || [] });
  }catch(e){
    res.status(500).json({ success: false, message: e.message, addresses: [] });
  }
});

// POST /api/user/addresses
router.post('/', async (req,res)=>{
  try{
    const user = await getUserFromReq(req);
    if(!user) return res.status(401).json({ success: false, message: 'User not found - login karo' });
    
    const { name, phone, line1, line2, city, state, pincode, label, isDefault } = req.body;
    if(!line1 || !city || !pincode) return res.status(400).json({ success: false, message: 'line1, city, pincode required' });

    const newAddr = {
      name: name || user.name,
      phone: phone || user.phone,
      line1, line2: line2||'', city, state: state||'Gujarat', pincode,
      label: label||'Home', isDefault: isDefault||false
    };
    
    // agar isDefault true hai toh baki sab false
    if(isDefault){
      user.addresses.forEach(a=> a.isDefault = false);
    }
    // pehla address hai toh default bana do
    if(user.addresses.length===0) newAddr.isDefault = true;
    
    user.addresses.push(newAddr);
    await user.save();
    
    res.json({ success: true, addresses: user.addresses });
  }catch(e){
    res.status(500).json({ success: false, message: e.message });
  }
});

// PUT /api/user/addresses/:id
router.put('/:id', async (req,res)=>{
  try{
    const user = await getUserFromReq(req);
    if(!user) return res.status(401).json({ success: false });
    const addr = user.addresses.id(req.params.id);
    if(!addr) return res.status(404).json({ success: false, message: 'Address not found' });
    Object.assign(addr, req.body);
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  }catch(e){ res.status(500).json({ success: false, message: e.message }); }
});

// DELETE /api/user/addresses/:id
router.delete('/:id', async (req,res)=>{
  try{
    const user = await getUserFromReq(req);
    if(!user) return res.status(401).json({ success: false });
    user.addresses = user.addresses.filter(a=> a._id.toString() !== req.params.id);
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  }catch(e){ res.status(500).json({ success: false, message: e.message }); }
});

// PUT /api/user/addresses/:id/default
router.put('/:id/default', async (req,res)=>{
  try{
    const user = await getUserFromReq(req);
    if(!user) return res.status(401).json({ success: false });
    user.addresses.forEach(a=> a.isDefault = a._id.toString() === req.params.id);
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  }catch(e){ res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
// LOCATION: server/routes/user.address.routes.js - MAIN APP ADDRESS API - USER MODEL TO ORDER MODEL CONNECTED
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// buyerId se user nikalne ka helper - tere screenshot wala 93162817764_7jgb5i1 bhi handle karega
async function getUserFromReq(req){
  let buyerId = req.headers['x-buyer-id'] || req.query.buyerId || req.body.buyerId || req.headers['x-buyer-id'.toLowerCase()];
  if(!buyerId){
    if(req.user && req.user._id) return req.user;
    return null;
  }
  if(buyerId.startsWith('guest_')) return null;
  if(buyerId.startsWith('user_')) buyerId = buyerId.replace('user_','');
  
  try{
    // direct _id
    if(buyerId.length===24){
      const u = await User.findById(buyerId);
      if(u) return u;
    }
    // phone_xxxx format (tera wala case)
    const phonePart = buyerId.split('_')[0].replace(/\D/g,'').slice(-10);
    if(phonePart.length>=10){
      const u = await User.findOne({ phone: phonePart });
      if(u) return u;
      const u2 = await User.findOne({ phone: { $regex: phonePart } });
      if(u2) return u2;
    }
  }catch(e){}
  return null;
}

// GET /api/user/addresses - checkout aur main app dono use karenge
router.get('/', async (req,res)=>{
  try{
    const user = await getUserFromReq(req);
    if(!user){
      return res.json({ success: true, addresses: [] });
    }
    // User model ke addresses ko frontend format me bhejo
    const formatted = (user.addresses||[]).map(a=>({
      _id: a._id,
      name: a.name,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2||'',
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      label: a.label||'Home',
      isDefault: a.isDefault,
      full: `${a.line1}${a.line2?', '+a.line2:''}, ${a.city}, ${a.state} - ${a.pincode}`,
      fullAddress: `${a.line1}${a.line2?', '+a.line2:''}, ${a.city}, ${a.state} - ${a.pincode}`
    }));
    res.json({ success: true, addresses: formatted, data: formatted });
  }catch(e){
    console.error('GET addresses error', e);
    res.json({ success: true, addresses: [] });
  }
});

// POST /api/user/addresses - main app + checkout dono se add hoga
router.post('/', async (req,res)=>{
  try{
    let user = await getUserFromReq(req);
    // agar guest hai toh usko phone se dhundo ya naya banao (main app logic)
    if(!user){
      const { phone, name } = req.body;
      if(phone){
        user = await User.findOne({ phone: phone.slice(-10) });
      }
      if(!user){
        return res.status(200).json({ success: true, addresses: [], message: 'Guest address - saved locally only' });
      }
    }
    
    const { name, phone, line1, line2, city, state, pincode, label, isDefault } = req.body;
    if(!line1) return res.status(400).json({ success: false, message: 'line1 required' });

    if(isDefault){
      user.addresses.forEach(a=> a.isDefault = false);
    }
    if(user.addresses.length===0){
      req.body.isDefault = true;
    }

    user.addresses.push({
      name: name || user.name,
      phone: phone || user.phone,
      line1, line2: line2||'', city: city||'Surat', state: state||'Gujarat', pincode: pincode||'395007',
      label: label||'Home', isDefault: isDefault||user.addresses.length===0
    });
    await user.save();
    
    res.json({ success: true, addresses: user.addresses });
  }catch(e){
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put('/:id', async (req,res)=>{
  try{
    const user = await getUserFromReq(req);
    if(!user) return res.status(401).json({ success: false });
    const addr = user.addresses.id(req.params.id);
    if(!addr) return res.status(404).json({ success: false });
    Object.assign(addr, req.body);
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  }catch(e){ res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/:id', async (req,res)=>{
  try{
    const user = await getUserFromReq(req);
    if(!user) return res.status(401).json({ success: false });
    user.addresses.pull(req.params.id);
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  }catch(e){ res.status(500).json({ success: false, message: e.message }); }
});

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
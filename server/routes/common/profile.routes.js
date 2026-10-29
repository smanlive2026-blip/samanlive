// LOCATION: server/routes/common/profile.routes.js - V7 WORLD CLASS - V6 SAME + CLOUDINARY MANDATORY - CUSTOMER + SHOP_OWNER + DELIVERY_BOY
const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const Shop = require('../../models/Shop');
const mongoose = require('mongoose');
const multer = require('multer');
const { cloudinary } = require('../../utils/cloudinary');

// MEMORY STORAGE FOR CLOUDINARY - VERCEL SAFE
const memoryStorage = multer.memoryStorage();
const memoryUpload = multer({ 
  storage: memoryStorage, 
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req,file,cb)=>{
    if(file.mimetype.startsWith('image/')) cb(null,true);
    else cb(new Error('Only images allowed'), false);
  }
});

// ========== HELPER: Get User from buyerId / token ==========
async function resolveUser(req){
  let buyerId = req.headers['x-buyer-id'] || req.query.buyerId || req.body.buyerId || req.user?._id || '';
  let tokenUserId = req.user?._id || null;

  // 1. From auth middleware (if logged)
  if(tokenUserId){
    try{
      const u = await User.findById(tokenUserId);
      if(u) return u;
    }catch(e){}
  }

  // 2. From buyerId (user_xxx or direct id)
  if(buyerId){
    let id = String(buyerId);
    if(id.startsWith('user_')) id = id.replace('user_','');
    if(id.startsWith('guest_')) return null; // guest ka profile nahi

    // Try by ObjectId
    if(mongoose.Types.ObjectId.isValid(id)){
      try{
        const u = await User.findById(id);
        if(u) return u;
      }catch(e){}
    }
    // Try by phone last 10
    const phone = id.replace(/\D/g,'').slice(-10);
    if(phone.length>=10){
      try{
        const u = await User.findOne({ phone: phone });
        if(u) return u;
      }catch(e){}
    }
  }

  // 3. From Authorization token phone
  try{
    const auth = req.headers.authorization || '';
    if(auth.startsWith('Bearer ')){
      const token = auth.split(' ')[1];
      // JWT decode without verify (fast path)
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      if(payload._id && mongoose.Types.ObjectId.isValid(payload._id)){
        const u = await User.findById(payload._id);
        if(u) return u;
      }
      if(payload.phone){
        const u = await User.findOne({ phone: payload.phone });
        if(u) return u;
      }
    }
  }catch(e){}

  return null;
}

function publicUser(user){
  if(!user) return null;
  return {
    _id: user._id,
    name: user.name,
    phone: user.phone,
    email: user.email || '',
    role: user.role || 'customer',
    profilePic: user.profilePic || user.avatar || user.profilePic || '',
    avatar: user.profilePic || user.avatar || '',
    isVerified: user.isVerified || false,
    addresses: user.addresses || [],
    wallet: user.wallet || { balance: 0 },
    shopId: user.shopId || null,
    area: user.area || '',
    city: user.city || '',
    createdAt: user.createdAt
  };
}

// ========== 1. GET MY PROFILE - MAIN APP + SHOP DASHBOARD DONO ==========
router.get('/me', async (req, res) => {
  try{
    const user = await resolveUser(req);
    if(!user){
      return res.status(401).json({ success: false, message: 'User not found - login karo', guest: true });
    }

    // Agar shop_owner hai to shop info bhi do
    let shopInfo = null;
    if(user.shopId || user.role==='shop_owner'){
      try{
        const shopId = user.shopId || req.query.shopId;
        if(shopId && mongoose.Types.ObjectId.isValid(shopId)){
          shopInfo = await Shop.findById(shopId);
        } else if(user.phone){
          shopInfo = await Shop.findOne({ ownerPhone: user.phone }) || await Shop.findOne({ phone: user.phone });
        }
      }catch(e){}
    }

    res.json({
      success: true,
      user: publicUser(user),
      shop: shopInfo,
      message: 'Profile loaded'
    });

  }catch(e){
    console.error('Profile /me error', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ========== 2. GET PROFILE BY ID (SHOP OWNER DEKHEGA CUSTOMER KA) ==========
router.get('/:userId', async (req, res) => {
  try{
    const { userId } = req.params;
    if(!userId || userId==='me') return res.status(400).json({ success: false, message: 'Use /me' });

    let user = null;
    if(mongoose.Types.ObjectId.isValid(userId)){
      user = await User.findById(userId);
    }
    if(!user){
      user = await User.findOne({ phone: userId });
    }
    if(!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, user: publicUser(user) });
  }catch(e){
    res.status(500).json({ success: false, message: e.message });
  }
});

// ========== 3. UPDATE PROFILE - NAME, PIC, EMAIL ==========
router.put('/update', async (req, res) => {
  try{
    const user = await resolveUser(req);
    if(!user) return res.status(401).json({ success: false, message: 'Login required' });

    const { name, email, profilePic, avatar, city, area } = req.body;
    const update = {};
    if(name) update.name = String(name).trim().slice(0,50);
    if(email) update.email = String(email).trim().toLowerCase();
    if(profilePic) update.profilePic = profilePic;
    if(avatar) update.profilePic = avatar;
    // avatar field bhi sync rakho - User model me avatar bhi hai
    if(profilePic || avatar) update.avatar = profilePic || avatar;
    if(city) update.city = city;
    if(area) update.area = area;
    update.updatedAt = new Date();

    const updated = await User.findByIdAndUpdate(user._id, update, { new: true });
    
    // Socket emit for live profile update
    if(global.io){
      global.io.to(`user:${user._id}`).emit('profile-updated', publicUser(updated));
    }

    console.log(`✅ Profile updated: ${user._id} name=${update.name||''}`);

    res.json({ success: true, user: publicUser(updated), message: 'Profile updated' });

  }catch(e){
    console.error('Profile update error', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ========== 4. UPDATE PROFILE PIC ONLY - JSON URL + FILE BOTH SUPPORTED - CLOUDINARY ==========
router.put('/pic', memoryUpload.single('profilePic'), async (req, res) => {
  try{
    const user = await resolveUser(req);
    if(!user) return res.status(401).json({ success: false, message: 'Login required' });

    let finalPic = req.body.profilePic || req.body.image || req.body.pic || req.body.avatar || '';

    // Agar file aayi hai to Cloudinary pe upload karo - MANDATORY CLOUDINARY
    if(req.file){
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'samanlive/users',
        resource_type: 'image',
        transformation: [
          { width: 500, height: 500, crop: 'fill', gravity: 'face' },
          { quality: 'auto:good', fetch_format: 'auto' }
        ]
      });
      finalPic = result.secure_url;
    }

    if(!finalPic) return res.status(400).json({ success: false, message: 'profilePic required' });

    const updated = await User.findByIdAndUpdate(user._id, { profilePic: finalPic, avatar: finalPic, updatedAt: new Date() }, { new: true });

    if(global.io){
      global.io.to(`user:${user._id}`).emit('profile-updated', publicUser(updated));
    }

    res.json({ success: true, user: publicUser(updated), pic: finalPic, url: finalPic });
  }catch(e){
    console.error('Profile pic error', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ========== 4.1 NEW - POST UPLOAD-AVATAR - FILE UPLOAD - CLOUDINARY MANDATORY ==========
router.post('/upload-avatar', memoryUpload.single('profilePic'), async (req, res) => {
  try{
    const user = await resolveUser(req);
    if(!user) return res.status(401).json({ success: false, message: 'Login required' });
    if(!req.file) return res.status(400).json({ success: false, message: 'File missing' });

    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'samanlive/users',
      resource_type: 'image',
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good', fetch_format: 'auto' }
      ]
    });

    const url = result.secure_url;
    const updated = await User.findByIdAndUpdate(user._id, { profilePic: url, avatar: url, updatedAt: new Date() }, { new: true });

    console.log(`✅ Avatar uploaded to Cloudinary: ${user._id} -> ${url}`);

    res.json({ success: true, url, avatar: url, profilePic: url, user: publicUser(updated), public_id: result.public_id });
  }catch(e){
    console.error('upload-avatar error', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ========== 5. GET ALL ADDRESSES (CHECKOUT USE KARTA HAI) ==========
router.get('/addresses/list', async (req, res) => {
  try{
    const user = await resolveUser(req);
    if(!user){
      // Guest ke liye local addresses
      return res.json({ success: true, addresses: [], guest: true, message: 'Guest - no saved addresses' });
    }
    res.json({ success: true, addresses: user.addresses || [], count: (user.addresses||[]).length });
  }catch(e){
    res.json({ success: true, addresses: [], error: e.message });
  }
});

// ========== 6. STATS FOR PROFILE PAGE ==========
router.get('/stats/:userId', async (req, res) => {
  try{
    const Order = require('../../models/Order');
    const userId = req.params.userId;
    const ids = [userId];
    if(userId.startsWith('user_')) ids.push(userId.replace('user_',''));
    ids.push(userId.replace('user_','').replace('guest_',''));

    const totalOrders = await Order.countDocuments({ $or: [{ buyerId: { $in: ids } }, { userId: { $in: ids } }] });
    const pendingOrders = await Order.countDocuments({ buyerId: { $in: ids }, orderStatus: { $in: ['placed','confirmed','accepted'] } });
    const deliveredOrders = await Order.countDocuments({ buyerId: { $in: ids }, orderStatus: 'delivered' });

    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        deliveredOrders,
        walletBalance: 0
      }
    });
  }catch(e){
    res.json({ success: true, stats: { totalOrders: 0, pendingOrders: 0, deliveredOrders: 0 } });
  }
});

module.exports = router;
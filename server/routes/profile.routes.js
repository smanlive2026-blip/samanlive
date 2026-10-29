// LOCATION: server/routes/common/profile.routes.js - V1 WORLD CLASS - USER + SHOP PROFILE + CLOUDINARY - MAIN APP + SHOP TEMPLATE CONNECTED
const express = require('express');
const router = express.Router();
const multer = require('multer');
const User = require('../../models/User');
const Shop = require('../../models/Shop');
const { cloudinary } = require('../../utils/cloudinary');
const { authenticateToken } = require('../../middleware/authenticateToken');

// Memory storage - Vercel pe disk fail hota hai, isliye memory + cloudinary
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req,file,cb)=>{
    if(file.mimetype.startsWith('image/')) cb(null,true);
    else cb(new Error('Only images allowed'), false);
  }
});

// Helper: buyerId se userId nikalo
function extractUserId(buyerId){
  if(!buyerId) return null;
  if(buyerId.startsWith('user_')) return buyerId.replace('user_','');
  if(buyerId.length===24) return buyerId; // ObjectId
  return null;
}

// GET /api/common/profile/me?buyerId=xxx  - MAIN API - MAIN APP + COMMON CONNECT
router.get('/me', async (req,res)=>{
  try{
    const buyerId = req.query.buyerId || req.headers['x-buyer-id'] || req.user?._id || '';
    let user = null;

    // 1. Try req.user (if auth middleware lagaya ho)
    if(req.user && req.user._id){
      user = req.user;
    }

    // 2. buyerId se extract
    if(!user){
      const uid = extractUserId(buyerId);
      if(uid){
        user = await User.findById(uid).select('-password').lean();
      }
    }

    // 3. token se - Authorization header
    if(!user){
      const authHeader = req.headers.authorization || '';
      const token = authHeader.replace('Bearer ','').trim();
      if(token){
        try{
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'samanlive_secret_key_2026_change_this');
          const id = decoded.id || decoded.userId || decoded._id;
          if(id) user = await User.findById(id).select('-password').lean();
        }catch(e){}
      }
    }

    if(!user){
      return res.status(404).json({ success:false, message:'User not found', buyerId });
    }

    // Shop owner hai to shop info bhi do
    let shop = null;
    if(user){
      try{
        shop = await Shop.findOne({ ownerId: user._id, status: { $ne: 'deleted' } }).lean().catch(()=>null);
      }catch(e){}
    }

    res.json({
      success:true,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role || 'customer',
        avatar: user.avatar || '',
        profilePic: user.avatar || '/assets/default-avatar.png',
        addresses: user.addresses || [],
        city: user.city || '',
        area: user.area || '',
        preferences: user.preferences || { language: 'hi' },
        language: user.preferences?.language || 'hi',
        shop: shop || null,
        userId: 'SL' + String(user._id).slice(-6).toUpperCase()
      },
      shop
    });
  }catch(e){
    console.error('common/profile/me error', e);
    res.status(500).json({ success:false, message:e.message });
  }
});

// PUT /api/common/profile/update - Unified update
router.put('/update', async (req,res)=>{
  try{
    const { buyerId, name, phone, email, language, avatar, profilePic } = req.body;
    const uid = extractUserId(buyerId || req.headers['x-buyer-id'] || '') || req.user?._id;
    if(!uid) return res.status(400).json({ success:false, message:'buyerId required' });

    const update = {};
    if(name) update.name = name;
    if(phone) update.phone = phone;
    if(email) update.email = email;
    if(language) update['preferences.language'] = language;
    if(avatar || profilePic) update.avatar = avatar || profilePic;

    const user = await User.findByIdAndUpdate(uid, update, { new:true, runValidators:false }).select('-password');
    if(!user) return res.status(404).json({ success:false, message:'User not found' });

    res.json({ success:true, user: { _id: user._id, name: user.name, phone: user.phone, email: user.email, profilePic: user.avatar, avatar: user.avatar, language: user.preferences?.language } });
  }catch(e){
    res.status(500).json({ success:false, message:e.message });
  }
});

// POST /api/common/profile/upload-avatar - CLOUDINARY MANDATORY
router.post('/upload-avatar', upload.single('profilePic'), async (req,res)=>{
  try{
    if(!req.file) return res.status(400).json({ success:false, message:'File missing' });
    const buyerId = req.body.buyerId || req.headers['x-buyer-id'] || '';
    const uid = extractUserId(buyerId) || req.user?._id;

    // Cloudinary upload from buffer
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'samanlive/users',
      resource_type: 'image',
      transformation: [{ width: 500, height: 500, crop: 'fill', gravity: 'face' }, { quality: 'auto:good', fetch_format: 'auto' }]
    });

    const url = result.secure_url;

    // DB me save
    if(uid){
      await User.findByIdAndUpdate(uid, { avatar: url }).catch(()=>{});
    }

    res.json({ success:true, url, avatar: url, profilePic: url, public_id: result.public_id });
  }catch(e){
    console.error('upload-avatar error', e);
    res.status(500).json({ success:false, message:e.message });
  }
});

// Fallback: /api/upload/upload-pic jo purana main app maangta hai - same logic ko redirect
router.post('/upload-pic-legacy', upload.single('profilePic'), async (req,res)=>{
  // same as above
  try{
    if(!req.file) return res.status(400).json({ success:false, message:'File missing' });
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
    const result = await cloudinary.uploader.upload(dataURI, { folder: 'samanlive/users', resource_type: 'image' });
    res.json({ success:true, url: result.secure_url });
  }catch(e){ res.status(500).json({ success:false, message:e.message }); }
});

module.exports = router;
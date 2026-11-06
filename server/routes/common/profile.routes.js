// LOCATION: server/routes/common/profile.routes.js - V23 UNIFIED - FULL CODE - NO CUT
// SUPPORT: customer + shop_owner + shop_logo + area_manager + executive + product_manager + delivery_boy
// FLOW: File (memory) -> Cloudinary -> URL -> Sahi Model + Media collection
// NOTE: middleware/upload.js ko haath nahi lagaya - memoryStorage use kiya hai, Vercel safe hai

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const { cloudinary } = require('../../utils/cloudinary');

const User = require('../../models/User');
const Shop = require('../../models/Shop');

// MEMORY STORAGE - Vercel safe, disk pe kuch save nahi hoga
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if(file.mimetype && file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'), false);
  }
});

// ---------- HELPER: User resolve ----------
async function resolveUser(req){
  let buyerId = req.headers['x-buyer-id'] || req.query.buyerId || req.body.buyerId || req.body.userId || '';
  let tokenUserId = req.user && req.user._id ? req.user._id : null;
  if(tokenUserId){
    try{ const u = await User.findById(tokenUserId); if(u) return u; }catch(e){}
  }
  if(buyerId){
    let id = String(buyerId);
    if(id.startsWith('user_')) id = id.replace('user_','');
    if(id.startsWith('guest_')) return null;
    if(mongoose.Types.ObjectId.isValid(id)){
      try{ const u = await User.findById(id); if(u) return u; }catch(e){}
    }
    const phone = id.replace(/\D/g,'').slice(-10);
    if(phone.length >= 10){
      try{ const u = await User.findOne({ phone: phone }); if(u) return u; }catch(e){}
    }
  }
  try{
    const auth = req.headers.authorization || '';
    if(auth.startsWith('Bearer ')){
      const token = auth.split(' ')[1];
      if(token && token.split('.').length === 3){
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        if(payload._id && mongoose.Types.ObjectId.isValid(payload._id)){
          const u = await User.findById(payload._id); if(u) return u;
        }
        if(payload.phone){
          const u = await User.findOne({ phone: payload.phone }); if(u) return u;
        }
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
    profilePic: user.profilePic || user.avatar || '',
    avatar: user.profilePic || user.avatar || '',
    isVerified: user.isVerified || false,
    addresses: user.addresses || [],
    shopId: user.shopId || null,
    area: user.area || '',
    city: user.city || '',
    createdAt: user.createdAt
  };
}

// ---------- 1. GET /me - Sab role ke liye ----------
router.get('/me', async (req, res) => {
  try{
    const role = (req.query.role || '').toLowerCase();
    const shopId = req.query.shopId || '';

    // Area Manager
    if(role === 'area_manager'){
      try{
        const Manager = require('../../models/Manager');
        const managerId = req.query.managerId || req.headers['x-manager-id'] || '';
        let m = null;
        if(managerId && mongoose.Types.ObjectId.isValid(managerId)) m = await Manager.findById(managerId);
        if(!m && req.query.phone) m = await Manager.findOne({ phone: req.query.phone });
        if(m) return res.json({ success: true, role: 'area_manager', user: { _id: m._id, name: m.name, phone: m.phone, email: m.email || '', profilePic: m.photo || '', avatar: m.photo || '', areaName: m.areaName, areaCode: m.areaCode, city: m.city } });
      }catch(e){}
    }
    // Executive
    if(role === 'executive'){
      try{
        const Executive = require('../../models/Executive');
        const eid = req.query.executiveId || '';
        if(eid && mongoose.Types.ObjectId.isValid(eid)){
          const ex = await Executive.findById(eid);
          if(ex) return res.json({ success: true, role: 'executive', user: { _id: ex._id, name: ex.name, phone: ex.phone, email: ex.email || '', profilePic: ex.photo || ex.avatar || '', avatar: ex.photo || ex.avatar || '' } });
        }
      }catch(e){}
    }
    // Product Manager
    if(role === 'product_manager'){
      try{
        const PM = require('../../models/ProductManager');
        const pmid = req.query.pmId || req.query.productManagerId || '';
        if(pmid && mongoose.Types.ObjectId.isValid(pmid)){
          const pm = await PM.findById(pmid);
          if(pm) return res.json({ success: true, role: 'product_manager', user: { _id: pm._id, name: pm.name, phone: pm.phone, email: pm.email || '', profilePic: pm.photo || pm.avatar || '', avatar: pm.photo || pm.avatar || '', companyName: pm.companyName } });
        }
      }catch(e){}
    }
    // Shop
    if(role === 'shop_owner' || role === 'shop_logo'){
      if(shopId && mongoose.Types.ObjectId.isValid(shopId)){
        const shop = await Shop.findById(shopId);
        if(shop) return res.json({ success: true, role: 'shop_owner', user: { _id: shop._id, name: shop.shopName, phone: shop.phone || shop.ownerPhone || '', email: shop.email || '', profilePic: shop.logo || '', avatar: shop.logo || '', ownerPhoto: shop.ownerPhotoUrl || '' }, shop: shop });
      }
    }

    // Default - Customer / User
    const user = await resolveUser(req);
    if(!user) return res.status(401).json({ success: false, message: 'User not found - login karo', guest: true });
    let shopInfo = null;
    if(user.shopId || user.role === 'shop_owner'){
      try{
        const sid = user.shopId || shopId;
        if(sid && mongoose.Types.ObjectId.isValid(sid)) shopInfo = await Shop.findById(sid);
        else if(user.phone) shopInfo = await Shop.findOne({ ownerPhone: user.phone }) || await Shop.findOne({ phone: user.phone });
      }catch(e){}
    }
    res.json({ success: true, user: publicUser(user), shop: shopInfo, message: 'Profile loaded' });
  }catch(e){
    res.status(500).json({ success: false, message: e.message });
  }
});

// ---------- 2. PUT /update - Name / Email / City ----------
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
    if(profilePic || avatar) update.avatar = profilePic || avatar;
    if(city) update.city = city;
    if(area) update.area = area;
    update.updatedAt = new Date();
    const updated = await User.findByIdAndUpdate(user._id, update, { new: true });
    if(global.io) global.io.to(`user:${user._id}`).emit('profile-updated', publicUser(updated));
    res.json({ success: true, user: publicUser(updated), message: 'Profile updated' });
  }catch(e){ res.status(500).json({ success: false, message: e.message }); }
});

// ---------- 3. POST /upload-avatar - MAIN - ALL ROLES + CLOUDINARY ----------
router.post('/upload-avatar', memoryUpload.single('profilePic'), async (req, res) => {
  try{
    const role = String(req.body.role || 'customer').toLowerCase();
    const field = req.body.field || '';
    const type = req.body.type || 'avatar';
    const shopId = req.body.shopId || req.query.shopId || '';

    let fileBuffer = null;
    let mime = 'image/jpeg';
    let base64Input = req.body.profilePic || req.body.image || req.body.pic || req.body.avatar || '';

    if(req.file){
      fileBuffer = req.file.buffer;
      mime = req.file.mimetype;
    } else if(base64Input && base64Input.startsWith('data:image')){
      const parts = base64Input.split(',');
      const header = parts[0];
      const m = header.match(/data:(.*);base64/);
      if(m) mime = m[1];
      fileBuffer = Buffer.from(parts[1], 'base64');
    } else if(base64Input && base64Input.startsWith('http')){
      // Pehle se Cloudinary URL hai - dobara upload mat karo
      return res.json({ success: true, url: base64Input, profilePic: base64Input, avatar: base64Input, savedTo: 'already-url', role });
    } else {
      return res.status(400).json({ success: false, message: 'Image missing - file ya base64 bhejo' });
    }

    // CLOUDINARY FOLDER - role ke hisab se
    const folderMap = {
      customer: 'samanlive/users',
      shop_owner: `samanlive/shops/${shopId || 'general'}`,
      shop_logo: `samanlive/shops/${shopId || 'general'}`,
      shop_cover: `samanlive/shops/${shopId || 'general'}`,
      shop_gallery: `samanlive/shops/${shopId || 'general'}`,
      area_manager: 'samanlive/managers',
      executive: 'samanlive/executives',
      product_manager: 'samanlive/product-managers',
      delivery_boy: 'samanlive/delivery'
    };
    const folder = folderMap[role] || 'samanlive/users';

    const dataURI = `data:${mime};base64,${fileBuffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataURI, {
      folder,
      resource_type: 'image',
      transformation: [{ width: 800, height: 800, crop: 'limit' }, { quality: 'auto:good', fetch_format: 'auto' }]
    });
    const url = result.secure_url;

    // SAVE TO CORRECT MODEL
    let savedTo = '';
    try{
      if(role === 'customer'){
        const user = await resolveUser(req);
        if(user){
          await User.findByIdAndUpdate(user._id, { profilePic: url, avatar: url, updatedAt: new Date() });
          savedTo = 'User.avatar + User.profilePic';
        }
      }
      if(role === 'shop_owner' || role === 'shop_logo' || role === 'shop_cover' || role === 'shop_gallery'){
        if(shopId && mongoose.Types.ObjectId.isValid(shopId)){
          const update = {};
          if(field === 'ownerPhotoUrl' || role === 'shop_owner') update.ownerPhotoUrl = url;
          else if(field === 'banner' || role === 'shop_cover') update.banner = url;
          else if(field === 'gallery' || role === 'shop_gallery'){ /* gallery Media me jayegi, Shop me nahi */ }
          else update.logo = url;
          if(Object.keys(update).length > 0) await Shop.findByIdAndUpdate(shopId, update);
          savedTo = `Shop.${field || 'logo'}`;
        }
      }
      if(role === 'area_manager'){
        const Manager = require('../../models/Manager');
        const managerId = req.body.managerId || req.headers['x-manager-id'] || '';
        if(managerId && mongoose.Types.ObjectId.isValid(managerId)) await Manager.findByIdAndUpdate(managerId, { photo: url });
        else if(req.body.phone) await Manager.findOneAndUpdate({ phone: req.body.phone }, { photo: url });
        savedTo = 'Manager.photo';
      }
      if(role === 'executive'){
        const Executive = require('../../models/Executive');
        const eid = req.body.executiveId || req.body.userId || '';
        if(eid && mongoose.Types.ObjectId.isValid(eid)) await Executive.findByIdAndUpdate(eid, { photo: url, avatar: url });
        else if(req.body.phone) await Executive.findOneAndUpdate({ phone: req.body.phone }, { photo: url, avatar: url });
        savedTo = 'Executive.photo';
      }
      if(role === 'product_manager'){
        const PM = require('../../models/ProductManager');
        const pmid = req.body.pmId || req.body.productManagerId || req.body.userId || '';
        if(pmid && mongoose.Types.ObjectId.isValid(pmid)) await PM.findByIdAndUpdate(pmid, { photo: url, avatar: url });
        else if(req.body.phone) await PM.findOneAndUpdate({ phone: req.body.phone }, { photo: url, avatar: url });
        savedTo = 'ProductManager.photo';
      }
      if(role === 'delivery_boy'){
        savedTo = 'Delivery - Media only';
      }

      // Media collection me bhi entry - history / gallery ke liye
      try{
        const Media = require('../../models/Media');
        await Media.create({ shopId: shopId || 'general', template: role, type: type, refId: null, url });
      }catch(e){}

      // Socket emit
      if(global.io && role === 'customer'){
        const user = await resolveUser(req);
        if(user) global.io.to(`user:${user._id}`).emit('profile-updated', { profilePic: url, avatar: url });
      }
    }catch(e){ console.log('Save to model warn:', e.message); }

    res.json({ success: true, url, profilePic: url, avatar: url, public_id: result.public_id, savedTo, role, field });
  }catch(e){
    console.error('Unified upload-avatar error', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ---------- 4. PUT /pic - Backward compatible - purana code na tute ----------
router.put('/pic', memoryUpload.single('profilePic'), async (req, res) => {
  try{
    const user = await resolveUser(req);
    if(!user) return res.status(401).json({ success: false, message: 'Login required' });
    let finalPic = req.body.profilePic || req.body.image || req.body.pic || req.body.avatar || '';
    if(req.file){
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;
      const result = await cloudinary.uploader.upload(dataURI, { folder: 'samanlive/users', resource_type: 'image', transformation: [{ width: 500, height: 500, crop: 'fill', gravity: 'face' }, { quality: 'auto:good', fetch_format: 'auto' }] });
      finalPic = result.secure_url;
    }
    if(!finalPic) return res.status(400).json({ success: false, message: 'profilePic required' });
    const updated = await User.findByIdAndUpdate(user._id, { profilePic: finalPic, avatar: finalPic, updatedAt: new Date() }, { new: true });
    res.json({ success: true, user: publicUser(updated), pic: finalPic, url: finalPic });
  }catch(e){ res.status(500).json({ success: false, message: e.message }); }
});

// ---------- 5. GET /:userId - kisi ka profile dekhna ----------
router.get('/:userId', async (req, res) => {
  try{
    const { userId } = req.params;
    if(!userId || userId === 'me') return res.status(400).json({ success: false, message: 'Use /me' });
    let user = null;
    if(mongoose.Types.ObjectId.isValid(userId)) user = await User.findById(userId);
    if(!user) user = await User.findOne({ phone: userId });
    if(!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: publicUser(user) });
  }catch(e){ res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
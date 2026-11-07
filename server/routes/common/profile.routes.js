// LOCATION: server/routes/common/profile.routes.js - V27 FINAL - FULL CODE - NO CUT
// SUPPORT: customer + shop_owner + shop_logo + shop_cover + shop_gallery + area_manager + executive + product_manager + delivery_boy
// FLOW: File (memory) -> Cloudinary -> URL -> Sahi Model + Media collection
// NOTE: middleware/upload.js ko haath nahi lagaya - memoryStorage use kiya hai, Vercel safe hai
// V27 CHANGE: 1) areaCode fallback HATA DIYA - managerId/phone na ho toh kuch update nahi hoga, galat aadmi ki photo kabhi nahi badlegi 2) PUT /update me har role me duplicate check -> 409 Hindi me, 500 nahi 3) phone hamesha 10 digit, email/gender hamesha chhota 4) PUT /pic me base64 reject 5) E11000 -> 409
// RULE: DB me kabhi base64 nahi jayega, sirf Cloudinary URL jayega. Update hamesha _id se, areaCode se kabhi nahi.

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const { cloudinary } = require('../../utils/cloudinary');

const User = require('../../models/User');
const Shop = require('../../models/Shop');

// V27: Normalize - findByIdAndUpdate pe Model setter nahi chalta, isliye yahan haath se karna padega
function normPhone(v) {
    if (v === undefined || v === null) return '';
    const d = String(v).replace(/\D/g, '');
    if (!d) return '';
    return d.length > 10 ? d.slice(-10) : d;
}
function normEmail(v) {
    if (v === undefined || v === null) return '';
    return String(v).toLowerCase().trim();
}
function normGender(v) {
    if (v === undefined || v === null) return '';
    return String(v).toLowerCase().trim();
}
function isBase64Image(val) {
    if (!val || typeof val !== 'string') return false;
    const s = val.trim();
    return s.startsWith('data:image') || s.startsWith('data:application') || (s.length > 5000 && !s.startsWith('http') && !s.startsWith('/') && !s.startsWith('blob:'));
}
function dupRes(res, field, val) {
    return res.status(409).json({ success: false, message: `Ye ${field} (${val}) pehle se kisi aur ka hai. Dusra ${field} use karo.` });
}
function handleDupErr(res, err) {
    if (err && (err.code === 11000 || String(err.message || '').includes('E11000'))) {
        const f = Object.keys(err.keyValue || {})[0] || 'phone/email';
        return res.status(409).json({ success: false, message: `Ye ${f} (${err.keyValue ? err.keyValue[f] : ''}) pehle se kisi aur ka hai. Dusra ${f} use karo.` });
    }
    return null;
}

// ============================================================================
// MEMORY STORAGE - Vercel safe, disk pe kuch save nahi hoga
// ============================================================================
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if(file.mimetype && file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'), false);
  }
});

// ============================================================================
// HELPER 1: User resolve - BuyerId / Token / Phone - teeno se dhoondhega
// ============================================================================
async function resolveUser(req){
  let tokenUserId = req.user && req.user._id ? req.user._id : null;
  if(tokenUserId){
    try{
      const u = await User.findById(tokenUserId);
      if(u) return u;
    }catch(e){}
  }
  let buyerId = req.headers['x-buyer-id'] || req.query.buyerId || req.body.buyerId || req.body.userId || '';
  if(buyerId){
    let id = String(buyerId);
    if(id.startsWith('user_')) id = id.replace('user_','');
    if(id.startsWith('guest_')) return null;
    if(mongoose.Types.ObjectId.isValid(id)){
      try{
        const u = await User.findById(id);
        if(u) return u;
      }catch(e){}
    }
    const phone = normPhone(id);
    if(phone.length === 10){
      try{
        const u = await User.findOne({ phone });
        if(u) return u;
      }catch(e){}
    }
  }
  try{
    const auth = req.headers.authorization || '';
    if(auth.startsWith('Bearer ')){
      const token = auth.split(' ')[1];
      if(token && token.split('.').length === 3){
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        if(payload._id && mongoose.Types.ObjectId.isValid(payload._id)){
          const u = await User.findById(payload._id);
          if(u) return u;
        }
        if(payload.phone){
          const u = await User.findOne({ phone: normPhone(payload.phone) });
          if(u) return u;
        }
        if(payload.userId && mongoose.Types.ObjectId.isValid(payload.userId)){
          const u = await User.findById(payload.userId);
          if(u) return u;
        }
      }
    }
  }catch(e){}
  return null;
}

// ============================================================================
// HELPER 2: publicUser
// ============================================================================
function publicUser(user){
  if(!user) return null;
  const pic = user.profilePic || user.avatar || user.photo || '';
  return {
    _id: user._id, name: user.name, phone: user.phone, email: user.email || '',
    role: user.role || 'customer', profilePic: pic, avatar: pic, photo: pic,
    coverPhoto: user.coverPhoto || '', gender: user.gender || '', dob: user.dob || null,
    isVerified: user.isVerified || false, status: user.status || 'active',
    addresses: user.addresses || [], shopId: user.shopId || null, shopIds: user.shopIds || [],
    area: user.area || '', city: user.city || '', state: user.state || '', pincode: user.pincode || '',
    address: user.address || '', wallet: user.wallet || { balance: 0, totalEarning: 0 },
    language: user.preferences?.language || user.language || 'hi', preferences: user.preferences || {},
    totalOrders: user.totalOrders || 0, totalSpent: user.totalSpent || 0,
    createdAt: user.createdAt, updatedAt: user.updatedAt
  };
}

// ============================================================================
// HELPER 3: publicShop
// ============================================================================
function publicShop(shop){
  if(!shop) return null;
  const logo = shop.logo || shop.shopLogo || shop.uploadedLogo || shop.image || '';
  const banner = shop.banner || shop.coverPhoto || shop.cover || '';
  const ownerPhoto = shop.ownerPhotoUrl || shop.ownerPhoto || shop.ownerAvatar || '';
  const o = shop.toObject ? shop.toObject() : shop;
  return {
    ...o, logo, shopLogo: logo, uploadedLogo: logo, image: logo,
    banner, coverPhoto: banner, cover: banner,
    ownerPhotoUrl: ownerPhoto, ownerPhoto: ownerPhoto, ownerAvatar: ownerPhoto,
    gallery: shop.gallery || shop.shopImages || [], shopImages: shop.shopImages || shop.gallery || [],
    shopName: shop.shopName || shop.name || '', ownerName: shop.ownerName || '',
    phone: shop.phone || shop.ownerPhone || '', ownerPhone: shop.ownerPhone || shop.phone || ''
  };
}

// ============================================================================
// HELPER 4: publicManager
// ============================================================================
function publicManager(m){
  if(!m) return null;
  const pic = m.photo || m.avatar || m.profilePic || '';
  return {
    _id: m._id, name: m.name, phone: m.phone, email: m.email || '',
    profilePic: pic, avatar: pic, photo: pic, coverPhoto: m.coverPhoto || '',
    areaCode: m.areaCode || '', areaName: m.areaName || '', city: m.city || '', state: m.state || '',
    pincode: m.pincode || '', bucket: m.bucket || '', role: m.role || 'area-manager',
    managerCode: m.managerCode || '', vehicleType: m.vehicleType || '', vehicleNumber: m.vehicleNumber || '',
    isAvailable: m.isAvailable !== undefined ? m.isAvailable : true, isOnline: m.isOnline || false,
    isVerified: m.isVerified || false, status: m.status, isActive: m.isActive,
    walletBalance: m.walletBalance || 0, totalEarning: m.totalEarning || 0, totalDeliveries: m.totalDeliveries || 0,
    createdAt: m.createdAt
  };
}

// ============================================================================
// HELPER 5: publicExecutive
// ============================================================================
function publicExecutive(ex){
  if(!ex) return null;
  const pic = ex.photo || ex.avatar || ex.profilePic || '';
  return {
    _id: ex._id, name: ex.name, phone: ex.phone, email: ex.email || '',
    profilePic: pic, avatar: pic, photo: pic, coverPhoto: ex.coverPhoto || '',
    area: ex.area || '', city: ex.city || '', state: ex.state || '', pincode: ex.pincode || '',
    companyName: ex.companyName || '', type: ex.type || '', isVerified: ex.isVerified || false,
    isActive: ex.isActive, walletBalance: ex.walletBalance || 0, totalEarning: ex.totalEarning || 0, createdAt: ex.createdAt
  };
}

// ============================================================================
// HELPER 6: publicProductManager
// ============================================================================
function publicProductManager(pm){
  if(!pm) return null;
  const pic = pm.photo || pm.avatar || pm.profilePic || '';
  return {
    _id: pm._id, name: pm.name, phone: pm.phone, email: pm.email || '',
    profilePic: pic, avatar: pic, photo: pic, companyName: pm.companyName || '',
    companyLogo: pm.companyLogo || '', companyCover: pm.companyCover || '', type: pm.type || 'other',
    area: pm.area || '', city: pm.city || '', state: pm.state || '', pincode: pm.pincode || '',
    gst: pm.gst || '', isVerified: pm.isVerified || false, isActive: pm.isActive,
    walletBalance: pm.walletBalance || 0, totalEarning: pm.totalEarning || 0, totalProducts: pm.totalProducts || 0, createdAt: pm.createdAt
  };
}

// ============================================================================
// HELPER 7: saveUrlToModel - V27 - areaCode fallback HATA DIYA
// ============================================================================
async function saveUrlToModel(role, field, type, url, req){
  const shopId = req.body.shopId || req.query.shopId || '';
  let savedTo = '';
  const ph = req.body.phone ? normPhone(req.body.phone) : '';

  if(role === 'customer'){
    const user = await resolveUser(req);
    if(user){
      await User.findByIdAndUpdate(user._id, { profilePic: url, avatar: url, photo: url, updatedAt: new Date() });
      savedTo = 'User.photo + User.avatar + User.profilePic';
    } else if(req.body.userId && mongoose.Types.ObjectId.isValid(req.body.userId)){
      await User.findByIdAndUpdate(req.body.userId, { profilePic: url, avatar: url, photo: url });
      savedTo = 'User.photo + avatar + profilePic (by userId)';
    }
  }

  if(role === 'shop_owner' || role === 'shop_logo' || role === 'shop_cover' || role === 'shop_gallery'){
    if(shopId && mongoose.Types.ObjectId.isValid(shopId)){
      const update = {};
      if(field === 'ownerPhotoUrl' || field === 'ownerPhoto' || field === 'ownerAvatar' || role === 'shop_owner'){
        update.ownerPhotoUrl = url; update.ownerPhoto = url; update.ownerAvatar = url;
        savedTo = 'Shop.ownerPhotoUrl + ownerPhoto + ownerAvatar';
      } else if(field === 'banner' || field === 'coverPhoto' || field === 'cover' || role === 'shop_cover'){
        update.banner = url; update.coverPhoto = url; update.cover = url;
        savedTo = 'Shop.banner + coverPhoto + cover';
      } else if(field === 'gallery' || role === 'shop_gallery'){
        await Shop.findByIdAndUpdate(shopId, { $push: { gallery: url, shopImages: url } });
        savedTo = 'Shop.gallery + shopImages (push)';
      } else {
        update.logo = url; update.shopLogo = url; update.uploadedLogo = url; update.image = url;
        savedTo = 'Shop.logo + shopLogo + uploadedLogo + image';
      }
      if(Object.keys(update).length > 0) await Shop.findByIdAndUpdate(shopId, update);
    } else if(ph) {
      const shop = await Shop.findOne({ phone: ph }) || await Shop.findOne({ ownerPhone: ph });
      if(shop){
        const update = {};
        if(field === 'ownerPhotoUrl' || role === 'shop_owner'){ update.ownerPhotoUrl = url; update.ownerPhoto = url; update.ownerAvatar = url; }
        else if(field === 'banner' || role === 'shop_cover'){ update.banner = url; update.coverPhoto = url; update.cover = url; }
        else { update.logo = url; update.shopLogo = url; update.uploadedLogo = url; update.image = url; }
        await Shop.findByIdAndUpdate(shop._id, update);
        savedTo = 'Shop (by phone)';
      }
    }
  }

  // ---- AREA MANAGER - V27: areaCode se kabhi mat dhoondho ----
  if(role === 'area_manager'){
    const Manager = require('../../models/Manager');
    const managerId = req.body.managerId || req.body.userId || req.headers['x-manager-id'] || req.query.managerId || '';
    const upd = { photo: url, avatar: url, profilePic: url };
    if(managerId && mongoose.Types.ObjectId.isValid(managerId)){
      await Manager.findByIdAndUpdate(managerId, upd);
      savedTo = 'Manager.photo + avatar + profilePic (by _id)';
    } else if(ph){
      const m = await Manager.findOne({ phone: ph });
      if(m) { await Manager.findByIdAndUpdate(m._id, upd); savedTo = 'Manager.photo + avatar + profilePic (by phone)'; }
    } else {
      // V27: managerId + phone dono nahi hai toh KUCH MAT KARO - areaCode se pehle wale ki photo badal jati thi
      savedTo = 'SKIPPED - managerId/phone missing, areaCode fallback removed';
    }
  }

  if(role === 'executive'){
    const Executive = require('../../models/Executive');
    const eid = req.body.executiveId || req.body.userId || req.body.exId || '';
    const upd = { photo: url, avatar: url, profilePic: url };
    if(eid && mongoose.Types.ObjectId.isValid(eid)) await Executive.findByIdAndUpdate(eid, upd);
    else if(ph) await Executive.findOneAndUpdate({ phone: ph }, upd);
    savedTo = 'Executive.photo + avatar + profilePic';
  }

  if(role === 'product_manager'){
    const PM = require('../../models/ProductManager');
    const pmid = req.body.pmId || req.body.productManagerId || req.body.userId || '';
    if(field === 'companyLogo'){
      const upd = { companyLogo: url };
      if(pmid && mongoose.Types.ObjectId.isValid(pmid)) await PM.findByIdAndUpdate(pmid, upd);
      else if(ph) await PM.findOneAndUpdate({ phone: ph }, upd);
      savedTo = 'ProductManager.companyLogo';
    } else if(field === 'companyCover'){
      const upd = { companyCover: url };
      if(pmid && mongoose.Types.ObjectId.isValid(pmid)) await PM.findByIdAndUpdate(pmid, upd);
      else if(ph) await PM.findOneAndUpdate({ phone: ph }, upd);
      savedTo = 'ProductManager.companyCover';
    } else {
      const upd = { photo: url, avatar: url, profilePic: url };
      if(pmid && mongoose.Types.ObjectId.isValid(pmid)) await PM.findByIdAndUpdate(pmid, upd);
      else if(ph) await PM.findOneAndUpdate({ phone: ph }, upd);
      savedTo = 'ProductManager.photo + avatar + profilePic';
    }
  }

  if(role === 'delivery_boy'){
    const deliveryBoyId = req.body.deliveryBoyId || req.body.userId || req.body.deliveryId || '';
    const upd = { photo: url, avatar: url, profilePic: url };
    let saved = false;
    try{
      const DeliveryBoy = require('../../models/DeliveryBoy');
      if(deliveryBoyId && mongoose.Types.ObjectId.isValid(deliveryBoyId)){
        await DeliveryBoy.findByIdAndUpdate(deliveryBoyId, upd); saved = true;
      } else if(ph){
        const r = await DeliveryBoy.findOneAndUpdate({ phone: ph }, upd);
        if(r) saved = true;
      }
    }catch(e){ console.log('DeliveryBoy save warn', e.message); }
    if(!saved){
      try{
        const Manager = require('../../models/Manager');
        if(deliveryBoyId && mongoose.Types.ObjectId.isValid(deliveryBoyId)) await Manager.findByIdAndUpdate(deliveryBoyId, upd);
        else if(ph) await Manager.findOneAndUpdate({ phone: ph }, upd);
      }catch(e){}
    }
    savedTo = 'DeliveryBoy.photo + avatar + profilePic';
  }
  return savedTo;
}

// ============================================================================
// 1. GET /me - V27: areaCode fallback hataya
// ============================================================================
router.get('/me', async (req, res) => {
  try{
    const role = (req.query.role || '').toLowerCase();
    const shopId = req.query.shopId || '';
    const qPhone = req.query.phone ? normPhone(req.query.phone) : '';

    if(role === 'area_manager'){
      try{
        const Manager = require('../../models/Manager');
        const managerId = req.query.managerId || req.headers['x-manager-id'] || req.query.userId || '';
        let m = null;
        if(managerId && mongoose.Types.ObjectId.isValid(managerId)) m = await Manager.findById(managerId);
        if(!m && qPhone) m = await Manager.findOne({ phone: qPhone });
        // V27: areaCode se kabhi mat dhoondho - kisi aur ka profile khul jata tha
        if(m) return res.json({ success: true, role: 'area_manager', user: publicManager(m), manager: publicManager(m) });
      }catch(e){ console.log('area_manager /me warn', e.message); }
    }

    if(role === 'executive'){
      try{
        const Executive = require('../../models/Executive');
        const eid = req.query.executiveId || req.query.userId || '';
        if(eid && mongoose.Types.ObjectId.isValid(eid)){
          const ex = await Executive.findById(eid);
          if(ex) return res.json({ success: true, role: 'executive', user: publicExecutive(ex), executive: publicExecutive(ex) });
        }
        if(qPhone){
          const ex2 = await Executive.findOne({ phone: qPhone });
          if(ex2) return res.json({ success: true, role: 'executive', user: publicExecutive(ex2) });
        }
      }catch(e){}
    }

    if(role === 'product_manager'){
      try{
        const PM = require('../../models/ProductManager');
        const pmid = req.query.pmId || req.query.productManagerId || req.query.userId || '';
        if(pmid && mongoose.Types.ObjectId.isValid(pmid)){
          const pm = await PM.findById(pmid);
          if(pm) return res.json({ success: true, role: 'product_manager', user: publicProductManager(pm), productManager: publicProductManager(pm) });
        }
        if(qPhone){
          const pm2 = await PM.findOne({ phone: qPhone });
          if(pm2) return res.json({ success: true, role: 'product_manager', user: publicProductManager(pm2) });
        }
      }catch(e){}
    }

    if(role === 'delivery_boy'){
      try{
        const DeliveryBoy = require('../../models/DeliveryBoy');
        const did = req.query.deliveryBoyId || req.query.userId || '';
        let d = null;
        if(did && mongoose.Types.ObjectId.isValid(did)) d = await DeliveryBoy.findById(did);
        if(!d && qPhone) d = await DeliveryBoy.findOne({ phone: qPhone });
        if(d) return res.json({ success: true, role: 'delivery_boy', user: publicManager(d), deliveryBoy: publicManager(d) });
        const Manager = require('../../models/Manager');
        let m2 = null;
        if(did && mongoose.Types.ObjectId.isValid(did)) m2 = await Manager.findById(did);
        if(!m2 && qPhone) m2 = await Manager.findOne({ phone: qPhone });
        if(m2) return res.json({ success: true, role: 'delivery_boy', user: publicManager(m2) });
      }catch(e){}
    }

    if(role === 'shop_owner' || role === 'shop_logo' || role === 'shop_cover' || role === 'shop_gallery'){
      if(shopId && mongoose.Types.ObjectId.isValid(shopId)){
        const shop = await Shop.findById(shopId);
        if(shop){
          const pub = publicShop(shop);
          return res.json({ success: true, role: 'shop_owner', user: { _id: shop._id, name: shop.shopName, phone: shop.phone || shop.ownerPhone || '', email: shop.email || '', profilePic: pub.logo, avatar: pub.logo, photo: pub.logo, ownerPhoto: pub.ownerPhotoUrl }, shop: pub });
        }
      }
      if(qPhone){
        const shop2 = await Shop.findOne({ phone: qPhone }) || await Shop.findOne({ ownerPhone: qPhone });
        if(shop2) return res.json({ success: true, role: 'shop_owner', shop: publicShop(shop2), user: { _id: shop2._id, name: shop2.shopName, phone: shop2.phone, profilePic: publicShop(shop2).logo } });
      }
    }

    const user = await resolveUser(req);
    if(!user) return res.status(401).json({ success: false, message: 'User not found - login karo', guest: true });
    let shopInfo = null;
    if(user.shopId || user.role === 'shop_owner'){
      try{
        const sid = user.shopId || shopId;
        if(sid && mongoose.Types.ObjectId.isValid(sid)) shopInfo = await Shop.findById(sid);
        else if(user.phone) shopInfo = await Shop.findOne({ ownerPhone: user.phone }) || await Shop.findOne({ phone: user.phone });
        if(shopInfo) shopInfo = publicShop(shopInfo);
      }catch(e){}
    }
    res.json({ success: true, user: publicUser(user), shop: shopInfo, message: 'Profile loaded' });
  }catch(e){
    res.status(500).json({ success: false, message: e.message });
  }
});

// ============================================================================
// 2. PUT /update - V27: Har role me duplicate check + normalize + base64 reject
// ============================================================================
router.put('/update', async (req, res) => {
  try{
    const role = String(req.body.role || req.query.role || 'customer').toLowerCase();
    const { name, email, profilePic, avatar, photo, city, area, state, pincode, gender, address, language } = req.body;
    const pic = profilePic || avatar || photo || '';
    if (pic && isBase64Image(pic)) return res.status(400).json({ success: false, message: 'Base64 photo not allowed - Cloudinary URL bhejo' });
    const normEm = email ? normEmail(email) : '';
    const normPh = req.body.phone ? normPhone(req.body.phone) : '';
    const normGen = gender ? normGender(gender) : '';

    // ---- SHOP OWNER ----
    if(role === 'shop_owner' || role === 'shop_logo'){
      const shopId = req.body.shopId || req.query.shopId || '';
      if(shopId && mongoose.Types.ObjectId.isValid(shopId)){
        const upd = {};
        if(name) upd.shopName = name;
        if(normEm) upd.email = normEm;
        if(city) upd.city = city;
        if(area) upd.area = area;
        if(req.body.ownerName) upd.ownerName = req.body.ownerName;
        if(req.body.ownerPhone) upd.ownerPhone = normPhone(req.body.ownerPhone);
        if(pic){ upd.logo = pic; upd.shopLogo = pic; upd.uploadedLogo = pic; upd.image = pic; }
        const shop = await Shop.findByIdAndUpdate(shopId, upd, { new: true, runValidators: false });
        if(shop) return res.json({ success: true, shop: publicShop(shop), message: 'Shop profile updated' });
      }
    }

    // ---- EXECUTIVE ----
    if(role === 'executive'){
      const Executive = require('../../models/Executive');
      const eid = req.body.executiveId || req.body.userId || '';
      if(eid && mongoose.Types.ObjectId.isValid(eid)){
        if(normEm){
          const other = await Executive.findOne({ email: normEm, _id: { $ne: eid } }).lean();
          if(other) return dupRes(res, 'email', normEm);
        }
        if(normPh){
          const other = await Executive.findOne({ phone: normPh, _id: { $ne: eid } }).lean();
          if(other) return dupRes(res, 'phone', normPh);
        }
        const upd = {};
        if(name) upd.name = name;
        if(normEm) upd.email = normEm;
        if(normPh) upd.phone = normPh;
        if(city) upd.city = city;
        if(area) upd.area = area;
        if(state) upd.state = state;
        if(pincode) upd.pincode = pincode;
        if(normGen) upd.gender = normGen;
        if(req.body.companyName) upd.companyName = req.body.companyName;
        if(pic){ upd.photo = pic; upd.avatar = pic; upd.profilePic = pic; }
        const ex = await Executive.findByIdAndUpdate(eid, upd, { new: true, runValidators: false });
        if(ex) return res.json({ success: true, user: publicExecutive(ex), message: 'Executive updated' });
      }
    }

    // ---- PRODUCT MANAGER ----
    if(role === 'product_manager'){
      const PM = require('../../models/ProductManager');
      const pmid = req.body.pmId || req.body.productManagerId || req.body.userId || '';
      if(pmid && mongoose.Types.ObjectId.isValid(pmid)){
        if(normEm){
          const other = await PM.findOne({ email: normEm, _id: { $ne: pmid } }).lean();
          if(other) return dupRes(res, 'email', normEm);
        }
        if(normPh){
          const other = await PM.findOne({ phone: normPh, _id: { $ne: pmid } }).lean();
          if(other) return dupRes(res, 'phone', normPh);
        }
        const upd = {};
        if(name) upd.name = name;
        if(normEm) upd.email = normEm;
        if(normPh) upd.phone = normPh;
        if(city) upd.city = city;
        if(area) upd.area = area;
        if(state) upd.state = state;
        if(pincode) upd.pincode = pincode;
        if(normGen) upd.gender = normGen;
        if(req.body.companyName) upd.companyName = req.body.companyName;
        if(req.body.companyLogo) upd.companyLogo = req.body.companyLogo;
        if(req.body.companyCover) upd.companyCover = req.body.companyCover;
        if(req.body.gst) upd.gst = req.body.gst;
        if(pic){ upd.photo = pic; upd.avatar = pic; upd.profilePic = pic; }
        const pm = await PM.findByIdAndUpdate(pmid, upd, { new: true, runValidators: false });
        if(pm) return res.json({ success: true, user: publicProductManager(pm), message: 'Product Manager updated' });
      }
    }

    // ---- AREA MANAGER ----
    if(role === 'area_manager'){
      const Manager = require('../../models/Manager');
      const mid = req.body.managerId || req.body.userId || '';
      if(mid && mongoose.Types.ObjectId.isValid(mid)){
        if(normEm){
          const other = await Manager.findOne({ email: normEm, _id: { $ne: mid } }).lean();
          if(other) return dupRes(res, 'email', normEm);
        }
        if(normPh){
          const other = await Manager.findOne({ phone: normPh, _id: { $ne: mid } }).lean();
          if(other) return dupRes(res, 'phone', normPh);
        }
        const upd = {};
        if(name) upd.name = name;
        if(normEm) upd.email = normEm;
        if(normPh) upd.phone = normPh;
        if(city) upd.city = city;
        if(state) upd.state = state;
        if(pincode) upd.pincode = pincode;
        if(normGen) upd.gender = normGen;
        if(address) upd.address = typeof address === 'string' ? address : address.line1 || '';
        if(pic){ upd.photo = pic; upd.avatar = pic; upd.profilePic = pic; }
        const m = await Manager.findByIdAndUpdate(mid, upd, { new: true, runValidators: false });
        if(m) return res.json({ success: true, user: publicManager(m), message: 'Manager updated' });
      }
    }

    // ---- DELIVERY BOY ----
    if(role === 'delivery_boy'){
      const DeliveryBoy = require('../../models/DeliveryBoy');
      const did = req.body.deliveryBoyId || req.body.userId || '';
      if(did && mongoose.Types.ObjectId.isValid(did)){
        if(normEm){
          const other = await DeliveryBoy.findOne({ email: normEm, _id: { $ne: did } }).lean();
          if(other) return dupRes(res, 'email', normEm);
        }
        if(normPh){
          const other = await DeliveryBoy.findOne({ phone: normPh, _id: { $ne: did } }).lean();
          if(other) return dupRes(res, 'phone', normPh);
        }
        const upd = {};
        if(name) upd.name = name;
        if(normEm) upd.email = normEm;
        if(normPh) upd.phone = normPh;
        if(city) upd.city = city;
        if(area) upd.areaCode = area;
        if(state) upd.state = state;
        if(pincode) upd.pincode = pincode;
        if(normGen) upd.gender = normGen;
        if(req.body.vehicleType) upd.vehicleType = req.body.vehicleType;
        if(req.body.vehicleNumber) upd.vehicleNumber = String(req.body.vehicleNumber).toUpperCase().trim();
        if(req.body.isAvailable !== undefined) upd.isAvailable = req.body.isAvailable;
        if(req.body.isOnline !== undefined) upd.isOnline = req.body.isOnline;
        if(pic){ upd.photo = pic; upd.avatar = pic; upd.profilePic = pic; }
        const d = await DeliveryBoy.findByIdAndUpdate(did, upd, { new: true, runValidators: false });
        if(d) return res.json({ success: true, user: publicManager(d), message: 'Delivery Boy updated' });
      }
    }

    // ---- DEFAULT - CUSTOMER / USER ----
    const user = await resolveUser(req);
    if(!user) return res.status(401).json({ success: false, message: 'Login required' });
    if(normEm){
      const other = await User.findOne({ email: normEm, _id: { $ne: user._id } }).lean();
      if(other) return dupRes(res, 'email', normEm);
    }
    if(normPh){
      const other = await User.findOne({ phone: normPh, _id: { $ne: user._id } }).lean();
      if(other) return dupRes(res, 'phone', normPh);
    }
    const update = {};
    if(name) update.name = String(name).trim().slice(0,50);
    if(normEm) update.email = normEm;
    if(normPh) update.phone = normPh;
    if(pic){ update.profilePic = pic; update.avatar = pic; update.photo = pic; }
    if(city) update.city = city;
    if(area) update.area = area;
    if(state) update.state = state;
    if(pincode) update.pincode = pincode;
    if(normGen) update.gender = normGen;
    if(address){
      if(typeof address === 'string') update.address = address;
      else if(typeof address === 'object'){
        if(address.line1) update.address = address.line1;
        if(address.street) update.address = address.street;
        if(address.city) update.city = address.city;
        if(address.state) update.state = address.state;
        if(address.pincode) update.pincode = address.pincode;
      }
    }
    if(language) update['preferences.language'] = language;
    if(req.body.dob !== undefined) update.dob = req.body.dob ? new Date(req.body.dob) : null;
    if(req.body.coverPhoto){
      if(isBase64Image(req.body.coverPhoto)) return res.status(400).json({ success: false, message: 'Base64 cover not allowed' });
      update.coverPhoto = req.body.coverPhoto;
    }
    update.updatedAt = new Date();
    const updated = await User.findByIdAndUpdate(user._id, update, { new: true, runValidators: false });
    if(global.io) global.io.to(`user:${user._id}`).emit('profile-updated', publicUser(updated));
    res.json({ success: true, user: publicUser(updated), message: 'Profile updated' });
  }catch(e){
    const dup = handleDupErr(res, e);
    if(dup) return dup;
    res.status(500).json({ success: false, message: e.message });
  }
});

// ============================================================================
// 2B. PUT /shop/:shopId - Shop Info update
// ============================================================================
router.put('/shop/:shopId', async (req, res) => {
  try{
    const { shopId } = req.params;
    if(!shopId || !mongoose.Types.ObjectId.isValid(shopId)) return res.status(400).json({ success: false, message: 'Valid shopId required' });
    const b = req.body || {};
    const upd = {};
    if(b.shopName || b.name) upd.shopName = b.shopName || b.name;
    if(b.ownerName) upd.ownerName = b.ownerName;
    if(b.phone) upd.phone = normPhone(b.phone);
    if(b.ownerPhone) upd.ownerPhone = normPhone(b.ownerPhone);
    if(b.altPhone) upd.altPhone = normPhone(b.altPhone);
    if(b.email) upd.email = normEmail(b.email);
    if(b.whatsapp) upd.whatsapp = normPhone(b.whatsapp);
    if(b.description) upd.description = b.description;
    if(b.tagline) upd.tagline = b.tagline;
    if(b.shopType || b.category) upd.shopType = b.shopType || b.category;
    if(b.category) upd.categoryId = b.category;
    if(b.template) upd.template = b.template;
    if(b.serviceType) upd.serviceType = b.serviceType;
    if(b.address){
      if(typeof b.address === 'string') upd['address.line1'] = b.address;
      else if(typeof b.address === 'object'){
        if(b.address.line1) upd['address.line1'] = b.address.line1;
        if(b.address.line2) upd['address.line2'] = b.address.line2;
        if(b.address.city) upd['address.city'] = b.address.city;
        if(b.address.state) upd['address.state'] = b.address.state;
        if(b.address.pincode) upd['address.pincode'] = b.address.pincode;
      }
    }
    if(b.area) upd.area = b.area;
    if(b.city) { upd['address.city'] = b.city; }
    if(b.pincode) { upd['address.pincode'] = b.pincode; }
    if(b.landmark) upd['address.line2'] = b.landmark;
    if(b.state) upd['address.state'] = b.state;
    if(b.gst) upd.gst = String(b.gst).toUpperCase();
    if(b.fssai) upd.fssai = b.fssai;
    if(b.estYear) upd.estYear = Number(b.estYear);
    if(b.isOpen !== undefined) upd.isOpen = b.isOpen;
    if(b.announcement !== undefined) upd.announcement = b.announcement;
    const logoPic = b.logo || b.shopLogo || b.uploadedLogo || b.image || '';
    if(logoPic){
      if(isBase64Image(logoPic)) return res.status(400).json({ success: false, message: 'Base64 logo not allowed - Cloudinary URL bhejo' });
      upd.logo = logoPic; upd.shopLogo = logoPic; upd.uploadedLogo = logoPic; upd.image = logoPic;
    }
    const bannerPic = b.banner || b.coverPhoto || b.cover || '';
    if(bannerPic){
      if(isBase64Image(bannerPic)) return res.status(400).json({ success: false, message: 'Base64 banner not allowed' });
      upd.banner = bannerPic; upd.coverPhoto = bannerPic; upd.cover = bannerPic;
    }
    const ownerPic = b.ownerPhotoUrl || b.ownerPhoto || b.ownerAvatar || '';
    if(ownerPic){
      if(isBase64Image(ownerPic)) return res.status(400).json({ success: false, message: 'Base64 owner photo not allowed' });
      upd.ownerPhotoUrl = ownerPic; upd.ownerPhoto = ownerPic; upd.ownerAvatar = ownerPic;
    }
    if(b.gallery && Array.isArray(b.gallery)) upd.gallery = b.gallery;
    if(b.shopImages && Array.isArray(b.shopImages)) upd.shopImages = b.shopImages;
    const shop = await Shop.findByIdAndUpdate(shopId, { $set: upd }, { new: true, runValidators: false });
    if(!shop) return res.status(404).json({ success: false, message: 'Shop not found' });
    res.json({ success: true, shop: publicShop(shop), message: 'Shop info saved' });
  }catch(e){
    const dup = handleDupErr(res, e);
    if(dup) return dup;
    res.status(500).json({ success: false, message: e.message });
  }
});

// ============================================================================
// 2C. GET /:shopId/stats
// ============================================================================
router.get('/:shopId/stats', async (req, res) => {
  try{
    const { shopId } = req.params;
    if(!shopId || !mongoose.Types.ObjectId.isValid(shopId)) return res.json({ success: true, totalOrders: 0, totalProducts: 0, totalCustomers: 0 });
    const shop = await Shop.findById(shopId).lean();
    if(!shop) return res.json({ success: true, totalOrders: 0, totalProducts: 0, totalCustomers: 0 });
    res.json({ success: true, totalOrders: shop.totalOrders || 0, totalProducts: (shop.products?.length || 0) + (shop.items?.length || 0), totalCustomers: 0, rating: shop.rating || 0, isOpen: shop.isOpen });
  }catch(e){ res.json({ success: true, totalOrders: 0, totalProducts: 0, totalCustomers: 0 }); }
});

// ============================================================================
// 3. POST /upload-avatar - MAIN - ALL ROLES + CLOUDINARY
// ============================================================================
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
      let savedTo = '';
      try{ savedTo = await saveUrlToModel(role, field, type, base64Input, req); }catch(e){ console.log('already-url save warn', e.message); }
      try{
        const Media = require('../../models/Media');
        await Media.create({ shopId: shopId || 'general', template: role, type: type, refId: null, url: base64Input });
      }catch(e){}
      return res.json({ success: true, url: base64Input, profilePic: base64Input, avatar: base64Input, photo: base64Input, savedTo: savedTo || 'already-url', role });
    } else {
      return res.status(400).json({ success: false, message: 'Image missing - file ya base64 bhejo' });
    }
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
      folder, resource_type: 'image',
      transformation: [{ width: 800, height: 800, crop: 'limit' }, { quality: 'auto:good', fetch_format: 'auto' }]
    });
    const url = result.secure_url;
    let savedTo = '';
    try{
      savedTo = await saveUrlToModel(role, field, type, url, req);
      try{
        const Media = require('../../models/Media');
        await Media.create({ shopId: shopId || 'general', template: role, type: type, refId: null, url });
      }catch(e){}
      if(global.io && role === 'customer'){
        const user = await resolveUser(req);
        if(user) global.io.to(`user:${user._id}`).emit('profile-updated', { profilePic: url, avatar: url, photo: url });
      }
    }catch(e){ console.log('Save to model warn:', e.message); }
    res.json({ success: true, url, profilePic: url, avatar: url, photo: url, public_id: result.public_id, savedTo, role, field });
  }catch(e){
    console.error('Unified upload-avatar error', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ============================================================================
// 3B. POST /upload-cover
// ============================================================================
router.post('/upload-cover', memoryUpload.single('profilePic'), async (req, res) => {
  try{
    req.body.field = req.body.field || (req.body.role === 'product_manager' ? 'companyCover' : 'banner');
    req.body.type = 'banner';
    const role = String(req.body.role || 'customer').toLowerCase();
    const shopId = req.body.shopId || '';
    if(!req.file) return res.status(400).json({ success: false, message: 'Cover image missing' });
    const dataURI = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const folder = role === 'product_manager' ? 'samanlive/product-managers' : role === 'area_manager' ? 'samanlive/managers' : `samanlive/shops/${shopId || 'general'}`;
    const result = await cloudinary.uploader.upload(dataURI, { folder, resource_type: 'image', transformation: [{ width: 1200, height: 600, crop: 'limit' }, { quality: 'auto:good', fetch_format: 'auto' }] });
    const url = result.secure_url;
    const savedTo = await saveUrlToModel(role, req.body.field, 'banner', url, req);
    res.json({ success: true, url, coverPhoto: url, banner: url, savedTo, role });
  }catch(e){ res.status(500).json({ success: false, message: e.message }); }
});

// ============================================================================
// 4. PUT /pic - V27: base64 reject - pehle body se base64 seedha DB me chala jata tha
// ============================================================================
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
    // V27: File nahi hai aur body me base64 hai toh reject - warna DB me base64 chala jayega
    if(!req.file && isBase64Image(finalPic)) return res.status(400).json({ success: false, message: 'Base64 photo not allowed - file bhejo ya Cloudinary URL bhejo' });
    if(!req.file && !String(finalPic).startsWith('http')) return res.status(400).json({ success: false, message: 'Invalid photo URL' });
    const updated = await User.findByIdAndUpdate(user._id, { profilePic: finalPic, avatar: finalPic, photo: finalPic, updatedAt: new Date() }, { new: true, runValidators: false });
    res.json({ success: true, user: publicUser(updated), pic: finalPic, url: finalPic });
  }catch(e){
    const dup = handleDupErr(res, e);
    if(dup) return dup;
    res.status(500).json({ success: false, message: e.message });
  }
});

// ============================================================================
// 4B. DELETE /avatar
// ============================================================================
router.delete('/avatar', async (req, res) => {
  try{
    const role = String(req.body.role || req.query.role || 'customer').toLowerCase();
    const shopId = req.body.shopId || req.query.shopId || '';
    if(role === 'customer'){
      const user = await resolveUser(req);
      if(!user) return res.status(401).json({ success: false, message: 'Login required' });
      await User.findByIdAndUpdate(user._id, { profilePic: '', avatar: '', photo: '' });
      return res.json({ success: true, message: 'Avatar deleted' });
    }
    if(role === 'shop_logo' || role === 'shop_owner'){
      if(shopId && mongoose.Types.ObjectId.isValid(shopId)){
        await Shop.findByIdAndUpdate(shopId, { logo: '', shopLogo: '', uploadedLogo: '', image: '' });
        return res.json({ success: true, message: 'Shop logo deleted' });
      }
    }
    if(role === 'shop_cover'){
      if(shopId && mongoose.Types.ObjectId.isValid(shopId)){
        await Shop.findByIdAndUpdate(shopId, { banner: '', coverPhoto: '', cover: '' });
        return res.json({ success: true, message: 'Cover deleted' });
      }
    }
    if(role === 'area_manager'){
      const Manager = require('../../models/Manager');
      const mid = req.body.managerId || req.body.userId || '';
      if(mid && mongoose.Types.ObjectId.isValid(mid)) await Manager.findByIdAndUpdate(mid, { photo: '', avatar: '', profilePic: '' });
      return res.json({ success: true, message: 'Manager photo deleted' });
    }
    if(role === 'executive'){
      const Executive = require('../../models/Executive');
      const eid = req.body.executiveId || req.body.userId || '';
      if(eid && mongoose.Types.ObjectId.isValid(eid)) await Executive.findByIdAndUpdate(eid, { photo: '', avatar: '', profilePic: '' });
      return res.json({ success: true, message: 'Executive photo deleted' });
    }
    if(role === 'product_manager'){
      const PM = require('../../models/ProductManager');
      const pmid = req.body.pmId || req.body.productManagerId || req.body.userId || '';
      if(pmid && mongoose.Types.ObjectId.isValid(pmid)){
        if(req.body.field === 'companyLogo') await PM.findByIdAndUpdate(pmid, { companyLogo: '' });
        else await PM.findByIdAndUpdate(pmid, { photo: '', avatar: '', profilePic: '' });
      }
      return res.json({ success: true, message: 'PM photo deleted' });
    }
    if(role === 'delivery_boy'){
      const DeliveryBoy = require('../../models/DeliveryBoy');
      const did = req.body.deliveryBoyId || req.body.userId || '';
      if(did && mongoose.Types.ObjectId.isValid(did)) await DeliveryBoy.findByIdAndUpdate(did, { photo: '', avatar: '', profilePic: '' });
      return res.json({ success: true, message: 'Delivery photo deleted' });
    }
    res.json({ success: true, message: 'Deleted' });
  }catch(e){ res.status(500).json({ success: false, message: e.message }); }
});

// ============================================================================
// 4C. DELETE /gallery
// ============================================================================
router.delete('/gallery', async (req, res) => {
  try{
    const shopId = req.body.shopId || req.query.shopId || '';
    const url = req.body.url || req.query.url || '';
    if(!shopId || !mongoose.Types.ObjectId.isValid(shopId)) return res.status(400).json({ success: false, message: 'shopId required' });
    if(!url) return res.status(400).json({ success: false, message: 'url required' });
    await Shop.findByIdAndUpdate(shopId, { $pull: { gallery: url, shopImages: url } });
    res.json({ success: true, message: 'Gallery photo deleted' });
  }catch(e){ res.status(500).json({ success: false, message: e.message }); }
});

// ============================================================================
// 5. GET /:userId
// ============================================================================
router.get('/:userId', async (req, res) => {
  try{
    const { userId } = req.params;
    if(!userId || userId === 'me') return res.status(400).json({ success: false, message: 'Use /me' });
    let user = null;
    if(mongoose.Types.ObjectId.isValid(userId)) user = await User.findById(userId);
    if(!user) user = await User.findOne({ phone: normPhone(userId) });
    if(!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: publicUser(user) });
  }catch(e){ res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
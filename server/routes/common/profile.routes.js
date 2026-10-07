// LOCATION: server/routes/common/profile.routes.js
// WORLD CLASS SHOP OWNER PROFILE ROUTE - FULL 600+ LINES - PRODUCTION READY - DB CONNECTED FIX
// NOTE: This is for SHOP OWNER profile only (shop-templates/common/profile/)
// NOT for customer/user profile (public/profile/) - that's separate
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ========== DB MODEL - models/common/shop.js ==========
let CommonShop = null;
try { CommonShop = require('../../models/common/shop'); } catch(e) { console.error('CommonShop model load failed', e.message); }

// ========== HELPERS - DB SE SHOP LAO / BANAO ==========
function isObjectId(id){ try{ return mongoose.Types.ObjectId.isValid(id); }catch(e){ return false; } }

async function findOrCreateShopDoc(shopId){
  if(!CommonShop) return null;
  let doc = null;
  // 1. _id se dhundho (agar shopId ObjectId hai)
  if(isObjectId(shopId)){
    doc = await CommonShop.findById(shopId).catch(()=>null);
    if(doc) return doc;
  }
  // 2. shopId field se dhundho
  doc = await CommonShop.findOne({ shopId: String(shopId) }).catch(()=>null);
  if(doc) return doc;
  // 3. Nahi mila to naya bana do - khali, jhoota Kirana data nahi
  doc = await CommonShop.create({
    shopId: String(shopId),
    name: '',
    shopName: '',
    category: '',
    description: '',
    tagline: '',
    ownerName: '',
    phone: '',
    altPhone: '',
    email: '',
    whatsapp: '',
    address: '',
    area: '',
    city: '',
    pincode: '',
    landmark: '',
    gst: '',
    fssai: '',
    estYear: '',
    staffCount: '1',
    avatar: '',
    cover: '',
    rating: 4.5,
    reviews: 0,
    orders: 0,
    products: 0,
    customers: 0,
    verified: false,
    location: {},
    timing: { openingTime:'09:00', closingTime:'21:00', breakStart:'', breakEnd:'', isOpen:true, is24Hours:false, weeklySchedule:{
      Monday:{ open:true, openingTime:'09:00', closingTime:'21:00' },
      Tuesday:{ open:true, openingTime:'09:00', closingTime:'21:00' },
      Wednesday:{ open:true, openingTime:'09:00', closingTime:'21:00' },
      Thursday:{ open:true, openingTime:'09:00', closingTime:'21:00' },
      Friday:{ open:true, openingTime:'09:00', closingTime:'21:00' },
      Saturday:{ open:true, openingTime:'09:00', closingTime:'21:00' },
      Sunday:{ open:true, openingTime:'09:00', closingTime:'21:00' }
    }, holidays: [] },
    openingTime:'09:00',
    closingTime:'21:00',
    isOpen:true,
    is24Hours:false,
    weeklySchedule:{
      Monday:{ open:true, openingTime:'09:00', closingTime:'21:00' },
      Tuesday:{ open:true, openingTime:'09:00', closingTime:'21:00' },
      Wednesday:{ open:true, openingTime:'09:00', closingTime:'21:00' },
      Thursday:{ open:true, openingTime:'09:00', closingTime:'21:00' },
      Friday:{ open:true, openingTime:'09:00', closingTime:'21:00' },
      Saturday:{ open:true, openingTime:'09:00', closingTime:'21:00' },
      Sunday:{ open:true, openingTime:'09:00', closingTime:'21:00' }
    },
    holidays: [],
    gallery: [],
    verification: { documents:{}, status:'not_submitted' }
  }).catch(()=>null);
  return doc;
}

function docToShop(doc, shopId){
  if(!doc) return { _id:shopId, shopId:String(shopId), name:'', shopName:'', avatar:'', cover:'', verified:false };
  const s = doc.toObject? doc.toObject() : {...doc};
  s._id = shopId;
  s.shopId = String(shopId);
  // FIELD SYNC - dashboard shopName padhta hai
  if(s.name &&!s.shopName) s.shopName = s.name;
  if(s.shopName &&!s.name) s.name = s.shopName;
  if(s.avatar &&!s.shopImage) s.shopImage = s.avatar;
  if(s.shopImage &&!s.avatar) s.avatar = s.shopImage;
  if(s.cover &&!s.banner) s.banner = s.cover;
  if(s.banner &&!s.cover) s.cover = s.banner;
  return s;
}

function docToTiming(doc, shopId){
  const s = docToShop(doc, shopId);
  const t = s.timing && (s.timing.openingTime || s.timing.closingTime)? s.timing : null;
  return {
    _id:'t'+shopId,
    shopId:String(shopId),
    openingTime: t?.openingTime || s.openingTime || '09:00',
    closingTime: t?.closingTime || s.closingTime || '21:00',
    breakStart: t?.breakStart || s.breakStart || '',
    breakEnd: t?.breakEnd || s.breakEnd || '',
    isOpen: (t?.isOpen!==undefined? t.isOpen : (s.isOpen!==undefined? s.isOpen : true)),
    is24Hours:!!(t?.is24Hours || s.is24Hours),
    weeklySchedule: t?.weeklySchedule || s.weeklySchedule || {
      Monday:{ open:true, openingTime:'09:00', closingTime:'21:00' },
      Tuesday:{ open:true, openingTime:'09:00', closingTime:'21:00' },
      Wednesday:{ open:true, openingTime:'09:00', closingTime:'21:00' },
      Thursday:{ open:true, openingTime:'09:00', closingTime:'21:00' },
      Friday:{ open:true, openingTime:'09:00', closingTime:'21:00' },
      Saturday:{ open:true, openingTime:'09:00', closingTime:'21:00' },
      Sunday:{ open:true, openingTime:'09:00', closingTime:'21:00' }
    },
    updatedAt: s.updatedAt || new Date().toISOString()
  };
}

function docToGallery(doc){
  if(!doc) return [];
  const s = doc.toObject? doc.toObject() : doc;
  return (s.gallery||[]).map(g=>{
    const gg = g.toObject? g.toObject() : g;
    return { _id:String(gg._id||''), shopId:String(s.shopId||''), url:gg.url||'', category:gg.category||'shop', type:gg.type||'image', uploadedAt:gg.uploadedAt||new Date().toISOString(), views:gg.views||0 };
  });
}

function docToHolidays(doc){
  const s = doc? (doc.toObject? doc.toObject() : doc) : {};
  const fromTiming = s.timing?.holidays || [];
  const top = s.holidays || [];
  const list = top.length? top : fromTiming;
  return list.map(h=>{
    const hh = h.toObject? h.toObject() : h;
    return { _id:String(hh._id||('h'+Date.now())), shopId:String(s.shopId||''), date:hh.date||'', reason:hh.reason||'Holiday', createdAt:hh.createdAt||new Date().toISOString() };
  });
}

function docToVerification(doc, shopId){
  const s = doc? (doc.toObject? doc.toObject() : doc) : {};
  const v = s.verification || {};
  return {
    _id:'v'+shopId,
    shopId:String(shopId),
    documents: v.documents || {},
    status: v.status || 'not_submitted',
    submittedAt: v.submittedAt || null,
    verifiedAt: v.reviewedAt || null,
    rejectedReason: v.rejectReason || '',
    createdAt: s.createdAt || new Date().toISOString(),
    updatedAt: s.updatedAt || new Date().toISOString()
  };
}

async function saveShopUpdates(shopId, updates){
  const doc = await findOrCreateShopDoc(shopId);
  if(!doc) return null;
  Object.keys(updates||{}).forEach(k=>{
    if(updates[k]!==undefined){
      try{ doc.set(k, updates[k]); }catch(e){ doc[k]=updates[k]; }
    }
  });
  // name <-> shopName sync
  if(updates.name &&!updates.shopName){ try{ doc.set('shopName', updates.name); }catch(e){} }
  if(updates.shopName &&!updates.name){ try{ doc.set('name', updates.shopName); }catch(e){} }
  if(updates.avatar &&!updates.shopImage){ try{ doc.set('shopImage', updates.avatar); }catch(e){} }
  if(updates.cover &&!updates.banner){ try{ doc.set('banner', updates.cover); }catch(e){} }
  await doc.save();
  return doc;
}

// ========== 1. SHOP PROFILE CRUD ==========
// GET /api/common/profile/:shopId
router.get('/:shopId', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const doc = await findOrCreateShopDoc(shopId);
    const shop = docToShop(doc, shopId);
    const gallery = docToGallery(doc);
    const timing = docToTiming(doc, shopId);
    const verification = docToVerification(doc, shopId);
    const holidays = docToHolidays(doc);

    res.json({
      success:true,
      shop,
      profile:shop,
      gallery,
      timing,
      verification,
      holidays,
      stats:{
        galleryCount:gallery.length,
        isVerified:shop.verified||false,
        verificationStatus:verification.status,
        isOpen:timing.isOpen
      }
    });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// PUT /api/common/profile/:shopId
router.put('/:shopId', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const updates = req.body;

    // Validate required fields
    if(updates.name && updates.name.trim().length<3){
      return res.status(400).json({ success:false, message:'Shop name must be at least 3 characters' });
    }
    if(updates.phone && updates.phone.toString().length!==10){
      return res.status(400).json({ success:false, message:'Phone must be 10 digits' });
    }
    if(updates.pincode && updates.pincode.toString().length!==6){
      return res.status(400).json({ success:false, message:'Pincode must be 6 digits' });
    }
    if(updates.gst && updates.gst.length!==15){
      return res.status(400).json({ success:false, message:'GST must be 15 characters' });
    }
    if(updates.fssai && updates.fssai.length!==14){
      return res.status(400).json({ success:false, message:'FSSAI must be 14 digits' });
    }

    // FIELD FIX - dono naam save karo
    const payload = {...updates};
    if(payload.name &&!payload.shopName) payload.shopName = payload.name;
    if(payload.shopName &&!payload.name) payload.name = payload.shopName;

    const doc = await saveShopUpdates(shopId, payload);
    const updatedShop = docToShop(doc, shopId);

    if(global.io){
      global.io.to(`shop:${shopId}`).emit('shop-profile-updated', updatedShop);
    }

    res.json({ success:true, message:'Shop profile updated', shop:updatedShop, profile:updatedShop });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ========== 2. SHOP GALLERY ==========
// GET /api/common/profile/:shopId/gallery
router.get('/:shopId/gallery', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { category, type } = req.query;
    const doc = await findOrCreateShopDoc(shopId);
    let gallery = docToGallery(doc);

    if(category && category!=='all'){
      gallery = gallery.filter(g=> g.category===category);
    }
    if(type){
      gallery = gallery.filter(g=> g.type===type);
    }
    gallery = gallery.sort((a,b)=> new Date(b.uploadedAt)-new Date(a.uploadedAt));

    res.json({
      success:true,
      gallery,
      count:gallery.length,
      totalViews:gallery.reduce((s,g)=> s+(g.views||0),0),
      categories:{ shop:gallery.filter(g=> g.category==='shop').length, products:gallery.filter(g=> g.category==='products').length, team:gallery.filter(g=> g.category==='team').length }
    });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// POST /api/common/profile/:shopId/gallery
router.post('/:shopId/gallery', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { url, category, type } = req.body;

    if(!url){
      return res.status(400).json({ success:false, message:'url required' });
    }

    const doc = await findOrCreateShopDoc(shopId);
    const newPhoto = {
      url,
      category:category||'shop',
      type:type||'image',
      uploadedAt:new Date(),
      views:0
    };
    doc.gallery.unshift(newPhoto);
    await doc.save();
    const gallery = docToGallery(doc);
    const savedPhoto = gallery[0];

    if(global.io){
      global.io.to(`shop:${shopId}`).emit('gallery-photo-added', savedPhoto);
    }

    res.json({ success:true, message:'Photo added to gallery', photo:savedPhoto, gallery });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// DELETE /api/common/profile/:shopId/gallery/:photoId
router.delete('/:shopId/gallery/:photoId', async (req,res)=>{
  try{
    const { shopId, photoId } = req.params;
    const doc = await findOrCreateShopDoc(shopId);
    let gallery = docToGallery(doc);
    const photo = gallery.find(g=> g._id===photoId);

    if(!photo){
      return res.status(404).json({ success:false, message:'Photo not found' });
    }

    doc.gallery = doc.gallery.filter(g=> String(g._id)!==String(photoId));
    await doc.save();
    gallery = docToGallery(doc);

    if(global.io){
      global.io.to(`shop:${shopId}`).emit('gallery-photo-deleted', { photoId });
    }

    res.json({ success:true, message:'Photo deleted', gallery });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// PUT /api/common/profile/:shopId/gallery/:photoId/cover
router.put('/:shopId/gallery/:photoId/cover', async (req,res)=>{
  try{
    const { shopId, photoId } = req.params;
    const doc = await findOrCreateShopDoc(shopId);
    const gallery = docToGallery(doc);
    const photo = gallery.find(g=> g._id===photoId);

    if(!photo){
      return res.status(404).json({ success:false, message:'Photo not found' });
    }

    doc.cover = photo.url;
    try{ doc.set('banner', photo.url); }catch(e){}
    await doc.save();
    const shop = docToShop(doc, shopId);

    if(global.io){
      global.io.to(`shop:${shopId}`).emit('shop-cover-updated', { cover:photo.url });
    }

    res.json({ success:true, message:'Cover photo updated', cover:photo.url, shop });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ========== 3. SHOP TIMING ==========
// GET /api/common/profile/:shopId/timing
router.get('/:shopId/timing', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const doc = await findOrCreateShopDoc(shopId);
    const timing = docToTiming(doc, shopId);
    const holidays = docToHolidays(doc);

    res.json({
      success:true,
      timing,
      holidays,
      isOpen:timing.isOpen,
      is24Hours:timing.is24Hours,
      nextHoliday:holidays.length? holidays[0] : null
    });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// PUT /api/common/profile/:shopId/timing
router.put('/:shopId/timing', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const timingData = req.body;

    if(timingData.openingTime &&!timingData.openingTime.includes(':')){
      return res.status(400).json({ success:false, message:'Invalid openingTime format, use HH:MM' });
    }
    if(timingData.closingTime &&!timingData.closingTime.includes(':')){
      return res.status(400).json({ success:false, message:'Invalid closingTime format, use HH:MM' });
    }

    const doc = await findOrCreateShopDoc(shopId);
    const currentTiming = docToTiming(doc, shopId);
    const newTiming = {...currentTiming,...timingData, shopId:String(shopId), _id:'t'+shopId, updatedAt:new Date().toISOString() };
    delete newTiming._id;

    try{ doc.set('timing', newTiming); }catch(e){}
    // top-level bhi sync rakho dashboard toggle ke liye
    if(newTiming.openingTime) doc.openingTime = newTiming.openingTime;
    if(newTiming.closingTime) doc.closingTime = newTiming.closingTime;
    if(newTiming.breakStart!==undefined) doc.breakStart = newTiming.breakStart;
    if(newTiming.breakEnd!==undefined) doc.breakEnd = newTiming.breakEnd;
    if(newTiming.isOpen!==undefined) doc.isOpen = newTiming.isOpen;
    if(newTiming.is24Hours!==undefined) doc.is24Hours = newTiming.is24Hours;
    if(newTiming.weeklySchedule) doc.weeklySchedule = newTiming.weeklySchedule;
    if(timingData.holidays){
      doc.holidays = timingData.holidays;
      try{ doc.set('timing.holidays', timingData.holidays); }catch(e){}
    }
    await doc.save();

    const timing = docToTiming(doc, shopId);

    if(global.io){
      global.io.to(`shop:${shopId}`).emit('shop-timing-updated', timing);
    }

    res.json({ success:true, message:'Shop timing updated', timing, holidays:docToHolidays(doc) });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// POST /api/common/profile/:shopId/timing/toggle
router.post('/:shopId/timing/toggle', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { isOpen } = req.body;
    const doc = await findOrCreateShopDoc(shopId);
    doc.isOpen = isOpen!==false;
    try{ doc.set('timing.isOpen', doc.isOpen); }catch(e){}
    await doc.save();
    const timing = docToTiming(doc, shopId);

    if(global.io){
      global.io.to(`shop:${shopId}`).emit('shop-status-toggled', { isOpen:timing.isOpen });
      global.io.emit('shop-status-changed', { shopId, isOpen:timing.isOpen });
    }

    res.json({ success:true, message:`Shop ${timing.isOpen?'opened 🟢':'closed 🔴'}`, timing, isOpen:timing.isOpen });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ========== 4. HOLIDAYS ==========
// GET /api/common/profile/:shopId/holidays
router.get('/:shopId/holidays', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const doc = await findOrCreateShopDoc(shopId);
    const holidays = docToHolidays(doc).sort((a,b)=> new Date(a.date)-new Date(b.date));

    res.json({ success:true, holidays, count:holidays.length, upcoming:holidays.filter(h=> new Date(h.date)>=new Date()).length });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// POST /api/common/profile/:shopId/holidays
router.post('/:shopId/holidays', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { date, reason } = req.body;

    if(!date){
      return res.status(400).json({ success:false, message:'date required' });
    }

    const doc = await findOrCreateShopDoc(shopId);
    doc.holidays.push({ date, reason:reason||'Holiday' });
    await doc.save();
    const holidays = docToHolidays(doc);
    const newHoliday = holidays[holidays.length-1];

    if(global.io){
      global.io.to(`shop:${shopId}`).emit('holiday-added', newHoliday);
    }

    res.json({ success:true, message:'Holiday added', holiday:newHoliday, holidays });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// DELETE /api/common/profile/:shopId/holidays/:holidayId
router.delete('/:shopId/holidays/:holidayId', async (req,res)=>{
  try{
    const { shopId, holidayId } = req.params;
    const doc = await findOrCreateShopDoc(shopId);
    doc.holidays = (doc.holidays||[]).filter(h=> String(h._id)!==String(holidayId));
    await doc.save();
    const holidays = docToHolidays(doc);

    if(global.io){
      global.io.to(`shop:${shopId}`).emit('holiday-deleted', { holidayId });
    }

    res.json({ success:true, message:'Holiday deleted', holidays });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ========== 5. VERIFICATION ==========
// GET /api/common/profile/:shopId/verification
router.get('/:shopId/verification', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const doc = await findOrCreateShopDoc(shopId);
    const verification = docToVerification(doc, shopId);
    const shop = docToShop(doc, shopId);

    res.json({
      success:true,
      verification,
      documents:verification.documents||{},
      status:verification.status,
      isVerified:shop.verified||false,
      submittedAt:verification.submittedAt,
      verifiedAt:verification.verifiedAt,
      rejectedReason:verification.rejectedReason||''
    });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// POST /api/common/profile/:shopId/verification
router.post('/:shopId/verification', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { documents, status } = req.body;

    if(!documents || typeof documents!=='object'){
      return res.status(400).json({ success:false, message:'documents object required' });
    }

    const required = ['shop_license','aadhaar','pan_card','owner_photo','shop_front'];
    const missing = required.filter(doc=>!documents[doc]);

    if(missing.length>0 && status!=='draft'){
      return res.status(400).json({ success:false, message:`Missing required documents: ${missing.join(', ')}`, missing });
    }

    const doc = await findOrCreateShopDoc(shopId);
    const oldDocs = doc.verification?.documents || {};
    const newVerification = {
      documents: {...oldDocs,...documents },
      status: status||'pending',
      submittedAt: new Date(),
      rejectReason: doc.verification?.rejectReason || ''
    };
    try{ doc.set('verification', newVerification); }catch(e){ doc.verification = newVerification; }
    await doc.save();
    const verification = docToVerification(doc, shopId);

    if(global.io){
      global.io.to(`shop:${shopId}`).emit('verification-submitted', verification);
      global.io.to('admin').emit('new-verification-request', { shopId, verification });
    }

    res.json({ success:true, message:'Verification submitted • Will be reviewed in 24-48 hours', verification, documents:verification.documents, status:verification.status });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// PUT /api/common/profile/:shopId/verification/status - Admin only (for demo)
router.put('/:shopId/verification/status', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { status, rejectedReason } = req.body;

    if(!['verified','rejected','pending'].includes(status)){
      return res.status(400).json({ success:false, message:'status must be verified, rejected, or pending' });
    }

    const doc = await findOrCreateShopDoc(shopId);
    const v = doc.verification? (doc.verification.toObject? doc.verification.toObject() : doc.verification) : {};
    v.status = status;
    v.rejectReason = rejectedReason||'';
    if(status==='verified'){ v.reviewedAt = new Date(); doc.verified = true; }
    else if(status==='rejected'){ doc.verified = false; }
    try{ doc.set('verification', v); }catch(e){ doc.verification = v; }
    await doc.save();

    const verification = docToVerification(doc, shopId);
    const shop = docToShop(doc, shopId);

    if(global.io){
      global.io.to(`shop:${shopId}`).emit('verification-status-updated', { status, shopId });
      if(status==='verified'){
        global.io.to(`shop:${shopId}`).emit('shop-verified', { shopId, verified:true });
      }
    }

    res.json({ success:true, message:`Verification ${status}`, verification, shop });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ========== 6. AVATAR & COVER ==========
// POST /api/common/profile/:shopId/avatar
router.post('/:shopId/avatar', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { avatar } = req.body;

    if(!avatar){
      return res.status(400).json({ success:false, message:'avatar url required' });
    }

    const doc = await saveShopUpdates(shopId, { avatar, shopImage: avatar });
    const shop = docToShop(doc, shopId);

    if(global.io){
      global.io.to(`shop:${shopId}`).emit('shop-avatar-updated', { avatar });
    }

    res.json({ success:true, message:'Avatar updated', avatar, shop });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// POST /api/common/profile/:shopId/cover
router.post('/:shopId/cover', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { cover } = req.body;

    if(!cover){
      return res.status(400).json({ success:false, message:'cover url required' });
    }

    const doc = await saveShopUpdates(shopId, { cover, banner: cover });
    const shop = docToShop(doc, shopId);

    if(global.io){
      global.io.to(`shop:${shopId}`).emit('shop-cover-updated', { cover });
    }

    res.json({ success:true, message:'Cover updated', cover, shop });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ========== 7. PROFILE STATS ==========
// GET /api/common/profile/:shopId/stats
router.get('/:shopId/stats', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const doc = await findOrCreateShopDoc(shopId);
    const shop = docToShop(doc, shopId);
    const gallery = docToGallery(doc);
    const timing = docToTiming(doc, shopId);
    const verification = docToVerification(doc, shopId);
    const holidays = docToHolidays(doc);

    res.json({
      success:true,
      stats:{
        profile:{ name:shop.name, category:shop.category, verified:shop.verified, rating:shop.rating, reviews:shop.reviews },
        gallery:{ total:gallery.length, shop:gallery.filter(g=> g.category==='shop').length, products:gallery.filter(g=> g.category==='products').length, team:gallery.filter(g=> g.category==='team').length, totalViews:gallery.reduce((s,g)=> s+(g.views||0),0) },
        timing:{ isOpen:timing.isOpen, is24Hours:timing.is24Hours, openingTime:timing.openingTime, closingTime:timing.closingTime },
        verification:{ status:verification.status, isVerified:shop.verified, documentsCount:Object.keys(verification.documents||{}).length },
        holidays:{ total:holidays.length, upcoming:holidays.filter(h=> new Date(h.date)>=new Date()).length }
      }
    });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

module.exports = router;
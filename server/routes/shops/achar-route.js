// LOCATION: server/routes/shops/achar-route.js - ACHAR ROUTES - V27 FINAL - SHOP 1
// Mount: app.use('/api/shops/achar', acharRoutes) - server.js me pehle se hai
// RULE: shopId = Shop._id, hamesha ObjectId check. Upload = memory -> Cloudinary. NaN kabhi save nahi.

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const Achar = require('../../models/shops/Achar');
const Shop = require('../../models/Shop');
const { getShopId } = require('../../utils/shopId');
const { cloudinary } = require('../../utils/cloudinary');

// ========================================
// MEMORY UPLOAD - Vercel safe, disk pe kuch nahi
// V27: Pehle CloudinaryStorage tha - wo package install hi nahi tha, isliye upload 500 tha
// ========================================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'), false);
  }
});

function isValidId(id){ return id && mongoose.Types.ObjectId.isValid(String(id)); }
function normPhone(v){
  if(v === undefined || v === null) return '';
  const d = String(v).replace(/\D/g, '');
  return d.length > 10 ? d.slice(-10) : d;
}
function num(v, fallback){
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function isBase64(v){ return typeof v === 'string' && (v.startsWith('data:image') || v.startsWith('data:application')); }
function normItem(obj){
  const o = obj && obj.toObject ? obj.toObject() : (obj || {});
  return {
    ...o,
    id: o.id || '',
    name: o.name || '',
    category: o.category || 'Other',
    description: o.description || '',
    price500: num(o.price500, 0),
    price1kg: num(o.price1kg, 0),
    price: num(o.price, num(o.price1kg, 0)),
    stock: num(o.stock, 0),
    jarType: o.jarType || 'Glass',
    spiceLevel: o.spiceLevel || 'Medium',
    image: o.image || o.img || 'https://placehold.co/400/eab308/fff?text=Achar',
    img: o.image || o.img || '',
    isActive: o.isActive !== undefined ? o.isActive : true
  };
}
async function getOrCreate(shopId){
  let a = await Achar.findOne({ shopId });
  if(!a) a = await Achar.create({ shopId, items: [] });
  return a;
}

// ========================================
// ACHAR ROUTES - /api/shops/achar
// ========================================

// 1. UPLOAD IMAGE
router.post('/upload', upload.single('image'), async (req, res) => {
  try{
    if(!req.file) return res.status(400).json({ success: false, message: 'Image nahi mili' });
    const dataURI = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'samanlive/achar-shop/products',
      resource_type: 'image',
      transformation: [{ width: 800, height: 800, crop: 'limit' }, { quality: 'auto:good', fetch_format: 'auto' }]
    });
    res.json({ success: true, url: result.secure_url, message: 'Upload ho gaya' });
  }catch(e){ res.status(500).json({ success: false, message: e.message }); }
});

// 1.5 GET LOCATION
router.get('/:shopId/location', async (req, res) => {
  try{
    const shopId = getShopId(req);
    if(!isValidId(shopId)) return res.status(400).json({ success: false, message: 'Invalid ShopId' });
    const achar = await Achar.findOne({ shopId }).lean();
    if(!achar) return res.json({ success: true, data: null });
    res.json({ success: true, data: {
      locationType: achar.locationType,
      deliveryRange: achar.deliveryRange,
      address: achar.shopAddress || achar.fullAddress || '',
      lat: achar.location?.coordinates?.[1] || '',
      lng: achar.location?.coordinates?.[0] || ''
    }});
  }catch(err){ res.status(500).json({ success: false, error: err.message }); }
});

// 1.6 SAVE LOCATION - Achar + Shop dono me
router.post('/:shopId/location', async (req, res) => {
  try{
    const shopId = getShopId(req);
    if(!isValidId(shopId)) return res.status(400).json({ success: false, message: 'Invalid ShopId' });
    const { lat, lng, type, range, address } = req.body || {};
    const la = Number(lat), lo = Number(lng);
    if(!Number.isFinite(la) || !Number.isFinite(lo)) return res.status(400).json({ success: false, message: 'Lat/Lng sahi bhejo' });
    const achar = await getOrCreate(shopId);
    if(type) achar.locationType = type;
    if(range !== undefined) achar.deliveryRange = num(range, 5);
    if(address){ achar.shopAddress = address; achar.fullAddress = address; }
    achar.location = { type: 'Point', coordinates: [lo, la] };
    await achar.save();
    await Shop.findByIdAndUpdate(shopId, { $set: { location: { type: 'Point', coordinates: [lo, la] }, range: num(range, 5) * 1000 } }).catch(()=>{});
    res.json({ success: true, message: 'Location saved' });
  }catch(err){ res.status(500).json({ success: false, error: err.message }); }
});

// 1.7 GET PROFILE
router.get('/:shopId/profile', async (req, res) => {
  try{
    const shopId = getShopId(req);
    if(!isValidId(shopId)) return res.status(400).json({ success: false, message: 'Invalid ShopId' });
    const achar = await Achar.findOne({ shopId }).lean();
    if(!achar) return res.json({ success: true, data: null });
    res.json({ success: true, data: {
      ownerName: achar.ownerName,
      ownerPhotoUrl: achar.ownerPhotoUrl,
      bannerPhotoUrl: achar.bannerPhotoUrl,
      fullAddress: achar.fullAddress,
      shopAddress: achar.shopAddress,
      lat: achar.location?.coordinates?.[1] || '',
      lng: achar.location?.coordinates?.[0] || ''
    }});
  }catch(err){ res.status(500).json({ success: false, error: err.message }); }
});

// 1.8 SAVE PROFILE - base64 reject
router.post('/:shopId/profile', async (req, res) => {
  try{
    const shopId = getShopId(req);
    if(!isValidId(shopId)) return res.status(400).json({ success: false, message: 'Invalid ShopId' });
    const { ownerName, ownerPhotoUrl, bannerPhotoUrl, fullAddress, lat, lng, shopAddress } = req.body || {};
    if(isBase64(ownerPhotoUrl) || isBase64(bannerPhotoUrl)) return res.status(400).json({ success: false, message: 'Base64 photo not allowed - Cloudinary URL bhejo' });
    const achar = await getOrCreate(shopId);
    if(ownerName) achar.ownerName = ownerName;
    if(fullAddress) achar.fullAddress = fullAddress;
    if(shopAddress) achar.shopAddress = shopAddress;
    if(ownerPhotoUrl) achar.ownerPhotoUrl = ownerPhotoUrl;
    if(bannerPhotoUrl) achar.bannerPhotoUrl = bannerPhotoUrl;
    if(lat && lng) achar.location = { type: 'Point', coordinates: [Number(lng), Number(lat)] };
    await achar.save();
    const shopUpd = {};
    if(ownerPhotoUrl){ shopUpd.ownerPhotoUrl = ownerPhotoUrl; shopUpd.ownerPhoto = ownerPhotoUrl; shopUpd.ownerAvatar = ownerPhotoUrl; }
    if(bannerPhotoUrl){ shopUpd.banner = bannerPhotoUrl; shopUpd.coverPhoto = bannerPhotoUrl; shopUpd.cover = bannerPhotoUrl; }
    if(Object.keys(shopUpd).length) await Shop.findByIdAndUpdate(shopId, { $set: shopUpd }).catch(()=>{});
    res.json({ success: true, message: 'Profile saved' });
  }catch(err){ res.status(500).json({ success: false, error: err.message }); }
});

// 2. GET PURI SHOP DATA - Shop + Achar merge
router.get('/:shopId', async (req, res) => {
  try{
    const shopId = getShopId(req);
    if(!isValidId(shopId)) return res.status(400).json({ success: false, message: 'Invalid ShopId' });
    const shop = await Shop.findById(shopId).lean();
    if(!shop) return res.status(404).json({ success: false, message: 'Shop not found' });
    const achar = await getOrCreate(shopId);
    const items = (achar.items || []).map(normItem);
    res.json({ success: true, shop: {
      shopId: shop._id,
      shopName: shop.shopName || '',
      name: shop.shopName || '',
      ownerName: achar.ownerName || shop.ownerName || '',
      phone: achar.phone || shop.phone || shop.ownerPhone || '',
      ownerPhone: shop.ownerPhone || shop.phone || '',
      email: shop.email || '',
      address: achar.shopAddress || achar.fullAddress || shop.address?.line1 || '',
      shopAddress: achar.shopAddress || '',
      fullAddress: achar.fullAddress || '',
      areaCode: shop.areaCode || '', areaName: shop.areaName || '',
      items, orders: achar.orders || [],
      settings: achar.settings || {},
      isOpen: shop.isOpen !== undefined ? shop.isOpen : (achar.settings?.isOpen ?? true),
      announcement: achar.settings?.announcement || achar.announcement || shop.announcement || '',
      ownerPhotoUrl: achar.ownerPhotoUrl || shop.ownerPhotoUrl || shop.ownerPhoto || '',
      bannerPhotoUrl: achar.bannerPhotoUrl || shop.banner || shop.coverPhoto || '',
      logo: shop.logo || shop.shopLogo || '',
      banner: shop.banner || shop.coverPhoto || achar.bannerPhotoUrl || '',
      updatedAt: achar.updatedAt,
      locationType: achar.locationType, deliveryRange: achar.deliveryRange,
      lat: achar.location?.coordinates?.[1] || shop.location?.coordinates?.[1] || '',
      lng: achar.location?.coordinates?.[0] || shop.location?.coordinates?.[0] || ''
    }});
  }catch(err){
    console.log('GET SHOP ERROR:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. GET SINGLE ITEM
router.get('/:shopId/item/:id', async (req, res) => {
  try{
    const shopId = getShopId(req);
    if(!isValidId(shopId)) return res.status(400).json({ success: false, message: 'Invalid ShopId' });
    const achar = await Achar.findOne({ shopId });
    if(!achar) return res.status(404).json({ success: false, message: 'Shop nahi mila' });
    const product = (achar.items || []).find(i => i.id === req.params.id);
    if(!product) return res.status(404).json({ success: false, message: 'Achar nahi mila' });
    res.json({ success: true, product: normItem(product) });
  }catch(e){ res.status(500).json({ success: false, error: e.message }); }
});

// 4. ADD NEW ACHAR ITEM
router.post('/:shopId/item', async (req, res) => {
  try{
    const shopId = getShopId(req);
    if(!isValidId(shopId)) return res.status(400).json({ success: false, message: 'Invalid ShopId' });
    const itemData = req.body.item || req.body || {};
    if(!itemData.name || !String(itemData.name).trim()) return res.status(400).json({ success: false, message: 'Name jaruri hai' });
    const p1 = num(itemData.price1kg, 0);
    if(p1 <= 0) return res.status(400).json({ success: false, message: '1Kg Price jaruri hai' });
    if(itemData.image && isBase64(itemData.image)) return res.status(400).json({ success: false, message: 'Base64 image not allowed - pehle /upload se Cloudinary URL lo' });
    const newItem = {
      id: Date.now().toString() + Math.random().toString(36).slice(2,6),
      name: String(itemData.name).trim(),
      category: itemData.category || 'Other',
      description: itemData.description || '',
      jarType: itemData.jarType || 'Glass',
      spiceLevel: itemData.spiceLevel || 'Medium',
      price500: num(itemData.price500, 0),
      price1kg: p1,
      price: p1,
      stock: num(itemData.stock, 0),
      image: itemData.image || 'https://placehold.co/400/eab308/fff?text=Achar',
      img: itemData.image || '',
      isActive: true, createdAt: new Date()
    };
    const achar = await getOrCreate(shopId);
    achar.items.push(newItem);
    await achar.save();
    res.status(201).json({ success: true, message: 'Achar add ho gaya', data: normItem(newItem) });
  }catch(err){ res.status(500).json({ success: false, error: err.message }); }
});

// 5. UPDATE ACHAR ITEM - sirf bheje hue field, khali field purana nahi udayega
router.put('/:shopId/item/:itemId', async (req, res) => {
  try{
    const shopId = getShopId(req);
    if(!isValidId(shopId)) return res.status(400).json({ success: false, message: 'Invalid ShopId' });
    const itemData = req.body.item || req.body || {};
    if(itemData.image && isBase64(itemData.image)) return res.status(400).json({ success: false, message: 'Base64 image not allowed' });
    const achar = await Achar.findOne({ shopId });
    if(!achar) return res.status(404).json({ success: false, message: 'Shop nahi mila' });
    const it = (achar.items || []).find(i => i.id === req.params.itemId);
    if(!it) return res.status(404).json({ success: false, message: 'Item nahi mila' });
    if(itemData.name !== undefined) it.name = String(itemData.name).trim();
    if(itemData.category !== undefined) it.category = itemData.category;
    if(itemData.description !== undefined) it.description = itemData.description;
    if(itemData.jarType !== undefined) it.jarType = itemData.jarType;
    if(itemData.spiceLevel !== undefined) it.spiceLevel = itemData.spiceLevel;
    if(itemData.price500 !== undefined && itemData.price500 !== '') it.price500 = num(itemData.price500, it.price500);
    if(itemData.price1kg !== undefined && itemData.price1kg !== ''){ it.price1kg = num(itemData.price1kg, it.price1kg); it.price = it.price1kg; }
    if(itemData.stock !== undefined && itemData.stock !== '') it.stock = num(itemData.stock, it.stock);
    if(itemData.image){ it.image = itemData.image; it.img = itemData.image; }
    if(itemData.isActive !== undefined) it.isActive = !!itemData.isActive;
    await achar.save();
    res.json({ success: true, message: 'Update ho gaya', data: normItem(it) });
  }catch(err){ res.status(500).json({ success: false, error: err.message }); }
});

// 6. DELETE ACHAR ITEM
router.delete('/:shopId/item/:itemId', async (req, res) => {
  try{
    const shopId = getShopId(req);
    if(!isValidId(shopId)) return res.status(400).json({ success: false, message: 'Invalid ShopId' });
    const r = await Achar.findOneAndUpdate({ shopId }, { $pull: { items: { id: req.params.itemId } } }, { new: true });
    if(!r) return res.status(404).json({ success: false, message: 'Shop nahi mila' });
    res.json({ success: true, message: 'Delete ho gaya' });
  }catch(err){ res.status(500).json({ success: false, error: err.message }); }
});

// 7. UPDATE SHOP SETTINGS - Achar + Shop dono sync
router.put('/:shopId', async (req, res) => {
  try{
    const shopId = getShopId(req);
    if(!isValidId(shopId)) return res.status(400).json({ success: false, message: 'Invalid ShopId' });
    const b = req.body || {};
    if(isBase64(b.ownerPhotoUrl) || isBase64(b.bannerPhotoUrl)) return res.status(400).json({ success: false, message: 'Base64 photo not allowed' });
    const achar = await getOrCreate(shopId);
    if(b.ownerName) achar.ownerName = b.ownerName;
    if(b.fullAddress) achar.fullAddress = b.fullAddress;
    if(b.shopAddress) achar.shopAddress = b.shopAddress;
    if(b.bannerPhotoUrl) achar.bannerPhotoUrl = b.bannerPhotoUrl;
    if(b.ownerPhotoUrl) achar.ownerPhotoUrl = b.ownerPhotoUrl;
    if(b.phone !== undefined) achar.phone = normPhone(b.phone);
    if(!achar.settings) achar.settings = {};
    if(b.isOpen !== undefined) achar.settings.isOpen = !!b.isOpen;
    if(b.announcement !== undefined){ achar.settings.announcement = b.announcement; achar.announcement = b.announcement; }
    if(b.settings && typeof b.settings === 'object'){
      if(b.settings.openTime) achar.settings.openTime = b.settings.openTime;
      if(b.settings.closeTime) achar.settings.closeTime = b.settings.closeTime;
      if(b.settings.isOpen !== undefined) achar.settings.isOpen = !!b.settings.isOpen;
      if(b.settings.announcement !== undefined) achar.settings.announcement = b.settings.announcement;
      if(b.settings.ownerPhotoUrl) achar.ownerPhotoUrl = b.settings.ownerPhotoUrl;
      if(b.settings.bannerPhotoUrl) achar.bannerPhotoUrl = b.settings.bannerPhotoUrl;
    }
    if(b.openTime) achar.settings.openTime = b.openTime;
    if(b.closeTime) achar.settings.closeTime = b.closeTime;
    await achar.save();
    const shopUpd = {};
    if(b.isOpen !== undefined) shopUpd.isOpen = !!b.isOpen;
    if(b.announcement !== undefined) shopUpd.announcement = b.announcement;
    if(b.phone) shopUpd.phone = normPhone(b.phone);
    if(b.ownerPhotoUrl){ shopUpd.ownerPhotoUrl = b.ownerPhotoUrl; shopUpd.ownerPhoto = b.ownerPhotoUrl; shopUpd.ownerAvatar = b.ownerPhotoUrl; }
    if(b.bannerPhotoUrl){ shopUpd.banner = b.bannerPhotoUrl; shopUpd.coverPhoto = b.bannerPhotoUrl; shopUpd.cover = b.bannerPhotoUrl; }
    if(Object.keys(shopUpd).length) await Shop.findByIdAndUpdate(shopId, { $set: shopUpd }, { runValidators: false }).catch(()=>{});
    res.json({ success: true, data: achar });
  }catch(err){
    console.log('UPDATE SHOP ERROR:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. GET ORDERS
router.get('/:shopId/orders', async (req, res) => {
  try{
    const shopId = getShopId(req);
    if(!isValidId(shopId)) return res.status(400).json({ success: false, message: 'Invalid ShopId' });
    const achar = await Achar.findOne({ shopId }).lean();
    if(!achar) return res.json({ success: true, data: [] });
    res.json({ success: true, data: (achar.orders || []).slice().reverse() });
  }catch(err){ res.status(500).json({ success: false, error: err.message }); }
});

// 9. POST NEW ORDER - validation ke saath
router.post('/:shopId/order', async (req, res) => {
  try{
    const shopId = getShopId(req);
    if(!isValidId(shopId)) return res.status(400).json({ success: false, message: 'Invalid ShopId' });
    const b = req.body || {};
    if(!Array.isArray(b.items) || !b.items.length) return res.status(400).json({ success: false, message: 'Items khali hain' });
    if(!b.customerName || !b.phone) return res.status(400).json({ success: false, message: 'Name aur Phone jaruri hai' });
    const trackingId = 'ACH' + Date.now().toString().slice(-8);
    const newOrder = {
      trackingId, status: 'pending', createdAt: new Date(),
      customerName: String(b.customerName).trim(), phone: normPhone(b.phone),
      address: b.address || '', items: b.items, total: num(b.total, 0)
    };
    await Achar.findOneAndUpdate({ shopId }, { $push: { orders: newOrder } }, { new: true, upsert: true, setDefaultsOnInsert: true });
    res.json({ success: true, trackingId });
  }catch(err){ res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
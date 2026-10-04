// LOCATION: server/routes/world-product.routes.js - V16 WORLD BOSS - 70 SHOPS + ROLE BASED + common/products/ CONNECTED
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary');
const WorldProduct = require('../models/WorldProduct'); // 👈 WORLD MODEL - 1 model for 70 shops
const auth = require('../middleware/auth');

// ===== CLOUDINARY - shopType ke hisab se folder =====
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: `samanlive/products/${(req.body.shopType || req.query.shopType || 'common').toLowerCase()}`,
    allowed_formats: ['jpg','png','webp','jpeg'],
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }]
  })
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ===== MIDDLEWARE - ROLE DETECT =====
function detectRole(req){
  const role = req.query.role || req.body.role || 'dashboard';
  return role; // dashboard / customer / admin / area-manager
}

// ===== 1. CREATE - POST /api/world-products =====
// product-manager.js isi pe POST karta hai
router.post('/', auth, upload.array('images', 5), async (req, res) => {
  try {
    // body can be JSON or FormData
    const body = req.body;
    const shopType = (body.shopType || body.type || 'kirana').toLowerCase();
    const shopId = body.shopId;
    const name = body.name;
    const price = Number(body.price);

    if(!shopType ||!name ||!price) return res.status(400).json({ success:false, message: 'shopType, name, price required' });

    // Images from cloudinary or thumbnail URL
    let images = [];
    let thumbnail = body.thumbnail || body.image || '';
    if(req.files && req.files.length>0){
      images = req.files.map(f => ({ url: f.path, public_id: f.filename }));
      thumbnail = images[0]?.url;
    }

    // ExtraData - sab dynamic fields yaha jayenge
    // kirana ke liye: brand, weight, unit
    // cloth ke liye: size, color, fabric
    // mobile ke liye: ram, storage, model
    let extraData = {};
    if(body.extraData){
      try{
        extraData = typeof body.extraData === 'string'? JSON.parse(body.extraData) : body.extraData;
      }catch(e){ extraData = body.extraData; }
    }

    // Jo fields direct model me nahi hai wo extraData me daal do
    const directFields = ['name','description','price','mrp','stock','unit','lowStockAlert','shopId','shopType','brand','category','thumbnail','images','isActive','areaId','cityId'];
    Object.keys(body).forEach(k=>{
      if(!directFields.includes(k) && k!=='extraData' && k!=='image'){
        extraData[k] = body[k];
      }
    });

    const product = await WorldProduct.create({
      shopId,
      shopType,
      name: body.name,
      category: body.category || 'General',
      brand: body.brand || extraData.brand || 'Local',
      price: Number(body.price),
      mrp: body.mrp? Number(body.mrp) : undefined,
      stock: Number(body.stock)||50,
      lowStockAlert: Number(body.lowStockAlert || body.lowStockLimit)||10,
      unit: body.unit || extraData.unit || 'piece',
      weight: body.weight || extraData.weight || '',
      thumbnail,
      images,
      description: body.description || '',
      isActive: body.isActive!==false,
      extraData,
      areaId: body.areaId || req.user?.areaId,
      cityId: body.cityId || req.user?.cityId,
      createdBy: req.user?._id || req.user?.id
    });

    // Socket emit for live update
    if(req.app.get('io')){
      req.app.get('io').emit('product-updated', { shopId, shopType, productId: product._id, action:'created' });
    }

    res.json({ success:true, message: `${shopType} product created in World Model`, data: product });
  } catch(err){
    console.error('WorldProduct create error', err);
    res.status(500).json({ success:false, message: err.message });
  }
});

// ===== 2. GET ALL - ROLE BASED FILTER =====
// GET /api/world-products?shopType=kirana&shopId=xxx&role=dashboard
// GET /api/world-products?shopType=cloth&shopId=xxx&role=customer
// GET /api/world-products?role=admin
// GET /api/world-products?role=area-manager&areaId=xxx
router.get('/', async (req, res) => {
  try{
    const { shopType, type, shopId, search, brand, category, minPrice, maxPrice, role, areaId, page=1, limit=100 } = req.query;
    const finalShopType = (shopType || type || '').toLowerCase();

    let filter = { isActive:true };

    // Role based filter
    const currentRole = role || 'dashboard';

    if(currentRole === 'customer'){
      // Customer ko sirf active + stock >0 wala dikhega, shopId mandatory
      filter.stock = { $gt: 0 };
      if(shopId) filter.shopId = shopId;
      if(finalShopType) filter.shopType = finalShopType;
    }else if(currentRole === 'dashboard'){
      // Dashboard = shop owner = apni shop ka sab
      if(shopId) filter.shopId = shopId;
      if(finalShopType) filter.shopType = finalShopType;
    }else if(currentRole === 'admin'){
      // Admin ko sab dikhega, filter optional
      if(finalShopType) filter.shopType = finalShopType;
      if(shopId) filter.shopId = shopId;
    }else if(currentRole === 'area-manager'){
      // Area manager ko apne area ka
      if(areaId) filter.areaId = areaId;
      if(finalShopType) filter.shopType = finalShopType;
    }else{
      // Default: shopType + shopId
      if(finalShopType) filter.shopType = finalShopType;
      if(shopId) filter.shopId = shopId;
    }

    if(brand) filter.brand = new RegExp(brand, 'i');
    if(category) filter.category = new RegExp(category, 'i');
    if(search) filter.name = new RegExp(search, 'i');
    if(minPrice || maxPrice){
      filter.price = {};
      if(minPrice) filter.price.$gte = Number(minPrice);
      if(maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const products = await WorldProduct.find(filter)
    .sort({ createdAt: -1 })
    .skip((Number(page)-1)*Number(limit))
    .limit(Number(limit));

    const total = await WorldProduct.countDocuments(filter);

    res.json({ success:true, role: currentRole, count: products.length, total, data: products });
  }catch(err){
    console.error(err);
    res.status(500).json({ success:false, message: err.message });
  }
});

// ===== 3. GET SINGLE - GET /api/world-products/:id =====
router.get('/:id', async (req,res)=>{
  try{
    const p = await WorldProduct.findById(req.params.id);
    if(!p) return res.status(404).json({ success:false, message:'Product not found in World Model' });
    res.json({ success:true, data: p });
  }catch(err){ res.status(500).json({ success:false, message: err.message }); }
});

// ===== 4. UPDATE - PUT /api/world-products/:id =====
router.put('/:id', auth, upload.array('images',5), async (req,res)=>{
  try{
    const body = req.body;
    let updateData = {...body };

    // extraData merge
    const existing = await WorldProduct.findById(req.params.id);
    if(!existing) return res.status(404).json({ success:false, message:'Not found' });

    let newExtra = {};
    if(body.extraData){
      try{ newExtra = typeof body.extraData === 'string'? JSON.parse(body.extraData) : body.extraData; }catch(e){ newExtra = body.extraData; }
    }
    // body ke extra fields bhi extraData me
    Object.keys(body).forEach(k=>{
      if(!['name','price','mrp','stock','unit','weight','category','brand','thumbnail','shopId','shopType','lowStockAlert','isActive'].includes(k)){
        if(k!=='extraData') newExtra[k]=body[k];
      }
    });

    updateData.extraData = {...(existing.extraData||{}),...newExtra };
    if(body.price) updateData.price = Number(body.price);
    if(body.mrp) updateData.mrp = Number(body.mrp);
    if(body.stock) updateData.stock = Number(body.stock);

    if(req.files && req.files.length>0){
      updateData.images = req.files.map(f=>({ url: f.path, public_id: f.filename }));
      updateData.thumbnail = updateData.images[0].url;
    }

    const updated = await WorldProduct.findByIdAndUpdate(req.params.id, updateData, { new:true, runValidators:true });

    if(req.app.get('io')){
      req.app.get('io').emit('product-updated', { shopId: updated.shopId, shopType: updated.shopType, productId: updated._id, action:'updated' });
    }

    res.json({ success:true, message:'World product updated', data: updated });
  }catch(err){ res.status(500).json({ success:false, message: err.message }); }
});

// ===== 5. DELETE - DELETE /api/world-products/:id (soft) =====
router.delete('/:id', auth, async (req,res)=>{
  try{
    const p = await WorldProduct.findByIdAndUpdate(req.params.id, { isActive:false }, { new:true });
    if(req.app.get('io')){
      req.app.get('io').emit('product-updated', { shopId: p.shopId, shopType: p.shopType, productId: p._id, action:'deleted' });
    }
    res.json({ success:true, message:'World product deleted (soft)', data: p });
  }catch(err){ res.status(500).json({ success:false, message: err.message }); }
});

// ===== 6. LOW STOCK - GET /api/world-products/alerts/low-stock?shopId=xxx&shopType=kirana =====
router.get('/alerts/low-stock', auth, async (req,res)=>{
  try{
    const { shopId, shopType } = req.query;
    let filter = { isActive:true };
    if(shopId) filter.shopId = shopId;
    if(shopType) filter.shopType = shopType.toLowerCase();
    const all = await WorldProduct.find(filter);
    const low = all.filter(p => (p.stock||0) <= (p.lowStockAlert||10));
    res.json({ success:true, count: low.length, data: low });
  }catch(err){ res.status(500).json({ success:false, message: err.message }); }
});

// ===== 7. BULK ADD - POST /api/world-products/bulk =====
// 100 products ek sath - Quick Add ke liye
router.post('/bulk', auth, async (req,res)=>{
  try{
    const { products, shopId, shopType } = req.body;
    if(!Array.isArray(products)) return res.status(400).json({ success:false, message:'products array required' });

    const toInsert = products.map(p=>({
     ...p,
      shopId: p.shopId || shopId,
      shopType: (p.shopType || shopType || 'kirana').toLowerCase(),
      extraData: p.extraData || { brand: p.brand, weight: p.weight, unit: p.unit }
    }));

    const created = await WorldProduct.insertMany(toInsert);
    res.json({ success:true, count: created.length, data: created });
  }catch(err){ res.status(500).json({ success:false, message: err.message }); }
});

// ===== 8. COMPATIBILITY - OLD /create route redirect =====
router.post('/create', auth, (req,res)=> {
  req.url = '/';
  router.handle(req,res);
});

module.exports = router;
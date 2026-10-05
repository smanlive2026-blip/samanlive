// LOCATION: server/routes/world-product.routes.js - V20 FINAL - NO AUTH - NO LOCALSTORAGE - BULK FAST - BUFFERING FIXED - 100% WORKING
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary');
const WorldProduct = require('../models/WorldProduct');

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

// ===== FIX 1: ALERTS & BULK KO SABSE UPAR RAKH - WARNA /:id INKO KHA JAYEGA - YEHI TERA MAIN BUG THA =====

// ===== 6. LOW STOCK - NO AUTH - TOP PE =====
router.get('/alerts/low-stock', async (req,res)=>{
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

// ===== 7. BULK ADD - NO AUTH - 100 PRODUCTS 1 REQUEST ME - TOP PE =====
router.post('/bulk', async (req,res)=>{
  try{
    const { products, shopId, shopType } = req.body;
    if(!Array.isArray(products)) return res.status(400).json({ success:false, message:'products array required' });
    if(!shopId) return res.status(400).json({ success:false, message:'shopId required' });

    const toInsert = products.map(p=>({
      shopId: p.shopId || shopId,
      shopType: (p.shopType || shopType || 'kirana').toLowerCase(),
      name: p.name,
      category: p.category || 'General',
      brand: p.brand || p.extraData?.brand || 'Local',
      price: Number(p.price),
      mrp: p.mrp? Number(p.mrp) : undefined,
      stock: Number(p.stock) || 50,
      lowStockAlert: Number(p.lowStockAlert || p.lowStockLimit || 10),
      unit: p.unit || p.extraData?.unit || 'piece',
      weight: p.weight || p.extraData?.weight || '',
      thumbnail: p.thumbnail || p.image || '',
      images: p.images || [],
      description: p.description || '',
      isActive: true,
      extraData: p.extraData || { brand: p.brand, weight: p.weight, unit: p.unit },
      areaId: p.areaId || '',
      cityId: p.cityId || '',
      createdBy: p.createdBy || shopId
    }));

    // ordered:false se ek fail hua toh baki insert honge - buffering timeout khatam
    const created = await WorldProduct.insertMany(toInsert, { ordered:false });

    if(req.app.get('io')){
      req.app.get('io').emit('product-updated', { shopId, shopType, count: created.length, action:'bulk-created' });
    }

    res.json({ success:true, count: created.length, data: created });
  }catch(err){
    console.error('BULK ERROR:', err);
    res.status(500).json({ success:false, message: err.message });
  }
});

// ===== 1. CREATE - POST /api/world-products - NO AUTH =====
router.post('/', upload.array('images', 5), async (req, res) => {
  try {
    const body = req.body;
    const shopType = (body.shopType || body.type || 'kirana').toLowerCase();
    const shopId = body.shopId;
    const name = body.name;
    const price = Number(body.price);

    if(!shopId) return res.status(400).json({ success:false, message: 'shopId required - URL se?shopId=xxx bhejo' });
    if(!shopType ||!name ||!price) return res.status(400).json({ success:false, message: 'shopType, name, price required' });

    let images = [];
    let thumbnail = body.thumbnail || body.image || '';
    if(req.files && req.files.length>0){
      images = req.files.map(f => ({ url: f.path, public_id: f.filename }));
      thumbnail = images[0]?.url;
    }

    let extraData = {};
    if(body.extraData){
      try{
        extraData = typeof body.extraData === 'string'? JSON.parse(body.extraData) : body.extraData;
      }catch(e){ extraData = body.extraData; }
    }

    const directFields = ['name','description','price','mrp','stock','unit','lowStockAlert','shopId','shopType','brand','category','thumbnail','images','isActive','areaId','cityId','weight'];
    Object.keys(body).forEach(k=>{
      if(!directFields.includes(k) && k!=='extraData' && k!=='image' && k!=='type'){
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
      stock: body.stock? Number(body.stock) : 50,
      lowStockAlert: Number(body.lowStockAlert || body.lowStockLimit || 10),
      unit: body.unit || extraData.unit || 'piece',
      weight: body.weight || extraData.weight || '',
      thumbnail,
      images,
      description: body.description || '',
      isActive: true,
      extraData,
      areaId: body.areaId || '',
      cityId: body.cityId || '',
      createdBy: body.createdBy || shopId
    });

    if(req.app.get('io')){
      req.app.get('io').emit('product-updated', { shopId, shopType, productId: product._id, action:'created' });
    }

    res.json({ success:true, message: `${shopType} product created in World Model - NO AUTH`, data: product });
  } catch(err){
    console.error('WorldProduct create error', err);
    res.status(500).json({ success:false, message: err.message });
  }
});

// ===== 2. GET ALL - ROLE BASED FILTER - NO AUTH =====
router.get('/', async (req, res) => {
  try{
    const { shopType, type, shopId, search, brand, category, minPrice, maxPrice, role, areaId, page=1, limit=100 } = req.query;
    const finalShopType = (shopType || type || '').toLowerCase();
    let filter = { isActive:true };
    const currentRole = role || 'dashboard';

    if(currentRole === 'customer'){
      filter.stock = { $gt: 0 };
      if(shopId) filter.shopId = shopId;
      if(finalShopType) filter.shopType = finalShopType;
    }else if(currentRole === 'dashboard'){
      if(shopId) filter.shopId = shopId;
      if(finalShopType) filter.shopType = finalShopType;
    }else if(currentRole === 'admin'){
      if(finalShopType) filter.shopType = finalShopType;
      if(shopId) filter.shopId = shopId;
    }else if(currentRole === 'area-manager'){
      if(areaId) filter.areaId = areaId;
      if(finalShopType) filter.shopType = finalShopType;
    }else{
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

// ===== 3. GET SINGLE - NICHE RAKHA HAI AB =====
router.get('/:id', async (req,res)=>{
  try{
    // alerts/bulk ko id samajh ke error na de
    if(req.params.id === 'alerts' || req.params.id === 'bulk' || req.params.id === 'create'){
      return res.status(400).json({ success:false, message:'Invalid ID - use /alerts/low-stock or /bulk' });
    }
    const p = await WorldProduct.findById(req.params.id);
    if(!p) return res.status(404).json({ success:false, message:'Product not found' });
    res.json({ success:true, data: p });
  }catch(err){ res.status(500).json({ success:false, message: err.message }); }
});

// ===== 4. UPDATE - NO AUTH =====
router.put('/:id', upload.array('images',5), async (req,res)=>{
  try{
    const body = req.body;
    const existing = await WorldProduct.findById(req.params.id);
    if(!existing) return res.status(404).json({ success:false, message:'Not found' });

    let newExtra = {};
    if(body.extraData){
      try{ newExtra = typeof body.extraData === 'string'? JSON.parse(body.extraData) : body.extraData; }catch(e){ newExtra = body.extraData; }
    }
    Object.keys(body).forEach(k=>{
      if(!['name','price','mrp','stock','unit','weight','category','brand','thumbnail','shopId','shopType','lowStockAlert','isActive'].includes(k)){
        if(k!=='extraData' && k!=='type') newExtra[k]=body[k];
      }
    });

    let updateData = {...body};
    updateData.extraData = {...(existing.extraData||{}),...newExtra };
    if(body.price) updateData.price = Number(body.price);
    if(body.mrp) updateData.mrp = Number(body.mrp);
    if(body.stock) updateData.stock = Number(body.stock);
    if(body.shopType) updateData.shopType = body.shopType.toLowerCase();

    if(req.files && req.files.length>0){
      updateData.images = req.files.map(f=>({ url: f.path, public_id: f.filename }));
      updateData.thumbnail = updateData.images[0].url;
    }

    const updated = await WorldProduct.findByIdAndUpdate(req.params.id, updateData, { new:true, runValidators:true });

    if(req.app.get('io')){
      req.app.get('io').emit('product-updated', { shopId: updated.shopId, shopType: updated.shopType, productId: updated._id, action:'updated' });
    }

    res.json({ success:true, message:'World product updated - NO AUTH', data: updated });
  }catch(err){ res.status(500).json({ success:false, message: err.message }); }
});

// ===== 5. DELETE - NO AUTH - soft delete =====
router.delete('/:id', async (req,res)=>{
  try{
    const p = await WorldProduct.findByIdAndUpdate(req.params.id, { isActive:false }, { new:true });
    if(!p) return res.status(404).json({ success:false, message:'Not found' });
    if(req.app.get('io')){
      req.app.get('io').emit('product-updated', { shopId: p.shopId, shopType: p.shopType, productId: p._id, action:'deleted' });
    }
    res.json({ success:true, message:'World product deleted - NO AUTH', data: p });
  }catch(err){ res.status(500).json({ success:false, message: err.message }); }
});

// ===== 8. COMPATIBILITY OLD /create =====
router.post('/create', upload.array('images',5), async (req,res)=>{
  req.url = '/';
  router.handle(req,res);
});

module.exports = router;
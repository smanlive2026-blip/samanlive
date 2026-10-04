// server/routes/world-product.routes.js - WORLD CLASS v999
// Ek route se 70+ shop ke product handle - bina purana kuch delete kiye
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary');
const Product = require('../models/Product');
const auth = require('../middleware/auth'); // tera auth middleware

// ===== CLOUDINARY SETUP =====
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: `samanlive/products/${req.body.shopType || 'common'}`,
    allowed_formats: ['jpg','png','webp','jpeg'],
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }]
  })
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ===== 1. CREATE PRODUCT - HAR SHOP KE LIYE SAME API =====
// POST /api/world-products/create
router.post('/create', auth, upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, price, mrp, stock, unit, lowStockAlert, shopId, shopType, brand, size, color, material, weight, warranty, model, ram, fabric, gender, expiryDate, fssai, isVeg,...extra } = req.body;

    if(!shopType ||!name ||!price) return res.status(400).json({ success:false, message: 'shopType, name, price required' });

    // Images
    const images = req.files? req.files.map(f => ({ url: f.path, public_id: f.filename })) : [];
    const thumbnail = images[0]?.url || '';

    // ExtraData - jo bhi dynamic field aaya sab isme
    const extraData = new Map(Object.entries(extra));
    // Form se jo common extra fields aaye unko bhi extraData me daal
    if(req.body.extraData){
      const parsed = typeof req.body.extraData === 'string'? JSON.parse(req.body.extraData) : req.body.extraData;
      Object.entries(parsed).forEach(([k,v]) => extraData.set(k,v));
    }

    const product = await Product.create({
      name, description, price: Number(price), mrp: mrp? Number(mrp) : undefined,
      stock: Number(stock)||10, unit: unit||'pcs', lowStockAlert: Number(lowStockAlert)||2,
      shopId, shopType: shopType.toLowerCase(),
      brand, size, color, material, weight, warranty, model, ram, fabric, gender,
      expiryDate: expiryDate? new Date(expiryDate) : undefined,
      fssai, isVeg: isVeg === 'true' || isVeg === true? true : isVeg === 'false'? false : null,
      images, thumbnail, extraData
    });

    res.json({ success:true, message: `${shopType} product created`, data: product });
  } catch(err){
    console.error(err);
    res.status(500).json({ success:false, message: err.message });
  }
});

// ===== 2. GET ALL PRODUCTS BY SHOP TYPE =====
// GET /api/world-products?type=kirana&shopId=xxx
router.get('/', async (req, res) => {
  try{
    const { type, shopId, search, brand, size, minPrice, maxPrice, page=1, limit=20 } = req.query;
    let filter = { isActive:true };
    if(type) filter.shopType = type.toLowerCase();
    if(shopId) filter.shopId = shopId;
    if(brand) filter.brand = new RegExp(brand, 'i');
    if(size) filter.size = size;
    if(search) filter.name = new RegExp(search, 'i');
    if(minPrice || maxPrice){
      filter.price = {};
      if(minPrice) filter.price.$gte = Number(minPrice);
      if(maxPrice) filter.price.$lte = Number(maxPrice);
    }
    const products = await Product.find(filter)
     .sort({ createdAt: -1 })
     .skip((page-1)*limit)
     .limit(Number(limit));
    const total = await Product.countDocuments(filter);
    res.json({ success:true, count: products.length, total, data: products });
  }catch(err){ res.status(500).json({ success:false, message: err.message }); }
});

// ===== 3. GET SINGLE PRODUCT =====
// GET /api/world-products/:id
router.get('/:id', async (req,res)=>{
  try{
    const p = await Product.findById(req.params.id).populate('shopId');
    if(!p) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, data: p });
  }catch(err){ res.status(500).json({ success:false, message: err.message }); }
});

// ===== 4. UPDATE PRODUCT =====
// PUT /api/world-products/:id
router.put('/:id', auth, upload.array('images',5), async (req,res)=>{
  try{
    const updateData = {...req.body };
    // extraData merge
    if(req.body.extraData){
      const parsed = typeof req.body.extraData === 'string'? JSON.parse(req.body.extraData) : req.body.extraData;
      const existing = await Product.findById(req.params.id);
      const merged = {...Object.fromEntries(existing.extraData || []),...parsed };
      updateData.extraData = merged;
    }
    if(req.files && req.files.length>0){
      updateData.images = req.files.map(f=>({ url: f.path, public_id: f.filename }));
      updateData.thumbnail = updateData.images[0].url;
    }
    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, { new:true, runValidators:true });
    res.json({ success:true, message:'Updated', data: updated });
  }catch(err){ res.status(500).json({ success:false, message: err.message }); }
});

// ===== 5. DELETE PRODUCT (soft delete) =====
router.delete('/:id', auth, async (req,res)=>{
  try{
    await Product.findByIdAndUpdate(req.params.id, { isActive:false });
    res.json({ success:true, message:'Product deleted (soft)' });
  }catch(err){ res.status(500).json({ success:false, message: err.message }); }
});

// ===== 6. LOW STOCK ALERT =====
// GET /api/world-products/alerts/low-stock?shopId=xxx
router.get('/alerts/low-stock', auth, async (req,res)=>{
  try{
    const { shopId } = req.query;
    const all = await Product.find({ shopId, isActive:true });
    const low = all.filter(p => p.stock <= p.lowStockAlert);
    res.json({ success:true, count: low.length, data: low });
  }catch(err){ res.status(500).json({ success:false, message: err.message }); }
});

// ===== 7. QUICK ADD BULK (kirana wala 10 product ek sath) =====
// POST /api/world-products/bulk
router.post('/bulk', auth, async (req,res)=>{
  try{
    const { products } = req.body; // array
    if(!Array.isArray(products)) return res.status(400).json({ success:false, message:'products array required' });
    const created = await Product.insertMany(products);
    res.json({ success:true, count: created.length, data: created });
  }catch(err){ res.status(500).json({ success:false, message: err.message }); }
});

module.exports = router;
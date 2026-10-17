// LOCATION: server/routes/productPoolRoutes.js - PRODUCT POOL ROUTES - V14 FINAL
const express = require('express');
const router = express.Router();
const ProductPool = require('../models/ProductPool');

// PM adds product to pool
router.post('/add', async (req, res) => {
  try {
    const { productManagerId, name, category, basePrice, stock, areaTags, images } = req.body;
    if (!productManagerId || !name || !category || !basePrice) return res.status(400).json({ success: false, error: 'Missing required' });
    const pool = await ProductPool.create({
      ...req.body,
      thumbnail: req.body.thumbnail || (images && images[0]) || '',
      status: 'pending',
    });
    // increment PM totalProducts
    const ProductManager = require('../models/ProductManager');
    await ProductManager.findByIdAndUpdate(productManagerId, { $inc: { totalProducts: 1 } });
    res.json({ success: true, data: pool });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/my-products/:pmId', async (req, res) => {
  try { const list = await ProductPool.find({ productManagerId: req.params.pmId }).sort({ createdAt: -1 }); res.json({ success: true, data: list }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try { const item = await ProductPool.findById(req.params.id).populate('productManagerId'); res.json({ success: true, data: item }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await ProductPool.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
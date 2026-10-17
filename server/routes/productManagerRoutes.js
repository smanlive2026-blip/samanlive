// LOCATION: server/routes/productManagerRoutes.js - PM ROUTES - V14 FINAL
const express = require('express');
const router = express.Router();
const ProductManager = require('../models/ProductManager');
const ProductPool = require('../models/ProductPool');

// CREATE PM - Admin or Executive can create
router.post('/register', async (req, res) => {
  try {
    const { name, phone, type, area, city, pincode, companyName, gst, email } = req.body;
    if (!name || !phone || !type || !area) return res.status(400).json({ success: false, error: 'Missing required fields' });
    const exists = await ProductManager.findOne({ phone });
    if (exists) return res.status(400).json({ success: false, error: 'Phone already exists' });
    const pm = await ProductManager.create(req.body);
    res.json({ success: true, data: pm });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/list', async (req, res) => {
  try {
    const { type, area, verified } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (area) filter.area = new RegExp(area, 'i');
    if (verified) filter.isVerified = verified === 'true';
    const list = await ProductManager.find(filter).sort({ createdAt: -1 });
    // attach totalProducts count
    const withCounts = await Promise.all(list.map(async (pm) => {
      const count = await ProductPool.countDocuments({ productManagerId: pm._id });
      return { ...pm.toObject(), totalProducts: count };
    }));
    res.json({ success: true, data: withCounts });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try { const pm = await ProductManager.findById(req.params.id); res.json({ success: true, data: pm }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.put('/verify/:id', async (req, res) => {
  try { const pm = await ProductManager.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true }); res.json({ success: true, data: pm }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await ProductManager.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
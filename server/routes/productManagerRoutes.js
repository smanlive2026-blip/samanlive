// LOCATION: routes/productManagerRoutes.js - V14 FINAL - FIXED req.body + LINK RETURN
const express = require('express');
const router = express.Router();
const ProductManager = require('../models/ProductManager');

// LIST
router.get('/list', async (req, res) => {
  try {
    const data = await ProductManager.find().sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// REGISTER - ADMIN CREATES - FIXED req.body
router.post('/register', async (req, res) => {
  try {
    console.log('PM Register Body:', req.body);
    if (!req.body) return res.status(400).json({ success: false, error: 'req.body undefined - add express.json() in server.js' });
    const { name, phone, email, type, companyName, gst, area, city, pincode } = req.body;
    if (!name || !phone || !type || !area) {
      return res.status(400).json({ success: false, error: 'Name, Phone, Type, Area required' });
    }
    const exists = await ProductManager.findOne({ phone });
    if (exists) return res.status(400).json({ success: false, error: 'Phone already exists' });

    const pm = await ProductManager.create({
      name, phone, email, type, companyName, gst, area, city, pincode,
      isVerified: false, totalProducts: 0, walletBalance: 0, totalEarning: 0
    });
    
    // LINK GENERATE
    const dashboardLink = `https://samanlive.vercel.app/product-manager/dashboard.html?pmId=${pm._id}`;
    const loginLink = `https://samanlive.vercel.app/product-manager/login.html?phone=${phone}`;

    res.json({ success: true, data: pm, pm, dashboardLink, loginLink });
  } catch (e) {
    console.error('PM Register Error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/verify/:id', async (req, res) => {
  await ProductManager.findByIdAndUpdate(req.params.id, { isVerified: true });
  res.json({ success: true });
});

router.delete('/:id', async (req, res) => {
  await ProductManager.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
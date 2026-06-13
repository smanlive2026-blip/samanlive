const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const Module = require('../models/Module');
const Shop = require('../models/Shop');
const Manager = require('../models/Manager');
const Content = require('../models/Content');
const Setting = require('../models/Setting');
const User = require('../models/User');

// Temp route - index fix karne ke liye
router.get('/admin/fix-index', async (req, res) => {
  try {
    await Module.collection.dropIndex('id_1');
    res.json({ success: true, message: 'Index dropped' });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ==================== UPLOAD SETUP ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dir = 'public/uploads/';
    if (file.fieldname === 'logo') dir = 'public/logos/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_'));
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 } });

// ==================== DASHBOARD ====================
router.get('/stats', async (req, res) => {
  try {
    const users = await User.countDocuments();
    const shops = await Shop.countDocuments({ status: { $ne: 'pending' } });
    const modules = await Module.countDocuments();
    const content = await Content.countDocuments();
    const managers = await Manager.countDocuments();
    res.json({ users, shops, modules, content, managers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== MODULES ====================
router.get('/modules', async (req, res) => {
  try {
    const modules = await Module.find().sort({ priority: -1 });
    res.json(modules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/modules', async (req, res) => {
  try {
    const data = req.body;
    // Categories string ko array me convert karo
    if (data.categories && typeof data.categories === 'string') {
      data.categories = data.categories.split(',').map(c => c.trim()).filter(c => c);
    }
    const module = new Module(data);
    await module.save();
    res.json({ success: true, module });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/modules/:id', async (req, res) => {
  try {
    const data = req.body;
    // Categories string ko array me convert karo
    if (data.categories && typeof data.categories === 'string') {
      data.categories = data.categories.split(',').map(c => c.trim()).filter(c => c);
    }
    const module = await Module.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json({ success: true, module });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/modules/:id', async (req, res) => {
  try {
    await Module.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== SHOPS ====================
router.get('/shops', async (req, res) => {
  try {
    const shops = await Shop.find().sort({ createdAt: -1 });
    res.json(shops);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/shops/:id', async (req, res) => {
  try {
    const shop = await Shop.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, shop });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/shops/:id', async (req, res) => {
  try {
    await Shop.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== MANAGERS ====================
router.get('/managers', async (req, res) => {
  try {
    const managers = await Manager.find().sort({ createdAt: -1 });
    res.json(managers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/create-manager', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'aadhar', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'addressProof', maxCount: 1 }
]), async (req, res) => {
  try {
    const data = req.body;
    data.moduleAccess = JSON.parse(data.moduleAccess);
    data.loginToken = Math.random().toString(36).substring(2, 15);
    data.tempPassword = Math.random().toString(36).substring(2, 10);

    data.documents = {};
    if (req.files.photo) data.documents.photo = '/' + req.files.photo[0].path.replace('public/', '').replace(/\\/g, '/');
    if (req.files.aadhar) data.documents.aadhar = '/' + req.files.aadhar[0].path.replace('public/', '').replace(/\\/g, '/');
    if (req.files.pan) data.documents.pan = '/' + req.files.pan[0].path.replace('public/', '').replace(/\\/g, '/');
    if (req.files.addressProof) data.documents.addressProof = '/' + req.files.addressProof[0].path.replace('public/', '').replace(/\\/g, '/');

    const manager = new Manager(data);
    await manager.save();

    const loginLink = `${req.protocol}://${req.get('host')}/area-manager.html?token=${data.loginToken}`;
    res.json({ success: true, manager, loginLink, tempPassword: data.tempPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/managers/:id', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'aadhar', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'addressProof', maxCount: 1 }
]), async (req, res) => {
  try {
    const data = req.body;
    if (data.moduleAccess) data.moduleAccess = JSON.parse(data.moduleAccess);

    const updateData = {...data };
    const existing = await Manager.findById(req.params.id);
    updateData.documents = existing.documents || {};

    if (req.files.photo) updateData.documents.photo = '/' + req.files.photo[0].path.replace('public/', '').replace(/\\/g, '/');
    if (req.files.aadhar) updateData.documents.aadhar = '/' + req.files.aadhar[0].path.replace('public/', '').replace(/\\/g, '/');
    if (req.files.pan) updateData.documents.pan = '/' + req.files.pan[0].path.replace('public/', '').replace(/\\/g, '/');
    if (req.files.addressProof) updateData.documents.addressProof = '/' + req.files.addressProof[0].path.replace('public/', '').replace(/\\/g, '/');

    const manager = await Manager.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, manager });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/managers/:id', async (req, res) => {
  try {
    await Manager.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== BANNERS ====================
router.get('/admin/pending-banners', async (req, res) => {
  try {
    const shops = await Shop.find({ banner: { $exists: true, $ne: null }, bannerStatus: 'pending' }).populate('managerId', 'name');
    res.json({ shops });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/approve-banner/:shopId', async (req, res) => {
  try {
    await Shop.findByIdAndUpdate(req.params.shopId, { bannerStatus: 'approved' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/reject-banner/:shopId', async (req, res) => {
  try {
    await Shop.findByIdAndUpdate(req.params.shopId, { banner: null, bannerStatus: 'rejected' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ACTIVITY LOG ====================
router.get('/admin/shop-history', async (req, res) => {
  try {
    const shops = await Shop.find().populate('managerId', 'name area').limit(100).sort({ updatedAt: -1 });
    const history = shops.map(s => ({
      managerId: s.managerId,
      action: 'edit',
      shopName: s.name,
      area: s.area,
      timestamp: s.updatedAt,
      oldData: {},
      newData: { name: s.name, address: s.address, status: s.status }
    }));
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== CONTENT ====================
router.get('/content', async (req, res) => {
  try {
    const content = await Content.find().sort({ priority: -1 });
    res.json(content);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/content', async (req, res) => {
  try {
    const item = new Content(req.body);
    await item.save();
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/content/:id', async (req, res) => {
  try {
    const item = await Content.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/content/:id', async (req, res) => {
  try {
    await Content.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== UPLOADS ====================
router.post('/upload/video', upload.single('video'), async (req, res) => {
  try {
    const url = '/' + req.file.path.replace('public/', '').replace(/\\/g, '/');
    res.json({ success: true, url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/upload/logo', upload.single('logo'), async (req, res) => {
  try {
    const url = '/' + req.file.path.replace('public/', '').replace(/\\/g, '/');
    res.json({ success: true, url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== SETTINGS ====================
router.get('/settings', async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) settings = await Setting.create({});
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/settings', async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) settings = new Setting(req.body);
    else Object.assign(settings, req.body);
    await settings.save();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ADMIN DATA ====================
router.get('/admin/data', async (req, res) => {
  try {
    const modules = await Module.find({ status: 'active' });
    res.json({ modules: modules.map(m => ({ id: m._id, name: m.name, icon: m.icon })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== MODULE DETAIL PAGE ====================

// Get single module with all areas for detail page
router.get('/admin/module/:id', async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) return res.status(404).json({ success: false, error: 'Module not found' });

    // Saare areas bhej do - ye tu modules.json se ya DB se le sakta hai
    const areas = [
      { id: 'lucknow', name: 'Lucknow', desc: 'Lucknow city area' },
      { id: 'kanpur', name: 'Kanpur', desc: 'Kanpur city area' },
      { id: 'varanasi', name: 'Varanasi', desc: 'Varanasi city area' },
      { id: 'delhi', name: 'Delhi', desc: 'Delhi NCR area' }
    ];

    res.json({ success: true, module, areas });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update module areas - konse area me active hai
router.put('/admin/module/:id/areas', async (req, res) => {
  try {
    const { areas } = req.body;
    await Module.findByIdAndUpdate(req.params.id, { areas });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add new category to module
router.post('/admin/module/:id/category', async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) return res.status(404).json({ success: false, error: 'Module not found' });

    const newCategory = {
      id: new mongoose.Types.ObjectId().toString(),
      name: req.body.name,
      icon: req.body.icon,
      color: req.body.color,
      group: req.body.group,
      status: req.body.status,
      areas: req.body.areas || []
    };

    module.categoryDetails = module.categoryDetails || [];
    module.categoryDetails.push(newCategory);
    await module.save();

    res.json({ success: true, category: newCategory });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete category from module
router.delete('/admin/module/:id/category/:catId', async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) return res.status(404).json({ success: false, error: 'Module not found' });

    module.categoryDetails = (module.categoryDetails || []).filter(c => c.id!== req.params.catId);
    await module.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
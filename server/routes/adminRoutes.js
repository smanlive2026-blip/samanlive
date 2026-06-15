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
const ShopHistory = require('../models/ShopHistory');
const Banner = require('../models/banner');

// ==================== MANAGER AUTH MIDDLEWARE ====================
async function authenticateManager(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });

    const manager = await Manager.findOne({ loginToken: token });
    if (!manager) return res.status(401).json({ error: 'Invalid token' });

    req.manager = manager;
    next();
}

// ==================== UPLOAD SETUP ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dir = 'public/uploads/';
    if (file.fieldname === 'logo') dir = 'public/logos/';
    if (file.fieldname === 'video') dir = 'public/videos/';
    if (file.fieldname === 'banner') dir = 'public/banners/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_'));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // ← FIX: 50MB kiya
});

// ==================== AREA MANAGER LOGIN ====================
router.post('/area-manager/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const manager = await Manager.findOne({ email });
        if (!manager) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isMatch = await manager.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        manager.lastLogin = new Date();
        await manager.save();
        res.json({
            success: true,
            token: manager.loginToken,
            manager: manager
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== MANAGER DASHBOARD ====================
router.get('/manager/dashboard', authenticateManager, async (req, res) => {
    try {
        const manager = req.manager;
        const shops = await Shop.find({
            areaCode: manager.areaCode,
            bucket: manager.bucket
        });
        const categories = await Module.find({ id: { $in: manager.moduleAccess } });

        res.json({
            success: true,
            manager: {
                name: manager.name,
                email: manager.email,
                area: manager.areaName || manager.area,
                areaCode: manager.areaCode,
                managerCode: manager.managerCode,
                bucket: manager.bucket,
                serviceCharge: manager.serviceCharge,
                modules: manager.moduleAccess
            },
            shops,
            categories
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== MANAGER SHOP CRUD ====================
router.post('/manager/shop', authenticateManager, async (req, res) => {
    try {
        const manager = req.manager;
        const shopData = {
         ...req.body,
            areaCode: manager.areaCode,
            areaName: manager.areaName,
            managerId: manager._id,
            bucket: manager.bucket,
            status: 'pending'
        };
        const shop = await Shop.create(shopData);

        // Update manager stats
        manager.totalShopsCreated += 1;
        await manager.save();

        res.json({ success: true, shop });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/manager/shop/:id', authenticateManager, async (req, res) => {
    try {
        const shop = await Shop.findOne({
            _id: req.params.id,
            areaCode: req.manager.areaCode
        });
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        Object.assign(shop, req.body);
        await shop.save();
        res.json({ success: true, shop });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/manager/shop/:id', authenticateManager, async (req, res) => {
    try {
        await Shop.deleteOne({
            _id: req.params.id,
            areaCode: req.manager.areaCode
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== DASHBOARD ====================
router.get('/admin/dashboard', async (req, res) => {
  try {
    const [users, shops, modules, content, managers, categories] = await Promise.all([
      User.countDocuments(),
      Shop.countDocuments({ status: 'approved' }),
      Module.countDocuments(), // ← YE AB CHALEGA
      Content.countDocuments(),
      Manager.countDocuments(),
      Module.aggregate([
        { $unwind: '$categoryDetails' },
        { $count: 'total' }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalUsers: users,
        totalShops: shops,
        totalModules: modules,
        totalCategories: categories[0]?.total || 0,
        totalContent: content,
        totalManagers: managers
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const [users, shops, modules, content, managers, categories] = await Promise.all([
      User.countDocuments(),
      Shop.countDocuments({ status: 'approved' }),
      Module.countDocuments(),
      Content.countDocuments(),
      Manager.countDocuments(),
      Module.aggregate([
        { $unwind: '$categoryDetails' },
        { $count: 'total' }
      ])
    ]);

    res.json({
      users,
      shops,
      modules,
      content,
      managers,
      categories: categories[0]?.total || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== MODULES ====================
router.get('/modules', async (req, res) => {
  try {
    const modules = await Module.find().sort({ priority: 1 });
    res.json({ success: true, modules }); // ← success flag add kiya
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/modules', async (req, res) => {
  try {
    const data = req.body;
    if (data.categories && typeof data.categories === 'string') {
      data.categories = data.categories.split(',').map(c => c.trim()).filter(c => c);
    }
    delete data.id;
    delete data._id;

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
    if (data.categories && typeof data.categories === 'string') {
      data.categories = data.categories.split(',').map(c => c.trim()).filter(c => c);
    }
    delete data.id;
    delete data._id;

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

// ==================== MODULE DETAIL PAGE ====================
router.get('/admin/module/:id', async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) return res.status(404).json({ success: false, error: 'Module not found' });

    const areas = [
      { id: 'MUM001', name: 'Mumbai', desc: 'Mumbai city area' },
      { id: 'DEL001', name: 'Delhi', desc: 'Delhi NCR area' },
      { id: 'BAN001', name: 'Bangalore', desc: 'Bangalore area' },
      { id: 'HYD001', name: 'Hyderabad', desc: 'Hyderabad area' },
      { id: 'AHM001', name: 'Ahmedabad', desc: 'Ahmedabad area' },
      { id: 'JAI001', name: 'Jaipur', desc: 'Jaipur area' }
    ];

    res.json({ success: true, module, areas });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/admin/module/:id/areas', async (req, res) => {
  try {
    const { areas } = req.body;
    await Module.findByIdAndUpdate(req.params.id, { areas });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/admin/module/:id/category', async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) return res.status(404).json({ success: false, error: 'Module not found' });

    const newCategory = {
      id: new mongoose.Types.ObjectId().toString(),
      name: req.body.name,
      icon: req.body.icon || '📦',
      color: req.body.color || '#10b981',
      group: req.body.group || 'General',
      status: req.body.status!== undefined? req.body.status : true,
      areas: req.body.areas || []
    };

    module.categoryDetails = module.categoryDetails || [];
    module.categoryDetails.push(newCategory);

    module.categories = module.categories || [];
    if (!module.categories.includes(req.body.name)) {
      module.categories.push(req.body.name);
    }

    await module.save();
    res.json({ success: true, category: newCategory });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/admin/module/:id/category/:catId', async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) return res.status(404).json({ success: false, error: 'Module not found' });

    const catToDelete = module.categoryDetails.find(c => c.id === req.params.catId);
    module.categoryDetails = (module.categoryDetails || []).filter(c => c.id!== req.params.catId);

    if (catToDelete) {
      module.categories = (module.categories || []).filter(name => name!== catToDelete.name);
    }

    await module.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== SHOPS ====================
router.get('/shops', async (req, res) => {
  try {
    const { status, area, search } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (area) filter.area = area;
    if (search) {
      filter.$or = [
        { shopName: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const shops = await Shop.find(filter)
   .populate('managerId', 'name')
   .sort({ createdAt: -1 });
    res.json(shops);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/shops/:id', async (req, res) => {
  try {
    const oldShop = await Shop.findById(req.params.id);
    const shop = await Shop.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // Log history
    if (req.body.status && oldShop.status!== req.body.status) {
      await ShopHistory.logAction({
        managerId: req.user?._id || oldShop.managerId,
        shopId: shop._id,
        shopName: shop.shopName,
        action: req.body.status === 'approved'? 'approve' : 'reject',
        oldData: { status: oldShop.status },
        newData: { status: req.body.status },
        area: shop.area
      });
    }

    res.json({ success: true, shop });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/shops/:id', async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    await Shop.findByIdAndDelete(req.params.id);

    // Log history
    await ShopHistory.logAction({
      managerId: shop.managerId,
      shopId: shop._id,
      shopName: shop.shopName,
      action: 'delete',
      oldData: shop.toObject(),
      newData: {},
      area: shop.area
    });

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
    if (data.moduleAccess) data.moduleAccess = JSON.parse(data.moduleAccess);

    const manager = new Manager(data);
    manager.generateLoginToken();
    manager.tempPassword = Math.random().toString(36).substring(2, 10);

    data.documents = {};
    if (req.files.photo) data.documents.photo = '/' + req.files.photo[0].path.replace('public/', '').replace(/\\/g, '/');
    if (req.files.aadhar) data.documents.aadhar = '/' + req.files.aadhar[0].path.replace('public/', '').replace(/\\/g, '/');
    if (req.files.pan) data.documents.pan = '/' + req.files.pan[0].path.replace('public/', '').replace(/\\/g, '/');
    if (req.files.addressProof) data.documents.addressProof = '/' + req.files.addressProof[0].path.replace('public/', '').replace(/\\/g, '/');

    manager.documents = data.documents;
    await manager.save();

    const loginLink = `${req.protocol}://${req.get('host')}/area-manager.html?token=${manager.loginToken}`;
    res.json({ success: true, manager, loginLink, tempPassword: manager.tempPassword });
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

    const existing = await Manager.findById(req.params.id);
    const updateData = {...data };
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

// ==================== BANNERS - FIXED ====================
router.get('/admin/pending-banners', async (req, res) => {
  try {
    const shops = await Shop.find({
      banner: { $exists: true, $ne: '' },
      bannerApproved: false
    }).populate('managerId', 'name');
    res.json({ shops });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/approve-banner/:shopId', async (req, res) => {
  try {
    await Shop.findByIdAndUpdate(req.params.shopId, {
      bannerApproved: true,
      bannerApprovedBy: req.user?._id,
      bannerApprovedAt: new Date()
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/reject-banner/:shopId', async (req, res) => {
  try {
    await Shop.findByIdAndUpdate(req.params.shopId, {
      banner: '',
      bannerApproved: false
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ACTIVITY LOG ====================
router.get('/admin/shop-history', async (req, res) => {
  try {
    const history = await ShopHistory.find()
   .populate('managerId', 'name area')
   .sort({ createdAt: -1 })
   .limit(100);
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

router.post('/upload/banner', upload.single('banner'), async (req, res) => {
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
    const settings = await Setting.getSettings();
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

// ==================== LOCAL MARKET STATS - FIXED ====================
router.get('/admin/local-market-stats', async (req, res) => {
  try {
    const modules = await Module.find({ status: 'active' });
    let totalCategories = 0;
    let categoriesByModule = [];

    modules.forEach(m => {
      const catCount = m.categoryDetails?.length || 0;
      totalCategories += catCount;
      categoriesByModule.push({
        id: m._id,
        name: m.name,
        icon: m.icon,
        color: m.color,
        categoriesCount: catCount,
        priority: m.priority || 0
      });
    });

    categoriesByModule.sort((a, b) => b.priority - a.priority);

    res.json({
      success: true,
      totalModules: modules.length,
      totalCategories: totalCategories,
      modules: categoriesByModule
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== FIX DUPLICATE INDEX ====================
router.get('/admin/fix-module-index', async (req, res) => {
  try {
    await Module.collection.dropIndex('id_1');
    res.json({ success: true, message: 'Index id_1 dropped successfully' });
  } catch (err) {
    if (err.codeName === 'IndexNotFound') {
      res.json({ success: true, message: 'Index already removed' });
    } else {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

// ==================== MIGRATION - TEMP ROUTE ====================
router.get('/admin/migrate-old-modules', async (req, res) => {
  try {
    const modules = await Module.find({});
    let updated = 0;

    for (let m of modules) {
      let changed = false;

      if (typeof m.status === 'boolean') {
        m.status = m.status? 'active' : 'hidden';
        changed = true;
      }

      if ((!m.categoryDetails || m.categoryDetails.length === 0) && m.categories && m.categories.length > 0) {
        m.categoryDetails = m.categories.map(name => ({
          id: new mongoose.Types.ObjectId().toString(),
          name: name,
          icon: '📦',
          color: '#10b981',
          group: 'General',
          status: true,
          areas: []
        }));
        changed = true;
      }

      if (!m.areas) {
        m.areas = [];
        changed = true;
      }

      if (m.id!== undefined) {
        m.set('id', undefined, { strict: false });
        changed = true;
      }

      if (changed) {
        await m.save();
        updated++;
      }
    }

    res.json({
      success: true,
      message: `Migrated ${updated}/${modules.length} modules`,
      note: 'Ab ye route delete kar sakte ho'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== BANNERS ====================
router.get('/banners', async (req, res) => {
    try {
        const { status, type, placement } = req.query;
        let filter = {};
        if (status) filter.status = status;
        if (type) filter.type = type;
        if (placement) filter.placement = placement;

        const banners = await Banner.find(filter)
          .populate('createdBy', 'name')
          .sort({ priority: -1 });
        res.json(banners);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/banners', upload.single('image'), async (req, res) => {
    try {
        const bannerData = {
          ...req.body,
            image: '/' + req.file.path.replace('public/', '').replace(/\\/g, '/'),
            createdBy: req.userId,
            createdByType: 'admin'
        };
        const banner = new Banner(bannerData);
        await banner.save();
        res.json({ success: true, banner });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/banners/:id/approve', async (req, res) => {
    try {
        const banner = await Banner.findByIdAndUpdate(req.params.id, {
            status: 'approved',
            approvedBy: req.userId,
            approvedAt: new Date()
        }, { new: true });
        res.json({ success: true, banner });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
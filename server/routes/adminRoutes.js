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
    // id field ko hatao agar aa rahi hai - DUPLICATE ERROR FIX
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
    // Categories string ko array me convert karo
    if (data.categories && typeof data.categories === 'string') {
      data.categories = data.categories.split(',').map(c => c.trim()).filter(c => c);
    }
    // id field ko hatao - DUPLICATE ERROR FIX
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

    // Saare areas - ye tu DB se bhi le sakta hai
    const areas = [
      { id: 'lucknow', name: 'Lucknow', desc: 'Lucknow city area' },
      { id: 'kanpur', name: 'Kanpur', desc: 'Kanpur city area' },
      { id: 'varanasi', name: 'Varanasi', desc: 'Varanasi city area' },
      { id: 'delhi', name: 'Delhi', desc: 'Delhi NCR area' },
      { id: 'noida', name: 'Noida', desc: 'Noida area' },
      { id: 'ghaziabad', name: 'Ghaziabad', desc: 'Ghaziabad area' }
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
      icon: req.body.icon,
      color: req.body.color,
      group: req.body.group,
      status: req.body.status,
      areas: req.body.areas || []
    };

    module.categoryDetails = module.categoryDetails || [];
    module.categoryDetails.push(newCategory);

    // categories array me bhi name add karo list page ke liye
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

    // categories array se bhi hatao
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

// ==================== LOCAL MARKET STATS - NEW ====================
// Local Market page ke liye stats
router.get('/admin/local-market-stats', async (req, res) => {
  try {
    const modules = await Module.find({ status: { $in: ['active', true] } });
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

    // Priority ke hisab se sort karo
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

// ==================== FIX DUPLICATE INDEX - NEW ROUTE ====================
// Module me id_1 index ko delete karne ke liye
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
// Purane modules ko new schema me convert karne ke liye
// Ek baar chala ke delete kar dena
router.get('/admin/migrate-old-modules', async (req, res) => {
  try {
    const modules = await Module.find({});
    let updated = 0;

    for (let m of modules) {
      let changed = false;

      // 1. Boolean status ko string me convert kar
      if (typeof m.status === 'boolean') {
        m.status = m.status? 'active' : 'hidden';
        changed = true;
      }

      // 2. Agar categoryDetails nahi hai aur categories array hai to convert kar
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

      // 3. Areas field nahi hai to empty array
      if (!m.areas) {
        m.areas = [];
        changed = true;
      }

      // 4. id field ko hatao agar hai - DUPLICATE ERROR FIX
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

// ==================== LOCAL MARKET STATS ====================
// Get categories count from local-market.html for admin dashboard
router.get('/admin/local-market-stats', async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const htmlPath = path.join(__dirname, '../../public/local-market.html');

        if (!fs.existsSync(htmlPath)) {
            return res.json({ success: true, totalModules: 0, totalCategories: 0, modules: [] });
        }

        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        const modulesMatch = htmlContent.match(/const\s+modules\s*=\s*(\[[\s\S]*?\]);/);

        if (!modulesMatch) {
            return res.json({ success: true, totalModules: 0, totalCategories: 0, modules: [] });
        }

        // Unsafe JSON parse se bachne ke liye eval use kiya - only for admin route
        const modules = eval(modulesMatch[1]);
        let totalCategories = 0;

        const moduleStats = modules.map(m => {
            const count = m.categories? m.categories.length : 0;
            totalCategories += count;
            return {
                id: m.id,
                name: m.name,
                icon: m.icon,
                color: m.color,
                categoriesCount: count,
                priority: m.priority || 0
            };
        });

        res.json({
            success: true,
            totalModules: modules.length,
            totalCategories: totalCategories,
            modules: moduleStats
        });
    } catch (err) {
        console.error('Local market stats error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ==================== CATEGORIES CRUD ====================
const Category = require('../models/Category');

// Get all categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find().populate('moduleId', 'name icon').sort({ priority: -1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create category
router.post('/categories', async (req, res) => {
    try {
        const category = new Category(req.body);
        await category.save();
        res.json({ success: true, category });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update category
router.put('/categories/:id', async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, category });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete category
router.delete('/categories/:id', async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update dashboard stats to use real categories
router.get('/stats', async (req, res) => {
    try {
        const User = require('../models/User');
        const Shop = require('../models/Shop');
        const Module = require('../models/Module');
        const Content = require('../models/Content');
        const Manager = require('../models/Manager');
        const Category = require('../models/Category');

        const [users, shops, modules, content, managers, categories] = await Promise.all([
            User.countDocuments(),
            Shop.countDocuments(),
            Module.countDocuments(),
            Content.countDocuments(),
            Manager.countDocuments(),
            Category.countDocuments()
        ]);

        res.json({ users, shops, modules, content, managers, categories });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
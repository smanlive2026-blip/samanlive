const express = require('express');
const router = express.Router();
const Manager = require('../models/Manager');
const Shop = require('../models/Shop');
const Module = require('../models/Module');
const ShopHistory = require('../models/ShopHistory');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'samanlive_secret_key_2026_change_this';

// ==================== MANAGER LOGIN ====================
router.post('/area-manager/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email ||!password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const manager = await Manager.findOne({ email });
    if (!manager) {
      return res.status(401).json({ success: false, error: 'Manager not found' });
    }

    if (!manager.status) {
      return res.status(401).json({ success: false, error: 'Account deactivated' });
    }

    const isMatch = await manager.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid password' });
    }

    // Update last login
    manager.lastLogin = new Date();
    await manager.save();

    // Token generate karo
    const token = jwt.sign(
      { id: manager._id, type: 'manager' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      manager: {
        _id: manager._id,
        name: manager.name,
        email: manager.email,
        area: manager.area,
        moduleAccess: manager.moduleAccess,
        serviceCharge: manager.serviceCharge
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== TOKEN LOGIN ====================
router.post('/area-manager/token-login', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Token required' });
    }

    const manager = await Manager.findOne({ loginToken: token, status: true });

    if (!manager) {
      return res.status(401).json({ success: false, error: 'Invalid or expired link' });
    }

    manager.lastLogin = new Date();
    await manager.save();

    const jwtToken = jwt.sign(
      { id: manager._id, type: 'manager' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token: jwtToken,
      manager: {
        _id: manager._id,
        name: manager.name,
        email: manager.email,
        area: manager.area,
        moduleAccess: manager.moduleAccess,
        serviceCharge: manager.serviceCharge
      }
    });
  } catch (err) {
    console.error('Token login error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== AUTH MIDDLEWARE ====================
const authManager = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.type!== 'manager') {
      return res.status(403).json({ success: false, error: 'Manager access required' });
    }

    const manager = await Manager.findById(decoded.id).select('-password');

    if (!manager ||!manager.status) {
      return res.status(401).json({ success: false, error: 'Invalid token or account deactivated' });
    }

    req.manager = manager;
    req.userId = manager._id;
    req.userType = 'manager';
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired. Please login again.' });
    }
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// ==================== MANAGER DASHBOARD ====================
router.get('/manager/dashboard', authManager, async (req, res) => {
  try {
    const manager = req.manager;

    // Manager ke area ki shops
    const shops = await Shop.find({
      area: manager.area,
      managerId: manager._id
    }).sort({ createdAt: -1 });

    // Manager ke accessible categories
    const allModules = await Module.find({ status: 'active' });
    const accessibleCategories = [];

    allModules.forEach(m => {
      if (m.categoryDetails) {
        m.categoryDetails.forEach(cat => {
          if (cat.status && manager.moduleAccess.includes(cat.id)) {
            accessibleCategories.push({
              id: cat.id,
              name: cat.name,
              icon: cat.icon,
              color: cat.color,
              group: cat.group,
              moduleId: m._id,
              moduleName: m.name,
              moduleIcon: m.icon
            });
          }
        });
      }
    });

    // Stats
    const stats = {
      totalShops: shops.length,
      pendingShops: shops.filter(s => s.status === 'pending').length,
      approvedShops: shops.filter(s => s.status === 'approved').length,
      totalCategories: accessibleCategories.length
    };

    res.json({
      success: true,
      manager: {
        _id: manager._id,
        name: manager.name,
        email: manager.email,
        area: manager.area,
        serviceCharge: manager.serviceCharge,
        moduleAccess: manager.moduleAccess
      },
      shops,
      categories: accessibleCategories,
      stats
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== SHOP CRUD ====================
router.post('/manager/shop', authManager, async (req, res) => {
  try {
    const manager = req.manager;
    const data = req.body;

    // Check karo ki ye category manager ke access me hai ya nahi
    if (!manager.moduleAccess.includes(data.serviceType)) {
      return res.status(403).json({
        success: false,
        error: 'You dont have access to this category'
      });
    }

    const shop = new Shop({
     ...data,
      area: manager.area,
      managerId: manager._id,
      ownerId: manager._id,
      createdBy: manager._id,
      status: 'pending',
      isActive: true
    });

    await shop.save();

    // Log history
    await ShopHistory.logAction({
      managerId: manager._id,
      shopId: shop._id,
      shopName: shop.shopName,
      action: 'create',
      oldData: {},
      newData: shop.toObject(),
      area: shop.area,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Update manager stats
    manager.totalShopsCreated = (manager.totalShopsCreated || 0) + 1;
    await manager.save();

    res.json({ success: true, shop });
  } catch (err) {
    console.error('Create shop error:', err);
    res.status(500).json({ success: false, error: 'Failed to create shop' });
  }
});

router.put('/manager/shop/:id', authManager, async (req, res) => {
  try {
    const manager = req.manager;
    const shop = await Shop.findById(req.params.id);

    if (!shop) return res.status(404).json({ success: false, error: 'Shop not found' });
    if (shop.managerId.toString()!== manager._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not your shop' });
    }

    const oldData = shop.toObject();
    Object.assign(shop, req.body);
    await shop.save();

    // Log history
    await ShopHistory.logAction({
      managerId: manager._id,
      shopId: shop._id,
      shopName: shop.shopName,
      action: 'edit',
      oldData: oldData,
      newData: shop.toObject(),
      changedFields: Object.keys(req.body),
      area: shop.area,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ success: true, shop });
  } catch (err) {
    console.error('Update shop error:', err);
    res.status(500).json({ success: false, error: 'Failed to update shop' });
  }
});

router.delete('/manager/shop/:id', authManager, async (req, res) => {
  try {
    const manager = req.manager;
    const shop = await Shop.findById(req.params.id);

    if (!shop) return res.status(404).json({ success: false, error: 'Shop not found' });
    if (shop.managerId.toString()!== manager._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not your shop' });
    }

    const oldData = shop.toObject();
    await Shop.findByIdAndDelete(req.params.id);

    // Log history
    await ShopHistory.logAction({
      managerId: manager._id,
      shopId: shop._id,
      shopName: shop.shopName,
      action: 'delete',
      oldData: oldData,
      newData: {},
      area: shop.area,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ success: true, message: 'Shop deleted successfully' });
  } catch (err) {
    console.error('Delete shop error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete shop' });
  }
});

// ==================== GET MANAGER'S CATEGORIES ====================
router.get('/manager/categories', authManager, async (req, res) => {
  try {
    const manager = req.manager;
    const allModules = await Module.find({ status: 'active' });
    const categories = [];

    allModules.forEach(m => {
      if (m.categoryDetails) {
        m.categoryDetails.forEach(cat => {
          if (cat.status && manager.moduleAccess.includes(cat.id)) {
            categories.push({
              id: cat.id,
              name: cat.name,
              icon: cat.icon,
              color: cat.color,
              group: cat.group,
              moduleId: m._id,
              moduleName: m.name
            });
          }
        });
      }
    });

    res.json({ success: true, categories });
  } catch (err) {
    console.error('Categories error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== PUBLIC API ====================
router.get('/market/categories', async (req, res) => {
  try {
    const modules = await Module.find({ status: 'active' });
    const categories = [];

    modules.forEach(m => {
      if (m.categoryDetails) {
        m.categoryDetails.forEach(cat => {
          if (cat.status) {
            categories.push({
              id: cat.id,
              name: cat.name,
              icon: cat.icon,
              color: cat.color,
              group: cat.group,
              moduleId: m._id,
              moduleName: m.name,
              moduleIcon: m.icon
            });
          }
        });
      }
    });

    res.json(categories);
  } catch (err) {
    console.error('Market categories error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const Manager = require('../models/Manager');
const Shop = require('../models/Shop');
const Module = require('../models/Module');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'samanlive_secret_key';

// ==================== MANAGER LOGIN ====================
router.post('/area-manager/login', async (req, res) => {
  try {
    const { email, password } = req.body;

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

    // Token generate karo
    const token = jwt.sign({ id: manager._id, type: 'manager' }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      token,
      manager: {
        _id: manager._id,
        name: manager.name,
        email: manager.email,
        area: manager.area,
        moduleAccess: manager.moduleAccess
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== AUTH MIDDLEWARE ====================
const authManager = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const manager = await Manager.findById(decoded.id);

    if (!manager ||!manager.status) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.manager = manager;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ==================== MANAGER DASHBOARD ====================
router.get('/manager/dashboard', authManager, async (req, res) => {
  try {
    const manager = req.manager;

    // Manager ke area ki shops
    const shops = await Shop.find({ area: manager.area, moduleId: { $in: manager.moduleAccess } });

    // Saari categories - manager ko dikhane ke liye
    const modules = await Module.find({ _id: { $in: manager.moduleAccess } });
    const categories = [];
    modules.forEach(m => {
      if (m.categoryDetails) {
        categories.push(...m.categoryDetails);
      }
    });

    res.json({
      success: true,
      manager: {
        _id: manager._id,
        name: manager.name,
        email: manager.email,
        area: manager.area,
        modules: manager.moduleAccess
      },
      shops,
      categories
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== SHOP CRUD ====================
router.post('/manager/shop', authManager, async (req, res) => {
  try {
    const manager = req.manager;
    const data = req.body;

    // Check karo ki ye category manager ke access me hai ya nahi
    if (!manager.moduleAccess.includes(data.moduleId)) {
      return res.status(403).json({ success: false, error: 'You dont have access to this category' });
    }

    const shop = new Shop({
    ...data,
      area: manager.area,
      managerId: manager._id,
      status: true
    });

    await shop.save();
    res.json({ success: true, shop });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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

    Object.assign(shop, req.body);
    await shop.save();

    res.json({ success: true, shop });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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

    await Shop.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
              moduleId: m._id
            });
          }
        });
      }
    });

    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
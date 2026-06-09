const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs'); // bcryptjs hi use kar, schema me bhi wahi hai
const multer = require('multer');
const path = require('path');
const Manager = require('../models/Manager');
const Shop = require('../models/Shop');
const ShopHistory = require('../models/shophistory');
const Category = require('../models/Category');
const router = express.Router();

// ========================================
// MULTER SETUP - Document Upload
// ========================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/managers/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PNG/JPG images allowed'));
    }
  }
});

// ========================================
// ADMIN AUTH MIDDLEWARE - TODO: JWT add karna
// ========================================
function authAdmin(req, res, next) {
  // Abhi ke liye skip kar rahe, production me JWT check karna
  // const token = req.headers['authorization']?.split(' ')[1];
  // if (!token) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// ========================================
// MANAGER CRUD - ADMIN ONLY
// ========================================

// GET ALL MANAGERS
router.get('/managers', authAdmin, async (req, res) => {
    try {
        const managers = await Manager.find().select('-password').sort({ createdAt: -1 }).lean();
        res.json(managers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE NEW MANAGER
router.post('/admin/create-manager', authAdmin, async (req, res) => {
    try {
        const { name, area, email, phone, serviceCharge, status, moduleAccess, documents } = req.body;

        if (!name ||!area ||!email ||!phone ||!moduleAccess || moduleAccess.length === 0) {
            return res.status(400).json({ error: 'Sab required fields bharo' });
        }

        if (!/^[0-9]{10}$/.test(phone)) {
            return res.status(400).json({ error: 'Phone must be 10 digits' });
        }

        const exists = await Manager.findOne({ email: email.toLowerCase() });
        if (exists) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const loginToken = crypto.randomBytes(32).toString('hex');
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const manager = new Manager({
            name,
            area,
            email,
            phone,
            password: hashedPassword,
            serviceCharge: serviceCharge || 5,
            status: status!== undefined? status : true,
            moduleAccess,
            documents: documents || {},
            loginToken,
            tempPassword
        });

        await manager.save();

        const baseUrl = process.env.BASE_URL || 'https://samanlive.onrender.com';
        const loginLink = `${baseUrl}/area-manager.html?token=${loginToken}`;

        res.json({
            success: true,
            message: 'Manager created',
            loginLink,
            tempPassword,
            manager: {
                _id: manager._id,
                name: manager.name,
                email: manager.email
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// UPDATE MANAGER
router.put('/managers/:id', authAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (updateData.moduleAccess && updateData.moduleAccess.length === 0) {
            return res.status(400).json({ error: 'Kam se kam 1 Module select karo' });
        }

        if (updateData.phone &&!/^[0-9]{10}$/.test(updateData.phone)) {
            return res.status(400).json({ error: 'Phone must be 10 digits' });
        }

        if (updateData.email) {
            updateData.email = updateData.email.toLowerCase();
        }

        const manager = await Manager.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        }).select('-password');

        if (!manager) {
            return res.status(404).json({ error: 'Manager not found' });
        }

        res.json({ success: true, manager });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE MANAGER
router.delete('/managers/:id', authAdmin, async (req, res) => {
    try {
        const manager = await Manager.findByIdAndDelete(req.params.id);
        if (!manager) {
            return res.status(404).json({ error: 'Manager not found' });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPLOAD DOCUMENT
router.post('/admin/upload', authAdmin, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const url = `/uploads/managers/${req.file.filename}`;
        res.json({ success: true, url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// BANNER APPROVAL - ADMIN ONLY
// ========================================

// GET PENDING BANNERS
router.get('/admin/pending-banners', authAdmin, async (req, res) => {
    try {
        const shops = await Shop.find({
            banner: { $exists: true, $ne: '' },
            $or: [
                { bannerApproved: false },
                { bannerStatus: 'pending' }
            ]
        })
      .populate('managerId', 'name area')
      .sort({ updatedAt: -1 })
      .lean();

        res.json({ success: true, shops });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// APPROVE BANNER
router.post('/admin/approve-banner/:id', authAdmin, async (req, res) => {
    try {
        const shop = await Shop.findByIdAndUpdate(
            req.params.id,
            {
                bannerApproved: true,
                bannerStatus: 'approved'
            },
            { new: true }
        );
        if (!shop) {
            return res.status(404).json({ error: 'Shop not found' });
        }
        res.json({ success: true, shop });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// REJECT BANNER
router.post('/admin/reject-banner/:id', authAdmin, async (req, res) => {
    try {
        const shop = await Shop.findByIdAndUpdate(
            req.params.id,
            {
                banner: '',
                bannerApproved: false,
                bannerStatus: 'rejected'
            },
            { new: true }
        );
        if (!shop) {
            return res.status(404).json({ error: 'Shop not found' });
        }
        res.json({ success: true, shop });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// ACTIVITY LOG - ADMIN ONLY
// ========================================

router.get('/admin/shop-history', authAdmin, async (req, res) => {
    try {
        const history = await ShopHistory.find()
          .populate('managerId', 'name email area')
          .sort({ timestamp: -1 })
          .limit(200)
          .lean();
        res.json({ success: true, history });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
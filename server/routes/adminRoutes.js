const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const Manager = require('../models/Manager');
const Shop = require('../models/Shop');
const ShopHistory = require('../models/ShopHistory');
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
// ADMIN AUTH MIDDLEWARE
// ========================================
function authAdmin(req, res, next) {
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
router.post('/admin/create-manager', authAdmin, upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'aadhar', maxCount: 1 },
    { name: 'pan', maxCount: 1 },
    { name: 'addressProof', maxCount: 1 }
]), async (req, res) => {
    try {
        const { name, area, email, phone, serviceCharge, status, moduleAccess } = req.body;

        if (!name ||!area ||!email ||!phone ||!moduleAccess) {
            return res.status(400).json({ error: 'Sab required fields bharo' });
        }

        const parsedModuleAccess = JSON.parse(moduleAccess);
        if (parsedModuleAccess.length === 0) {
            return res.status(400).json({ error: 'Kam se kam 1 Module select karo' });
        }

        if (!/^[0-9]{10}$/.test(phone)) {
            return res.status(400).json({ error: 'Phone must be 10 digits' });
        }

        const exists = await Manager.findOne({ email: email.toLowerCase() });
        if (exists) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const documents = {};
        if (req.files.photo) documents.photo = '/' + req.files.photo[0].path.replace(/\\/g, '/');
        if (req.files.aadhar) documents.aadhar = '/' + req.files.aadhar[0].path.replace(/\\/g, '/');
        if (req.files.pan) documents.pan = '/' + req.files.pan[0].path.replace(/\\/g, '/');
        if (req.files.addressProof) documents.addressProof = '/' + req.files.addressProof[0].path.replace(/\\/g, '/');

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
            status: status!== undefined? status === 'true' : true,
            moduleAccess: parsedModuleAccess,
            documents: documents,
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
router.put('/managers/:id', authAdmin, upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'aadhar', maxCount: 1 },
    { name: 'pan', maxCount: 1 },
    { name: 'addressProof', maxCount: 1 }
]), async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {...req.body };

        if (updateData.moduleAccess) {
            const parsed = JSON.parse(updateData.moduleAccess);
            if (parsed.length === 0) {
                return res.status(400).json({ error: 'Kam se kam 1 Module select karo' });
            }
            updateData.moduleAccess = parsed;
        }

        if (updateData.phone &&!/^[0-9]{10}$/.test(updateData.phone)) {
            return res.status(400).json({ error: 'Phone must be 10 digits' });
        }

        if (updateData.email) {
            updateData.email = updateData.email.toLowerCase();
        }

        if (updateData.status) {
            updateData.status = updateData.status === 'true';
        }

        if (req.files) {
            updateData.documents = {};
            if (req.files['photo']) updateData.documents.photo = '/' + req.files['photo'][0].path.replace(/\\/g, '/');
            if (req.files['aadhar']) updateData.documents.aadhar = '/' + req.files['aadhar'][0].path.replace(/\\/g, '/');
            if (req.files['pan']) updateData.documents.pan = '/' + req.files['pan'][0].path.replace(/\\/g, '/');
            if (req.files['addressProof']) updateData.documents.addressProof = '/' + req.files['addressProof'][0].path.replace(/\\/g, '/');
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

// GET ADMIN DATA - Modules ke liye
router.get('/admin/data', authAdmin, async (req, res) => {
    try {
        const modules = [
            { id: 1, name: 'Grocery Store' },
            { id: 2, name: 'Electronics' },
            { id: 3, name: 'Clothing' },
            { id: 4, name: 'Restaurants' },
            { id: 5, name: 'Pharmacy' }
        ];
        res.json({ success: true, modules });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// BANNER APPROVAL - ADMIN ONLY
// ========================================

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
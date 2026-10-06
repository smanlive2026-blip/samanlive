// ========================================
// AREA MANAGER - EK HI FILE
// File: server/routes/areaManagerRoutes.js
// Mount: app.use('/api', require('./routes/areaManagerRoutes'))
// Frontend: area-manager.html
// Shop Create alag file me hai: managerShopCreate.js
// ========================================
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const Manager = require('../models/Manager');
const Shop = require('../models/Shop');
const Area = require('../models/Area');
const Module = require('../models/Module');

// ========== AUTH - Manager Token ==========
const authManager = async (req, res, next) => {
    try {
        //const token = (req.headers.authorization || '').replace('Bearer ', '').trim() || req.query.token;
        const token = ((req.headers.authorization || '').replace('Bearer ', '').trim()
            || req.headers['x-manager-token']
            || req.headers['manager-token']
            || req.headers.token
            || req.query.token
            || req.query.managerToken
            || (req.body && (req.body.managerToken || req.body.token || req.body.loginToken || req.body.authToken)) || '').toString().trim();
        if (!token) return res.status(401).json({ success: false, error: 'No token provided' });

        const manager = await Manager.findOne({ loginToken: token, status: true });
        if (!manager) return res.status(403).json({ success: false, error: 'Manager not found' });

        req.manager = manager;
        next();
    } catch (err) {
        res.status(401).json({ success: false, error: 'Auth failed: ' + err.message });
    }
};

// Shop filter - ek hi logic: pehle areaCode, purani shop ke liye managerCodes/controlledBy fallback
function managerShopFilter(manager) {
    return {
        $or: [
            { areaCode: manager.areaCode },
            { managerCodes: manager.managerCode },
            { controlledBy: manager._id }
        ],
        isActive: true
    };
}

// ========== 1. DASHBOARD ==========
router.get('/manager/dashboard', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        const area = await Area.findOne({ areaCode: manager.areaCode }).lean();

        const shops = await Shop.find(managerShopFilter(manager))
            .sort({ createdAt: -1 }).lean();

        const modules = manager.moduleAccess && manager.moduleAccess.length
            ? await Module.find({ id: { $in: manager.moduleAccess }, status: true }).lean()
            : await Module.find({ status: true }).sort({ name: 1 }).lean();

        res.json({
            success: true,
            manager: {
                _id: manager._id, name: manager.name, email: manager.email,
                phone: manager.phone, photo: manager.photo || '',
                areaCode: manager.areaCode, areaName: area?.areaName || manager.areaName,
                city: area?.city || manager.city, state: area?.state || manager.state,
                managerCode: manager.managerCode, bucket: manager.bucket,
                role: manager.role || 'area-manager',
                serviceCharge: manager.serviceCharge || 0,
                maxShops: manager.maxShops || 10,
                centerLat: area?.centerLat, centerLng: area?.centerLng,
                radius: area?.radius || manager.radius || 50,
                modules: manager.moduleAccess || []
            },
            shops, categories: modules, area,
            stats: {
                totalShops: shops.length,
                activeShops: shops.filter(s => s.isActive).length
            }
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== 2. MERI SHOPS LIST ==========
router.get('/manager/shops', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        const shops = await Shop.find({
            ...managerShopFilter(manager),
            status: { $in: ['approved', 'active'] }
        }).sort({ createdAt: -1 }).lean();

        res.json({ success: true, shops, total: shops.length, areaCode: manager.areaCode });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== 3. TOKEN VERIFY (Dashboard load ke liye) ==========
router.get('/manager-by-token/:token', async (req, res) => {
    try {
        const manager = await Manager.findOne({ loginToken: req.params.token, status: true }).lean();
        if (!manager) return res.status(404).json({ success: false, error: 'Invalid token' });
        res.json({ success: true, manager });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
router.post('/manager/verify-token', async (req, res) => {
    try {
        const token = req.body.token;
        if (!token) return res.json({ success: false, error: 'Token required' });
        const manager = await Manager.findOne({ loginToken: token, status: true }).lean();
        if (!manager) return res.json({ success: false, error: 'Invalid token' });
        res.json({ success: true, manager });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== 4. PROFILE UPDATE ==========
router.put('/manager/update-profile', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        const { name, phone, email, photo } = req.body;

        if (name) manager.name = String(name).trim();
        if (phone) manager.phone = String(phone).trim();
        if (email) manager.email = String(email).toLowerCase().trim();
        if (photo !== undefined) {
            if (photo && photo.length > 700000) {
                return res.status(400).json({ success: false, error: 'Photo too large. Use image under 300KB' });
            }
            manager.photo = photo || '';
        }
        await manager.save();
        res.json({ success: true, manager });
    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== 5. SHOP EDIT (Sirf apni shop) ==========
router.put('/manager/shops/:id', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        const shop = await Shop.findById(req.params.id);
        if (!shop) return res.status(404).json({ success: false, error: 'Shop not found' });

        const isMine = shop.areaCode === manager.areaCode
            || (shop.managerCodes && shop.managerCodes.includes(manager.managerCode))
            || String(shop.controlledBy || '') === String(manager._id);
        if (!isMine) return res.status(403).json({ success: false, error: 'Access Denied: This shop is not assigned to you' });

        const { location, areaCode, ownerId, managerCodes, claimedBy, controlledBy, createdBy, ...rest } = req.body;

        // Sirf allowed field hi update honge
        const allowed = {};
        ['shopName','icon','logo','serviceType','categoryId','template','templateFolder','shopType','phone','contact','range','isActive','description'].forEach(k => {
            if (rest[k] !== undefined) allowed[k] = rest[k];
        });
        if (rest.address) {
            allowed.address = (typeof rest.address === 'object')
                ? { ...(shop.address?.toObject ? shop.address.toObject() : shop.address || {}), ...rest.address }
                : { line1: rest.address };
        }

        const updated = await Shop.findByIdAndUpdate(req.params.id, { $set: allowed }, { new: true, runValidators: true });
        res.json({ success: true, shop: updated, message: 'Shop updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== 6. AREA INFO ==========
router.get('/manager/area-info', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        const area = await Area.findOne({ areaCode: manager.areaCode }).lean();
        const totalShops = await Shop.countDocuments({ areaCode: manager.areaCode });
        const claimedShops = await Shop.countDocuments({ controlledBy: manager._id });
        res.json({ success: true, area, totalShops, claimedShops });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== 7. MODULES (Services dropdown ke liye) ==========
router.get('/modules', async (req, res) => {
    try {
        const modules = await Module.find({ status: true }).sort({ name: 1 }).lean();
        res.json({ success: true, modules });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========== 8. DELIVERY BOY CREATE ==========
router.post('/manager/create-delivery-manager', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        if (manager.role && manager.role !== 'area-manager') {
            return res.status(403).json({ success: false, message: 'Sirf Area Manager bana sakta hai' });
        }
        const { name, phone, email, vehicleType } = req.body;
        if (!name || !phone) return res.status(400).json({ success: false, message: 'Name aur Phone zaruri hai' });

        const exists = await Manager.findOne({ phone });
        if (exists) return res.status(400).json({ success: false, message: 'Phone already exist' });

        const count = await Manager.countDocuments({ role: 'delivery-manager', areaCode: manager.areaCode });
        const managerCode = `DM-${manager.areaCode}-${count + 1}`;
        const loginToken = crypto.randomBytes(24).toString('hex');

        const dm = new Manager({
            name: String(name).trim(),
            phone: String(phone).trim(),
            email: email ? String(email).toLowerCase().trim() : `${managerCode.toLowerCase()}@samanlive.local`,
            loginToken, role: 'delivery-manager',
            areaCode: manager.areaCode, areaName: manager.areaName,
            city: manager.city, state: manager.state,
            managerCode, parentManager: manager._id,
            vehicleType: vehicleType || 'bike', status: true
        });
        await dm.save();
        res.json({ success: true, message: 'Delivery Boy ban gaya', manager: dm });
    } catch (err) {
        console.error('Create DM error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== 9. DELIVERY BOY LIST ==========
router.get('/manager/delivery-managers', authManager, async (req, res) => {
    try {
        const managers = await Manager.find({ role: 'delivery-manager', areaCode: req.manager.areaCode })
            .sort({ createdAt: -1 }).lean();
        // token frontend ko link banane ke liye chahiye, isiliye bhej rahe hain
        res.json({ success: true, managers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== 10. DELIVERY BOY LOCATION UPDATE ==========
router.post('/manager/update-location', async (req, res) => {
    try {
        const { token, lat, lng } = req.body;
        if (!token) return res.status(400).json({ success: false, error: 'Token required' });
        await Manager.findOneAndUpdate({ loginToken: token }, { lastLat: lat, lastLng: lng, lastLocationAt: new Date() });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
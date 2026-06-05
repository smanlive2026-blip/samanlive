const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const dbPath = path.join(__dirname, '../database/modules.json');
const JWT_SECRET = 'samanlive-area-manager-secret-2026';

function readDB() {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    if (!data.areaManagers) data.areaManagers = [];
    if (!data.areas) data.areas = [];
    if (!data.shops) data.shops = [];
    if (!data.marketCategories) data.marketCategories = [];
    return data;
}

function writeDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function authManager(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token nahi mila' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.manager = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

// ========================================
// LOGIN
// ========================================
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email ||!password) return res.status(400).json({ error: 'Email aur Password zaruri hai' });

    const db = readDB();
    const manager = db.areaManagers.find(m => m.email === email && m.status);
    if (!manager) return res.status(401).json({ error: 'Manager nahi mila ya inactive hai' });

    const validPass = await bcrypt.compare(password, manager.password);
    if (!validPass) return res.status(401).json({ error: 'Password galat hai' });

    const token = jwt.sign({
        id: manager.id,
        email: manager.email,
        name: manager.name,
        assignedAreas: manager.assignedAreas || [manager.city] // NEW: Multiple areas
    }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
        success: true,
        token,
        manager: { id: manager.id, name: manager.name, email: manager.email, assignedAreas: manager.assignedAreas }
    });
});

// ========================================
// DASHBOARD - SIRF ASSIGNED AREAS KA
// ========================================
router.get('/dashboard', authManager, (req, res) => {
    const db = readDB();
    const manager = db.areaManagers.find(m => m.id === req.manager.id);
    const assignedAreas = manager.assignedAreas || [manager.city];

    // Sirf assigned areas ki approved shops
    const areaShops = db.shops.filter(shop => {
        return assignedAreas.includes(shop.area) && shop.status === 'approved';
    });

    res.json({
        success: true,
        assignedAreas,
        stats: {
            totalShops: areaShops.length,
            activeShops: areaShops.filter(s => s.isActive).length,
            totalCategories: db.marketCategories.length
        },
        shops: areaShops,
        categories: db.marketCategories
    });
});

// ========================================
// SHOP CREATE - DELETE KAR DIYA ❌
// Ab manager shop create nahi kar sakta
// ========================================

// ========================================
// SHOP UPDATE - SIRF EDIT KAR SAKTA HAI
// ========================================
router.put('/shop/:id', authManager, (req, res) => {
    const db = readDB();
    const shopIdx = db.shops.findIndex(s => s.id === req.params.id);

    if (shopIdx === -1) return res.status(404).json({ error: 'Shop nahi mili' });

    const shop = db.shops[shopIdx];
    const manager = db.areaManagers.find(m => m.id === req.manager.id);
    const assignedAreas = manager.assignedAreas || [manager.city];

    // Check: Shop is manager ke assigned area me hai ya nahi
    if (!assignedAreas.includes(shop.area)) {
        return res.status(403).json({ error: 'Ye shop aapke area ki nahi hai' });
    }

    // Sirf ye fields update kar sakta hai manager
    const allowedFields = ['phone', 'banner', 'isActive', 'priority'];
    const updateData = {};
    allowedFields.forEach(field => {
        if (req.body[field]!== undefined) updateData[field] = req.body[field];
    });

    db.shops[shopIdx] = {...db.shops[shopIdx],...updateData};
    writeDB(db);
    res.json({ success: true, data: db.shops[shopIdx] });
});

// ========================================
// SHOP DELETE - HATA DIYA ❌
// Manager delete nahi kar sakta, sirf admin
// ========================================

module.exports = router;
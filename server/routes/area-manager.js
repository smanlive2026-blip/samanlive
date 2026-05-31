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
        areaId: manager.areaId
    }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
        success: true,
        token,
        manager: { id: manager.id, name: manager.name, email: manager.email, areaId: manager.areaId }
    });
});

// ========================================
// DASHBOARD - SIRF APNE AREA KA
// ========================================
router.get('/dashboard', authManager, (req, res) => {
    const db = readDB();
    const area = db.areas.find(a => a.id === req.manager.areaId);
    if (!area) return res.status(404).json({ error: 'Area nahi mila' });

    const areaShops = db.shops.filter(shop => {
        if (!shop.lat ||!shop.lng) return false;
        if (area.type === 'circle') {
            const dist = getDistance(area.lat, area.lng, shop.lat, shop.lng);
            return dist <= area.radius;
        }
        return false;
    });

    res.json({
        success: true,
        area,
        stats: {
            totalShops: areaShops.length,
            activeShops: areaShops.filter(s => s.status).length,
            totalCategories: db.marketCategories.length
        },
        shops: areaShops,
        categories: db.marketCategories
    });
});

// ========================================
// SHOP ADD - APNE AREA ME HI
// ========================================
router.post('/shop', authManager, (req, res) => {
    const db = readDB();
    const { name, icon, color, categoryId, lat, lng, range, address, phone } = req.body;
    const area = db.areas.find(a => a.id === req.manager.areaId);

    if (!name ||!categoryId ||!lat ||!lng) {
        return res.status(400).json({ error: 'Name, Category, Lat, Lng zaruri hai' });
    }

    if (!area) return res.status(404).json({ error: 'Area nahi mila' });

    if (area.type === 'circle') {
        const dist = getDistance(area.lat, area.lng, parseFloat(lat), parseFloat(lng));
        if (dist > area.radius) return res.status(403).json({ error: 'Location area ke bahar hai' });
    }

    const newShop = {
        id: 'shop-' + Date.now(),
        name,
        icon: icon || '🏪',
        color: color || '#6366f1',
        categoryId,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        range: range || 5000,
        address: address || '',
        phone: phone || '',
        status: true,
        priority: db.shops.length + 1,
        createdAt: new Date().toISOString(),
        createdBy: req.manager.id,
        areaId: req.manager.areaId
    };

    db.shops.push(newShop);
    writeDB(db);
    res.json({ success: true, data: newShop });
});

// ========================================
// SHOP UPDATE - SIRF APNI SHOP
// ========================================
router.put('/shop/:id', authManager, (req, res) => {
    const db = readDB();
    const shopIdx = db.shops.findIndex(s => s.id === req.params.id);

    if (shopIdx === -1) return res.status(404).json({ error: 'Shop nahi mili' });
    if (db.shops[shopIdx].createdBy!== req.manager.id) {
        return res.status(403).json({ error: 'Ye shop aapki nahi hai' });
    }

    // Area check agar lat/lng change ho raha hai
    if (req.body.lat && req.body.lng) {
        const area = db.areas.find(a => a.id === req.manager.areaId);
        if (area && area.type === 'circle') {
            const dist = getDistance(area.lat, area.lng, parseFloat(req.body.lat), parseFloat(req.body.lng));
            if (dist > area.radius) return res.status(403).json({ error: 'Nayi location area ke bahar hai' });
        }
    }

    db.shops[shopIdx] = {...db.shops[shopIdx],...req.body };

    if (writeDB(db)) {
        res.json({ success: true, data: db.shops[shopIdx] });
    } else {
        res.status(500).json({ error: 'Update nahi hua' });
    }
});

// ========================================
// SHOP DELETE - SIRF APNI SHOP
// ========================================
router.delete('/shop/:id', authManager, (req, res) => {
    const db = readDB();
    const shop = db.shops.find(s => s.id === req.params.id);

    if (!shop) return res.status(404).json({ error: 'Shop nahi mili' });
    if (shop.createdBy!== req.manager.id) {
        return res.status(403).json({ error: 'Ye shop aapki nahi hai' });
    }

    db.shops = db.shops.filter(s => s.id!== req.params.id);

    if (writeDB(db)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'Delete nahi hua' });
    }
});

module.exports = router;
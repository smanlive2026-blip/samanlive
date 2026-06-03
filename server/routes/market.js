const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Database Path
const dbPath = path.join(__dirname, '../database/modules.json');

// ========================================
// DB HELPER FUNCTIONS
// ========================================
function readDB() {
    try {
        return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    } catch (err) {
        console.error('DB Read Error:', err);
        return { marketCategories: [], shops: [] };
    }
}

function writeDB(data) {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error('DB Write Error:', err);
        return false;
    }
}

// ========================================
// LOCATION HELPERS
// ========================================
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ========================================
// PUBLIC APIs - FRONTEND KE LIYE
// ========================================

// 1. Saari Market Categories Dedo
router.get('/categories', (req, res) => {
    const db = readDB();
    res.json(db.marketCategories || []);
});

// 2. Specific Category Ki Details
router.get('/category/:id', (req, res) => {
    const db = readDB();
    const category = db.marketCategories.find(c => c.id === req.params.id);

    if (!category) {
        return res.status(404).json({ error: 'Category nahi mili' });
    }

    res.json(category);
});

// 3. Category Ke Hisaab Se Shops - Location Filter Ke Saath - BANNER ADD KIYA
router.get('/shops', (req, res) => {
    const db = readDB();
    const categoryId = req.query.category;
    const userLat = parseFloat(req.query.lat);
    const userLng = parseFloat(req.query.lng);

    let shops = db.shops.filter(s => s.status);

    // Category filter
    if (categoryId) {
        shops = shops.filter(s => s.categoryId === categoryId);
    }

    // Location filter - Agar user ka lat/lng mila
    if (userLat && userLng) {
        shops = shops.map(s => {
            if (s.lat && s.lng) {
                const dist = getDistance(userLat, userLng, s.lat, s.lng);
                s.distance = Math.round(dist);
                s.distanceKm = (dist/1000).toFixed(1);
                s.inRange = dist <= (s.range || 5000); // Default 5km
            } else {
                s.distance = 999999;
                s.distanceKm = 'N/A';
                s.inRange = false;
            }
            return s;
        }).filter(s => s.inRange).sort((a, b) => a.distance - b.distance);
    } else {
        shops = shops.sort((a, b) => a.priority - b.priority);
    }

    // BANNER FIELD ENSURE KARO - AGAR NAHI HAI TO EMPTY STRING
    shops = shops.map(shop => ({
     ...shop,
        banner: shop.banner || ''
    }));

    res.json(shops);
});

// 3.1. CATEGORY ID SE SHOPS - MODULE PAGE KE LIYE - NEW ROUTE ADD KIYA
router.get('/shops/:categoryId', (req, res) => {
    const db = readDB();
    const { categoryId } = req.params;
    const userLat = parseFloat(req.query.lat);
    const userLng = parseFloat(req.query.lng);

    let shops = db.shops.filter(s =>
        s.categoryId === categoryId &&
        s.status!== false
    );

    // Location filter
    if (userLat && userLng) {
        shops = shops.map(s => {
            if (s.lat && s.lng) {
                const dist = getDistance(userLat, userLng, s.lat, s.lng);
                s.distance = Math.round(dist);
                s.distanceKm = (dist/1000).toFixed(1);
                s.inRange = dist <= (s.range || 5000);
            } else {
                s.distance = 999999;
                s.distanceKm = 'N/A';
                s.inRange = false;
            }
            return s;
        }).filter(s => s.inRange).sort((a, b) => a.distance - b.distance);
    } else {
        shops = shops.sort((a, b) => a.priority - b.priority);
    }

    // BANNER FIELD ENSURE KARO
    shops = shops.map(shop => ({
     ...shop,
        banner: shop.banner || ''
    }));

    res.json(shops);
});

// 4. Single Shop Ki Details - BANNER ADD KIYA
router.get('/shop/:id', (req, res) => {
    const db = readDB();
    const shop = db.shops.find(s => s.id === req.params.id);

    if (!shop) {
        return res.status(404).json({ error: 'Shop nahi mili' });
    }

    // BANNER FIELD ENSURE KARO
    const shopData = {
     ...shop,
        banner: shop.banner || ''
    };

    res.json(shopData);
});

// ========================================
// ADMIN APIs - CONTROL PANEL KE LIYE
// ========================================

// 1. Nayi Category Add Karo
router.post('/admin/category', (req, res) => {
    const db = readDB();
    const { name, icon, color } = req.body;

    if (!name ||!icon) {
        return res.status(400).json({ error: 'Name aur Icon zaruri hai' });
    }

    const newCategory = {
        id: name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
        name,
        icon,
        color: color || '#6366f1'
    };

    if (!db.marketCategories) db.marketCategories = [];
    db.marketCategories.push(newCategory);

    if (writeDB(db)) {
        res.json({ success: true, data: newCategory });
    } else {
        res.status(500).json({ error: 'Save nahi hua' });
    }
});

// 2. Category Update Karo
router.put('/admin/category/:id', (req, res) => {
    const db = readDB();
    const idx = db.marketCategories.findIndex(c => c.id === req.params.id);

    if (idx === -1) {
        return res.status(404).json({ error: 'Category nahi mili' });
    }

    db.marketCategories[idx] = {...db.marketCategories[idx],...req.body };

    if (writeDB(db)) {
        res.json({ success: true, data: db.marketCategories[idx] });
    } else {
        res.status(500).json({ error: 'Update nahi hua' });
    }
});

// 3. Category Delete Karo
router.delete('/admin/category/:id', (req, res) => {
    const db = readDB();
    const initialLength = db.marketCategories.length;
    db.marketCategories = db.marketCategories.filter(c => c.id!== req.params.id);

    if (db.marketCategories.length === initialLength) {
        return res.status(404).json({ error: 'Category nahi mili' });
    }

    if (writeDB(db)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'Delete nahi hua' });
    }
});

// 4. Shop Add Karo - Category Ke Saath - BANNER SUPPORT ADD KIYA
router.post('/admin/shop', (req, res) => {
    const db = readDB();
    const { name, icon, color, categoryId, lat, lng, range, address, phone, banner } = req.body;

    if (!name ||!categoryId) {
        return res.status(400).json({ error: 'Name aur Category zaruri hai' });
    }

    const newShop = {
        id: 'shop-' + Date.now(),
        name,
        icon: icon || '🏪',
        color: color || '#6366f1',
        categoryId,
        lat: lat || null,
        lng: lng || null,
        range: range || 5000,
        address: address || '',
        phone: phone || '',
        banner: banner || '', // BANNER FIELD ADD KIYA
        status: true,
        priority: db.shops.length + 1,
        createdAt: new Date().toISOString()
    };

    if (!db.shops) db.shops = [];
    db.shops.push(newShop);

    if (writeDB(db)) {
        res.json({ success: true, data: newShop });
    } else {
        res.status(500).json({ error: 'Save nahi hua' });
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// NAYA ADD KIYA: MongoDB Models import
const Shop = require('../models/shop');
const Banner = require('../models/banner');

// Database Path
const dbPath = path.join(__dirname, '../database/modules.json');

// ========================================
// DB HELPER FUNCTIONS - PURANA WALA
// ========================================
function readDB() {
    try {
        return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    } catch (err) {
        console.error('DB Read Error:', err);
        return { marketCategories: [], shops: [], banners: [] };
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
// LOCATION HELPERS - PURANA WALA
// ========================================
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ========================================
// PUBLIC APIs - PURANE SAB WAISE KE WAISE
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

// 3. Category Ke Hisaab Se Shops - Location Filter Ke Saath
router.get('/shops', (req, res) => {
    const db = readDB();
    const categoryId = req.query.category;
    const userLat = parseFloat(req.query.lat);
    const userLng = parseFloat(req.query.lng);
    let shops = db.shops.filter(s => s.status);
    if (categoryId) {
        shops = shops.filter(s => s.categoryId === categoryId);
    }
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
    shops = shops.map(shop => ({
     ...shop,
        banner: shop.banner || ''
    }));
    res.json(shops);
});

// 3.1. CATEGORY ID SE SHOPS - MODULE PAGE KE LIYE
router.get('/shops/:categoryId', (req, res) => {
    const db = readDB();
    const { categoryId } = req.params;
    const userLat = parseFloat(req.query.lat);
    const userLng = parseFloat(req.query.lng);
    let shops = db.shops.filter(s =>
        s.categoryId === categoryId &&
        s.status!== false
    );
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
    shops = shops.map(shop => ({
     ...shop,
        banner: shop.banner || ''
    }));
    res.json(shops);
});

// 4. Single Shop Ki Details
router.get('/shop/:id', (req, res) => {
    const db = readDB();
    const shop = db.shops.find(s => s.id === req.params.id);
    if (!shop) {
        return res.status(404).json({ error: 'Shop nahi mili' });
    }
    const shopData = {
     ...shop,
        banner: shop.banner || ''
    };
    res.json(shopData);
});

// ========================================
// NAYA ROUTE - TERE SKETCH WALA PATTERN
// ========================================
router.get('/layout/:categoryId', async (req, res) => {
    try {
        const { categoryId } = req.params;
        const userLat = parseFloat(req.query.lat);
        const userLng = parseFloat(req.query.lng);
        const db = readDB();

        // 1. 5KM wali shops - JSON se nikalo
        let shops = db.shops.filter(s => s.status && s.categoryId === categoryId);
        if(userLat && userLng) {
            shops = shops.map(s => {
                if(s.lat && s.lng) {
                    const dist = getDistance(userLat, userLng, s.lat, s.lng);
                    s.distance = Math.round(dist);
                    s.inRange = dist <= 5000;
                } else { s.inRange = false; }
                return s;
            }).filter(s => s.inRange).sort((a, b) => a.distance - b.distance);
        }

        // 2. Banners - JSON se + MongoDB se dono check karo
        let areaBanners = db.banners? db.banners.filter(b =>
            b.status &&
            b.type === 'area' &&
            (b.categoryId === categoryId ||!b.categoryId)
        ).sort((a, b) => a.priority - b.priority) : [];

        let adminBanners = db.banners? db.banners.filter(b =>
            b.status &&
            b.type === 'admin' &&
            (b.categoryId === categoryId ||!b.categoryId)
        ).sort((a, b) => a.priority - b.priority) : [];

        // MongoDB se bhi try karo agar hai
        try {
            const mongoAreaBanners = await Banner.find({
                type: 'area',
                status: true,
                $or: [{ categoryId: categoryId }, { categoryId: null }, { categoryId: '' }]
            }).sort({ priority: 1 }).lean();

            const mongoAdminBanners = await Banner.find({
                type: 'admin',
                status: true,
                $or: [{ categoryId: categoryId }, { categoryId: null }, { categoryId: '' }]
            }).sort({ priority: 1 }).lean();

            areaBanners = [...areaBanners,...mongoAreaBanners];
            adminBanners = [...adminBanners,...mongoAdminBanners];
        } catch(e) { console.log('MongoDB banner fetch fail:', e.message); }

        // 3. Pattern banao: Banner -> 8 Shops -> Banner -> 8 Shops
        let layout = [];
        let shopIndex = 0;
        let allBanners = [...areaBanners,...adminBanners];

        allBanners.forEach((banner) => {
            layout.push({ type: 'banner', data: banner });
            const shopSlice = shops.slice(shopIndex, shopIndex + 8);
            if(shopSlice.length > 0) {
                layout.push({ type: 'shops', data: shopSlice });
                shopIndex += 8;
            }
        });

        if(shopIndex < shops.length) {
            layout.push({ type: 'shops', data: shops.slice(shopIndex) });
        }

        res.json({
            category: categoryId,
            categoryName: categoryId.replace(/-/g, ' ').toUpperCase(),
            layout: layout,
            totalShops: shops.length,
            totalBanners: allBanners.length
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// ADMIN APIs - PURANE SAB WAISE KE WAISE + BANNER ADD KIYA
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

// 4. Shop Add Karo - BANNER SUPPORT + MONGODB BHI
router.post('/admin/shop', async (req, res) => {
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
        banner: banner || '',
        status: true,
        priority: db.shops.length + 1,
        createdAt: new Date().toISOString()
    };

    // MongoDB me bhi save kar
    try {
        const mongoShop = new Shop(newShop);
        await mongoShop.save();
        newShop.mongoId = mongoShop._id.toString();
    } catch(e) { console.log('MongoDB shop save fail:', e.message); }

    if (!db.shops) db.shops = [];
    db.shops.push(newShop);
    if (writeDB(db)) {
        res.json({ success: true, data: newShop });
    } else {
        res.status(500).json({ error: 'Save nahi hua' });
    }
});

// 5. Banner Add Karo - NAYA ROUTE
router.post('/admin/banner', async (req, res) => {
    const db = readDB();
    const { title, image, link, type, areaId, categoryId } = req.body;
    if (!title ||!image) {
        return res.status(400).json({ error: 'Title aur Image zaruri hai' });
    }
    const newBanner = {
        id: 'banner-' + Date.now(),
        title,
        image,
        link: link || '',
        type: type || 'admin',
        areaId: areaId || '',
        categoryId: categoryId || '',
        status: true,
        priority: db.banners? db.banners.length + 1 : 1,
        createdAt: new Date().toISOString()
    };

    // MongoDB me bhi save
    try {
        const mongoBanner = new Banner(newBanner);
        await mongoBanner.save();
        newBanner.mongoId = mongoBanner._id.toString();
    } catch(e) { console.log('MongoDB banner save fail:', e.message); }

    if (!db.banners) db.banners = [];
    db.banners.push(newBanner);
    if (writeDB(db)) {
        res.json({ success: true, data: newBanner });
    } else {
        res.status(500).json({ error: 'Save nahi hua' });
    }
});

module.exports = router;
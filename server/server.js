require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose'); // MONGOOSE ADD KIYA
const app = express();
const PORT = process.env.PORT || 3000;

// MONGODB CONNECTION - NAYA ADD KIYA - YAHAN FIX KIYA
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB Connected ✅'))
.catch(err => console.log('MongoDB Error:', err));

// ========================================
// MONGOOSE SCHEMAS - NAYA ADD KIYA
// ========================================
const shopSchema = new mongoose.Schema({
    name: { type: String, required: true },
    categoryId: String,
    address: String,
    phone: String,
    lat: Number,
    lng: Number,
    range: { type: Number, default: 5000 },
    banner: String,
    logo: String,
    status: { type: Boolean, default: true },
    priority: Number,
    desc: String
}, { timestamps: true });

const Shop = mongoose.model('Shop', shopSchema);

// Video + Image upload config - Dono ke liye
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../public/uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = file.mimetype.startsWith('image')? 'logo-' : 'video-';
        cb(null, name + Date.now() + ext);
    }
});
const upload = multer({ storage: storage });

// FIX 1: dbPath sahi kiya - server folder ke andar database folder hai
const dbPath = path.join(__dirname, './database/modules.json');

// Static files
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB Helpers - JSON FILE KE LIYE - ABHI BHI USE HONGE
function readDB() {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    if (!data.areaManagers) data.areaManagers = [];
    if (!data.areas) data.areas = [];
    return data;
}

function writeDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// ========================================
// LOCATION HELPERS - NEW
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

function isPointInPolygon(point, vs) {
    const x = point[0], y = point[1];
    let inside = false;
    for(let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i][0], yi = vs[i][1];
        const xj = vs[j][0], yj = vs[j][1];
        const intersect = ((yi > y)!== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if(intersect) inside =!inside;
    }
    return inside;
}

function checkModuleInArea(module, userLat, userLng) {
    if(!module.areas || module.areas.length === 0) return { inArea: true, distance: 0 };

    for(let area of module.areas) {
        if(area.type === 'circle') {
            const dist = getDistance(userLat, userLng, area.lat, area.lng);
            if(dist <= area.radius) {
                return { inArea: true, distance: Math.round(dist) };
            }
        }
        if(area.type === 'polygon') {
            if(isPointInPolygon([userLat, userLng], area.coordinates)) {
                return { inArea: true, distance: 0 };
            }
        }
    }
    return { inArea: false, distance: 0 };
}

// ========================================
// PUBLIC APIs - Frontend - FIXED
// ========================================
app.get('/api/modules', (req, res) => {
    const db = readDB();
    const userLat = parseFloat(req.query.lat);
    const userLng = parseFloat(req.query.lng);

    let modules = db.modules.filter(m => m.status);

    if(userLat && userLng) {
        modules = modules.filter(m => {
            const check = checkModuleInArea(m, userLat, userLng);
            if(check.inArea) {
                m.distance = check.distance;
                return true;
            }
            return false;
        }).sort((a, b) => a.distance - b.distance);
    } else {
        modules = modules.sort((a, b) => a.priority - b.priority);
    }

    res.json(modules);
});

// FIXED: SHOPS AB MONGODB SE AAYENGI
app.get('/api/shops', async (req, res) => {
    try {
        const userLat = parseFloat(req.query.lat);
        const userLng = parseFloat(req.query.lng);
        let shops = await Shop.find({ status: true }).lean();

        if(userLat && userLng) {
            shops = shops.map(s => {
                if(s.lat && s.lng) {
                    const dist = getDistance(userLat, userLng, s.lat, s.lng);
                    s.distance = Math.round(dist);
                    s.inRange = dist <= (s.range || 5000);
                } else {
                    s.distance = 999999;
                    s.inRange = false;
                }
                return s;
            }).filter(s => s.inRange).sort((a, b) => a.distance - b.distance);
        } else {
            shops = shops.sort((a, b) => a.priority - b.priority);
        }
        res.json(shops);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// FIX 2: Homepage API - Location na mile to bhi saare modules dikhao - SHOPS MONGODB SE
app.get('/api/homepage', async (req, res) => {
    try {
        const db = readDB();
        const userLat = parseFloat(req.query.lat);
        const userLng = parseFloat(req.query.lng);

        let modules = [];
        let shops = [];

        if(userLat && userLng) {
            modules = db.modules.filter(m => {
                if(!m.status) return false;
                const check = checkModuleInArea(m, userLat, userLng);
                if(check.inArea) {
                    m.distance = (check.distance/1000).toFixed(1);
                    return true;
                }
                return false;
            }).sort((a, b) => a.distance - b.distance);

            shops = await Shop.find({ status: true }).lean();
            shops = shops.filter(s => {
                if(!s.lat ||!s.lng) return false;
                const dist = getDistance(userLat, userLng, s.lat, s.lng);
                s.distance = Math.round(dist);
                return dist <= (s.range || 5000);
            }).sort((a, b) => a.distance - b.distance);
        } else {
            modules = db.modules.filter(m => m.status).sort((a, b) => a.priority - b.priority);
            shops = await Shop.find({ status: true }).sort({ priority: 1 }).lean();
        }

        res.json({ modules, shops });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/ads', (req, res) => {
    const db = readDB();
    res.json(db.ads.filter(a => a.status).sort((a, b) => a.priority - b.priority));
});

app.get('/api/videos', (req, res) => {
    const db = readDB();
    res.json(db.videos.filter(v => v.status).sort((a, b) => a.priority - b.priority));
});

app.get('/api/campaigns', (req, res) => {
    const db = readDB();
    res.json(db.campaigns.filter(c => c.status).sort((a, b) => a.priority - b.priority));
});

app.get('/api/settings', (req, res) => {
    const db = readDB();
    res.json(db.settings);
});

// ========================================
// MARKET SHOPS API - COMMENTED OUT - routes/market.js USE HO RAHI HAI
// ========================================
// app.get('/api/market/shops/:categoryId', (req, res) => {
// const db = readDB();
// const { categoryId } = req.params;
// const userLat = parseFloat(req.query.lat);
// const userLng = parseFloat(req.query.lng);
//
// // 1. Sirf is category ki active shops nikalo
// let shops = db.shops.filter(s =>
// s.categoryId === categoryId &&
// s.status!== false
// );
//
// // 2. Agar location mili hai to 5km radius filter lagao
// if (userLat && userLng) {
// shops = shops.map(shop => {
// if (shop.lat && shop.lng) {
// const dist = getDistance(userLat, userLng, parseFloat(shop.lat), parseFloat(shop.lng));
// shop.distance = Math.round(dist); // meters me
// shop.inRange = dist <= 5000; // 5km
// } else {
// shop.distance = 999999;
// shop.inRange = false;
// }
// return shop;
// }).filter(s => s.inRange).sort((a, b) => a.distance - b.distance);
// }
//
// // banner field automatically jayegi kyunki shop object me hai
// res.json(shops);
// });

// MARKET API ROUTE
app.use('/api/market', require('./routes/market'));

// AREA MANAGER API ROUTE - NEW
app.use('/api/area-manager', require('./routes/area-manager'));

// ========================================
// ADMIN APIs - Control Panel
// ========================================
app.get('/api/admin/data', async (req, res) => {
    const db = readDB();
    db.shops = await Shop.find().lean(); // SHOPS MONGODB SE ADD KAR DI
    res.json(db);
});

// Modules CRUD - JSON ME HI RAHENGE
app.put('/api/admin/module/:id', (req, res) => {
    const db = readDB();
    const idx = db.modules.findIndex(m => m.id === req.params.id);
    if(idx!== -1) {
        db.modules[idx] = {...db.modules[idx],...req.body};
        writeDB(db);
        res.json({ success: true, data: db.modules[idx] });
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

app.post('/api/admin/module', (req, res) => {
    const db = readDB();
    const newItem = {
        id: req.body.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
        status: true,
        priority: db.modules.length + 1,
        desc: "",
        banner: "",
        areas: [],
...req.body
    };
    db.modules.push(newItem);
    writeDB(db);
    res.json({ success: true, data: newItem });
});

app.delete('/api/admin/module/:id', (req, res) => {
    const db = readDB();
    db.modules = db.modules.filter(m => m.id!== req.params.id);
    writeDB(db);
    res.json({ success: true });
});

// Ads CRUD - JSON ME HI RAHENGE
app.put('/api/admin/ad/:id', (req, res) => {
    const db = readDB();
    const idx = db.ads.findIndex(a => a.id === req.params.id);
    if(idx!== -1) {
        db.ads[idx] = {...db.ads[idx],...req.body};
        writeDB(db);
        res.json({ success: true });
    } else res.status(404).json({ error: 'Not found' });
});

app.post('/api/admin/ad', (req, res) => {
    const db = readDB();
    const newItem = { id: 'ad-' + Date.now(), status: true, priority: db.ads.length + 1,...req.body };
    db.ads.push(newItem);
    writeDB(db);
    res.json({ success: true, data: newItem });
});

app.delete('/api/admin/ad/:id', (req, res) => {
    const db = readDB();
    db.ads = db.ads.filter(a => a.id!== req.params.id);
    writeDB(db);
    res.json({ success: true });
});

// Videos CRUD - JSON ME HI RAHENGE
app.put('/api/admin/video/:id', (req, res) => {
    const db = readDB();
    const idx = db.videos.findIndex(v => v.id === req.params.id);
    if(idx!== -1) {
        db.videos[idx] = {...db.videos[idx],...req.body};
        writeDB(db);
        res.json({ success: true });
    } else res.status(404).json({ error: 'Not found' });
});

app.post('/api/admin/video', (req, res) => {
    const db = readDB();
    const newItem = { id: 'v-' + Date.now(), status: true, priority: db.videos.length + 1,...req.body };
    db.videos.push(newItem);
    writeDB(db);
    res.json({ success: true, data: newItem });
});

app.delete('/api/admin/video/:id', (req, res) => {
    const db = readDB();
    db.videos = db.videos.filter(v => v.id!== req.params.id);
    writeDB(db);
    res.json({ success: true });
});

// Campaigns CRUD - JSON ME HI RAHENGE
app.put('/api/admin/campaign/:id', (req, res) => {
    const db = readDB();
    const idx = db.campaigns.findIndex(c => c.id === req.params.id);
    if(idx!== -1) {
        db.campaigns[idx] = {...db.campaigns[idx],...req.body};
        writeDB(db);
        res.json({ success: true });
    } else res.status(404).json({ error: 'Not found' });
});

app.post('/api/admin/campaign', (req, res) => {
    const db = readDB();
    const newItem = { id: 'c-' + Date.now(), status: true, priority: db.campaigns.length + 1,...req.body };
    db.campaigns.push(newItem);
    writeDB(db);
    res.json({ success: true, data: newItem });
});

app.delete('/api/admin/campaign/:id', (req, res) => {
    const db = readDB();
    db.campaigns = db.campaigns.filter(c => c.id!== req.params.id);
    writeDB(db);
    res.json({ success: true });
});

// Shops CRUD - AB MONGODB ME SAVE HONGE ✅
app.put('/api/admin/shop/:id', async (req, res) => {
    try {
        const updatedShop = await Shop.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if(updatedShop) {
            res.json({ success: true, data: updatedShop });
        } else {
            res.status(404).json({ error: 'Not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/shop', async (req, res) => {
    try {
        const count = await Shop.countDocuments();
        const newItem = new Shop({
           ...req.body,
            priority: count + 1,
            status: true,
            range: req.body.range || 5000,
            banner: req.body.banner || ''
        });
        await newItem.save();
        console.log('Shop saved to MongoDB:', newItem.name);
        res.json({ success: true, data: newItem });
    } catch (err) {
        console.log('Shop save error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/shop/:id', async (req, res) => {
    try {
        await Shop.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Settings - JSON ME HI RAHENGE
app.put('/api/admin/settings', (req, res) => {
    const db = readDB();
    db.settings = {...db.settings,...req.body};
    writeDB(db);
    res.json({ success: true, settings: db.settings });
});

// Upload
app.post('/api/admin/upload', upload.single('file'), (req, res) => {
    res.json({ success: true, url: `/uploads/${req.file.filename}` });
});

// Admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// Area Manager page - NEW
app.get('/area-manager', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/area-manager.html'));
});

// Home
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Dynamic module pages
app.get('/modules/:moduleName', (req, res) => {
    const db = readDB();
    const module = db.modules.find(m => m.id === req.params.moduleName);
    if (!module) return res.status(404).send('Module not found');

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${module.name} - ${db.settings.logoText}</title>
            <link rel="stylesheet" href="/assets/css/main.css">
        </head>
        <body>
            <div class="video-bg"><div class="video-overlay"></div></div>
            <header class="header" style="background: linear-gradient(135deg, ${db.settings.headerColor}, #764ba2);">
                <div class="header-container">
                    <div class="logo">
                        ${db.settings.logoImage?
                            `<img src="${db.settings.logoImage}" class="logo-img" style="width:40px;height:40px;border-radius:8px;object-fit:contain;margin-right:10px;">` :
                            `<div class="logo-icon">${db.settings.logoText.charAt(0)}</div>`
                        }
                        <span class="logo-text">${db.settings.logoText}</span>
                    </div>
                </div>
            </header>
            <main class="main-content">
                <div class="container">
                    <div style="min-height:60vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:50px 20px;">
                        <div>
                            <div style="font-size:80px;margin-bottom:20px;">${module.icon}</div>
                            <h1 style="font-size:48px;color:${module.color};margin-bottom:20px;">${module.name}</h1>
                            <p style="font-size:18px;color:#64748b;margin-bottom:30px;">${module.desc || 'Ye ' + module.name + ' ka page hai. Yahan is service ka pura content aayega.'}</p>
                            <a href="/" style="background:${module.color};color:white;padding:12px 30px;border:none;border-radius:25px;font-size:16px;text-decoration:none;display:inline-block;">← Back to Home</a>
                        </div>
                    </div>
                </div>
            </main>
        </body>
        </html>
    `);
});

// 404
app.use((req, res) => {
    res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head><title>404 - Page Not Found</title></head>
        <body style="font-family:Arial;text-align:center;padding:50px;">
            <h1 style="color:#1e40af;font-size:72px;margin:0;">404</h1>
            <p style="color:#64748b;font-size:18px;">Oops! Page nahi mila 😅</p>
            <a href="/" style="background:#1e40af;color:white;padding:12px 30px;text-decoration:none;border-radius:25px;display:inline-block;margin-top:20px;">Home Pe Wapas Jao</a>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`✅ SAMANLIVE Server: http://localhost:${PORT}`);
    console.log(`🔧 Admin Panel: http://localhost:${PORT}/admin`);
    console.log(`👨‍💼 Area Manager: http://localhost:${PORT}/area-manager`);
    console.log(`📁 Serving: ${path.join(__dirname, '../public')}`);
});
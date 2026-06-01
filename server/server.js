require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

// MONGODB CONNECTION
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
    desc: String,
    mongoId: String, // JSON wali ID ko track karne ke liye
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // NAYA ADD KIYA
}, { timestamps: true });

const moduleSchema = new mongoose.Schema({
    id: String,
    name: String,
    icon: String,
    color: String,
    desc: String,
    banner: String,
    status: { type: Boolean, default: true },
    priority: Number,
    areas: Array,
    mongoId: String
}, { timestamps: true });

const adSchema = new mongoose.Schema({
    id: String,
    title: String,
    image: String,
    link: String,
    status: { type: Boolean, default: true },
    priority: Number,
    mongoId: String
}, { timestamps: true });

const videoSchema = new mongoose.Schema({
    id: String,
    title: String,
    url: String,
    thumbnail: String,
    status: { type: Boolean, default: true },
    priority: Number,
    mongoId: String
}, { timestamps: true });

const campaignSchema = new mongoose.Schema({
    id: String,
    name: String,
    image: String,
    desc: String,
    status: { type: Boolean, default: true },
    priority: Number,
    mongoId: String
}, { timestamps: true });

const settingsSchema = new mongoose.Schema({
    logoText: String,
    logoImage: String,
    headerColor: String,
    footerText: String
}, { timestamps: true });

// USER SCHEMA - NAYA ADD KIYA
const userSchema = new mongoose.Schema({
    userId: { type: String, unique: true }, // USER001, USER002
    name: { type: String, required: true },
    phone: String,
    email: String,
    password: String,
    profilePic: { type: String, default: '/assets/default-avatar.png' },
    address: {
        street: String,
        city: String,
        state: String,
        pincode: String
    },
    language: { type: String, default: 'hi' },
    qrCodeData: String, // JSON string for QR
    hasShop: { type: Boolean, default: false },
    googleId: String
}, { timestamps: true });

const Shop = mongoose.model('Shop', shopSchema);
const Module = mongoose.model('Module', moduleSchema);
const Ad = mongoose.model('Ad', adSchema);
const Video = mongoose.model('Video', videoSchema);
const Campaign = mongoose.model('Campaign', campaignSchema);
const Settings = mongoose.model('Settings', settingsSchema);
const User = mongoose.model('User', userSchema); // NAYA ADD KIYA

// Video + Image upload config
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
    if (!data.modules) data.modules = [];
    if (!data.shops) data.shops = [];
    if (!data.ads) data.ads = [];
    if (!data.videos) data.videos = [];
    if (!data.campaigns) data.campaigns = [];
    if (!data.settings) data.settings = {};
    return data;
}

function writeDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// ========================================
// AUTH MIDDLEWARE - NAYA ADD KIYA
// ========================================
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied' });

    jwt.verify(token, process.env.JWT_SECRET || 'samanlive_secret_key', (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
}

// GENERATE USER ID - NAYA ADD KIYA
async function generateUserId() {
    const count = await User.countDocuments();
    return `USER${String(count + 1).padStart(3, '0')}`;
}

// ========================================
// LOCATION HELPERS
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
            if(dist <= area.radius) return { inArea: true, distance: Math.round(dist) };
        }
        if(area.type === 'polygon') {
            if(isPointInPolygon([userLat, userLng], area.coordinates)) return { inArea: true, distance: 0 };
        }
    }
    return { inArea: false, distance: 0 };
}

// ========================================
// USER AUTH ROUTES - NAYA ADD KIYA
// ========================================
app.post('/api/auth/login-phone', async (req, res) => {
    try {
        const { phone, name } = req.body;
        if (!phone ||!name) return res.status(400).json({ error: 'Phone and name required' });

        let user = await User.findOne({ phone });

        if (!user) {
            // New user
            const userId = await generateUserId();
            const qrData = JSON.stringify({ userId, name, phone });

            user = new User({
                userId,
                name,
                phone,
                qrCodeData: qrData
            });
            await user.save();
        }

        const token = jwt.sign(
            { userId: user._id, phone: user.phone },
            process.env.JWT_SECRET || 'samanlive_secret_key',
            { expiresIn: '30d' }
        );

        res.json({ success: true, token, user });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        res.json({ success: true, user });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/user/update', authenticateToken, async (req, res) => {
    try {
        const updates = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { $set: updates },
            { new: true }
        ).select('-password');

        // Update QR data if name/phone changed
        if (updates.name || updates.phone) {
            user.qrCodeData = JSON.stringify({
                userId: user.userId,
                name: user.name,
                phone: user.phone
            });
            await user.save();
        }

        res.json({ success: true, user });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ========================================
// SHOP CREATION BY USER - NAYA ADD KIYA
// ========================================
app.post('/api/shop/create', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (user.hasShop) {
            return res.status(400).json({ error: 'User already has a shop' });
        }

        const { name, moduleId, phone, address, range, icon, color } = req.body;

        const shop = new Shop({
            name,
            moduleId,
            phone,
            address,
            range,
            icon,
            color,
            priority: 1,
            status: false, // Pending approval
            ownerId: req.user.userId
        });

        await shop.save();

        // User me hasShop true kar do
        user.hasShop = true;
        await user.save();

        res.json({ success: true, shop });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ========================================
// PUBLIC APIs - PEHLE JSON SE, FAIL HO TO MONGODB SE
// ========================================
app.get('/api/modules', (req, res) => {
    const db = readDB();
    const userLat = parseFloat(req.query.lat);
    const userLng = parseFloat(req.query.lng);
    let modules = db.modules.filter(m => m.status);
    if(userLat && userLng) {
        modules = modules.filter(m => {
            const check = checkModuleInArea(m, userLat, userLng);
            if(check.inArea) { m.distance = check.distance; return true; }
            return false;
        }).sort((a, b) => a.distance - b.distance);
    } else {
        modules = modules.sort((a, b) => a.priority - b.priority);
    }
    res.json(modules);
});

app.get('/api/shops', (req, res) => {
    const db = readDB();
    const userLat = parseFloat(req.query.lat);
    const userLng = parseFloat(req.query.lng);
    let shops = db.shops.filter(s => s.status);
    if(userLat && userLng) {
        shops = shops.map(s => {
            if(s.lat && s.lng) {
                const dist = getDistance(userLat, userLng, s.lat, s.lng);
                s.distance = Math.round(dist);
                s.inRange = dist <= (s.range || 5000);
            } else { s.distance = 999999; s.inRange = false; }
            return s;
        }).filter(s => s.inRange).sort((a, b) => a.distance - b.distance);
    } else {
        shops = shops.sort((a, b) => a.priority - b.priority);
    }
    res.json(shops);
});

app.get('/api/homepage', (req, res) => {
    const db = readDB();
    const userLat = parseFloat(req.query.lat);
    const userLng = parseFloat(req.query.lng);
    let modules = [];
    let shops = [];
    if(userLat && userLng) {
        modules = db.modules.filter(m => {
            if(!m.status) return false;
            const check = checkModuleInArea(m, userLat, userLng);
            if(check.inArea) { m.distance = (check.distance/1000).toFixed(1); return true; }
            return false;
        }).sort((a, b) => a.distance - b.distance);
        shops = db.shops.filter(s => {
            if(!s.status ||!s.lat ||!s.lng) return false;
            const dist = getDistance(userLat, userLng, s.lat, s.lng);
            s.distance = Math.round(dist);
            return dist <= (s.range || 5000);
        }).sort((a, b) => a.distance - b.distance);
    } else {
        modules = db.modules.filter(m => m.status).sort((a, b) => a.priority - b.priority);
        shops = db.shops.filter(s => s.status).sort((a, b) => a.priority - b.priority);
    }
    res.json({ modules, shops });
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

// MARKET API ROUTE
app.use('/api/market', require('./routes/market'));
// AREA MANAGER API ROUTE
app.use('/api/area-manager', require('./routes/area-manager'));

// ========================================
// ADMIN APIs - DONO JAGAH SAVE HOGA
// ========================================
app.get('/api/admin/data', (req, res) => {
    res.json(readDB());
});

// Modules CRUD - JSON + MONGODB DONO
app.put('/api/admin/module/:id', async (req, res) => {
    const db = readDB();
    const idx = db.modules.findIndex(m => m.id === req.params.id);
    if(idx!== -1) {
        db.modules[idx] = {...db.modules[idx],...req.body};
        writeDB(db); // JSON me save
        // MongoDB me bhi update
        try {
            if(db.modules[idx].mongoId) {
                await Module.findByIdAndUpdate(db.modules[idx].mongoId, req.body);
            }
        } catch(e) { console.log('MongoDB update failed:', e.message); }
        res.json({ success: true, data: db.modules[idx] });
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

app.post('/api/admin/module', async (req, res) => {
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
    // MongoDB me save
    try {
        const mongoItem = new Module(newItem);
        await mongoItem.save();
        newItem.mongoId = mongoItem._id.toString(); // MongoDB ID save kar le
    } catch(e) { console.log('MongoDB save failed:', e.message); }

    db.modules.push(newItem);
    writeDB(db); // JSON me save
    res.json({ success: true, data: newItem });
});

app.delete('/api/admin/module/:id', async (req, res) => {
    const db = readDB();
    const item = db.modules.find(m => m.id === req.params.id);
    if(item && item.mongoId) {
        try { await Module.findByIdAndDelete(item.mongoId); } catch(e) {}
    }
    db.modules = db.modules.filter(m => m.id!== req.params.id);
    writeDB(db);
    res.json({ success: true });
});

// Ads CRUD - JSON + MONGODB DONO
app.put('/api/admin/ad/:id', async (req, res) => {
    const db = readDB();
    const idx = db.ads.findIndex(a => a.id === req.params.id);
    if(idx!== -1) {
        db.ads[idx] = {...db.ads[idx],...req.body};
        writeDB(db);
        try {
            if(db.ads[idx].mongoId) await Ad.findByIdAndUpdate(db.ads[idx].mongoId, req.body);
        } catch(e) {}
        res.json({ success: true });
    } else res.status(404).json({ error: 'Not found' });
});

app.post('/api/admin/ad', async (req, res) => {
    const db = readDB();
    const newItem = { id: 'ad-' + Date.now(), status: true, priority: db.ads.length + 1,...req.body };
    try {
        const mongoItem = new Ad(newItem);
        await mongoItem.save();
        newItem.mongoId = mongoItem._id.toString();
    } catch(e) {}
    db.ads.push(newItem);
    writeDB(db);
    res.json({ success: true, data: newItem });
});

app.delete('/api/admin/ad/:id', async (req, res) => {
    const db = readDB();
    const item = db.ads.find(a => a.id === req.params.id);
    if(item && item.mongoId) { try { await Ad.findByIdAndDelete(item.mongoId); } catch(e) {} }
    db.ads = db.ads.filter(a => a.id!== req.params.id);
    writeDB(db);
    res.json({ success: true });
});

// Videos CRUD - JSON + MONGODB DONO
app.put('/api/admin/video/:id', async (req, res) => {
    const db = readDB();
    const idx = db.videos.findIndex(v => v.id === req.params.id);
    if(idx!== -1) {
        db.videos[idx] = {...db.videos[idx],...req.body};
        writeDB(db);
        try {
            if(db.videos[idx].mongoId) await Video.findByIdAndUpdate(db.videos[idx].mongoId, req.body);
        } catch(e) {}
        res.json({ success: true });
    } else res.status(404).json({ error: 'Not found' });
});

app.post('/api/admin/video', async (req, res) => {
    const db = readDB();
    const newItem = { id: 'v-' + Date.now(), status: true, priority: db.videos.length + 1,...req.body };
    try {
        const mongoItem = new Video(newItem);
        await mongoItem.save();
        newItem.mongoId = mongoItem._id.toString();
    } catch(e) {}
    db.videos.push(newItem);
    writeDB(db);
    res.json({ success: true, data: newItem });
});

app.delete('/api/admin/video/:id', async (req, res) => {
    const db = readDB();
    const item = db.videos.find(v => v.id === req.params.id);
    if(item && item.mongoId) { try { await Video.findByIdAndDelete(item.mongoId); } catch(e) {} }
    db.videos = db.videos.filter(v => v.id!== req.params.id);
    writeDB(db);
    res.json({ success: true });
});

// Campaigns CRUD - JSON + MONGODB DONO
app.put('/api/admin/campaign/:id', async (req, res) => {
    const db = readDB();
    const idx = db.campaigns.findIndex(c => c.id === req.params.id);
    if(idx!== -1) {
        db.campaigns[idx] = {...db.campaigns[idx],...req.body};
        writeDB(db);
        try {
            if(db.campaigns[idx].mongoId) await Campaign.findByIdAndUpdate(db.campaigns[idx].mongoId, req.body);
        } catch(e) {}
        res.json({ success: true });
    } else res.status(404).json({ error: 'Not found' });
});

app.post('/api/admin/campaign', async (req, res) => {
    const db = readDB();
    const newItem = { id: 'c-' + Date.now(), status: true, priority: db.campaigns.length + 1,...req.body };
    try {
        const mongoItem = new Campaign(newItem);
        await mongoItem.save();
        newItem.mongoId = mongoItem._id.toString();
    } catch(e) {}
    db.campaigns.push(newItem);
    writeDB(db);
    res.json({ success: true, data: newItem });
});

app.delete('/api/admin/campaign/:id', async (req, res) => {
    const db = readDB();
    const item = db.campaigns.find(c => c.id === req.params.id);
    if(item && item.mongoId) { try { await Campaign.findByIdAndDelete(item.mongoId); } catch(e) {} }
    db.campaigns = db.campaigns.filter(c => c.id!== req.params.id);
    writeDB(db);
    res.json({ success: true });
});

// Shops CRUD - JSON + MONGODB DONO
app.put('/api/admin/shop/:id', async (req, res) => {
    const db = readDB();
    const idx = db.shops.findIndex(s => s.id === req.params.id);
    if(idx!== -1) {
        db.shops[idx] = {...db.shops[idx],...req.body};
        writeDB(db); // JSON me save
        try {
            if(db.shops[idx].mongoId) {
                await Shop.findByIdAndUpdate(db.shops[idx].mongoId, req.body);
            }
        } catch(e) { console.log('MongoDB update failed:', e.message); }
        res.json({ success: true, data: db.shops[idx] });
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

app.post('/api/admin/shop', async (req, res) => {
    const db = readDB();
    const newItem = {
        id: 's-' + Date.now(),
        status: true,
        priority: db.shops.length + 1,
        range: 5000,
        banner: '',
      ...req.body
    };
    // MongoDB me save
    try {
        const mongoItem = new Shop(newItem);
        await mongoItem.save();
        newItem.mongoId = mongoItem._id.toString();
        console.log('Shop saved to MongoDB:', newItem.name);
    } catch(e) { console.log('MongoDB save failed:', e.message); }

    db.shops.push(newItem);
    writeDB(db); // JSON me save
    res.json({ success: true, data: newItem });
});

app.delete('/api/admin/shop/:id', async (req, res) => {
    const db = readDB();
    const item = db.shops.find(s => s.id === req.params.id);
    if(item && item.mongoId) {
        try { await Shop.findByIdAndDelete(item.mongoId); } catch(e) {}
    }
    db.shops = db.shops.filter(s => s.id!== req.params.id);
    writeDB(db);
    res.json({ success: true });
});

// Settings - JSON + MONGODB DONO
app.put('/api/admin/settings', async (req, res) => {
    const db = readDB();
    db.settings = {...db.settings,...req.body};
    writeDB(db);
    try {
        let settings = await Settings.findOne();
        if(!settings) await Settings.create(req.body);
        else await Settings.findByIdAndUpdate(settings._id, req.body);
    } catch(e) {}
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

// Area Manager page
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
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const multer = require('multer');

// MULTER
const { managerUpload, upload } = require('./middleware/upload');
const app = express();
const PORT = process.env.PORT || 3000;

// MONGODB CONNECTION
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB Connected ✅'))
.catch(err => console.log('MongoDB Error:', err));

// ========================================
// MODELS REQUIRE
// ========================================
const Shop = require('./models/Shop');
const Manager = require('./models/Manager');
const Content = require('./models/Content');
const Setting = require('./models/Setting');
const ShopHistory = require('./models/ShopHistory');

// ========================================
// MONGOOSE SCHEMAS - Sirf jo JSON me save hote hain
// ========================================
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
    mongoId: String,
    categories: Array
}, { timestamps: true });

const userSchema = new mongoose.Schema({
    userId: { type: String, unique: true },
    name: { type: String, required: true },
    phone: String,
    email: String,
    password: String,
    profilePic: { type: String, default: '/assets/default-avatar.png' },
    bio: String,
    address: {
        street: String,
        city: String,
        state: String,
        pincode: String
    },
    addresses: [],
    payments: [],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    notifications: [],
    settings: {
        notifOrders: { type: Boolean, default: true },
        notifPromos: { type: Boolean, default: true },
        notifPush: { type: Boolean, default: true },
        notifEmail: { type: Boolean, default: false },
        privacyLocation: { type: Boolean, default: true },
        darkMode: { type: Boolean, default: false }
    },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', default: null },
    language: { type: String, default: 'hi' },
    qrCodeData: String,
    hasShop: { type: Boolean, default: false },
    googleId: String
}, { timestamps: true });

const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    oldPrice: Number,
    image: String,
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
    category: String,
    stock: { type: Number, default: 0 },
    status: { type: Boolean, default: true }
}, { timestamps: true });

// MODELS COMPILE
const Module = mongoose.models.Module || mongoose.model('Module', moduleSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

// LOGO SETUP
const uploadLogo = require('multer')({ dest: 'public/logos/' });
let CURRENT_LOGO = 'public/logos/default.png';

if (!fs.existsSync('public/logos')) fs.mkdirSync('public/logos', { recursive: true });
if (!fs.existsSync(CURRENT_LOGO)) {
    fs.writeFileSync(CURRENT_LOGO, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64'));
}

const dbPath = path.join(__dirname, './database/modules.json');

// BODY PARSER
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create uploads folder if not exists
const uploadsDir = path.join(__dirname, 'public/uploads/managers');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads/managers folder');
}

// Static files - SABSE PEHLE
app.use(express.static(path.join(__dirname, 'public')));

// DB Helpers
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

// AUTH MIDDLEWARE
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied' });
    jwt.verify(token, process.env.JWT_SECRET || 'samanlive_secret_key', (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        req.userId = user.userId || user.id;
        next();
    });
}

// GENERATE USER ID
async function generateUserId() {
    const count = await User.countDocuments();
    return `USER${String(count + 1).padStart(3, '0')}`;
}

// LOCATION HELPERS
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
// ROUTES CONNECT KARO
// ========================================
const adminRoutes = require('./routes/adminRoutes');
app.use('/api', adminRoutes);

app.use('/api/market', require('./routes/market'));
app.use('/api/area-managers', require('./routes/area-manager'));
app.use('/api', require('./routes/userAddresses'));
app.use('/api', require('./routes/userPayments'));
app.use('/api', require('./routes/wishlist'));
app.use('/api', require('./routes/orders'));
app.use('/api', require('./routes/notifications'));
app.use('/api', require('./routes/shop'));

// Direct upload API
app.post('/admin/upload', authenticateToken, upload.single('file'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const url = '/uploads/' + req.file.filename;
        res.json({ success: true, url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Video upload API
app.post('/api/upload/video', authenticateToken, managerUpload.single('video'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No video uploaded' });
        const url = '/uploads/managers/' + req.file.filename;
        res.json({ success: true, url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Logo upload API
app.post('/api/upload/logo', authenticateToken, uploadLogo.single('logo'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No logo uploaded' });
        const url = '/logos/' + req.file.filename;
        res.json({ success: true, url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ADMIN DASHBOARD STATS API
app.get('/api/stats', async (req, res) => {
    try {
        const users = await User.countDocuments();
        const shops = await Shop.countDocuments();
        const modules = await Module.countDocuments();
        const content = await Content.countDocuments();
        const managers = await Manager.countDocuments();
        res.json({ users, shops, modules, content, managers });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// SETTINGS API
app.get('/api/settings/mongo', async (req, res) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) {
            settings = await Setting.create({
                logoText: 'SAMANLIVE',
                headerColor: '#1e40af',
                footerColor: '#1e293b',
                footerText: '© 2026 SAMANLIVE',
                footerAbout: 'Best services in your city',
                footerLinks: [],
                facebook: '',
                instagram: '',
                twitter: '',
                youtube: ''
            });
        }
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/settings/mongo', async (req, res) => {
    try {
        const settings = await Setting.findOneAndUpdate({}, req.body, { new: true, upsert: true });
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// USER AUTH ROUTES
app.post('/api/auth/login-phone', async (req, res) => {
    try {
        const { phone, name } = req.body;
        if (!phone ||!name) return res.status(400).json({ error: 'Phone and name required' });
        let user = await User.findOne({ phone });
        if (!user) {
            const userId = await generateUserId();
            const qrData = JSON.stringify({ userId, name, phone });
            user = new User({ userId, name, phone, qrCodeData: qrData });
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

// PUBLIC APIs
app.get('/api/modules', async (req, res) => {
    try {
        const userLat = parseFloat(req.query.lat);
        const userLng = parseFloat(req.query.lng);
        let modules = await Module.find({ status: true }).lean();

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
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/shops', async (req, res) => {
    try {
        const userLat = parseFloat(req.query.lat);
        const userLng = parseFloat(req.query.lng);
        let shops = await Shop.find({ status: 'approved', isActive: true }).lean();

        shops = shops.map(shop => {
            if (!shop.bannerApproved) shop.banner = '';
            return shop;
        });

        if(userLat && userLng) {
            shops = shops.map(s => {
                if(s.location && s.location.coordinates) {
                    const dist = getDistance(userLat, userLng, s.location.coordinates[1], s.location.coordinates[0]);
                    s.distance = Math.round(dist);
                    s.inRange = dist <= (s.range || 5000);
                } else { s.distance = 999999; s.inRange = false; }
                return s;
            }).filter(s => s.inRange).sort((a, b) => a.distance - b.distance);
        } else {
            shops = shops.sort((a, b) => (a.priority || 0) - (b.priority || 0));
        }
        res.json(shops);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/public/shops', async (req, res) => {
    try {
        const { lat, lng, area } = req.query;
        let query = { status: 'approved', isActive: true };
        if (area) query.area = area;
        let shops = await Shop.find(query).lean();
        shops = shops.map(shop => {
            if (!shop.bannerApproved) shop.banner = '';
            return shop;
        });
        if (lat && lng) {
            shops = shops.map(s => {
                if (s.location && s.location.coordinates) {
                    const dist = getDistance(parseFloat(lat), parseFloat(lng), s.location.coordinates[1], s.location.coordinates[0]);
                    s.distance = Math.round(dist);
                    s.inRange = dist <= (s.range || 5000);
                } else {
                    s.distance = 999999;
                    s.inRange = false;
                }
                return s;
            }).filter(s => s.inRange).sort((a, b) => a.distance - b.distance);
        }
        res.json({ success: true, shops });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/homepage', async (req, res) => {
    try {
        const userLat = parseFloat(req.query.lat);
        const userLng = parseFloat(req.query.lng);
        let modules = await Module.find({ status: true }).lean();
        let shops = await Shop.find({ status: 'approved', isActive: true }).lean();

        shops = shops.map(shop => {
            if (!shop.bannerApproved) shop.banner = '';
            return shop;
        });

        if(userLat && userLng) {
            modules = modules.filter(m => {
                const check = checkModuleInArea(m, userLat, userLng);
                if(check.inArea) { m.distance = (check.distance/1000).toFixed(1); return true; }
                return false;
            }).sort((a, b) => a.distance - b.distance);

            shops = shops.filter(s => {
                if(!s.location ||!s.location.coordinates) return false;
                const dist = getDistance(userLat, userLng, s.location.coordinates[1], s.location.coordinates[0]);
                s.distance = Math.round(dist);
                return dist <= (s.range || 5000);
            }).sort((a, b) => a.distance - b.distance);
        } else {
            modules = modules.sort((a, b) => a.priority - b.priority);
            shops = shops.sort((a, b) => (a.priority || 0) - (b.priority || 0));
        }
        res.json({ modules, shops });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CONTENT APIs - Ab Content model use kar rahe
app.get('/api/ads', async (req, res) => {
    try {
        const ads = await Content.find({ type: 'ad', status: 'active' }).sort({ priority: 1 });
        res.json(ads);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/videos', async (req, res) => {
    try {
        const videos = await Content.find({ type: 'video', status: 'active' }).sort({ priority: 1 });
        res.json(videos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/campaigns', async (req, res) => {
    try {
        const campaigns = await Content.find({ type: 'campaign', status: 'active' }).sort({ priority: 1 });
        res.json(campaigns);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/settings', async (req, res) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) {
            settings = await Setting.create({
                logoText: 'SAMANLIVE',
                headerColor: '#1e40af',
                footerColor: '#1e293b',
                footerText: '© 2026 SAMANLIVE',
                footerAbout: 'Best services in your city'
            });
        }
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CONTENT CRUD APIs
app.get('/api/content', async (req, res) => {
    try {
        const content = await Content.find().sort({ createdAt: -1 });
        res.json(content);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/content', authenticateToken, async (req, res) => {
    try {
        const content = await Content.create(req.body);
        res.json({ success: true, data: content });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/content/:id', authenticateToken, async (req, res) => {
    try {
        const content = await Content.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!content) return res.status(404).json({ error: 'Content nahi mila' });
        res.json({ success: true, data: content });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/content/:id', authenticateToken, async (req, res) => {
    try {
        const content = await Content.findByIdAndDelete(req.params.id);
        if (!content) return res.status(404).json({ error: 'Content nahi mila' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/area-manager/verify-token', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ error: 'Token required' });
        const manager = await Manager.findOne({ loginToken: token, status: 'active' });
        if (!manager) return res.status(401).json({ error: 'Invalid or expired token' });
        const jwtToken = jwt.sign(
            { managerId: manager._id, email: manager.email },
            process.env.JWT_SECRET || 'samanlive_secret_key',
            { expiresIn: '7d' }
        );
        res.json({ success: true, token: jwtToken, manager: {...manager.toObject(), password: undefined } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ADMIN DATA
app.get('/api/admin/data', async (req, res) => {
    try {
        const modules = await Module.find().sort({ priority: 1 });
        const shops = await Shop.find().populate('createdBy', 'name email').populate('approvedBy', 'name');
        const users = await User.find();
        const db = readDB();
        res.json({
            success: true,
            modules,
            shops,
            areas: db.areas || [],
            ads: [],
            videos: [],
            campaigns: [],
            areaManagers: [],
            settings: {}
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// MODULE APIs
app.put('/api/admin/module/:id', async (req, res) => {
    try {
        const db = readDB();
        const idx = db.modules.findIndex(m => m.id === req.params.id);
        if(idx!== -1) {
            db.modules[idx] = {...db.modules[idx],...req.body };
            writeDB(db);
            if(db.modules[idx].mongoId) {
                await Module.findByIdAndUpdate(db.modules[idx].mongoId, req.body);
            }
            res.json({ success: true, data: db.modules[idx] });
        } else {
            res.status(404).json({ error: 'Not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/module', async (req, res) => {
    try {
        const db = readDB();
        const newItem = {
            id: req.body.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
            status: true,
            priority: db.modules.length + 1,
            desc: "",
            banner: "",
            areas: [],
            categories: [],
           ...req.body
        };
        const mongoItem = new Module(newItem);
        await mongoItem.save();
        newItem.mongoId = mongoItem._id.toString();
        db.modules.push(newItem);
        writeDB(db);
        res.json({ success: true, data: newItem });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/module/:id', async (req, res) => {
    try {
        const db = readDB();
        const item = db.modules.find(m => m.id === req.params.id);
        if(item && item.mongoId) {
            await Module.findByIdAndDelete(item.mongoId);
        }
        db.modules = db.modules.filter(m => m.id!== req.params.id);
        writeDB(db);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// SHOP APIs
app.put('/api/admin/shop/:id', async (req, res) => {
    try {
        const db = readDB();
        const idx = db.shops.findIndex(s => s.id === req.params.id);
        if(idx!== -1) {
            db.shops[idx] = {...db.shops[idx],...req.body };
            writeDB(db);
            if(db.shops[idx].mongoId) {
                await Shop.findByIdAndUpdate(db.shops[idx].mongoId, req.body);
            }
            res.json({ success: true, data: db.shops[idx] });
        } else {
            res.status(404).json({ error: 'Not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/shop', async (req, res) => {
    try {
        const db = readDB();
        const newItem = {
            id: 's-' + Date.now(),
            status: true,
            priority: db.shops.length + 1,
            range: 5000,
            banner: '',
            bannerApproved: false,
           ...req.body
        };
        const mongoItem = new Shop(newItem);
        await mongoItem.save();
        newItem.mongoId = mongoItem._id.toString();
        db.shops.push(newItem);
        writeDB(db);
        res.json({ success: true, data: newItem });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

<<<<<<< HEAD
// MULTER ERROR HANDLER - YE EK HI BAAR
=======
// MULTER ERROR HANDLER - SABSE END ME
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size too large. Max 10MB allowed' });
        }
        return res.status(400).json({ error: err.message });
    }
    if (err) {
        console.error('Server Error:', err);
        return res.status(500).json({ error: err.message });
    }
    next();
});
// Static files - Public folder serve kar - YE SABSE UPAR RAKHNA ROUTES SE
app.use(express.static(path.join(__dirname, 'public')));





app.use('/api/market', require('./routes/market'));
app.use('/api/area-managers', require('./routes/area-manager'));
app.use('/api', require('./routes/userAddresses'));
app.use('/api', require('./routes/userPayments'));
app.use('/api', require('./routes/wishlist'));
app.use('/api', require('./routes/orders'));
app.use('/api', require('./routes/notifications'));
app.use('/api', require('./routes/shop'));

// Baki saare API routes yahan...

// MULTER ERROR HANDLER
>>>>>>> 2d3e18a0f18e3ddaf12aaa7b75b660841505429a
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size too large. Max 10MB allowed' });
        }
        return res.status(400).json({ error: err.message });
    }
    if (err) {
        console.error('Server Error:', err);
        return res.status(500).json({ error: err.message });
    }
    next();
});

// 404 HANDLER - API KE LIYE
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'API route not found',
        path: req.originalUrl
    });
});

// HTML FILES KE LIYE - SPA FALLBACK
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-panel', 'index.html'));
});

// Server start
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} 🚀`);
});

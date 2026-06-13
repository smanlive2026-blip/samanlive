require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const multer = require('multer');

// MULTER AB YAHAN SE AAYEGA
const { managerUpload, upload } = require('./middleware/upload');
const app = express();
const PORT = process.env.PORT || 3000;

// MONGODB CONNECTION
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB Connected ✅'))
.catch(err => console.log('MongoDB Error:', err));

// ========================================
// MODELS REQUIRE KAR - models/Shop.js USE KARENGE
// ========================================
const Shop = require('./models/Shop');
const Manager = require('./models/Manager');
const Content = require('./models/Content');
const Setting = require('./models/Setting');
const ShopHistory = require('./models/ShopHistory');

// ========================================
// MONGOOSE SCHEMAS - Shop.js ALAG FILE ME HAI
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
    footerText: String,
    footerColor: String,
    footerAbout: String,
    footerLinks: Array,
    facebook: String,
    instagram: String,
    twitter: String,
    youtube: String
}, { timestamps: true });

// USER SCHEMA - PURA RAHEGA
const addressSchema = new mongoose.Schema({
    type: { type: String, enum: ['Home', 'Work', 'Other'], default: 'Home' },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }
    }
});

const paymentSchema = new mongoose.Schema({
    type: { type: String, enum: ['upi', 'card', 'wallet'], required: true },
    name: String,
    upiId: String,
    cardLast4: String,
    cardExpiry: String,
    walletType: String,
    phone: String,
    isDefault: { type: Boolean, default: false }
});

const notificationSchema = new mongoose.Schema({
    type: { type: String, enum: ['order', 'promo', 'shop', 'system'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    actionUrl: String,
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

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
    addresses: [addressSchema],
    payments: [paymentSchema],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    notifications: [notificationSchema],
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

userSchema.index({ 'addresses.location': '2dsphere' });

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

// MODELS COMPILE KAR
const Module = mongoose.models.Module || mongoose.model('Module', moduleSchema);
const Ad = mongoose.models.Ad || mongoose.model('Ad', adSchema);
const Video = mongoose.models.Video || mongoose.model('Video', videoSchema);
const Campaign = mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema);
const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

// LOGO UPLOAD KE LIYE - ye rahega
const uploadLogo = require('multer')({ dest: 'public/logos/' });
let CURRENT_LOGO = 'public/logos/default.png';

if (!fs.existsSync('public/logos')) fs.mkdirSync('public/logos', { recursive: true });
if (!fs.existsSync(CURRENT_LOGO)) {
    fs.writeFileSync(CURRENT_LOGO, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64'));
}

const dbPath = path.join(__dirname, './database/modules.json');

// BODY PARSER LIMIT BADHA DI - 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create uploads folder if not exists
const uploadsDir = path.join(__dirname, 'public/uploads/managers');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads/managers folder');
}

// Static files - Public folder serve kar
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
// ROUTES CONNECT KARO - ADMIN ROUTER YAHAN LAGA
// ========================================
const adminRoutes = require('./routes/adminRoutes');
app.use('/api', adminRoutes);

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

// Video upload API - CONTENT PAGE KE LIYE
app.post('/api/upload/video', authenticateToken, managerUpload.single('video'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No video uploaded' });
        const url = '/uploads/managers/' + req.file.filename;
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

// USER AUTH ROUTES - PURA RAKHA HAI
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

// ROUTES FILES
app.use('/api/market', require('./routes/market'));
app.use('/api/area-managers', require('./routes/area-manager'));
app.use('/api', require('./routes/userAddresses'));
app.use('/api', require('./routes/userPayments'));
app.use('/api', require('./routes/wishlist'));
app.use('/api', require('./routes/orders'));
app.use('/api', require('./routes/notifications'));
app.use('/api', require('./routes/shop'));

// CONTENT APIs
app.get('/api/content', async (req, res) => {
    try {
        const content = await Content.find().sort({ createdAt: -1 });
        res.json(content);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/content', async (req, res) => {
    try {
        const content = await Content.create(req.body);
        res.json(content);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/content/:id', async (req, res) => {
    try {
        const content = await Content.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!content) return res.status(404).json({ error: 'Content nahi mila' });
        res.json(content);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/content/:id', async (req, res) => {
    try {
        const content = await Content.findByIdAndDelete(req.params.id);
        if (!content) return res.status(404).json({ error: 'Content nahi mila' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ❌ PURANE MANAGER ROUTES DELETE KAR DIYE - AB ROUTER ME HAI

app.get('/api/area-manager/verify-token', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ error: 'Token required' });
        const manager = await Manager.findOne({ loginToken: token, status: true });
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
    const db = readDB();
    const idx = db.modules.findIndex(m => m.id === req.params.id);
    if(idx!== -1) {
        db.modules[idx] = {...db.modules[idx],...req.body };
        writeDB(db);
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
        categories: [],
   ...req.body
    };
    try {
        const mongoItem = new Module(newItem);
        await mongoItem.save();
        newItem.mongoId = mongoItem._id.toString();
    } catch(e) { console.log('MongoDB save failed:', e.message); }
    db.modules.push(newItem);
    writeDB(db);
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

// AD APIs
app.put('/api/admin/ad/:id', async (req, res) => {
    const db = readDB();
    const idx = db.ads.findIndex(a => a.id === req.params.id);
    if(idx!== -1) {
        db.ads[idx] = {...db.ads[idx],...req.body };
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

// VIDEO APIs
app.put('/api/admin/video/:id', async (req, res) => {
    const db = readDB();
    const idx = db.videos.findIndex(v => v.id === req.params.id);
    if(idx!== -1) {
        db.videos[idx] = {...db.videos[idx],...req.body };
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
    } catch(e) {
        console.log('MongoDB save failed:', e.message);
    }
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

// CAMPAIGN APIs
app.put('/api/admin/campaign/:id', async (req, res) => {
    const db = readDB();
    const idx = db.campaigns.findIndex(c => c.id === req.params.id);
    if(idx!== -1) {
        db.campaigns[idx] = {...db.campaigns[idx],...req.body };
        writeDB(db);
        try {
            if(db.campaigns[idx].mongoId) await Campaign.findByIdAndUpdate(db.campaigns[idx].mongoId, req.body);
        } catch(e) {
            console.log('MongoDB update failed:', e.message);
        }
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
    } catch(e) {
        console.log('MongoDB save failed:', e.message);
    }
    db.campaigns.push(newItem);
    writeDB(db);
    res.json({ success: true, data: newItem });
});

app.delete('/api/admin/campaign/:id', async (req, res) => {
    const db = readDB();
    const item = db.campaigns.find(c => c.id === req.params.id);
    if(item && item.mongoId) {
        try {
            await Campaign.findByIdAndDelete(item.mongoId);
        } catch(e) {
            console.log('MongoDB delete failed:', e.message);
        }
    }
    db.campaigns = db.campaigns.filter(c => c.id!== req.params.id);
    writeDB(db);
    res.json({ success: true });
});

// SHOP APIs
app.put('/api/admin/shop/:id', async (req, res) => {
    const db = readDB();
    const idx = db.shops.findIndex(s => s.id === req.params.id);
    if(idx!== -1) {
        db.shops[idx] = {...db.shops[idx],...req.body };
        writeDB(db);
        try {
            if(db.shops[idx].mongoId) {
                await Shop.findByIdAndUpdate(db.shops[idx].mongoId, req.body);
            }
        } catch(e) {
            console.log('MongoDB update failed:', e.message);
        }
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
        bannerApproved: false,
   ...req.body
    };
    try {
        const mongoItem = new Shop(newItem);
        await mongoItem.save();
        newItem.mongoId = mongoItem._id.toString();
        console.log('Shop saved to MongoDB:', newItem.name);
    } catch(e) {
        console.log('MongoDB save failed:', e.message);
    }
    db.shops.push(newItem);
    writeDB(db);
    res.json({ success: true, data: newItem });
});

// 404 ke liye - SPA fallback
app.get('*', (req, res) => {
    const file404 = path.join(__dirname, 'public/404.html');
    if (fs.existsSync(file404)) {
        res.status(404).sendFile(file404);
    } else {
        res.status(404).json({ error: 'Page not found', path: req.originalUrl });
    }
});

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

// 404 HANDLER SIRF API KE LIYE - YE CHANGE HAI
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        error: 'API route not found',
        path: req.originalUrl 
    });
});

// HTML FILES KE LIYE - Ye add kar
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-panel', 'index.html'));
});

// Server start - SIRF 1 BAAR
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} 🚀`);
});

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
// MODELS REQUIRE KAR - models/Shop.js USE KARENGE
// ========================================
const Shop = require('./models/Shop');

// ========================================
// NAYA ADD - admin-server.js wale Models Import
// ========================================
const Manager = require('./models/Manager');
const Content = require('./models/Content');
const Setting = require('./models/Setting');

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
    categories: Array // ← NAYA ADD - admin-server.js ke liye
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
    footerColor: String, // ← NAYA ADD
    footerAbout: String, // ← NAYA ADD
    footerLinks: Array, // ← NAYA ADD
    facebook: String, // ← NAYA ADD
    instagram: String, // ← NAYA ADD
    twitter: String, // ← NAYA ADD
    youtube: String // ← NAYA ADD
}, { timestamps: true });

// USER SCHEMA - UPDATE KAR SIRF YE ADD KARNA HAI
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
    // NAYA ADD KAR - PROFILE PAGES KE LIYE
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

// PRODUCT SCHEMA - NAYA ADD KAR WISHLIST KE LIYE
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

// BAAKI TERA PURANA CODE SAME RAHEGA...
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

// NAYA ADD - admin-server.js wala logo upload
const uploadLogo = multer({ dest: 'public/logos/' });
let CURRENT_LOGO = 'public/logos/default.png';

// Default logo banao agar nahi hai
if (!fs.existsSync('public/logos')) fs.mkdirSync('public/logos', { recursive: true });
if (!fs.existsSync(CURRENT_LOGO)) {
    fs.writeFileSync(CURRENT_LOGO, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64'));
}

const dbPath = path.join(__dirname, './database/modules.json');

// Static files
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/admin-panel', express.static(path.join(__dirname, '../public/admin-panel')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB Helpers - SAME
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

// AUTH MIDDLEWARE - SAME
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

// GENERATE USER ID - SAME
async function generateUserId() {
    const count = await User.countDocuments();
    return `USER${String(count + 1).padStart(3, '0')}`;
}

// LOCATION HELPERS - SAME
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
// NAYA ADD - ADMIN DASHBOARD STATS API
// ========================================
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

// ========================================
// NAYA ADD - SETTINGS API MONGODB WALA
// ========================================
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

// USER AUTH ROUTES - SAME
app.post('/api/auth/login-phone', async (req, res) => {
    try {
        const { phone, name } = req.body;
        if (!phone ||!name) return res.status(400).json({ error: 'Phone and name required' });

        let user = await User.findOne({ phone });

        if (!user) {
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

// SHOP CREATION BY USER - SAME
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
            status: false,
            ownerId: req.user.userId,
            bannerApproved: false // NAYA ADD - Banner default pending
        });

        await shop.save();

        user.hasShop = true;
        await user.save();

        res.json({ success: true, shop });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// PUBLIC APIs - SAME
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

// ========================================
// NAYA ADD - PUBLIC SHOPS API FOR USER PANEL
// Area wise + sirf approved banners dikhenge
// ========================================
app.get('/api/public/shops', async (req, res) => {
    try {
        const { lat, lng, area } = req.query;
        let query = { status: true };

        // Agar area diya hai to filter karo
        if (area) {
            query.area = area;
        }

        let shops = await Shop.find(query).lean();

        // Sirf approved banner wali shop ka banner dikhao
        shops = shops.map(shop => {
            if (!shop.bannerApproved) {
                shop.banner = ''; // Pending banner hide kar do
            }
            return shop;
        });

        // Location wise sort agar lat/lng hai
        if (lat && lng) {
            shops = shops.map(s => {
                if (s.lat && s.lng) {
                    const dist = getDistance(parseFloat(lat), parseFloat(lng), s.lat, s.lng);
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

// MARKET API ROUTE
app.use('/api/market', require('./routes/market'));
// AREA MANAGER API ROUTE
app.use('/api/area-manager', require('./routes/area-manager'));

// ========================================
// NAYI PROFILE ROUTES - SIRF YE ADD KAR
// ========================================
app.use('/api', require('./routes/userAddresses'));
app.use('/api', require('./routes/userPayments'));
app.use('/api', require('./routes/wishlist'));
app.use('/api', require('./routes/orders'));
app.use('/api', require('./routes/notifications'));
app.use('/api', require('./routes/shop'));

// ========================================
// NAYA ADD - CONTENT API MONGODB WALA
// ========================================
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

// ========================================
// NAYA ADD - MANAGERS API MONGODB WALA - UPDATED
// ========================================
app.get('/api/managers', async (req, res) => {
    try {
        const managers = await Manager.find().select('-password');
        res.json(managers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// NAYA - ADMIN PANEL SE MANAGER BANANE KA API
app.post('/api/admin/create-manager', async (req, res) => {
    try {
        const { name, email, phone, area, serviceCharge, documents } = req.body;

        // Check agar email already exist karta hai
        const existing = await Manager.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Auto generate password
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Unique login token generate
        const loginToken = Math.random().toString(36).substring(2) + Date.now().toString(36);

        const manager = await Manager.create({
            name,
            email,
            phone,
            password: hashedPassword,
            area: area || '',
            serviceCharge: serviceCharge || 5,
            documents: documents || {},
            loginToken,
            status: true
        });

        // Login link banao
        const loginLink = `${req.protocol}://${req.get('host')}/area-manager?token=${loginToken}`;

        res.json({
            success: true,
            manager: {...manager.toObject(), password: undefined },
            tempPassword,
            loginLink
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// NAYA - BANNER APPROVE API
app.put('/api/admin/approve-banner/:shopId', async (req, res) => {
    try {
        const shop = await Shop.findByIdAndUpdate(
            req.params.shopId,
            { bannerApproved: true },
            { new: true }
        );
        if (!shop) return res.status(404).json({ error: 'Shop nahi mili' });
        res.json({ success: true, shop });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// NAYA - BANNER REJECT API
app.put('/api/admin/reject-banner/:shopId', async (req, res) => {
    try {
        const shop = await Shop.findByIdAndUpdate(
            req.params.shopId,
            { bannerApproved: false, banner: '' },
            { new: true }
        );
        if (!shop) return res.status(404).json({ error: 'Shop nahi mili' });
        res.json({ success: true, shop });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/managers', async (req, res) => {
    try {
        if (req.body.password) {
            req.body.password = await bcrypt.hash(req.body.password, 10);
        }
        req.body.loginToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
        const manager = await Manager.create(req.body);
        res.json(manager);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/managers/:id', async (req, res) => {
    try {
        if (req.body.password) {
            req.body.password = await bcrypt.hash(req.body.password, 10);
        }
        const manager = await Manager.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!manager) return res.status(404).json({ error: 'Manager nahi mila' });
        res.json(manager);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/managers/:id', async (req, res) => {
    try {
        const manager = await Manager.findByIdAndDelete(req.params.id);
        if (!manager) return res.status(404).json({ error: 'Manager nahi mila' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// ⭐⭐ NAYA ADD KIYA HAI - YAHAN PASTE KIYA ⭐⭐
// ADMIN SHOPS API - Pending Banners ke liye
// ========================================
app.get('/api/admin/shops', async (req, res) => {
    try {
        let query = {};
        // Agar bannerPending=true hai to sirf unapproved banners wali shop
        if (req.query.bannerPending === 'true') {
            query.banner = { $ne: '' }; // Banner laga hua hai
            query.bannerApproved = false; // But approved nahi hai
        }
        const shops = await Shop.find(query).populate('managerId', 'name email area');
        res.json({ success: true, shops });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ADMIN APIs - SAME RAHEGA TERA PURANA
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

app.put('/api/admin/module/:id', async (req, res) => {
    const db = readDB();
    const idx = db.modules.findIndex(m => m.id === req.params.id);
    if(idx!== -1) {
        db.modules[idx] = {...db.modules[idx],...req.body};
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
        categories: [], // ← NAYA ADD
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

app.put('/api/admin/shop/:id', async (req, res) => {
    const db = readDB();
    const idx = db.shops.findIndex(s => s.id === req.params.id);
    if(idx!== -1) {
        db.shops[idx] = {...db.shops[idx],...req.body};
        writeDB(db);
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
        bannerApproved: false, // NAYA ADD - Default pending
...req.body
    };
    try {
        const mongoItem = new Shop(newItem);
        await mongoItem.save();
        newItem.mongoId = mongoItem._id.toString();
        console.log('Shop saved to MongoDB:', newItem.name);
    } catch(e) { console.log('MongoDB save failed:', e.message); }

    db.shops.push(newItem);
    writeDB(db);
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

app.get('/api/admin/areaManager', (req, res) => {
    const db = readDB();
    res.json(db.areaManagers || []);
});

app.post('/api/admin/areaManager', async (req, res) => {
    const db = readDB();
    const { password,...restData } = req.body;

    const hashedPassword = password? await bcrypt.hash(password, 10) : '';

    const newManager = {
        id: 'am-' + Date.now(),
...restData,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        status: restData.status!== undefined? restData.status : true
    };

    if (!db.areaManagers) db.areaManagers = [];
    db.areaManagers.push(newManager);
    writeDB(db);

    const { password: _,...managerWithoutPassword } = newManager;
    res.json({ success: true, data: managerWithoutPassword });
});

app.put('/api/admin/areaManager/:id', async (req, res) => {
    const db = readDB();
    if (!db.areaManagers) db.areaManagers = [];

    const idx = db.areaManagers.findIndex(m => m.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Manager not found' });

    const { password,...restData } = req.body;
    const updateData = {...db.areaManagers[idx],...restData };

    if (password && password.trim()!== '') {
        updateData.password = await bcrypt.hash(password, 10);
    }

    db.areaManagers[idx] = updateData;
    writeDB(db);

    const { password: _,...managerWithoutPassword } = updateData;
    res.json({ success: true, data: managerWithoutPassword });
});

app.delete('/api/admin/areaManager/:id', (req, res) => {
    const db = readDB();
    if (!db.areaManagers) db.areaManagers = [];

    db.areaManagers = db.areaManagers.filter(m => m.id!== req.params.id);
    writeDB(db);
    res.json({ success: true });
});

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

app.post('/api/admin/upload', upload.single('file'), (req, res) => {
    res.json({ success: true, url: `/uploads/${req.file.filename}` });
});

// NAYA ADD - VIDEO UPLOAD API
const videoUpload = multer({ dest: 'public/uploads/videos/' });
app.post('/api/upload/video', videoUpload.single('video'), (req, res) => {
    try {
        const url = `/uploads/videos/${req.file.filename}`;
        res.json({ url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// LOGO UPLOAD API - NAYA ADD
app.post('/api/upload/logo', uploadLogo.single('logo'), (req, res) => {
    try {
        CURRENT_LOGO = req.file.path.replace(/\\/g, '/');
        const url = `/${CURRENT_LOGO}`;
        res.json({ success: true, url });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

// ========================================
// MODULE DETAIL & AREA/CATEGORY APIS - admin-server.js se
// ========================================

// 1. GET SINGLE MODULE WITH CATEGORIES
app.get('/api/admin/module/:id', async (req, res) => {
    try {
        const db = readDB();
        const module = db.modules.find(m => m.id === req.params.id);

        if (!module) return res.status(404).json({ error: 'Module nahi mila' });

        if (!module.categories) module.categories = [];
        if (!module.areas) module.areas = [];

        res.json({ success: true, module, areas: db.areas || [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. UPDATE MODULE AREAS - Module Area tab se save hoga
app.put('/api/admin/module/:id/areas', async (req, res) => {
    try {
        const db = readDB();
        const idx = db.modules.findIndex(m => m.id === req.params.id);

        if (idx === -1) return res.status(404).json({ error: 'Module nahi mila' });

        db.modules[idx].areas = req.body.areas || [];
        writeDB(db);

        try {
            if (db.modules[idx].mongoId) {
                await Module.findByIdAndUpdate(db.modules[idx].mongoId, { areas: req.body.areas });
            }
        } catch(e) { console.log('MongoDB skip:', e.message); }

        res.json({ success: true, data: db.modules[idx] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. ADD CATEGORY IN MODULE
app.post('/api/admin/module/:id/category', async (req, res) => {
    try {
        const db = readDB();
        const idx = db.modules.findIndex(m => m.id === req.params.id);

        if (idx === -1) return res.status(404).json({ error: 'Module nahi mila' });

        if (!db.modules[idx].categories) db.modules[idx].categories = [];

        const newCat = {
            id: req.body.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
            name: req.body.name,
            icon: req.body.icon || '📦',
            color: req.body.color || '#10b981',
            group: req.body.group || 'General',
            status: req.body.status!== undefined? req.body.status : true,
            areas: req.body.areas || []
        };

        db.modules[idx].categories.push(newCat);
        writeDB(db);

        try {
            if (db.modules[idx].mongoId) {
                await Module.findByIdAndUpdate(db.modules[idx].mongoId, {
                    categories: db.modules[idx].categories
                });
            }
        } catch(e) { console.log('MongoDB skip:', e.message); }

        res.json({ success: true, data: newCat });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. UPDATE CATEGORY - Area toggle ke liye
app.put('/api/admin/module/:id/category/:catId', async (req, res) => {
    try {
        const db = readDB();
        const modIdx = db.modules.findIndex(m => m.id === req.params.id);

        if (modIdx === -1) return res.status(404).json({ error: 'Module nahi mila' });

        const catIdx = db.modules[modIdx].categories.findIndex(c => c.id === req.params.catId);
        if (catIdx === -1) return res.status(404).json({ error: 'Category nahi mili' });

        db.modules[modIdx].categories[catIdx] = {
   ...db.modules[modIdx].categories[catIdx],
   ...req.body
        };

        writeDB(db);

        try {
            if (db.modules[modIdx].mongoId) {
                await Module.findByIdAndUpdate(db.modules[modIdx].mongoId, {
                    categories: db.modules[modIdx].categories
                });
            }
        } catch(e) { console.log('MongoDB skip:', e.message); }

        res.json({ success: true, data: db.modules[modIdx].categories[catIdx] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. DELETE CATEGORY
app.delete('/api/admin/module/:id/category/:catId', async (req, res) => {
    try {
        const db = readDB();
        const modIdx = db.modules.findIndex(m => m.id === req.params.id);

        if (modIdx === -1) return res.status(404).json({ error: 'Module nahi mila' });

        db.modules[modIdx].categories = db.modules[modIdx].categories.filter(c => c.id!== req.params.catId);
        writeDB(db);

        try {
            if (db.modules[modIdx].mongoId) {
                await Module.findByIdAndUpdate(db.modules[modIdx].mongoId, {
                    categories: db.modules[modIdx].categories
                });
            }
        } catch(e) { console.log('MongoDB skip:', e.message); }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ NAYA ADMIN PANEL ROUTES
app.get('/admin-panel', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin-panel/index.html'));
});

app.get('/admin-panel/:page', (req, res) => {
    const page = req.params.page;
    const allowedPages = ['modules', 'content', 'shops', 'managers', 'qr-batch'];
    if (allowedPages.includes(page)) {
        res.sendFile(path.join(__dirname, `../public/admin-panel/${page}.html`));
    } else {
        res.status(404).send('Page not found');
    }
});

// Purana /admin redirect kar de naya pe
app.get('/admin', (req, res) => {
    res.redirect('/admin-panel');
});

app.get('/area-manager', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/area-manager.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

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

const managerRoutes = require('./routes/managerRoutes');
app.use(managerRoutes);

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
    console.log('✅ SAMANLIVE Server: http://localhost:' + PORT);
    console.log('🔧 Admin Panel: http://localhost:' + PORT + '/admin-panel');
    console.log('👨‍💼 Area Manager: http://localhost:' + PORT + '/area-manager');
    console.log('📁 Serving: ' + path.join(__dirname, '../public'));
});
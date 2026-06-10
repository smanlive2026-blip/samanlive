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
app.use('/api/area-managers', require('./routes/area-manager'));

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
        const { name, email, phone, area, serviceCharge, documents, moduleAccess } = req.body;

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
            moduleAccess: moduleAccess || [],
            loginToken,
            status: true,
            tempPassword
        });

        // Login link banao
        const loginLink = `${req.protocol}://${req.get('host')}/area-manager.html?token=${loginToken}`;

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

// NAYA - AREA MANAGER TOKEN LOGIN VERIFY
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

        res.json({ success: true, token: jwtToken, manager: {...manager.toObject(), password: undefined} });
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
// ⭐⭐ YE 2 ROUTE MISSING THE - AB ADD KIYE ⭐⭐
// ========================================

// 1. PENDING BANNERS API - managers.html ke liye
app.get('/api/admin/pending-banners', async (req, res) => {
    try {
        const shops = await Shop.find({
            banner: { $ne: '' },
            bannerApproved: false
        }).populate('managerId', 'name email area');
        res.json({ success: true, shops });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. MANAGER ACTIVITY HISTORY API - managers.html ke liye
app.get('/api/admin/shop-history', async (req, res) => {
    try {
        const shops = await Shop.find({}).populate('managerId', 'name email area');

        const history = [];
        shops.forEach(shop => {
            if (shop.history && shop.history.length > 0) {
                shop.history.forEach(h => {
                    history.push({
                    ...h.toObject(),
                        shopName: shop.name,
                        area: shop.area,
                        managerId: shop.managerId
                    });
                });
            }
        });

        history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({ success: true, history });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========================================
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
    } catch(e) { // ← YE CATCH MISSING THA - AB ADD KAR DIYA
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

app.put('/api/admin/campaign/:id', async (req, res) => {
    const db = readDB();
    const idx = db.campaigns.findIndex(c => c.id === req.params.id);
    if(idx!== -1) {
        db.campaigns[idx] = {...db.campaigns[idx],...req.body};
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

// Static files serve karo
app.use(express.static(path.join(__dirname, '../public')));

// 404 ke liye
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/404.html'));
});
// ========================================
// NAYA ADD - AREA MANAGER DASHBOARD APIs
// ========================================

// AREA MANAGER AUTH MIDDLEWARE
function authenticateManager(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied' });

    jwt.verify(token, process.env.JWT_SECRET || 'samanlive_secret_key', (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        if (!user.managerId) return res.status(403).json({ error: 'Not a manager token' });
        req.manager = user;
        next();
    });
}

// AREA MANAGER KA DASHBOARD DATA
app.get('/api/manager/dashboard', authenticateManager, async (req, res) => {
    try {
        const manager = await Manager.findById(req.manager.managerId);
        if (!manager) return res.status(404).json({ error: 'Manager not found' });

        // Manager ke area ki shops
        const totalShops = await Shop.countDocuments({ area: manager.area });
        const activeShops = await Shop.countDocuments({ area: manager.area, status: true });
        const pendingBanners = await Shop.countDocuments({
            area: manager.area,
            banner: { $ne: '' },
            bannerApproved: false
        });

        // Manager ke area ke modules count
        const modules = await Module.countDocuments();

        res.json({
            success: true,
            stats: {
                totalShops,
                activeShops,
                pendingBanners,
                modules
            },
            manager: {
                name: manager.name,
                email: manager.email,
                area: manager.area,
                serviceCharge: manager.serviceCharge
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// AREA MANAGER KI SHOPS
app.get('/api/manager/shops', authenticateManager, async (req, res) => {
    try {
        const manager = await Manager.findById(req.manager.managerId);
        if (!manager) return res.status(404).json({ error: 'Manager not found' });

        const shops = await Shop.find({ area: manager.area }).sort({ createdAt: -1 });
        res.json({ success: true, shops });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// AREA MANAGER KI SHOPS
app.get('/api/manager/shops', authenticateManager, async (req, res) => {
    try {
        const manager = await Manager.findById(req.manager.managerId);
        if (!manager) return res.status(404).json({ error: 'Manager not found' });

        const shops = await Shop.find({ area: manager.area }).sort({ createdAt: -1 });
        res.json({ success: true, shops });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Server start
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} 🚀`);
});
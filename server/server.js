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

const dbPath = path.join(__dirname, './database/modules.json');

// Static files
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/qr_output', express.static(path.join(__dirname, './qr_output')));
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
            ownerId: req.user.userId
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

// ADMIN APIs - SAME RAHEGA TERA PURANA
app.get('/api/admin/data', (req, res) => {
    res.json(readDB());
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

const { exec } = require('child_process');
const QR_CURRENT_LOGO = 'public/logos/qr_logo.png';

app.post('/api/generate-qr', (req, res) => {
    const { manager_id, product_name, batch, mfg_date, quantity, qr_size_mm } = req.body;
    const logoPath = fs.existsSync(QR_CURRENT_LOGO)? QR_CURRENT_LOGO : 'public/logos/default.png';
    const cmd = `node generate-qr-batch.js "${manager_id}" "${product_name}" "${batch}" "${mfg_date}" ${quantity} ${qr_size_mm} "${logoPath}"`;

    console.log('Running QR Gen:', cmd);
    exec(cmd, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ success: false, error: stderr || error.message });
        const match = stdout.match(/Folder: (.*)/);
        const outputDir = match? match[1].trim() : null;
        res.json({ success: true, log: stdout, outputDir });
    });
});

app.post('/api/make-qr-pdf', (req, res) => {
    const { folderPath } = req.body;
    const cmd = `node make-pdf.js "${folderPath}"`;

    exec(cmd, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ success: false, error: stderr || error.message });
        res.json({ success: true, log: stdout });
    });
});

app.post('/api/upload-qr-logo', upload.single('logo'), (req, res) => {
    const destPath = path.join(__dirname, '../public/logos/qr_logo.png');
    fs.renameSync(req.file.path, destPath);
    res.json({ success: true, logoPath: 'logos/qr_logo.png' });
});

app.get('/api/qr-batches', (req, res) => {
    const dir = path.join(__dirname, './qr_output');
    if (!fs.existsSync(dir)) return res.json([]);

    const batches = fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isDirectory()).map(folder => {
        const folderPath = path.join(dir, folder);
        const infoPath = path.join(folderPath, 'batch_info.json');
        const pdf1 = path.join(folderPath, '1_ID_LAYER.pdf');
        const pdf2 = path.join(folderPath, '2_QR_LAYER.pdf');

        return {
            name: folder,
            path: folderPath,
            info: fs.existsSync(infoPath)? JSON.parse(fs.readFileSync(infoPath)) : null,
            pdf1: fs.existsSync(pdf1)? path.relative(path.join(__dirname, '.'), pdf1).replace(/\\/g, '/') : null,
            pdf2: fs.existsSync(pdf2)? path.relative(path.join(__dirname, '.'), pdf2).replace(/\\/g, '/') : null
        };
    }).reverse();
    res.json(batches);
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
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
    console.log('🔧 Admin Panel: http://localhost:' + PORT + '/admin');
    console.log('👨‍💼 Area Manager: http://localhost:' + PORT + '/area-manager');
    console.log('📁 Serving: ' + path.join(__dirname, '../public'));
});
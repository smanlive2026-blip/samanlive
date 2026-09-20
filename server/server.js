/**
 * ====================================================================================
 * SAMANLIVE - MAIN SERVER FILE
 * Project: 3 Mahine ka kaam, 70+ Shop Templates
 * ====================================================================================
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const compression = require('compression'); // Response ko compress karta hai - site tez khulti hai
const fs = require('fs');
require('dotenv').config();
const cloudinary = require('./utils/cloudinary'); // Image upload ke liye
const uploadRoutes = require('./routes/upload');
const deliveryManagerRoutes = require('./routes/deliveryManager'); 
const app = express();
const PORT = process.env.PORT || 3000;

// --- SHOP KE ALAG-ALAG ROUTES ---
const orderRoutes = require('./routes/orders'); // Sab orders ka common route
const fruitItemRoutes = require('./routes/fruit-item'); // Fruit shop ka item add/edit
const acharRoutes = require('./routes/shops/achar-route'); // Achar shop ka alag logic
const autoRoutes = require('./routes/shops/auto'); // Auto / garage shop
const productRoutes = require('./routes/product.routes'); // Common product CRUD
const settingsRoutes = require('./routes/settings.routes'); // Admin banner/settings

// ==================== MIDDLEWARE ====================
// Ye sab har request se pehle chalta hai
app.use(compression({ level: 6 })); // GZIP - 70 templates ko halka karta hai
app.use(cors()); // Frontend ko API access deta hai
app.use(express.json({ limit: '50mb' })); // Badi image JSON me aaye to
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ==================== SHOP TEMPLATE & DASHBOARD ROUTES ====================
// NOTE: Yahi wo jagah hai jaha 60-70 shop templates ke dashboard connect hote hain
// public/shop-templates/ me har folder = ek dukaan ka design
// Ex: /shop-templates/kirana/dashboard.html, /fruit/dashboard.html, /cloth/dashboard.html etc

app.use('/api', deliveryManagerRoutes); // /api/manager/create-delivery-manager - Delivery boy banane ka

// --- FRUIT SHOP TEMPLATE ---
// File: public/shop-templates/fruit/dashboard.html + dashboard.js
// Kaam: Fruit ka stock, price, offer manage
app.use('/api/shops', fruitItemRoutes); 

const shopViewRoutes = require('./routes/shopViewRoutes'); // Shop ko customer kaise dekhega
app.use('/api/shop-view', shopViewRoutes);  // Customer view API - purana wala, rakha hua hai backup ke liye
app.use('/api/shop-view', require('./routes/shopViewRoutes'));  // Naya wala - same kaam
app.use('/api/shop', require('./routes/shopViewRoutes')); // Admin panel se shop dekhne ke liye
app.use('/api/shops/auto', require('./routes/shops/auto')); // Auto shop customer view

// --- SHOP DASHBOARD KA MAIN ROUTE ---
// File: /shop/:id/dashboard -> yaha se decide hota hai kaunsa template khulna hai
// public/shop-templates/ me se folder pick karta hai shopType ke hisab se
app.use('/shop', require('./routes/shopViewRoutes')); 

// --- ACHAR SHOP TEMPLATE ---
// File: public/shop-templates/achar-shop/dashboard.html + quick-add-products.js
// Kaam: Achar ke 20-30 flavour ka quick add
app.use('/api/shops/auto', autoRoutes);
app.use('/api/shops/achar', acharRoutes);

// --- MEDIA & LOGOS ---
// File: public/assets/, public/logos/samanlive-*.svg
app.use('/api/media', require('./routes/media'));

// --- FURNITURE SHOP TEMPLATE ---
// File: public/shop-templates/furniture/dashboard.html + product-library.html + banner.html
// Kaam: Bada product, photo zyada, isliye alag route
app.use('/api/shops/furniture', require('./routes/shops/furniture-route'));

// --- GENERIC SHOP ROUTE (SAB SHOPS KA BAAP) ---
// File: server/routes/shopRoutes.js
// Kaam: Baaki bache 50+ templates (bakery, bartan, battery, beauty, kirana, medical etc) isi se chalte hain
// Agar koi specific route upar match nahi hua to ye pakad leta hai
app.use('/api/shops', require('./routes/shopRoutes'));

// --- SPORTS, KIRANA SHOP TEMPLATE ---
// File: public/shop-templates/sports/dashboard.html, kirana/dashboard.html
// Kirana = sabse zyada use hota hai, isliye iska product-form.html alag hai
app.use('/api/shops/sports', require('./routes/shops/sports-route'));
app.use('/api/shops/kirana', require('./routes/shops/kirana-route'));

// --- SHOP ON/OFF TOGGLE ---
// File: public/shop-templates/common/shop-toggle.js + customer-shop-status.js
// Kaam: Dukaan khuli hai ya band - customer ko dikhana
app.use('/api/shop-toggle', require('./routes/common/shop-toggle'));

app.use('/api/products', productRoutes);
app.use('/api/admin', settingsRoutes);

// Dev me har request ka log
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    }
    next();
});

// --- SHOP WISE ORDER LIST ---
// File: Koi bhi dashboard -> Orders tab
// Kaam: Ek dukaan ke saare orders dikhana
app.get('/api/orders/shop/:shopId', async (req, res) => {
  try {
    const Order = require('./models/Order');
    const orders = await Order.find({ shopId: req.params.shopId }).sort({createdAt: -1});
    res.json({ success: true, data: orders });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

// ==================== STATIC FILES - 70+ DASHBOARDS SERVE HOTE HAIN YAHA SE ====================
// public/ = user ki site (index.html, local-market.html, nearby-shops.html)
// public/shop-templates/* = 60-70 dukaano ke alag-alag dashboard design
// public/admin-panel/* = Admin ka pura panel (shops.html, orders.html, areas.html etc)
app.use(express.static(path.join(__dirname, '../public'), { maxAge: '1d', etag: true }));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads'), { maxAge: '1d' }));
app.use('/logos', express.static(path.join(__dirname, '../public/logos'), { maxAge: '7d' }));
app.use('/videos', express.static(path.join(__dirname, '../public/videos'), { maxAge: '7d' }));
app.use('/banners', express.static(path.join(__dirname, '../public/banners'), { maxAge: '1d' }));
app.use('/api/orders', orderRoutes);
app.use('/shop-templates', express.static(path.join(__dirname, '../public/shop-templates'), { maxAge: '1d' })); // <-- 70 dashboard yaha se serve hote hain

// ==================== MONGODB CONNECT ====================
mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/samanlive', {
    maxPoolSize: 50, // Raat ko slow na ho isliye connection zyada rakhe hain
    minPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
})
.then(async () => {
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📦 Database: ${mongoose.connection.name}`);
    try {
        const Shop = require('./models/Shop');
        const pending = await Shop.countDocuments({ status: 'active' });
        if(pending > 0){
            const result = await Shop.updateMany({ status: 'active' }, { $set: { status: 'approved' } });
            console.log(`🔄 Auto-migrated ${result.modifiedCount} shops`);
        }
    } catch (err) {
        console.log('⚠️ Migration skipped:', err.message);
    }
})
.catch(err => {
    console.error('❌ MongoDB Error:', err);
    process.exit(1);
});

mongoose.connection.on('error', err => { console.error('❌ MongoDB Error:', err); });
mongoose.connection.on('disconnected', () => { console.log('⚠️ MongoDB Disconnected'); });

// ==================== API ROUTES - CORE ====================
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        mongodb: mongoose.connection.readyState === 1? 'connected' : 'disconnected',
        environment: process.env.NODE_ENV || 'development'
    });
});

app.use('/api/auth', require('./routes/auth')); // Login / Signup
app.use('/api', require('./routes/adminRoutes')); // Admin panel ke saare API
app.use('/api/manager', require('./routes/managerRoutes')); // Area Manager
app.use('/api', require('./routes/areaRoutes')); // Area / City
app.use('/api', require('./routes/market')); // Local market public API
app.use('/api', require('./routes/public-modules')); // Modules jo user ko dikhte hain
app.use('/api', require('./routes/stats')); // Dashboard ke numbers

// --- LOCATION ROUTES ---
// File: public/assets/js/location.*.js
// Kaam: Nearby shops, user location, shop location
const locationRoutes = require('./routes/location');
app.use('/api/location', locationRoutes);
app.use('/api/location', require('./routes/location'));
app.use('/api/location', require('./routes/user.location.routes'));

app.use('/api/upload', require('./routes/upload')); // Cloudinary upload
const userRoutes = require('./routes/user');
app.use('/api/user', userRoutes); // User profile, wishlist, orders
app.use('/api/admin', require('./routes/userAdmin')); // Admin user ko manage karega

// ==================== FRONTEND PAGE ROUTES ====================
// Har .html file ko serve karna

app.get('/admin', (req, res) => { res.sendFile(path.join(__dirname, '../public/admin-panel/modules.html')); });
app.get('/admin-panel', (req, res) => { res.redirect('/admin'); });
app.get('/admin/:page', (req, res) => {
    const filePath = path.join(__dirname, `../public/admin-panel/${req.params.page}.html`);
    res.sendFile(filePath, (err) => { if (err) res.sendFile(path.join(__dirname, '../public/404.html')); });
});
app.get('/module-detail.html', (req, res) => { res.sendFile(path.join(__dirname, '../public/admin-panel/module-detail.html')); });
app.get('/area-manager.html', (req, res) => { res.sendFile(path.join(__dirname, '../public/area-manager.html')); });
app.get('/area-manager/:page', (req, res) => {
    const filePath = path.join(__dirname, `../public/area-manager/${req.params.page}.html`);
    res.sendFile(filePath, (err) => { if (err) res.sendFile(path.join(__dirname, '../public/404.html')); });
});
app.get('/areas.html', (req, res) => { res.sendFile(path.join(__dirname, '../public/areas.html')); });
app.get('/area-detail.html', (req, res) => { res.sendFile(path.join(__dirname, '../public/area-detail.html')); });
app.get('/managers.html', (req, res) => { res.sendFile(path.join(__dirname, '../public/managers.html')); });
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, '../public/index.html')); });
app.get('/local-market.html', (req, res) => { res.sendFile(path.join(__dirname, '../public/local-market.html')); });

/**
 * SHOP DASHBOARD LOADER - SABSE IMPORTANT
 * URL: /shop/:id/dashboard
 * Kaam: DB se shopType nikal ke usi naam ke template folder ka dashboard.html kholta hai
 * Ex: shopType = 'Kirana' -> /shop-templates/kirana/dashboard.html
 *     shopType = 'Medical' -> /shop-templates/medical/dashboard.html
 *     60+ templates isi logic se khulte hain
 */
app.get('/shop/:id/dashboard', async (req, res) => {
    try {
        const Shop = require('./models/Shop');
        const shop = await Shop.findById(req.params.id);
        if (!shop) { return res.status(404).sendFile(path.join(__dirname, '../public/404.html')); }
        const shopTypeMap = { 'General Store': 'general', 'Kirana': 'kirana', 'Medical': 'medical', 'Restaurant': 'restaurant', 'Cloth': 'cloth', 'Furniture': 'furniture' };
        const templateFolder = shopTypeMap[shop.shopType] || shop.shopType?.toLowerCase() || 'general';
        const templatePath = path.join(__dirname, `../public/shop-templates/${templateFolder}/dashboard.html`);
        console.log(`🏪 Loading template: ${templateFolder} for shop: ${shop.shopName}`);
        res.sendFile(templatePath, (err) => {
            if (err) {
                const fallbackPath = path.join(__dirname, '../public/shop-templates/general/dashboard.html');
                res.sendFile(fallbackPath, (err2) => { if (err2) res.status(404).send('Shop template not found'); });
            }
        });
    } catch (err) {
        console.error('❌ Shop dashboard error:', err);
        res.status(500).send('Error loading shop dashboard');
    }
});

app.get('/profile.html', (req, res) => { res.sendFile(path.join(__dirname, '../public/profile.html')); });
app.get('/wishlist.html', (req, res) => { res.sendFile(path.join(__dirname, '../public/wishlist.html')); });

// ... baaki admin API docs, error handlers same rakhe hain ...

app.get('/api/admin/routes', (req, res) => {
    try {
        const allRoutes = [];
        const routesDir = path.join(__dirname, './routes');
        function scanProjectTree(dir, basePath = '') {
            const items = [];
            if (!fs.existsSync(dir)) return items;
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                const relativePath = path.join(basePath, file);
                if (stat.isDirectory()) {
                    items.push({ name: file, type: 'folder', path: relativePath, children: scanProjectTree(filePath, relativePath) });
                } else {
                    items.push({ name: file, type: 'file', path: relativePath });
                }
            });
            return items;
        }
        if (app._router && app._router.stack) {
            app._router.stack.forEach(layer => {
                if (layer.route) {
                    const path = layer.route.path;
                    const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
                    allRoutes.push({ path, methods, file: 'server.js', type: 'direct' });
                }
            });
        }
        if (fs.existsSync(routesDir)) {
            const files = fs.readdirSync(routesDir);
            files.forEach(file => {
                if (file.endsWith('.js')) {
                    const filePath = path.join(routesDir, file);
                    const content = fs.readFileSync(filePath, 'utf8');
                    const routeRegex = /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g;
                    let match;
                    while ((match = routeRegex.exec(content))!== null) {
                        const method = match[1].toUpperCase();
                        const routePath = match[2];
                        let basePath = '';
                        if (file === 'adminRoutes.js') basePath = '/api/admin';
                        else if (file === 'managerRoutes.js') basePath = '/api/manager';
                        else if (file === 'areaRoutes.js') basePath = '/api';
                        else if (file === 'shopRoutes.js') basePath = '/api/local-market';
                        else if (file === 'market.js') basePath = '/api/market';
                        else if (file === 'stats.js') basePath = '/api';
                        else if (file === 'public-modules.js') basePath = '/api';
                        else if (file === 'auth.js') basePath = '/api/auth';
                        else { const name = file.replace('Routes.js', '').replace('.js', '').toLowerCase(); basePath = `/api/${name}`; }
                        const fullPath = basePath + routePath;
                        allRoutes.push({ path: fullPath, methods: [method], file: file, type: 'file' });
                    }
                }
            });
        }
        const uniqueRoutes = [];
        const seen = new Set();
        allRoutes.forEach(r => {
            const key = `${r.methods[0]}_${r.path}`;
            if (!seen.has(key)) { seen.add(key); uniqueRoutes.push(r); }
        });
        const projectRoot = path.join(__dirname, '..');
        const projectTree = scanProjectTree(projectRoot);
        res.json({ success: true, total: uniqueRoutes.length, routes: uniqueRoutes.sort((a, b) => a.path.localeCompare(b.path)), models: mongoose.modelNames(), projectTree: projectTree });
    } catch (err) {
        console.error('API Routes Error:', err);
        res.status(500).json({ success: false, error: err.message, routes: [], models: [], projectTree: [] });
    }
});

app.post('/api/admin/get-route-code', express.json(), (req, res) => {
    try {
        const { file } = req.body;
        let filePath = file === 'server.js'? path.join(__dirname, 'server.js') : path.join(__dirname, './routes', file);
        if (!fs.existsSync(filePath)) return res.json({ success: false, error: 'File not found: ' + file });
        const fileContent = fs.readFileSync(filePath, 'utf8');
        res.json({ success: true, file: file, code: fileContent });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.post('/api/admin/update-route-code', express.json(), (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({ success: false, error: 'File editing disabled in production for security' });
        }
        const { file, code } = req.body;
        let filePath = file === 'server.js'? path.join(__dirname, 'server.js') : path.join(__dirname, './routes', file);
        const backupPath = filePath + '.backup-' + Date.now();
        fs.copyFileSync(filePath, backupPath);
        fs.writeFileSync(filePath, code);
        res.json({ success: true, message: `File ${file} updated! Server restart karo. Backup: ${path.basename(backupPath)}` });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.use((err, req, res, next) => {
    if (err.name === 'MulterError') { return res.status(400).json({ success: false, error: err.message }); }
    next(err);
});
app.get('*', (req, res) => { res.status(404).sendFile(path.join(__dirname, '../public/404.html')); });
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    if (err.name === 'ValidationError') { return res.status(400).json({ success: false, error: 'Validation Error', details: Object.values(err.errors).map(e => e.message) }); }
    if (err.code === 11000) { return res.status(400).json({ success: false, error: 'Duplicate Entry', field: Object.keys(err.keyPattern)[0] }); }
    if (err.name === 'JsonWebTokenError') { return res.status(401).json({ success: false, error: 'Invalid Token' }); }
    if (err.name === 'TokenExpiredError') { return res.status(401).json({ success: false, error: 'Token Expired' }); }
    res.status(err.status || 500).json({ success: false, error: err.message || 'Something went wrong!',...(process.env.NODE_ENV === 'development' && { stack: err.stack }) });
});
process.on('SIGINT', async () => { await mongoose.connection.close(); process.exit(0); });
process.on('SIGTERM', async () => { await mongoose.connection.close(); process.exit(0); });
const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Admin Panel: http://localhost:${PORT}/admin`);
    console.log(`🛒 User App: http://localhost:${PORT}\n`);
});
module.exports = app;
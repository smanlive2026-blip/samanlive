// LOCATION: server/server.js
const nodeCrypto = require('crypto');
try {
  if (!global.crypto) global.crypto = nodeCrypto.webcrypto || nodeCrypto;
} catch(e){}

const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const compression = require('compression');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// ==================== IMPORTS ====================
//const uploadRoutes = require('./routes/upload');
const deliveryManagerRoutes = require('./routes/deliveryManager');
const orderRoutes = require('./routes/orders');
const fruitItemRoutes = require('./routes/fruit-item');
const acharRoutes = require('./routes/shops/achar-route');
const autoRoutes = require('./routes/shops/auto');
const productRoutes = require('./routes/product.routes');
const settingsRoutes = require('./routes/settings.routes');
const shopViewRoutes = require('./routes/shopViewRoutes');
const locationRoutes = require('./routes/location');
const userRoutes = require('./routes/user');

// ==================== MIDDLEWARE ====================
// [COMMENT] Compression se 70+ dashboard tez load honge, CORS se frontend connect hoga
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ==================== ROUTES - ORDER IS IMPORTANT ====================
// [COMMENT] Delivery Manager - delivery boy banane ka API
app.use('/api', deliveryManagerRoutes);

// [COMMENT] FRUIT SHOP TEMPLATE - public/shop-templates/fruit/dashboard.html
app.use('/api/shops', fruitItemRoutes);

// [COMMENT] SHOP VIEW - Customer ko shop kaise dikhegi - public/shop-templates/*/customer-view.html
app.use('/api/shop-view', shopViewRoutes);
app.use('/api/shop', shopViewRoutes);
app.use('/shop', shopViewRoutes);

// [COMMENT] AUTO & ACHAR SHOP TEMPLATE - public/shop-templates/achar-shop/ + auto/
app.use('/api/shops/auto', autoRoutes);
app.use('/api/shops/achar', acharRoutes);

// [COMMENT] MEDIA & FURNITURE & SPORTS & KIRANA
app.use('/api/media', require('./routes/media'));
app.use('/api/shops/furniture', require('./routes/shops/furniture-route'));
app.use('/api/shops/sports', require('./routes/shops/sports-route'));
app.use('/api/shops/kirana', require('./routes/shops/kirana-route'));

// [COMMENT] GENERIC SHOP ROUTE - Baaki 50+ templates
app.use('/api/shops', require('./routes/shopRoutes'));

// [COMMENT] SHOP TOGGLE - public/shop-templates/common/shop-toggle.js
app.use('/api/shop-toggle', require('./routes/common/shop-toggle'));
app.use('/api/products', productRoutes);
app.use('/api/admin', settingsRoutes);

// [COMMENT] Logger - dev me kaunsa API hit ho raha hai
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    }
    next();
});

// [COMMENT] SHOP KE ORDERS - Har dashboard ke Orders tab ke liye
app.get('/api/orders/shop/:shopId', async (req, res) => {
  try {
    const Order = require('./models/Order');
    const orders = await Order.find({ shopId: req.params.shopId }).sort({createdAt: -1});
    res.json({ success: true, data: orders });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

// [COMMENT] STATIC FILES - 70+ Dashboard yahi se serve hote hain - public/shop-templates/*
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/logos', express.static(path.join(__dirname, '../public/logos')));
app.use('/videos', express.static(path.join(__dirname, '../public/videos')));
app.use('/banners', express.static(path.join(__dirname, '../public/banners')));
app.use('/shop-templates', express.static(path.join(__dirname, '../public/shop-templates')));

app.use('/api/orders', orderRoutes);

// ==================== MONGODB CONNECT ====================
// [COMMENT] MongoDB - Tera main DB
let mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/samanlive';
mongoose.connect(mongoUri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000
})
.then(async () => {
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📦 Database: ${mongoose.connection.name}`);
    try {
        const Shop = require('./models/Shop');
        const result = await Shop.updateMany({ status: 'active' }, { $set: { status: 'approved' } });
        if (result.modifiedCount > 0) console.log(`🔄 Auto-migrated ${result.modifiedCount} shops`);
    } catch (err) { console.log('⚠️ Migration skipped:', err.message); }
})
.catch(err => {
    console.error('❌ MongoDB Error:', err.message);
    if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') process.exit(1);
});
mongoose.connection.on('error', err => console.error('❌ MongoDB Error:', err));
mongoose.connection.on('disconnected', () => console.log('⚠️ MongoDB Disconnected'));

// ==================== API ROUTES ====================
app.get('/api/health', (req, res) => {
    res.json({
        success: true, message: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        environment: process.env.NODE_ENV || 'development'
    });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/adminRoutes'));
app.use('/api/manager', require('./routes/managerRoutes'));
app.use('/api', require('./routes/areaRoutes'));
app.use('/api', require('./routes/market'));
app.use('/api', require('./routes/public-modules'));
app.use('/api', require('./routes/stats'));

// [COMMENT] LOCATION - nearby-shops.js, location.core.js - NEARBY SHOP KA MAIN LOGIC
app.use('/api/location', locationRoutes);
app.use('/api/location', require('./routes/user.location.routes'));

// [COMMENT] UPLOAD - Cloudinary image upload
//app.use('/api/upload', require('./routes/upload'));

// user profile ke liye
app.use('/api/user', userRoutes);
app.use('/api/admin', require('./routes/userAdmin'));

// ==================== ADMIN PANEL ROUTES ====================
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../public/admin-panel/modules.html')));
app.get('/admin-panel', (req, res) => res.redirect('/admin'));
app.get('/admin/:page', (req, res) => {
    const filePath = path.join(__dirname, `../public/admin-panel/${req.params.page}.html`);
    res.sendFile(filePath, (err) => { if (err) res.sendFile(path.join(__dirname, '../public/404.html')); });
});
app.get('/module-detail.html', (req, res) => res.sendFile(path.join(__dirname, '../public/admin-panel/module-detail.html')));

// [COMMENT] AREA MANAGER - area-manager.html
app.get('/area-manager.html', (req, res) => res.sendFile(path.join(__dirname, '../public/area-manager.html')));
app.get('/area-manager/:page', (req, res) => {
    const filePath = path.join(__dirname, `../public/area-manager/${req.params.page}.html`);
    res.sendFile(filePath, (err) => { if (err) res.sendFile(path.join(__dirname, '../public/404.html')); });
});
app.get('/areas.html', (req, res) => res.sendFile(path.join(__dirname, '../public/areas.html')));
app.get('/area-detail.html', (req, res) => res.sendFile(path.join(__dirname, '../public/area-detail.html')));
app.get('/managers.html', (req, res) => res.sendFile(path.join(__dirname, '../public/managers.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));
app.get('/local-market.html', (req, res) => res.sendFile(path.join(__dirname, '../public/local-market.html')));

// [COMMENT] SHOP DASHBOARD - /shop/:id/dashboard
app.get('/shop/:id/dashboard', async (req, res) => {
    try {
        const Shop = require('./models/Shop');
        const shop = await Shop.findById(req.params.id);
        if (!shop) return res.status(404).sendFile(path.join(__dirname, '../public/404.html'));
        const shopTypeMap = { 'General Store': 'general', 'Kirana': 'kirana', 'Medical': 'medical', 'Restaurant': 'restaurant', 'Cloth': 'cloth', 'Furniture': 'furniture' };
        const templateFolder = shopTypeMap[shop.shopType] || shop.shopType?.toLowerCase() || 'general';
        const templatePath = path.join(__dirname, `../public/shop-templates/${templateFolder}/dashboard.html`);
        res.sendFile(templatePath, (err) => {
            if (err) {
                const fallbackPath = path.join(__dirname, '../public/shop-templates/general/dashboard.html');
                res.sendFile(fallbackPath, (err2) => { if (err2) res.status(404).send('Shop template not found'); });
            }
        });
    } catch (err) { res.status(500).send('Error loading shop dashboard'); }
});
app.get('/profile.html', (req, res) => res.sendFile(path.join(__dirname, '../public/profile.html')));
app.get('/wishlist.html', (req, res) => res.sendFile(path.join(__dirname, '../public/wishlist.html')));

// ==================== ADMIN API DOCS + FILE EXPLORER - FULL ====================
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
                    allRoutes.push({ path: layer.route.path, methods: Object.keys(layer.route.methods).map(m => m.toUpperCase()), file: 'server.js' });
                }
            });
        }
        if (fs.existsSync(routesDir)) {
            const files = fs.readdirSync(routesDir);
            files.forEach(file => {
                if (file.endsWith('.js')) {
                    const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
                    const routeRegex = /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g;
                    let match;
                    while ((match = routeRegex.exec(content)) !== null) {
                        let basePath = '/api';
                        if (file === 'adminRoutes.js') basePath = '/api';
                        const fullPath = basePath + match[2];
                        allRoutes.push({ path: fullPath, methods: [match[1].toUpperCase()], file: file });
                    }
                }
            });
        }
        const projectRoot = path.join(__dirname, '..');
        const projectTree = scanProjectTree(projectRoot);
        res.json({ success: true, total: allRoutes.length, routes: allRoutes, models: mongoose.modelNames(), projectTree });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message, routes: [], projectTree: [] });
    }
});

app.post('/api/admin/get-route-code', (req, res) => {
    try {
        const { file } = req.body;
        let filePath = file === 'server.js' ? path.join(__dirname, 'server.js') : path.join(__dirname, './routes', file);
        if (!fs.existsSync(filePath)) {
             filePath = path.join(__dirname, '..', file);
        }
        if (!fs.existsSync(filePath)) return res.json({ success: false, error: 'File not found: ' + file });
        res.json({ success: true, file, code: fs.readFileSync(filePath, 'utf8') });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.post('/api/admin/update-route-code', (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({ success: false, error: 'File editing disabled in production' });
        }
        const { file, code } = req.body;
        let filePath = file === 'server.js' ? path.join(__dirname, 'server.js') : path.join(__dirname, './routes', file);
        if (!fs.existsSync(filePath)) filePath = path.join(__dirname, '..', file);
        const backupPath = filePath + '.backup-' + Date.now();
        fs.copyFileSync(filePath, backupPath);
        fs.writeFileSync(filePath, code);
        res.json({ success: true, message: `File ${file} updated! Backup: ${path.basename(backupPath)}` });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});
// ==================== END FILE EXPLORER ====================

// ==================== ERROR HANDLERS - LAST ME RAKHNA HAI ====================
app.use((err, req, res, next) => {
    if (err.name === 'MulterError') return res.status(400).json({ success: false, error: err.message });
    next(err);
});

app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    res.status(err.status || 500).json({ success: false, error: err.message || 'Something went wrong!' });
});

// [COMMENT] 404 - Sabse last me
app.get('*', (req, res) => {
    const p = path.join(__dirname, '../public/404.html');
    if(fs.existsSync(p)) return res.status(404).sendFile(p);
    res.status(404).send('404 Not Found');
});

// ==================== START SERVER - VERCEL FIX ====================
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Admin Panel: http://localhost:${PORT}/admin`);
    console.log(`💚 Health Check: http://localhost:${PORT}/api/health\n`);
  });
}

module.exports = app;
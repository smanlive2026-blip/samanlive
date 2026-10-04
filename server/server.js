// LOCATION: server/server.js - V11 FINAL - FULL FILE - ORDER FIX - NO OLD DASHBOARD
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
const worldProductRoutes = require('./routes/world-product.routes');
app.use('/api/world-products', worldProductRoutes);
// ==================== MIDDLEWARE ====================
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ==================== NO CACHE MIDDLEWARE - TOP PE DEFINED ====================
const noCacheMiddleware = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
};

// ==================== AUTO INJECTOR FOR RENDER->VERCEL - HAZAAR DASHBOARD FIX ====================
const GLOBAL_CONFIG_INJECT = `<script>(function(){const O=window.location.origin;window.API_BASE=O;window.EnvConfig={API_BASE:O};const OLD=['onrender.com'];const _f=window.fetch;window.fetch=function(u,o){if(typeof u==='string'){OLD.forEach(e=>{if(u.includes(e))u=u.replace(/https:\\/\\/[^\\/]+\\.onrender\\.com/g,O)})}return _f.call(this,u,o)};const _o=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u){OLD.forEach(e=>{if(typeof u==='string'&&u.includes(e))u=u.replace(/https:\\/\\/[^\\/]+\\.onrender\\.com/g,O)});return _o.apply(this,arguments)}})();</script><meta http-equiv="Cache-Control" content="no-store">`;

function serveHtmlFresh(filePath, res){
  try{
    if(!fs.existsSync(filePath)) return res.status(404).sendFile(path.join(__dirname,'../public/404.html'));
    let html = fs.readFileSync(filePath,'utf8');
    if(html.includes('<head>')) html = html.replace('<head>', `<head>${GLOBAL_CONFIG_INJECT}`);
    res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma','no-cache');
    res.setHeader('Expires','0');
    res.setHeader('Content-Type','text/html');
    res.send(html);
  }catch(e){ 
    console.error(e);
    res.status(500).send('Error loading file'); 
  }
}

// ==================== ROUTES - ORDER FIXED - SABSE PEHLE DASHBOARD ====================

// 1. SHOP DASHBOARD - ISKO SABSE PEHLE RAKHNA ZARURI HAI - SHOPVIEW SE PEHLE
app.get('/shop/:id/dashboard', async (req, res) => {
    try {
        const Shop = require('./models/Shop');
        const shop = await Shop.findById(req.params.id);
        if (!shop) return res.status(404).sendFile(path.join(__dirname, '../public/404.html'));
        const shopTypeMap = { 'General Store': 'general', 'Kirana': 'kirana', 'Medical': 'medical', 'Restaurant': 'restaurant', 'Cloth': 'cloth', 'Furniture': 'furniture' };
        const templateFolder = shopTypeMap[shop.shopType] || shop.shopType?.toLowerCase() || 'general';
        const templatePath = path.join(__dirname, `../public/shop-templates/${templateFolder}/dashboard.html`);
        serveHtmlFresh(templatePath, res);
    } catch (err) { 
        console.error(err);
        res.status(500).send('Error loading shop dashboard'); 
    }
});

// 2. SHOP TEMPLATES HTML - DIRECT ACCESS - FRESH SERVE
app.get('/shop-templates/*/*.html', (req,res)=>{
  const fp = path.join(__dirname,'../public', req.path);
  serveHtmlFresh(fp, res);
});

// 3. AB BAKI KE API ROUTES - DASHBOARD KE BAAD
app.use('/api', deliveryManagerRoutes);
app.use('/api/common', require('./routes/common/index')); // COMMON INDEX CONNECTED ✅
app.use('/api/shops', fruitItemRoutes);
app.use('/api/shop-view', shopViewRoutes);
app.use('/api/shop', shopViewRoutes);
app.use('/shop', shopViewRoutes); // YE AB DASHBOARD KE BAAD HAI - ISLIYE PURANA NAHI KHULEGA
app.use('/api/shops/auto', autoRoutes);
app.use('/api/shops/achar', acharRoutes);
app.use('/api/media', require('./routes/media'));
app.use('/api/shops/furniture', require('./routes/shops/furniture-route'));
app.use('/api/shops/sports', require('./routes/shops/sports-route'));
app.use('/api/shops/kirana', require('./routes/shops/kirana-route')); // KIRANA CONNECTED ✅
app.use('/api/shops', require('./routes/shopRoutes'));
app.use('/api/products', productRoutes);
app.use('/api/admin', settingsRoutes);

// Logger
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    }
    next();
});

app.get('/api/orders/shop/:shopId', async (req, res) => {
  try {
    const Order = require('./models/Order');
    const orders = await Order.find({ shopId: req.params.shopId }).sort({createdAt: -1});
    res.json({ success: true, data: orders });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

// ==================== STATIC FILES - SINGLE STATIC ONLY - FIXED DUPLICATE BUG ====================
app.use(['/admin','/admin-panel','/area-manager','/manager-panel','/dashboard'], noCacheMiddleware);

app.get('/admin', noCacheMiddleware, (req, res) => {
  serveHtmlFresh(path.join(__dirname, '../public/admin-panel/modules.html'), res);
});
app.get('/admin/*', noCacheMiddleware, (req, res) => {
  serveHtmlFresh(path.join(__dirname, '../public/admin-panel/modules.html'), res);
});

// Single static for all assets - NO DUPLICATE
app.use(express.static(path.join(__dirname, '../public'), {
  etag: false,
  lastModified: false,
  maxAge: 0,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/logos', express.static(path.join(__dirname, '../public/logos')));
app.use('/videos', express.static(path.join(__dirname, '../public/videos')));
app.use('/banners', express.static(path.join(__dirname, '../public/banners')));
app.use('/api/orders', orderRoutes);

// ==================== MONGODB CONNECT ====================
let mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/samanlive';
mongoose.connect(mongoUri, { maxPoolSize: 10, serverSelectionTimeoutMS: 10000 })
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
        success: true, message: 'Server V11 FINAL - Order Fixed - No Old Dashboard',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        environment: process.env.NODE_ENV || 'development',
        common: '/api/common/health',
        kirana: '/api/shops/kirana/health/check'
    });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/adminRoutes'));
app.use('/api/manager', require('./routes/managerRoutes'));
app.use('/api', require('./routes/areaRoutes'));
app.use('/api', require('./routes/market'));
app.use('/api', require('./routes/public-modules'));
app.use('/api', require('./routes/stats'));
app.use('/api/location', locationRoutes);
app.use('/api/location', require('./routes/user.location.routes'));
app.use('/api/user', userRoutes);
app.use('/api/admin', require('./routes/userAdmin'));

app.get('/admin/:page', (req, res) => {
    const filePath = path.join(__dirname, `../public/admin-panel/${req.params.page}.html`);
    serveHtmlFresh(filePath, res);
});
app.get('/module-detail.html', (req, res) => serveHtmlFresh(path.join(__dirname, '../public/admin-panel/module-detail.html'), res));
app.get('/area-manager.html', (req, res) => serveHtmlFresh(path.join(__dirname, '../public/area-manager.html'), res));
app.get('/areas.html', (req, res) => res.sendFile(path.join(__dirname, '../public/areas.html')));
app.get('/area-detail.html', (req, res) => res.sendFile(path.join(__dirname, '../public/area-detail.html')));
app.get('/managers.html', (req, res) => res.sendFile(path.join(__dirname, '../public/managers.html')));
app.get('/', (req, res) => serveHtmlFresh(path.join(__dirname, '../public/index.html'), res));
app.get('/local-market.html', (req, res) => serveHtmlFresh(path.join(__dirname, '../public/local-market.html'), res));
app.get('/profile.html', (req, res) => serveHtmlFresh(path.join(__dirname, '../public/profile.html'), res));
app.get('/wishlist.html', (req, res) => serveHtmlFresh(path.join(__dirname, '../public/wishlist.html'), res));

// ==================== ADMIN API DOCS + FILE EXPLORER ====================
function getProjectTree(dirPath, basePath = '') {
    const ignore = ['node_modules', '.git', '.vercel', '.next', 'dist', 'uploads', 'logos', 'videos', 'banners', 'public/uploads'];
    const items = [];
    if (!fs.existsSync(dirPath)) return items;
    try {
        const files = fs.readdirSync(dirPath);
        files.forEach(file => {
            if (ignore.includes(file) || file.startsWith('.')) return;
            const filePath = path.join(dirPath, file);
            try {
                const stat = fs.statSync(filePath);
                const relativePath = basePath ? `${basePath}/${file}` : file;
                if (stat.isDirectory()) {
                    items.push({ name: file, type: 'folder', path: relativePath, children: getProjectTree(filePath, relativePath) });
                } else if(file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.json')) {
                    items.push({ name: file, type: 'file', path: relativePath });
                }
            } catch(e){}
        });
    } catch(e){}
    return items;
}
app.get('/api/admin/routes', (req, res) => {
    const projectTree = getProjectTree(path.join(__dirname, '..'));
    res.json({ success: true, projectTree });
});
app.post('/api/admin/get-route-code', (req, res) => {
    const { file } = req.body;
    const fullPath = path.join(path.join(__dirname, '..'), file);
    const code = fs.readFileSync(fullPath, 'utf8');
    res.json({ success: true, file, code });
});
app.post('/api/admin/update-route-code', (req, res) => {
    if (process.env.NODE_ENV === 'production') return res.json({ success: false, error: 'Vercel read-only' });
    const { file, code } = req.body;
    const fullPath = path.join(path.join(__dirname, '..'), file);
    fs.writeFileSync(fullPath, code, 'utf8');
    res.json({ success: true, message: `Saved ${file}` });
});

// ==================== ERROR HANDLERS ====================
app.use((err, req, res, next) => {
    if (err.name === 'MulterError') return res.status(400).json({ success: false, error: err.message });
    next(err);
});
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    res.status(err.status || 500).json({ success: false, error: err.message });
});
app.get('*', (req, res) => {
    const p = path.join(__dirname, '../public/404.html');
    if(fs.existsSync(p)) return serveHtmlFresh(p, res);
    res.status(404).send('404 Not Found');
});

if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server V11 FINAL running on http://localhost:${PORT}`);
    console.log(`📊 Admin: http://localhost:${PORT}/admin`);
    console.log(`💚 Health: /api/health`);
    console.log(`🔥 Common: /api/common/health`);
    console.log(`🛒 Kirana: /api/shops/kirana/health/check\n`);
  });
}
module.exports = app;
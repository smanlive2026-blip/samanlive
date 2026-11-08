// LOCATION: server/server.js - V27 FINAL - FULL CODE - NO LINE DELETED + INDEX CLEANUP + WALLET MOUNT + SECURITY FIX
// FIX: io ko app pe bhi set kiya taaki req.app.get('io') kaam kare. module.exports = app hi rakha hai (Vercel ko app chahiye, server nahi) - koi line delete nahi ki
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
// === SAFETY: Ek kharab router poora server na giraye ===
const _origAppUse = app.use.bind(app);
app.use = function(...args){
  try{
    return _origAppUse(...args);
  }catch(e){
    console.error('=== BAD MOUNT PAKDA GAYA ===');
    console.error('Mount path:', args[0]);
    console.error('Error:', e.message);
    console.error(e.stack);
    return this;
  }
};
// === SAFETY END ===

// ==================== SOCKET.IO SETUP - V12 SOCKET FIX ====================
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET","POST"] },
  transports: ['websocket','polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

global.io = io;
// FIX 1 - YAHI MISSING THA: Route files me req.app.get('io') likha hai, par app pe io set hi nahi tha, isliye undefined milta tha aur emit kabhi hota hi nahi tha.
// Ab app pe bhi set kar diya, global.io jaisa tha waisa hi rahega.
app.set('io', io);
app.io = io;
console.log('🔌 Socket.IO initialized - global.io set');

io.on('connection', (socket) => {
  console.log(`✅ Socket connected: ${socket.id} | Query:`, socket.handshake.query);

  socket.on('join-shop', (shopId) => {
    socket.join(`shop:${shopId}`);
    console.log(`  -> Joined shop:${shopId}`);
    socket.emit('pong', { shopId, msg: 'joined' });
  });

  socket.on('join-user', (userId) => {
    socket.join(`user:${userId}`);
  });

  socket.on('shop-status-changed', (data) => {
    console.log(`  -> shop-status:`, data);
    io.to(`shop:${data.shopId}`).emit('shop-status-changed', data);
  });

  socket.on('new-order', (order) => {
    io.to(`shop:${order.shopId}`).emit('new-order', order);
  });

  socket.on('disconnect', (reason) => {
    console.log(`❌ Socket disconnected: ${socket.id} - ${reason}`);
  });
});
// ==================== END SOCKET SETUP ====================

// ==================== MONGODB CONNECT - BUFFERING FIX - SABSE PEHLE ====================
let mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/samanlive';

mongoose.set('bufferTimeoutMS', 5000);
mongoose.set('strictQuery', false);
mongoose.set('bufferCommands', false);

let dbPromise = null;
function connectDB() {
    if (mongoose.connection.readyState === 1) return Promise.resolve();
    if (dbPromise) return dbPromise;
    dbPromise = mongoose.connect(mongoUri, {
      // V27: Crore log ke liye pool badhaya - 10 pe line lag jati thi
      maxPoolSize: 50,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000
    })
.then(async () => {
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📦 Database: ${mongoose.connection.name}`);
    try {
        const Shop = require('./models/Shop');
        const result = await Shop.updateMany({ status: 'active' }, { $set: { status: 'approved' } });
        if (result.modifiedCount > 0) console.log(`🔄 Auto-migrated ${result.modifiedCount} shops`);
    } catch (err) { console.log('⚠️ Migration skipped:', err.message); }

    // V27 FINAL - ONE TIME INDEX CLEANUP - Model badalne se purana index nahi mit-ta, yahan mitega
    // Manager ka purana email_1 unique index mitana hai, warna same email se Manager + DeliveryBoy banega hi nahi, E11000 aata rahega
    try {
        const Manager = require('./models/Manager');
        const mIndexes = await Manager.collection.getIndexes().catch(() => ({}));
        if (mIndexes['email_1']) {
            await Manager.collection.dropIndex('email_1');
            console.log('🧹 Dropped old Manager email_1 unique index - ab same email se Manager + DeliveryBoy ban sakta hai');
        }
        // Sahi index bana do - agar nahi hai toh
        await Manager.collection.createIndex({ managerCode: 1 }, { unique: true, background: true }).catch(() => {});
        await Manager.collection.createIndex({ loginToken: 1 }, { unique: true, background: true }).catch(() => {});
        await Manager.collection.createIndex({ phone: 1 }, { background: true }).catch(() => {});
        await Manager.collection.createIndex({ email: 1 }, { background: true }).catch(() => {});
    } catch (e) { console.log('Manager index cleanup skip:', e.message); }

    // V27: User ka purana email_1 unique index bhi sparse banana hai - warna khali email wale 100 log E11000 denge
    try {
        const User = require('./models/User');
        const uIndexes = await User.collection.getIndexes().catch(() => ({}));
        // Agar email_1 hai aur sparse nahi hai toh drop karke sparse bana do
        if (uIndexes['email_1'] && !uIndexes['email_1'].sparse) {
            await User.collection.dropIndex('email_1');
            console.log('🧹 Dropped old User email_1 unique index - ab sparse banega');
        }
        await User.collection.createIndex({ email: 1 }, { unique: true, sparse: true, background: true }).catch(() => {});
        await User.collection.createIndex({ phone: 1 }, { unique: true, background: true }).catch(() => {});
    } catch (e) { console.log('User index cleanup skip:', e.message); }
})
.catch(err => {
    dbPromise = null;
    console.error('❌ MongoDB Error:', err.message);
    if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') process.exit(1);
});
    return dbPromise;
}
connectDB();
mongoose.connection.on('error', err => console.error('❌ MongoDB Error:', err));
mongoose.connection.on('disconnected', () => { dbPromise = null; console.log('⚠️ MongoDB Disconnected'); });

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

const productManagerRoutes = require('./routes/productManagerRoutes');
const executiveRoutes = require('./routes/executiveRoutes');
const productPoolRoutes = require('./routes/productPoolRoutes');
const areaDemandRoutes = require('./routes/areaDemandRoutes');
const userAddressRoutes = require('./routes/user.address.routes');

// ==================== MIDDLEWARE - V27 - limit 50mb -> 2mb - base64 bomb band ====================
app.use(compression());
app.use(cors());
// V27: Pehle 50mb tha - koi bhi 50MB base64 bhej ke server ki memory phad deta tha. Upload multer se hota hai, JSON ko 2mb kaafi hai
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

app.use('/api/user/addresses', userAddressRoutes);

app.use('/api/product-manager', productManagerRoutes);
app.use('/api/executive', executiveRoutes);
app.use('/api/product-pool', productPoolRoutes);
app.use('/api/area-demand', areaDemandRoutes);

app.use('/api/world-products', async (req,res,next)=>{
  try{
    await connectDB();
    if(mongoose.connection.readyState !== 1){
      return res.status(503).json({ success:false, message:'DB not ready, try again' });
    }
    next();
  }catch(e){
    console.error('DB ensure failed:', e.message);
    return res.status(503).json({ success:false, message:'DB connection failed: ' + e.message });
  }
}, worldProductRoutes);

app.use('/api', async (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        try { await connectDB(); } catch(e) {}
    }
    next();
});

const noCacheMiddleware = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
};

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

app.get('/shop-templates/*/*.html', (req,res)=>{
  const fp = path.join(__dirname,'../public', req.path);
  serveHtmlFresh(fp, res);
});

// ==================== FIXED ORDER - V13 - SETTINGS FIRST, THEN MEDIA - LOGO 500 FIX ====================
// 1. SETTINGS ROUTES - SABSE PEHLE - /api/settings + /api/upload/logo + /api/upload/banner
app.use('/api', settingsRoutes); // ✅ FIX 1 - MAIN FIX - /api/settings, /api/upload/logo, /api/upload/banner - TERE SCREENSHOT KE LIYE
app.use('/api/admin', settingsRoutes); // ✅ FIX 2 - /api/admin/settings - backward compatible

// 2. COMMON + PROFILE - CLOUDINARY
app.use('/api/common', require('./routes/common/index'));
app.use('/api/common/profile', require('./routes/common/profile.routes'));
// V27 NEW: WALLET - Ye mount nahi tha, isliye /api/common/wallet/balance pe 404 aata tha
app.use('/api/common/wallet', require('./routes/common/wallet.routes'));

// 3. MEDIA - SETTINGS KE BAAD - warna /api/upload/logo ko ye pakad lega aur 500 dega
app.use('/api/media', require('./routes/media'));
app.use('/api/upload', require('./routes/media')); // /api/upload/upload-pic - profile pic

// 4. REST SHOP ROUTES
app.use('/api/shops', fruitItemRoutes);
app.use('/api/shop-view', shopViewRoutes);
app.use('/api/shop', shopViewRoutes);
app.use('/shop', shopViewRoutes);
app.use('/api/shops/auto', autoRoutes);
app.use('/api/shops/achar', acharRoutes);
app.use('/api/shops/furniture', require('./routes/shops/furniture-route'));
app.use('/api/shops/sports', require('./routes/shops/sports-route'));
app.use('/api/shops/kirana', require('./routes/shops/kirana-route'));
app.use('/api/shops', require('./routes/shopRoutes'));
app.use('/api/products', productRoutes);

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

app.use(['/admin','/admin-panel','/area-manager','/manager-panel','/dashboard'], noCacheMiddleware);

app.get('/admin', noCacheMiddleware, (req, res) => {
  serveHtmlFresh(path.join(__dirname, '../public/admin-panel/modules.html'), res);
});
app.get('/admin/*', noCacheMiddleware, (req, res) => {
  serveHtmlFresh(path.join(__dirname, '../public/admin-panel/modules.html'), res);
});

app.use(express.static(path.join(__dirname, '../public'), {
  etag: false,
  lastModified: false,
  maxAge: 0,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma','no-cache');
      res.setHeader('Expires','0');
    }
  }
}));

app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/logos', express.static(path.join(__dirname, '../public/logos')));
app.use('/videos', express.static(path.join(__dirname, '../public/videos')));
app.use('/banners', express.static(path.join(__dirname, '../public/banners')));
app.use('/api/orders', orderRoutes);

app.get('/api/health', (req, res) => {
    res.json({
        success: true, message: 'Server V27 FINAL - Settings Order + Logo 500 Fixed + Cloudinary + Wallet + Index Cleanup',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        readyState: mongoose.connection.readyState,
        environment: process.env.NODE_ENV || 'development',
        settings: '/api/settings',
        settings_admin: '/api/admin/settings',
        upload_logo: '/api/upload/logo -> Cloudinary samanlive/logo',
        upload_banner: '/api/upload/banner -> Cloudinary samanlive/banner',
        common: '/api/common/health'
    });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/areaManagerRoutes'));
app.use('/api', require('./routes/managerShopCreate'));
app.use('/api', deliveryManagerRoutes);
app.use('/api', require('./routes/adminRoutes'));
app.use('/api', require('./routes/areaRoutes'));
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
    // V27 SECURITY: Pehle koi bhi ../.env likh ke secret padh sakta tha. Ab sirf .js/.html/.json, aur .env / .. / node_modules kabhi nahi
    const { file } = req.body || {};
    if (!file || typeof file !== 'string') return res.status(400).json({ success: false, error: 'file required' });
    if (file.includes('..') || file.includes('.env') || file.includes('node_modules') || file.startsWith('/') || file.includes(':')) {
        return res.status(403).json({ success: false, error: 'Blocked - .env / .. allowed nahi hai' });
    }
    if (!file.endsWith('.js') && !file.endsWith('.html') && !file.endsWith('.json')) {
        return res.status(403).json({ success: false, error: 'Sirf .js / .html / .json allowed hai' });
    }
    const fullPath = path.join(path.join(__dirname, '..'), file);
    if (!fs.existsSync(fullPath)) return res.status(404).json({ success: false, error: 'File not found' });
    const code = fs.readFileSync(fullPath, 'utf8');
    res.json({ success: true, file, code });
});
app.post('/api/admin/update-route-code', (req, res) => {
    if (process.env.NODE_ENV === 'production') return res.json({ success: false, error: 'Vercel read-only' });
    const { file, code } = req.body;
    // V27: Update me bhi wahi rok
    if (!file || file.includes('..') || file.includes('.env') || file.includes('node_modules')) {
        return res.status(403).json({ success: false, error: 'Blocked - .env / .. allowed nahi hai' });
    }
    const fullPath = path.join(path.join(__dirname, '..'), file);
    fs.writeFileSync(fullPath, code, 'utf8');
    res.json({ success: true, message: `Saved ${file}` });
});

// V27 FIX: E11000 -> 409 Hindi, ValidationError -> 400, MulterError -> 400 - 500 mat do
app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    if (err.name === 'MulterError') return res.status(400).json({ success: false, error: err.message });
    if (err.code === 11000 || String(err.message || '').includes('E11000')) {
        const f = Object.keys(err.keyValue || {})[0] || 'phone/email';
        return res.status(409).json({ success: false, error: `Ye ${f} (${err.keyValue ? err.keyValue[f] : ''}) pehle se kisi aur ka hai. Dusra ${f} use karo.` });
    }
    if (err.name === 'ValidationError') return res.status(400).json({ success: false, error: 'Validation: ' + err.message });
    if (err.type === 'entity.too.large') return res.status(413).json({ success: false, error: 'Photo / data bahut bada hai - 2MB se chhota bhejo' });
    console.error('❌ Error:', err.stack || err.message);
    return res.status(err.status || 500).json({ success: false, error: err.message });
});

// V27: /api/* pe 404 aaye toh HTML mat bhejo, JSON bhejo - warna frontend HTML ko JSON samajh ke toot jata hai
app.use('/api', (req, res) => {
    return res.status(404).json({ success: false, error: 'API route not found: ' + req.method + ' ' + req.originalUrl });
});

app.get('*', (req, res) => {
    const p = path.join(__dirname, '../public/404.html');
    if(fs.existsSync(p)) return serveHtmlFresh(p, res);
    res.status(404).send('404 Not Found');
});

if (!process.env.VERCEL) {
   server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server V27 FINAL running on http://localhost:${PORT}`);
    console.log(`📊 Admin: http://localhost:${PORT}/admin`);
    console.log(`🔌 Socket: ws://localhost:${PORT}/socket.io/`);
    console.log(`💚 Health: /api/health\n`);
  });
}
// FIX 2 - module.exports = app HI RAHEGA, isko server mat karna.
// Vercel ke api/index.js ko app (function) chahiye. Server de diya toh Vercel hi toot jayega.
// Bas io aur server ko bhi saath me attach kar diya, taaki dono taraf se kaam kare.
module.exports = app;
module.exports.io = io;
module.exports.server = server;
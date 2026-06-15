const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const compression = require('compression');
const fs = require('fs');
require('dotenv').config();
const seedModules = require('./seed/modules');
const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARE ====================
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request Logger - Development ke liye
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    }
    next();
});

// Static files serve karo
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/logos', express.static(path.join(__dirname, '../public/logos')));
app.use('/videos', express.static(path.join(__dirname, '../public/videos')));
app.use('/banners', express.static(path.join(__dirname, '../public/banners')));

// ==================== MONGODB CONNECT ====================
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/samanlive', {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000
})
.then(async () => {
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📦 Database: ${mongoose.connection.name}`);
    await seedModules(); // ← YE 25 MODULES SEED KAREGA
})
.catch(err => {
    console.error('❌ MongoDB Error:', err);
    process.exit(1);
});

mongoose.connection.on('error', err => {
    console.error('❌ MongoDB Error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB Disconnected');
});

// ==================== ROUTES ====================
// Admin Routes
app.use('/api', require('./routes/adminRoutes'));

// Manager Routes - Ye hi sab handle karega
app.use('/api', require('./routes/managerRoutes'));

// Market/Public Routes
app.use('/api', require('./routes/market'));

// Shop Routes - User side - TEMP COMMENT: File missing
// app.use('/api', require('./routes/shop'));

// User Routes - TEMP COMMENT: Files missing
// app.use('/api', require('./routes/userRoutes'));
// app.use('/api', require('./routes/wishlistRoutes'));
// app.use('/api', require('./routes/paymentRoutes'));
// app.use('/api', require('./routes/notificationRoutes'));

// Banner Routes - TEMP COMMENT: File missing
// app.use('/api', require('./routes/bannerRoutes'));

// ==================== ADMIN PANEL ROUTES ====================
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin/admin-panel/index.html'));
});

app.get('/admin-panel', (req, res) => {
    res.redirect('/admin');
});

app.get('/admin/:page', (req, res) => {
    const filePath = path.join(__dirname, `../public/admin/admin-panel/${req.params.page}.html`);
    res.sendFile(filePath, (err) => {
        if (err) res.sendFile(path.join(__dirname, '../public/404.html'));
    });
});

// Module detail page route
app.get('/module-detail.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin/module-detail.html'));
});

// ==================== AREA MANAGER ROUTE ====================
app.get('/area-manager.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/area-manager.html'));
});

app.get('/area-manager/:page', (req, res) => {
    const filePath = path.join(__dirname, `../public/area-manager/${req.params.page}.html`);
    res.sendFile(filePath, (err) => {
        if (err) res.sendFile(path.join(__dirname, '../public/404.html'));
    });
});

// ==================== AREA SYSTEM ROUTES - NEW ====================
// Area management pages
app.get('/areas.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/areas.html'));
});

app.get('/area-detail.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/area-detail.html'));
});

app.get('/managers.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/managers.html'));
});
// ==================== AREA SYSTEM ROUTES END ====================

// ==================== USER APP ROUTES ====================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/local-market.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/local-market.html'));
});

app.get('/shop/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/shop-detail.html'));
});

app.get('/profile.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/profile.html'));
});

app.get('/wishlist.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/wishlist.html'));
});

// ==================== HEALTH CHECK ====================
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

// ==================== ADMIN API DOCS ROUTE - ALL FILES SCANNER ====================
app.get('/api/admin/routes', (req, res) => {
    try {
        const allRoutes = [];
        const routesDir = path.join(__dirname, './routes');

        // 1. server.js ke direct routes
        if (app._router && app._router.stack) {
            app._router.stack.forEach(layer => {
                if (layer.route) {
                    const path = layer.route.path;
                    const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
                    allRoutes.push({
                        path,
                        methods,
                        file: 'server.js',
                        type: 'direct'
                    });
                }
            });
        }

        // 2. routes/ folder ki saari files scan karo
        if (fs.existsSync(routesDir)) {
            const files = fs.readdirSync(routesDir);

            files.forEach(file => {
                if (file.endsWith('.js')) {
                    const filePath = path.join(routesDir, file);
                    const content = fs.readFileSync(filePath, 'utf8');

                    // Regex se routes nikaalo: router.get('/path',...), router.post(...), etc
                    const routeRegex = /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g;
                    let match;

                    while ((match = routeRegex.exec(content))!== null) {
                        const method = match[1].toUpperCase();
                        const routePath = match[2];

                        // Base path nikaalo file name se
                        let basePath = '';
                        if (file === 'adminRoutes.js') basePath = '/api/admin';
                        else if (file === 'managerRoutes.js') basePath = '/api/manager';
                        else if (file === 'userRoutes.js') basePath = '/api/users';
                        else if (file === 'market.js') basePath = '/api/market';
                        else if (file === 'testRoutes.js') basePath = '/api/test';
                        else if (file === 'shop.js') basePath = '/api/shop';
                        else if (file === 'wishlistRoutes.js') basePath = '/api/wishlist';
                        else if (file === 'paymentRoutes.js') basePath = '/api/payment';
                        else if (file === 'notificationRoutes.js') basePath = '/api/notification';
                        else if (file === 'bannerRoutes.js') basePath = '/api/banner';
                        else {
                            // Auto detect: xyzRoutes -> /api/xyz
                            const name = file.replace('Routes.js', '').replace('.js', '').toLowerCase();
                            basePath = `/api/${name}`;
                        }

                        const fullPath = basePath + routePath;

                        allRoutes.push({
                            path: fullPath,
                            methods: [method],
                            file: file,
                            type: 'file'
                        });
                    }
                }
            });
        }

        // Duplicates hatao
        const uniqueRoutes = [];
        const seen = new Set();

        allRoutes.forEach(r => {
            const key = `${r.methods[0]}_${r.path}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueRoutes.push(r);
            }
        });

        res.json({
            success: true,
            total: uniqueRoutes.length,
            routes: uniqueRoutes.sort((a, b) => a.path.localeCompare(b.path)),
            models: mongoose.modelNames()
        });
    } catch (err) {
        console.error('API Routes Error:', err);
        res.status(500).json({
            success: false,
            error: err.message,
            routes: [],
            models: []
        });
    }
});

// ==================== ROUTE CODE VIEWER + EDITOR ====================
// Local aur production dono me chalega, lekin save sirf local me
app.post('/api/admin/get-route-code', express.json(), (req, res) => {
    try {
        const { file } = req.body;
        let filePath;

        if (file === 'server.js') {
            filePath = path.join(__dirname, 'server.js');
        } else {
            filePath = path.join(__dirname, './routes', file);
        }

        if (!fs.existsSync(filePath)) {
            return res.json({ success: false, error: 'File not found: ' + file });
        }

        const fileContent = fs.readFileSync(filePath, 'utf8');

        res.json({
            success: true,
            file: file,
            code: fileContent
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/admin/update-route-code', express.json(), (req, res) => {
    try {
        // Production me block kar do
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({
                success: false,
                error: 'File editing disabled in production for security'
            });
        }

        const { file, code } = req.body;
        let filePath;

        if (file === 'server.js') {
            filePath = path.join(__dirname, 'server.js');
        } else {
            filePath = path.join(__dirname, './routes', file);
        }

        // Backup banao
        const backupPath = filePath + '.backup-' + Date.now();
        fs.copyFileSync(filePath, backupPath);

        // Naya code likho
        fs.writeFileSync(filePath, code);

        res.json({
            success: true,
            message: `File ${file} updated! Server restart karo changes dekhne ke liye. Backup: ${path.basename(backupPath)}`
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==================== 404 FALLBACK ====================
app.get('*', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../public/404.html'));
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: 'Validation Error',
            details: Object.values(err.errors).map(e => e.message)
        });
    }

    if (err.code === 11000) {
        return res.status(400).json({
            success: false,
            error: 'Duplicate Entry',
            field: Object.keys(err.keyPattern)[0]
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: 'Invalid Token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: 'Token Expired'
        });
    }

    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Something went wrong!',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ==================== GRACEFUL SHUTDOWN ====================
process.on('SIGINT', async () => {
    console.log('\n⚠️ SIGINT received. Closing server gracefully...');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n⚠️ SIGTERM received. Closing server gracefully...');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
});

// ==================== START SERVER - SABSE LAST ME ====================
const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Admin Panel: http://localhost:${PORT}/admin`);
    console.log(`👤 Area Manager: http://localhost:${PORT}/area-manager.html`);
    console.log(`🛒 User App: http://localhost:${PORT}`);
    console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
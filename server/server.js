const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const compression = require('compression');
const fs = require('fs');
require('dotenv').config();

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
mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/samanlive', {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000
})
.then(async () => {
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📦 Database: ${mongoose.connection.name}`);
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

// ==================== API ROUTES ====================
// Health Check
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

// Admin Routes
app.use('/api', require('./routes/adminRoutes'));

// Manager Routes - Ek hi baar
app.use('/api/manager', require('./routes/managerRoutes'));

// Area Routes
app.use('/api', require('./routes/areaRoutes'));

// Local Market Admin Routes
app.use('/api/local-market', require('./routes/local-market-admin'));

// Market/Public Routes
app.use('/api', require('./routes/market'));

// Public Modules Routes
app.use('/api', require('./routes/public-modules'));

// Stats Routes
app.use('/api', require('./routes/stats'));

// Shop Routes - User side
app.use('/api/local-market', require('./routes/shopRoutes'));

// ==================== ADMIN PANEL ROUTES ====================
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin-panel/modules.html'));
});

app.get('/admin-panel', (req, res) => {
    res.redirect('/admin');
});

app.get('/admin/:page', (req, res) => {
    const filePath = path.join(__dirname, `../public/admin-panel/${req.params.page}.html`);
    res.sendFile(filePath, (err) => {
        if (err) res.sendFile(path.join(__dirname, '../public/404.html'));
    });
});

app.get('/module-detail.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin-panel/module-detail.html'));
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

// ==================== AREA SYSTEM ROUTES ====================
app.get('/areas.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/areas.html'));
});

app.get('/area-detail.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/area-detail.html'));
});

app.get('/managers.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/managers.html'));
});

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

// ==================== ADMIN API DOCS ROUTE ====================
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
                    items.push({
                        name: file,
                        type: 'folder',
                        path: relativePath,
                        children: scanProjectTree(filePath, relativePath)
                    });
                } else {
                    items.push({
                        name: file,
                        type: 'file',
                        path: relativePath
                    });
                }
            });
            return items;
        }

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
                        else if (file === 'local-market-admin.js') basePath = '/api/local-market';
                        else if (file === 'shopRoutes.js') basePath = '/api/local-market';
                        else if (file === 'market.js') basePath = '/api/market';
                        else if (file === 'stats.js') basePath = '/api';
                        else if (file === 'public-modules.js') basePath = '/api';
                        else {
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

        const uniqueRoutes = [];
        const seen = new Set();

        allRoutes.forEach(r => {
            const key = `${r.methods[0]}_${r.path}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueRoutes.push(r);
            }
        });

        const projectRoot = path.join(__dirname, '..');
        const projectTree = scanProjectTree(projectRoot);

        res.json({
            success: true,
            total: uniqueRoutes.length,
            routes: uniqueRoutes.sort((a, b) => a.path.localeCompare(b.path)),
            models: mongoose.modelNames(),
            projectTree: projectTree
        });
    } catch (err) {
        console.error('API Routes Error:', err);
        res.status(500).json({
            success: false,
            error: err.message,
            routes: [],
            models: [],
            projectTree: []
        });
    }
});

// ==================== ROUTE CODE VIEWER + EDITOR ====================
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

        const backupPath = filePath + '.backup-' + Date.now();
        fs.copyFileSync(filePath, backupPath);
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

// ==================== START SERVER ====================
const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Admin Panel: http://localhost:${PORT}/admin`);
    console.log(`👤 Area Manager: http://localhost:${PORT}/area-manager.html`);
    console.log(`🛒 User App: http://localhost:${PORT}`);
    console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
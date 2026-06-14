const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const compression = require('compression');
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
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/samanlive', {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000
})
.then(() => {
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

// ==================== ROUTES ====================
// Admin Routes
app.use('/api', require('./routes/adminRoutes'));

// Manager Routes
app.use('/api', require('./routes/managerRoutes'));

// Shop Routes - User side - TEMP COMMENT: File missing
// app.use('/api', require('./routes/shop'));

// Market/Public Routes - Fixed: marketRoutes → market
app.use('/api', require('./routes/market'));

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

// ==================== TEMP DUMMY APIs FOR ADMIN + MANAGER ====================

// Modules API - FIXED: Direct array return kar raha
app.get('/api/modules', (req, res) => {
    res.json([
        {
            _id: '1',
            name: 'Electronics',
            slug: 'electronics',
            icon: '📱',
            color: '#3b82f6',
            link: '/electronics',
            status: 'active',
            priority: 1,
            categoryDetails: [
                { id: 'cat_1', name: 'Mobile', icon: '📱', color: '#10b981', group: 'Gadgets' },
                { id: 'cat_2', name: 'Laptop', icon: '💻', color: '#f59e0b', group: 'Gadgets' }
            ],
            areas: [],
            createdAt: new Date().toISOString()
        },
        {
            _id: '2',
            name: 'Grocery',
            slug: 'grocery',
            icon: '🛒',
            color: '#10b981',
            link: '/grocery',
            status: 'active',
            priority: 2,
            categoryDetails: [
                { id: 'cat_3', name: 'Vegetables', icon: '🥬', color: '#22c55e', group: 'Food' }
            ],
            areas: [],
            createdAt: new Date().toISOString()
        }
    ]);
});

app.post('/api/modules', (req, res) => {
    res.json({ success: true, message: 'Module created', data: { _id: Date.now().toString(),...req.body } });
});

app.put('/api/modules/:id', (req, res) => {
    res.json({ success: true, message: 'Module updated' });
});

app.delete('/api/modules/:id', (req, res) => {
    res.json({ success: true, message: 'Module deleted' });
});

// Categories API - Market categories ke liye
app.get('/api/market/categories', (req, res) => {
    res.json([
        { id: '1', name: 'Electronics', icon: '📱' },
        { id: '2', name: 'Grocery', icon: '🛒' }
    ]);
});

// Managers API
app.get('/api/managers', (req, res) => {
    res.json([]);
});

// Admin Create Manager API
app.post('/api/admin/create-manager', (req, res) => {
    const loginToken = 'mgr_' + Date.now() + Math.random().toString(36).substr(2, 9);
    const tempPassword = 'SL' + Math.floor(1000 + Math.random() * 9000);
    
    res.json({
        success: true,
        message: 'Manager created successfully',
        loginLink: `https://samanlive.onrender.com/area-manager.html?token=${loginToken}`,
        tempPassword: tempPassword,
        data: {
            _id: Date.now().toString(),
            ...req.body,
            loginToken: loginToken,
            status: true
        }
    });
});

// Manager Login API
app.post('/api/area-manager/login', (req, res) => {
    const { email, password } = req.body;
    
    if (email && password) {
        res.json({
            success: true,
            token: 'mgr_' + Date.now() + Math.random().toString(36).substr(2, 9),
            manager: {
                _id: '1',
                name: 'Test Manager',
                email: email,
                area: 'Ahmedabad',
                modules: ['1', '2'],
                status: true
            }
        });
    } else {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
});

// Manager Dashboard API
app.get('/api/manager/dashboard', (req, res) => {
    res.json({
        success: true,
        manager: {
            _id: '1',
            name: 'Test Manager',
            area: 'Ahmedabad',
            modules: ['1', '2']
        },
        shops: [],
        categories: [
            { id: '1', name: 'Electronics', icon: '📱' },
            { id: '2', name: 'Grocery', icon: '🛒' }
        ]
    });
});

// Manager Shop CRUD APIs
app.post('/api/manager/shop', (req, res) => {
    res.json({ success: true, message: 'Shop created', data: { _id: Date.now().toString(), ...req.body } });
});

app.put('/api/manager/shop/:id', (req, res) => {
    res.json({ success: true, message: 'Shop updated' });
});

app.delete('/api/manager/shop/:id', (req, res) => {
    res.json({ success: true, message: 'Shop deleted' });
});

// Admin Upload API - Banner ke liye
app.post('/api/admin/upload', (req, res) => {
    res.json({ 
        success: true, 
        url: 'https://via.placeholder.com/800x200.png?text=Banner',
        message: 'File uploaded' 
    });
});

// Admin History API
app.get('/api/admin/shop-history', (req, res) => {
    res.json({ success: true, history: [] });
});

// Pending Banners API
app.get('/api/admin/pending-banners', (req, res) => {
    res.json({ success: true, shops: [] });
});

// Categories API
app.get('/api/categories', (req, res) => {
    res.json({ success: true, data: [], count: 0 });
});

app.post('/api/categories', (req, res) => {
    res.json({ success: true, message: 'Category created' });
});

// Shops API
app.get('/api/shops', (req, res) => {
    res.json({ success: true, data: [], count: 0 });
});

// Content API
app.get('/api/content', (req, res) => {
    res.json({ success: true, data: [], count: 0 });
});

// Banners API
app.get('/api/banners', (req, res) => {
    res.json({ success: true, data: [], count: 0 });
});

// Settings API
app.get('/api/settings', (req, res) => {
    res.json({ success: true, data: { siteName: 'SAMANLIVE' } });
});

// Dashboard API
app.get('/api/dashboard', (req, res) => {
    res.json({
        success: true,
        data: {
            totalModules: 2,
            totalCategories: 0,
            totalShops: 0,
            totalManagers: 0,
            totalContent: 0
        }
    });
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
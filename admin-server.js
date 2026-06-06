const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const mongoose = require('mongoose');

// Models Import
const Shop = require('./server/models/Shop');
const User = require('./server/models/User');
const Module = require('./server/models/Module');

const app = express();
const PORT = 4000;

// MongoDB Connect - FIXED: Options hata diye
mongoose.connect('mongodb://localhost:27017/samanlive')
 .then(() => console.log('✅ MongoDB Connected'))
 .catch(err => console.log('❌ MongoDB Error:', err));

app.use(express.json());
app.use(express.static('public'));
app.use('/qr_output', express.static('qr_output'));

// Logo upload ke liye
const upload = multer({ dest: 'public/logos/' });
let CURRENT_LOGO = 'public/logos/default.png';

// Default logo banao agar nahi hai
if (!fs.existsSync('public/logos')) fs.mkdirSync('public/logos', { recursive: true });
if (!fs.existsSync(CURRENT_LOGO)) {
    // 1x1 transparent png
    fs.writeFileSync(CURRENT_LOGO, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64'));
}

// ========================================
// JSON DB HELPERS - NAYA ADD KIYA - AREA/CATEGORY KE LIYE
// ========================================
const dbPath = path.join(__dirname, './database/modules.json');

function readDB() {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    if (!data.modules) data.modules = [];
    if (!data.areas) data.areas = [];
    if (!data.shops) data.shops = [];
    if (!data.ads) data.ads = [];
    if (!data.videos) data.videos = [];
    if (!data.campaigns) data.campaigns = [];
    if (!data.areaManagers) data.areaManagers = [];
    if (!data.settings) data.settings = {};
    return data;
}

function writeDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// ========================================
// ADMIN PANEL API ROUTES
// ========================================

// 1. ADMIN DATA - Sab data ek saath - UPDATED: areas add kiya
app.get('/api/admin/data', async (req, res) => {
    try {
        const modules = await Module.find().sort({ priority: 1 });
        const shops = await Shop.find().populate('createdBy', 'name email').populate('approvedBy', 'name');
        const users = await User.find();
        const db = readDB(); // ← NAYA ADD KIYA

        res.json({
            success: true,
            modules,
            shops,
            areas: db.areas || [], // ← NAYA ADD KIYA
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

// 2. PENDING SHOPS LIST
app.get('/api/admin/pending-shops', async (req, res) => {
    try {
        const shops = await Shop.find({ status: 'pending' })
           .populate('createdBy', 'name email')
           .populate('serviceType');
        res.json({ success: true, shops });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. APPROVE/REJECT SHOP
app.put('/api/admin/approve-shop/:id', async (req, res) => {
    try {
        const { action } = req.body;
        const shop = await Shop.findByIdAndUpdate(req.params.id, {
            status: action,
            approvedBy: null,
            approvedAt: new Date()
        }, { new: true });

        if (!shop) return res.status(404).json({ error: 'Shop nahi mili' });
        res.json({ success: true, shop });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. AREA ANALYTICS
app.get('/api/admin/area-analytics', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalShops = await Shop.countDocuments({ status: 'approved' });
        const pendingShops = await Shop.countDocuments({ status: 'pending' });

        const areaData = await Shop.aggregate([
            { $match: { status: 'approved', area: { $ne: null } } },
            { $group: { _id: "$area", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        const statusData = await Shop.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            totalUsers,
            totalShops,
            pendingShops,
            areaData,
            statusData
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. UPDATE SHOP STATUS
app.put('/api/admin/shop/:id', async (req, res) => {
    try {
        const shop = await Shop.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!shop) return res.status(404).json({ error: 'Shop nahi mili' });
        res.json({ success: true, shop });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. DELETE SHOP
app.delete('/api/admin/shop/:id', async (req, res) => {
    try {
        const shop = await Shop.findByIdAndDelete(req.params.id);
        if (!shop) return res.status(404).json({ error: 'Shop nahi mili' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// MODULE DETAIL & AREA/CATEGORY APIS - NAYA ADD KIYA
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

// ========================================
// QR GENERATION APIS
// ========================================

// 1. QR Generate API
app.post('/api/generate', (req, res) => {
    const { manager_id, product_name, batch, mfg_date, quantity, qr_size_mm, area_manager_name, area_manager_id } = req.body;
    const cmd = `node generate-qr-batch.js "${manager_id}" "${product_name}" "${batch}" "${mfg_date}" ${quantity} ${qr_size_mm} "${CURRENT_LOGO}"`;

    console.log('Running:', cmd);
    exec(cmd, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ success: false, error: stderr });

        const match = stdout.match(/Folder: (.*)/);
        const outputDir = match? match[1].trim() : null;

        if (!outputDir) return res.status(500).json({ success: false, error: 'Folder not found in output' });

        const safeName = area_manager_name.replace(/[^a-zA-Z0-9]/g, '_');
        const pdf1Name = `${safeName}_${area_manager_id}_${qr_size_mm}mm_ID_LAYER.pdf`;
        const pdf2Name = `${safeName}_${area_manager_id}_${qr_size_mm}mm_QR_LAYER.pdf`;

        res.json({
            success: true,
            log: stdout,
            outputDir,
            tempPdf1: '1_ID_LAYER.pdf',
            tempPdf2: '2_QR_LAYER.pdf',
            finalPdf1Name: pdf1Name,
            finalPdf2Name: pdf2Name
        });
    });
});

// 2. PDF Generate API
app.post('/api/make-pdf', (req, res) => {
    const { folderPath, finalPdf1Name, finalPdf2Name } = req.body;
    const cmd = `node make-pdf.js "${folderPath}"`;

    exec(cmd, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ success: false, error: stderr });

        const oldPdf1 = path.join(folderPath, '1_ID_LAYER.pdf');
        const oldPdf2 = path.join(folderPath, '2_QR_LAYER.pdf');
        const newPdf1 = path.join(folderPath, finalPdf1Name);
        const newPdf2 = path.join(folderPath, finalPdf2Name);

        try {
            if (fs.existsSync(oldPdf1)) fs.renameSync(oldPdf1, newPdf1);
            if (fs.existsSync(oldPdf2)) fs.renameSync(oldPdf2, newPdf2);

            const relativePath = folderPath.replace(/\\/g, '/').replace('qr_output/', '');
            const url1 = `/qr_output/${relativePath}/${finalPdf1Name}`;
            const url2 = `/qr_output/${relativePath}/${finalPdf2Name}`;

            res.json({
                success: true,
                log: stdout,
                url1: url1,
                name1: finalPdf1Name,
                url2: url2,
                name2: finalPdf2Name
            });
        } catch (e) {
            res.status(500).json({ success: false, error: 'Rename failed: ' + e.message });
        }
    });
});

// 3. Logo Upload API
app.post('/api/upload-logo', upload.single('logo'), (req, res) => {
    CURRENT_LOGO = req.file.path.replace(/\\/g, '/');
    res.json({ success: true, logoPath: CURRENT_LOGO });
});

// 4. Sare Batch List Karo
app.get('/api/batches', (req, res) => {
    const dir = './qr_output';
    if (!fs.existsSync(dir)) return res.json([]);

    const batches = fs.readdirSync(dir).map(folder => {
        const folderPath = path.join(dir, folder);
        const infoPath = path.join(folderPath, 'batch_info.json');
        const pdf1 = path.join(folderPath, '1_ID_LAYER.pdf');
        const pdf2 = path.join(folderPath, '2_QR_LAYER.pdf');

        return {
            name: folder,
            path: folderPath,
            info: fs.existsSync(infoPath)? JSON.parse(fs.readFileSync(infoPath)) : null,
            pdf1: fs.existsSync(pdf1)? pdf1 : null,
            pdf2: fs.existsSync(pdf2)? pdf2 : null
        };
    });
    res.json(batches);
});

app.listen(PORT, () => {
    console.log(`✅ Admin Panel: http://localhost:${PORT}/admin.html`);
    console.log(`✅ MongoDB APIs Ready`);
});
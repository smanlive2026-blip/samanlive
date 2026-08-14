const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Setting = require('../models/Setting'); // TERE PASS YE MODEL HAI
const router = express.Router();

// BANNER UPLOAD KE LIYE MULTER
const bannerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../../public/assets/images/banners');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, 'header-banner-' + Date.now() + path.extname(file.originalname));
    }
});

const uploadBanner = multer({ 
    storage: bannerStorage,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

// ============ 1. GET SETTINGS ============
router.get('/settings', async (req, res) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) {
            settings = new Setting({
                headerBannerUrl: '/assets/images/default-banner.jpg',
                headerBannerHeight: 200
            });
            await settings.save();
        }
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load settings' });
    }
});

// ============ 2. UPDATE SETTINGS ============
router.put('/settings', express.json(), async (req, res) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) settings = new Setting();
        
        Object.assign(settings, req.body);
        await settings.save();
        
        res.json({ success: true, message: 'Settings saved', data: settings });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

// ============ 3. UPLOAD BANNER ============
router.post('/upload/banner', uploadBanner.single('banner'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const fileUrl = `/assets/images/banners/${req.file.filename}`;
        
        res.json({ 
            success: true, 
            url: fileUrl,
            message: 'Banner uploaded successfully' 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
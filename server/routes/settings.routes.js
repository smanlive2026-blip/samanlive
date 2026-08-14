const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Setting = require('../models/Setting');
const router = express.Router();

// BANNER UPLOAD KE LIYE MULTER
const bannerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../../public'); // <-- seedha public me
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, 'header-banner.jpg'); // <-- naam fix rakha. hamesha 1 hi file overwrite hogi
    }
});

const uploadBanner = multer({ 
    storage: bannerStorage,
    limits: { fileSize: 2 * 1024 * 1024 }
});

// GET SETTINGS
router.get('/settings', async (req, res) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) {
            settings = new Setting({ headerBannerUrl: '', headerBannerHeight: 200 });
            await settings.save();
        }
        res.json(settings);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// UPDATE SETTINGS
router.put('/settings', express.json(), async (req, res) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) settings = new Setting();
        Object.assign(settings, req.body);
        await settings.save();
        res.json({ success: true, data: settings });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});
// UPLOAD BANNER
router.post('/upload/banner', uploadBanner.single('banner'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file' });
        
        const fileUrl = `/header-banner.jpg?v=` + Date.now(); // cache bust
        let settings = await Setting.findOne();
        if (!settings) settings = new Setting();
        settings.headerBannerUrl = fileUrl; // <-- YE LINE ADD KAR
        await settings.save();

        res.json({ success: true, url: fileUrl });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
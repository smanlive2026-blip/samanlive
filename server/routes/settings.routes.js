//server/routes/setting.routes.js

const express = require('express');
const Setting = require('../models/Setting');
const { upload } = require('../utils/cloudinary'); // <-- TERI WALI FILE SE UTHA LIYA
const router = express.Router();

// GET SETTINGS
router.get('/settings', async (req, res) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) {
            settings = new Setting({ headerBannerUrl: '', headerBannerHeight: 200 });
            await settings.save();
        }
        res.json(settings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load settings' });
    }
});

// UPDATE SETTINGS
router.put('/settings', express.json(), async (req, res) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) settings = new Setting();
        Object.assign(settings, req.body);
        await settings.save();
        res.json({ success: true, data: settings });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

// ============ UPLOAD BANNER - AB TERI WALI CLOUDINARY STORAGE USE HOGI ============
router.post('/upload/banner', upload.single('banner'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file' });

        // TERI STORAGE ENGINE SE FILE DIRECT CLOUDINARY PE CHALI GAYI
        // URL yaha milega: req.file.path
        const fileUrl = req.file.path;

        // DB ME SAVE KARO
        let settings = await Setting.findOne();
        if (!settings) settings = new Setting();
        settings.headerBannerUrl = fileUrl;
        await settings.save();

        res.json({ success: true, url: fileUrl });
    } catch (err) {
        console.error("Banner Upload Error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
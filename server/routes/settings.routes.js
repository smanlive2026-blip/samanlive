//server/routes/settings.routes.js

const express = require('express');
const Setting = require('../models/Setting');
const { upload } = require('../utils/cloudinary'); 
const router = express.Router();

// GET SETTINGS - PURANE DOC ME FIELD ADD KAREGA
router.get('/settings', async (req, res) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) {
            // NAYA DOC BANA RAHA HAI TO SAB FIELD DAAL DE
            settings = new Setting({ 
                headerBannerUrl: '', 
                headerBannerHeight: 200 
            });
            await settings.save();
        } else {
            // PURANE DOC ME FIELD MISSING HO TO ADD KAR DE
            let updated = false;
            if (settings.headerBannerUrl === undefined) {
                settings.headerBannerUrl = '';
                updated = true;
            }
            if (settings.headerBannerHeight === undefined) {
                settings.headerBannerHeight = 200;
                updated = true;
            }
            if (updated) await settings.save();
        }
        res.json(settings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load settings' });
    }
});

// UPDATE SETTINGS - AUTH HATA DIYA
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

// UPLOAD BANNER - AUTH HATA DIYA
router.post('/upload/banner', upload.single('banner'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file' });
        const fileUrl = req.file.path;
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
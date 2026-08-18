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
            settings = await Setting.create({ 
                headerBannerUrl: '', 
                headerBannerType: 'image', // NAYA ADD
                headerBannerHeight: 200,
                headerLogoUrl: '', 
                appName: 'SAMAN LIVE'
            });
        } else {
            // PURANE DOC ME FIELD MISSING HO TO ADD KAR DE
            let updated = false;
            if (settings.headerBannerUrl === undefined) {
                settings.headerBannerUrl = '';
                updated = true;
            }
            if (settings.headerBannerType === undefined) { // NAYA ADD
                settings.headerBannerType = 'image';
                updated = true;
            }
            if (settings.headerBannerHeight === undefined) {
                settings.headerBannerHeight = 200;
                updated = true;
            }
            if (settings.headerLogoUrl === undefined) { 
                settings.headerLogoUrl = '';
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

// UPDATE SETTINGS - SIRF BHEJI HUI FIELD UPDATE KAREGA, BAQI NAHI UDAEGA
router.put('/settings', express.json(), async (req, res) => {
    try {
        const settings = await Setting.findOneAndUpdate(
            {},
            { $set: req.body }, 
            { upsert: true, new: true }
        );
        res.json({ success: true, data: settings });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// UPLOAD BANNER - IMAGE YA VIDEO DONO
router.post('/upload/banner', upload.single('banner'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file' });
        const fileUrl = req.file.path;
        const fileType = req.file.mimetype.startsWith('video') ? 'video' : 'image'; // AUTO DETECT

        let settings = await Setting.findOne();
        if (!settings) settings = await Setting.create({}); 
        
        settings.headerBannerUrl = fileUrl;
        settings.headerBannerType = fileType; // TYPE BHI SAVE KAR DIYA
        await settings.save();
        
        res.json({ success: true, url: fileUrl, type: fileType }); // type bhi bhej diya
    } catch (err) {
        console.error("Banner Upload Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// UPLOAD LOGO
router.post('/upload/logo', upload.single('logo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file' });
        const fileUrl = req.file.path;
        let settings = await Setting.findOne();
        if (!settings) settings = await Setting.create({}); 
        settings.headerLogoUrl = fileUrl;
        await settings.save();
        res.json({ success: true, url: fileUrl });
    } catch (err) {
        console.error("Logo Upload Error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
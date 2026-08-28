const express = require('express');
const Setting = require('../models/Setting');
const { upload } = require('../utils/cloudinary'); // LOGO ke liye golden wala
const { cloudinary } = require('../utils/cloudinary');
const multer = require('multer');
const router = express.Router();

// BANNER KE LIYE ALAG MULTER - GOLDEN BYPASS
const bannerMemoryUpload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 }
});

// GET SETTINGS
router.get('/settings', async (req, res) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) {
            settings = await Setting.create({ 
                headerBannerUrl: '', 
                headerBannerType: 'image',
                headerBannerHeight: 200,
                headerLogoUrl: '', 
                appName: 'SAMAN LIVE'
            });
        } else {
            let updated = false;
            if (settings.headerBannerType === undefined) { settings.headerBannerType = 'image'; updated = true; }
            if (settings.headerBannerHeight === undefined) { settings.headerBannerHeight = 200; updated = true; }
            if (settings.headerLogoUrl === undefined) { settings.headerLogoUrl = ''; updated = true; }
            if (settings.headerBannerUrl === undefined) { settings.headerBannerUrl = ''; updated = true; }
            if (updated) await settings.save();
        }
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load settings' });
    }
});

// UPDATE SETTINGS
router.put('/settings', express.json({limit: '30mb'}), async (req, res) => {
    try {
        const settings = await Setting.findOneAndUpdate({}, { $set: req.body }, { upsert: true, new: true });
        res.json({ success: true, data: settings });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// BANNER UPLOAD - DIRECT CLOUDINARY, GOLDEN TOUCH NAHI HOGA
router.post('/upload/banner', bannerMemoryUpload.single('banner'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file' });
        const isVideo = req.file.mimetype.startsWith('video/');
        const resourceType = isVideo ? 'video' : 'image';

        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: 'samanlive/banner',
                    resource_type: resourceType,
                    allowed_formats: ['jpg','png','jpeg','webp','avif','mp4','mov','webm']
                },
                (error, result) => error ? reject(error) : resolve(result)
            );
            stream.end(req.file.buffer);
        });

        let settings = await Setting.findOne();
        if (!settings) settings = await Setting.create({});
        settings.headerBannerUrl = result.secure_url;
        settings.headerBannerType = resourceType;
        await settings.save();
        
        console.log("Banner OK:", result.secure_url, resourceType);
        res.json({ success: true, url: result.secure_url, type: resourceType });
    } catch (err) {
        console.error("Banner Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// LOGO UPLOAD - GOLDEN WALA HI RAHEGA
router.post('/upload/logo', upload.single('logo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file' });
        let settings = await Setting.findOne();
        if (!settings) settings = await Setting.create({});
        settings.headerLogoUrl = req.file.path;
        await settings.save();
        res.json({ success: true, url: req.file.path });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
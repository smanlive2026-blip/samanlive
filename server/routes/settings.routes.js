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

// HELPER - HAMESHA LATEST SETTING LAO (DUPLICATE BUG FIX)
async function getLatestSettings() {
    let settings = await Setting.findOne().sort({ _id: -1 });
    if (!settings) {
        settings = await Setting.create({ 
            headerBannerUrl: '', 
            headerBannerType: 'image',
            headerBannerHeight: 200,
            headerLogoUrl: '', 
            appName: 'SAMAN LIVE'
        });
    }
    return settings;
}

// GET SETTINGS - HAMESHA LATEST WALA
router.get('/settings', async (req, res) => {
    try {
        let settings = await Setting.findOne().sort({ _id: -1 });
        if (!settings) {
            settings = await Setting.create({ 
                headerBannerUrl: '', 
                headerBannerType: 'image',
                headerBannerHeight: 200,
                headerLogoUrl: '', 
                appName: 'SAMAN LIVE'
            });
        }
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load settings' });
    }
});

// UPDATE SETTINGS
router.put('/settings', express.json({limit: '30mb'}), async (req, res) => {
    try {
        let settings = await getLatestSettings();
        Object.assign(settings, req.body);
        await settings.save();
        res.json({ success: true, data: settings });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// BANNER UPLOAD - NAYA UPLOAD = NAYA LINK - VIDEO FIX
router.post('/upload/banner', bannerMemoryUpload.single('banner'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file' });
        
        console.log("Banner File:", req.file.originalname, req.file.mimetype, req.file.size);

        const isVideo = req.file.mimetype.startsWith('video/');
        
        // VIDEO KE LIYE AUTO + CHUNK_SIZE - YAHI FIX HAI
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: 'samanlive/banner',
                    resource_type: 'auto',
                    chunk_size: 6000000,
                },
                (error, result) => {
                    if(error) {
                        console.error("Cloudinary Video Error:", error);
                        return reject(error);
                    }
                    resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        const resourceType = result.resource_type === 'video' ? 'video' : 'image';

        // NAYA LINK DB ME SAVE - AB FINDONE+SAVE SE (100% KAAM KAREGA)
        let settings = await getLatestSettings();
        settings.headerBannerUrl = result.secure_url;
        settings.headerBannerType = resourceType;
        await settings.save();
        
        console.log("Banner Naya Link:", result.secure_url, "Type:", resourceType);
        res.json({ success: true, url: result.secure_url, type: resourceType });
    } catch (err) {
        console.error("Banner Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// LOGO UPLOAD - GOLDEN WALA, NAYA UPLOAD = NAYA LINK
router.post('/upload/logo', upload.single('logo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file' });
        
        const newUrl = req.file.path; // Cloudinary ka naya permanent link

        // NAYA LINK DB ME SAVE - PURANA HAT JAYEGA, NAYA DIKHEGA
        let settings = await getLatestSettings();
        settings.headerLogoUrl = newUrl;
        await settings.save();

        console.log("Logo Naya Link:", newUrl);
        res.json({ success: true, url: newUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
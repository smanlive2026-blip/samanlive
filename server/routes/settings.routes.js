// LOCATION: server/routes/settings.routes.js - V12 FINAL FIXED - V10 SAME + LOGO 500 FIX + CLOUDINARY MEMORY + LAUNCHER COMPATIBLE
const express = require('express');
const Setting = require('../models/Setting');
const { cloudinary } = require('../utils/cloudinary');
const multer = require('multer');
const router = express.Router();

// VERCEL SAFE - MEMORY ONLY - NO DISK - LOGO + BANNER DONO KE LIYE
const memoryUpload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 }
});

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

async function uploadToCloudinaryBuffer(buffer, folder, resource_type='auto'){
    return await new Promise((resolve, reject)=>{
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type, chunk_size: 6000000 },
            (error, result) => { if(error) return reject(error); resolve(result); }
        );
        stream.end(buffer);
    });
}

// GET SETTINGS - MAIN APP + ADMIN DONO USE KARTE HAIN
router.get('/settings', async (req, res) => {
    try {
        let settings = await Setting.findOne().sort({ _id: -1 });
        if (!settings) {
            settings = await Setting.create({});
        }
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load settings' });
    }
});

// GET SETTINGS FOR MAIN APP - PUBLIC - CACHED
router.get('/settings/public', async (req, res) => {
    try {
        let settings = await Setting.findOne().sort({ _id: -1 });
        if (!settings) settings = await Setting.create({});
        
        const publicSettings = {
            appName: settings.appName,
            appTagline: settings.appTagline,
            headerLogoUrl: settings.headerLogoUrl,
            headerLogoSize: settings.headerLogoSize,
            headerHeight: settings.headerHeight,
            headerColor: settings.headerColor,
            headerTextColor: settings.headerTextColor,
            headerShowLogo: settings.headerShowLogo,
            headerShowSearch: settings.headerShowSearch,
            headerShowCart: settings.headerShowCart,
            headerShowScanner: settings.headerShowScanner,
            headerBannerUrl: settings.headerBannerUrl,
            headerBannerImageUrl: settings.headerBannerImageUrl,
            headerBannerVideoUrl: settings.headerBannerVideoUrl,
            headerBannerActive: settings.headerBannerActive,
            headerBannerType: settings.headerBannerType,
            headerBannerHeight: settings.headerBannerHeight,
            bannerAutoPlay: settings.bannerAutoPlay,
            bannerShowOverlay: settings.bannerShowOverlay,
            bannerShow: settings.bannerShow,
            productCardStyle: settings.productCardStyle,
            productCardSize: settings.productCardSize,
            productScrollType: settings.productScrollType,
            productScrollSpeed: settings.productScrollSpeed,
            productPerRow: settings.productPerRow,
            productGap: settings.productGap,
            productShowDiscount: settings.productShowDiscount,
            productShowShopName: settings.productShowShopName,
            productShowAddCart: settings.productShowAddCart,
            productBorderRadius: settings.productBorderRadius,
            productShadow: settings.productShadow,
            categoryShow: settings.categoryShow,
            categoryStyle: settings.categoryStyle,
            categorySize: settings.categorySize,
            historyShow: settings.historyShow,
            historyTitle: settings.historyTitle,
            adShow: settings.adShow,
            adTitle: settings.adTitle,
            nearbyShow: settings.nearbyShow,
            nearbyTitle: settings.nearbyTitle,
            bottomNavShow: settings.bottomNavShow,
            bottomNavColor: settings.bottomNavColor,
            bottomNavActiveColor: settings.bottomNavActiveColor,
            bottomNavHeight: settings.bottomNavHeight,
            bottomNavButtons: settings.bottomNavButtons,
            footerShow: settings.footerShow,
            footerStyle: settings.footerStyle,
            footerColor: settings.footerColor,
            footerText: settings.footerText,
            footerAbout: settings.footerAbout,
            footerLinks: settings.footerLinks,
            primaryColor: settings.primaryColor,
            secondaryColor: settings.secondaryColor,
            accentColor: settings.accentColor,
            backgroundColor: settings.backgroundColor,
            fontFamily: settings.fontFamily,
            facebook: settings.facebook,
            instagram: settings.instagram,
            youtube: settings.youtube,
            maintenanceMode: settings.maintenanceMode
        };
        res.json(publicSettings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE SETTINGS - ADMIN FULL CONTROL
router.put('/settings', express.json({limit: '50mb'}), async (req, res) => {
    try {
        let settings = await getLatestSettings();
        Object.assign(settings, req.body);
        await settings.save();
        console.log('✅ Settings updated by admin - fields:', Object.keys(req.body).join(', '));
        res.json({ success: true, data: settings });
    } catch (err) {
        console.error('Settings update error:', err);
        res.status(500).json({ error: err.message });
    }
});

// PATCH SINGLE FIELD - FAST UPDATE
router.patch('/settings/:field', express.json({limit: '10mb'}), async (req, res) => {
    try {
        const field = req.params.field;
        let settings = await getLatestSettings();
        settings[field] = req.body.value;
        await settings.save();
        res.json({ success: true, field, value: req.body.value });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// BANNER UPLOAD - IMAGE + VIDEO - MEMORY + CLOUDINARY - VERCEL SAFE
router.post('/upload/banner', memoryUpload.single('banner'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file' });
        console.log("Banner File:", req.file.originalname, req.file.mimetype, req.file.size);

        const result = await uploadToCloudinaryBuffer(req.file.buffer, 'samanlive/banner', 'auto');

        const resourceType = result.resource_type === 'video' ? 'video' : 'image';
        let settings = await getLatestSettings();
        settings.headerBannerUrl = result.secure_url;
        settings.headerBannerType = resourceType;
        if(resourceType==='video') {
            settings.headerBannerVideoUrl = result.secure_url;
            settings.headerBannerActive = 'video';
        } else {
            settings.headerBannerImageUrl = result.secure_url;
            settings.headerBannerActive = 'image';
        }
        await settings.save();
        
        console.log("✅ Banner saved:", result.secure_url, resourceType);
        res.json({ success: true, url: result.secure_url, type: resourceType });
    } catch (err) {
        console.error("Banner Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// LOGO UPLOAD - FIXED V12 - MEMORY + CLOUDINARY - VERCEL 500 FIX - NO DISK
router.post('/upload/logo', memoryUpload.single('logo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file - logo field missing' });
        console.log("Logo File:", req.file.originalname, req.file.mimetype, req.file.size);

        const result = await uploadToCloudinaryBuffer(req.file.buffer, 'samanlive/logo', 'image');

        let settings = await getLatestSettings();
        settings.headerLogoUrl = result.secure_url;
        await settings.save();

        console.log("✅ Logo saved to Cloudinary:", result.secure_url);
        res.json({ success: true, url: result.secure_url });
    } catch (err) {
        console.error("Logo Error:", err);
        res.status(500).json({ error: err.message || 'Cloudinary config missing? Check CLOUDINARY_CLOUD_NAME' });
    }
});

// LEGACY ALIAS - /api/upload/logo -> same handler for launcher compatibility
router.post('/upload/logo/legacy', memoryUpload.single('logo'), async (req, res) => {
    try{
        if(!req.file) return res.status(400).json({error:'No file'});
        const result = await uploadToCloudinaryBuffer(req.file.buffer, 'samanlive/logo', 'image');
        const settings = await getLatestSettings();
        settings.headerLogoUrl = result.secure_url;
        await settings.save();
        res.json({ success:true, url: result.secure_url });
    }catch(e){ res.status(500).json({error:e.message}); }
});

// RESET SETTINGS
router.post('/settings/reset', async (req, res) => {
    try {
        await Setting.deleteMany({});
        const settings = await Setting.create({ appName: 'SAMAN LIVE' });
        res.json({ success: true, data: settings, message: 'Settings reset to default' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// EXPORT SETTINGS
router.get('/settings/export', async (req, res) => {
    try {
        const settings = await getLatestSettings();
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
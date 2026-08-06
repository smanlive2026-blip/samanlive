// server/routes/media.js
// LOCATION: Upload + Fetch sabhi media yahi se hoga
const express = require('express');
const router = express.Router();
const Media = require('../models/Media');
const { upload } = require('../middleware/upload'); 
const { getShopId } = require('../utils/shopId'); // ✅ NAYA IMPORT

// LOCATION: POST /api/media/upload  -> Photo upload karo
router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        let { shopId, template, type, refId } = req.body;
        if(!req.file) return res.status(400).json({ error: 'Image missing' });

        shopId = String(shopId); // ✅ HAMESHA STRING
        const url = `/uploads/${req.file.filename}`;

        // LOCATION: Agar banner/logo hai to purana update, naya nahi banega
        const media = await Media.findOneAndUpdate(
            { shopId, type, refId: refId || null },
            { url, template },
            { upsert: true, new: true }
        );
        res.json({ success: true, url: media.url });
    } catch(e) { 
        console.error(e);
        res.status(500).json({ error: e.message }); 
    }
});

// LOCATION: GET /api/media/:shopId  -> 1 shop ki saari photo le aao
router.get('/:shopId', async (req,res) => {
    try {
        const shopId = getShopId(req); // ✅ HELPER USE KIYA
        const media = await Media.find({ shopId: shopId });
        res.json({ success: true, data: media });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
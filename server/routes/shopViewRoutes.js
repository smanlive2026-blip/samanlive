const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const path = require('path');
const fs = require('fs');

// Distance nikalne ka function
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // KM
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ========================================
// 1. NEARBY SHOPS - SAB SHOP CHAHIYE. KOI FILTER NAHI
// URL: /api/shop-view/nearby-shops?lat=23.22&lng=72.58
// ========================================
router.get('/nearby-shops', async (req, res) => {
    try {
        const { lat, lng } = req.query;
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);

        // SABHI SHOP NIKALO. APPROVED PENDING KUCH NAHI DEKHEGA
        let shops = await Shop.find({})
            .select('-ownerId -approvedBy -rejectionReason -email -phone -managerCodes')
            .limit(1000)
            .lean();

        // LOCATION HAI TO DISTANCE LAGA KE SORT
        if(lat && lng && !isNaN(latitude) && !isNaN(longitude)) {
            shops = shops.map(shop => {
                if(shop.location?.coordinates) {
                    const [shopLng, shopLat] = shop.location.coordinates;
                    shop.distance = getDistance(latitude, longitude, shopLat, shopLng);
                } else {
                    shop.distance = 9999; // location nahi hai to sabse last
                }
                return shop;
            }).sort((a,b) => a.distance - b.distance); // paas wali pehle
        } 
        // LOCATION NAHI HAI TO NAYI WALI PEHLE
        else {
            shops = shops.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        res.json({ 
            success: true, 
            count: shops.length, 
            data: shops
        });

    } catch (err) { 
        console.error('❌ nearby-shops error:', err);
        res.status(500).json({ error: err.message }); 
    }
});

// ========================================
// 2. SINGLE SHOP TEMPLATE KHOLNA
// URL: /api/shop-view/:shopId
// ========================================
router.get('/:shopId', async (req, res) => {
    try {
        const { shopId } = req.params;
        const shop = await Shop.findById(shopId);
        if(!shop) return res.status(404).send("Shop not found");
        
        const template = shop.template || shop.shopType || 'general'; 
        const templatePath = path.join(__dirname, '../../public/shop-templates', template);
        const possibleFiles = ['customer-view.html', 'user-view.html', 'shop-view.html'];
        let viewFile = null;
        for(let file of possibleFiles) {
            const filePath = path.join(templatePath, file);
            if(fs.existsSync(filePath)) { viewFile = filePath; break; }
        }
        if(!viewFile) viewFile = path.join(__dirname, '../../public/shop-templates/general/user-view.html');
        res.sendFile(viewFile);
    } catch(err) { res.status(500).send(err.message); }
});

module.exports = router;
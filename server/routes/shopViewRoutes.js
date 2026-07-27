const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');

// Distance nikalne ka function - Meter me
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // METER
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c); // meter me round karke
}

// ========================================
// 1. NEARBY SHOPS - APP KE LIYE
// URL: /api/shop-view/nearby-shops?lat=23.22&lng=72.58
// ========================================
router.get('/nearby-shops', async (req, res) => {
    try {
        const { lat, lng } = req.query;
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);

        // Sirf active + approved shops
        let shops = await Shop.find({ isActive: true, status: 'approved' })
            .select('shopName icon logo uploadedLogo template serviceType shopType location createdAt')
            .limit(1000)
            .lean();

        if(lat && lng && !isNaN(latitude) && !isNaN(longitude)) {
            shops = shops.map(shop => {
                if(shop.location?.coordinates?.length === 2) {
                    const [shopLng, shopLat] = shop.location.coordinates;
                    shop.distance = getDistance(latitude, longitude, shopLat, shopLng); // meter
                } else {
                    shop.distance = 999999; // bahut door
                }
                return shop;
            }).sort((a,b) => a.distance - b.distance).slice(0, 100); // top 100
        } else {
            shops = shops.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 100);
        }

        // ✅ APP KE LIYE FINAL FORMAT - LOGO + KM
        const finalShops = shops.map(shop => ({
            _id: shop._id,
            shopId: shop._id,
            shopName: shop.shopName || 'Shop',
            logo: shop.uploadedLogo || shop.logo || shop.icon || '/assets/default-shop.png', // ✅ logo priority
            template: (shop.template || shop.serviceType || 'common').toLowerCase().trim(), // ✅ sabse important
            shopType: shop.shopType,
            distance: shop.distance // meter me
        }));

        res.json({ success: true, count: finalShops.length, data: finalShops });
    } catch (err) { 
        console.error('❌ nearby-shops error:', err);
        res.status(500).json({ success: false, error: err.message }); 
    }
});

// ========================================
// 2. SINGLE SHOP REDIRECT - PURANA LINK SUPPORT
// URL: /shop/:shopId/view 
// Ab ye seedha /shop-templates/ wale pe bhej dega
// ========================================
router.get('/:shopId/view', async (req, res) => {
    try {
        const { shopId } = req.params;
        const shop = await Shop.findById(shopId);
        if(!shop) return res.status(404).send("Shop not found");
        
        const template = (shop.template || shop.serviceType || 'common').toLowerCase().trim();
        
        // user-view wale template
        const userViewTemplates = ['kirana', 'medical', 'restaurant']; 
        const fileName = userViewTemplates.includes(template) ? 'user-view.html' : 'customer-view.html';
        
        const newUrl = `/shop-templates/${template}/${fileName}?shopId=${shopId}`;
        console.log(`✅ Redirecting: ${shop.shopName} to ${newUrl}`);
        
        res.redirect(301, newUrl); // 301 permanent redirect

    } catch(err) { 
        console.error(err);
        res.status(500).send(err.message); 
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();

// Models import kar
const User = require('../models/User');
const Shop = require('../models/Shop');
const Area = require('../models/Area');
const Module = require('../models/Module');
const Manager = require('../models/Manager');
const Content = require('../models/Content');

// GET /api/stats - Dashboard ke liye saare counts
router.get('/stats', async (req, res) => {
    try {
        const [
            userCount,
            shopCount,
            areaCount,
            moduleCount,
            managerCount,
            contentCount,
            pendingShops
        ] = await Promise.all([
            User.countDocuments(),
            Shop.countDocuments(),
            Area.countDocuments(),
            Module.countDocuments(),
            Manager.countDocuments(),
            Content.countDocuments(),
            Shop.countDocuments({ status: 'pending' })
        ]);

        res.json({
            success: true,
            users: userCount,
            shops: shopCount,
            areas: areaCount, // ← Dashboard me ye use hoga
            modules: moduleCount,
            managers: managerCount,
            content: contentCount,
            pendingShops: pendingShops
        });
    } catch (err) {
        console.error('Stats API Error:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
});

// GET /api/stats/areas - Areas ka detailed stats
router.get('/stats/areas', async (req, res) => {
    try {
        const areas = await Area.find().lean();
        
        const areaStats = await Promise.all(
            areas.map(async (area) => {
                const [shops, managers, users] = await Promise.all([
                    Shop.countDocuments({ areaCode: area.areaCode }),
                    Manager.countDocuments({ areaCode: area.areaCode }),
                    User.countDocuments({ areaCode: area.areaCode })
                ]);
                
                return {
                    ...area,
                    shopCount: shops,
                    managerCount: managers,
                    userCount: users
                };
            })
        );

        res.json({
            success: true,
            totalAreas: areas.length,
            areas: areaStats
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
});

module.exports = router;

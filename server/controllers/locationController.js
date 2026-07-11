// iska location  server/controllers/locationControllers.js h

const { UserLocation, ShopLocation } = require('../models/locationModel');

// USER LOCATION UPDATE
exports.updateUserLocation = async (req, res) => {
    try {
        const { userId, lat, lng } = req.body;
        if (!userId ||!lat ||!lng) return res.status(400).json({ error: 'Missing data' });

        await UserLocation.findOneAndUpdate(
            { userId },
            {
                $set: {
                    location: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
                    lastSeen: new Date()
                }
            },
            { upsert: true, new: true }
        );
        res.json({ success: true, message: 'Location updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// SHOP LOCATION UPDATE
exports.updateShopLocation = async (req, res) => {
    try {
        const { shopId, lat, lng, type, range, address } = req.body;
        if (!shopId ||!lat ||!lng) return res.status(400).json({ error: 'Missing data' });

        await ShopLocation.findOneAndUpdate(
            { shopId },
            {
                $set: {
                    location: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
                    locationType: type || 'fixed',
                    deliveryRange: range || 5,
                    address: address || '',
                    lastUpdated: new Date()
                }
            },
            { upsert: true, new: true }
        );
        res.json({ success: true, message: 'Shop location updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// NEARBY SHOPS GET
exports.getNearbyShops = async (req, res) => {
    try {
        const { lat, lng, radius = 5000 } = req.query; // radius in meters
        if (!lat ||!lng) return res.status(400).json({ error: 'Lat Lng required' });

        const shops = await ShopLocation.find({
            location: {
                $near: {
                    $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
                    $maxDistance: parseInt(radius)
                }
            }
        }).limit(50);

        res.json({ success: true, shops });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
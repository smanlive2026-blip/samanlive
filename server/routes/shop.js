const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const User = require('../models/User');
const ShopHistory = require('../models/ShopHistory');
const auth = require('../middleware/authenticateToken');

// ========================================
// POST /api/shop/create - User apni shop banaye
// ========================================
router.post('/shop/create', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Check if user already has a shop
        if (user.shopId) {
            return res.status(400).json({ success: false, error: 'You already have a shop' });
        }

        const {
            shopName,
            ownerName,
            phone,
            email,
            address,
            serviceType,
            description,
            location,
            range,
            icon,
            banner
        } = req.body;

        // Validation
        if (!shopName ||!ownerName ||!phone ||!serviceType ||!location) {
            return res.status(400).json({
                success: false,
                error: 'Shop name, owner name, phone, service type and location are required'
            });
        }

        // Location format check: [lng, lat]
        if (!location.coordinates ||!Array.isArray(location.coordinates) || location.coordinates.length!== 2) {
            return res.status(400).json({
                success: false,
                error: 'Location coordinates [lng, lat] required'
            });
        }

        // FIX 1: Address object properly merge karo
        const finalAddress = {
            line1: address?.line1 || user.address?.line1 || '',
            line2: address?.line2 || user.address?.line2 || '',
            city: address?.city || user.address?.city || 'Unknown',
            state: address?.state || user.address?.state || '',
            pincode: address?.pincode || user.address?.pincode || ''
        };

        const shopData = {
            ownerId: req.userId,
            createdBy: req.userId,
            shopName,
            ownerName,
            phone,
            email: email || user.email,
            address: finalAddress,
            area: finalAddress.city,
            serviceType,
            description: description || '',
            location: {
                type: 'Point',
                coordinates: [parseFloat(location.coordinates[0]), parseFloat(location.coordinates[1])]
            },
            range: range || 5000,
            icon: icon || '🏪',
            banner: banner || '',
            bannerApproved: false,
            status: 'pending',
            isActive: true
        };

        const shop = new Shop(shopData);
        await shop.save();

        // FIX 2: User ek hi baar save karo
        user.shopId = shop._id;
        user.hasShop = true;
        user.notifications.push({
            type: 'shop',
            title: 'Shop Created Successfully!',
            message: `Your shop "${shop.shopName}" is under review. We'll notify you once approved.`,
            actionUrl: '/shop/dashboard'
        });
        await user.save();

        res.json({
            success: true,
            shop,
            message: 'Shop created successfully, pending admin approval'
        });
    } catch (error) {
        console.error('Create shop error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// GET /api/shop/my-shop - User ki shop get karo
// ========================================
router.get('/shop/my-shop', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user ||!user.shopId) {
            return res.json({ success: false, error: 'No shop found' });
        }

        const shop = await Shop.findById(user.shopId);
        if (!shop) {
            return res.json({ success: false, error: 'Shop not found' });
        }

        res.json({ success: true, shop });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// PUT /api/shop/update - User apni shop update kare
// ========================================
router.put('/shop/update', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user ||!user.shopId) {
            return res.status(404).json({ success: false, error: 'No shop found' });
        }

        const shop = await Shop.findById(user.shopId);
        if (!shop) {
            return res.status(404).json({ success: false, error: 'Shop not found' });
        }

        const oldData = shop.toObject();

        // Allowed fields for user update
        const allowedFields = [
            'shopName', 'phone', 'email', 'address', 'description',
            'location', 'range', 'icon', 'banner'
        ];

        const updateData = {};
        allowedFields.forEach(field => {
            if (req.body[field]!== undefined) {
                updateData[field] = req.body[field];
            }
        });

        // Address merge properly
        if (req.body.address) {
            updateData.address = {
               ...shop.address.toObject(),
               ...req.body.address
            };
            if (req.body.address.city) {
                updateData.area = req.body.address.city;
            }
        }

        // Agar banner change hua to approval reset karo
        if (req.body.banner && req.body.banner!== shop.banner) {
            updateData.bannerApproved = false;
            updateData.bannerApprovedBy = null;
            updateData.bannerApprovedAt = null;
        }

        // Location update
        if (req.body.location && req.body.location.coordinates) {
            updateData.location = {
                type: 'Point',
                coordinates: [
                    parseFloat(req.body.location.coordinates[0]),
                    parseFloat(req.body.location.coordinates[1])
                ]
            };
        }

        const updatedShop = await Shop.findByIdAndUpdate(
            user.shopId,
            updateData,
            { new: true }
        );

        // Log history
        await ShopHistory.create({
            managerId: req.userId,
            shopId: shop._id,
            action: 'edit',
            shopName: shop.shopName,
            area: updatedShop.area || shop.area,
            oldData: oldData,
            newData: updatedShop.toObject()
        });

        res.json({ success: true, shop: updatedShop, message: 'Shop updated successfully' });
    } catch (error) {
        console.error('Update shop error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// GET /api/shop/:id - Public shop detail
// ========================================
router.get('/shop/:id', async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id);

        if (!shop) {
            return res.status(404).json({ success: false, error: 'Shop not found' });
        }

        // Sirf approved aur active shops public me dikhao
        if (shop.status!== 'approved' ||!shop.isActive) {
            return res.status(403).json({ success: false, error: 'Shop not available' });
        }

        // Banner approved nahi hai to hide kar do
        const shopData = shop.toObject();
        if (!shop.bannerApproved) {
            shopData.banner = '';
        }

        res.json({ success: true, shop: shopData });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
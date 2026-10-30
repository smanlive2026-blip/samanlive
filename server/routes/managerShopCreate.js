// LOCATION: server/routes/managerShopCreate.js - V21 - 50 MODES - FULL CODE
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const Shop = require('../models/Shop');
const Manager = require('../models/Manager');
const Area = require('../models/Area');

const authManager = async (req, res, next) => {
    try {
        const token = ((req.headers.authorization || '').replace('Bearer ', '').trim()
            || req.headers['x-manager-token']
            || req.headers['manager-token']
            || req.headers.token
            || req.query.token
            || req.query.managerToken
            || (req.body && (req.body.managerToken || req.body.token || req.body.loginToken || req.body.authToken)) || '').toString().trim();
        if (!token) return res.status(401).json({ success: false, error: 'No token provided' });
        const manager = await Manager.findOne({ loginToken: token, status: true });
        if (!manager) return res.status(403).json({ success: false, error: 'Manager not found' });
        req.manager = manager;
        next();
    } catch (err) {
        res.status(401).json({ success: false, error: 'Auth failed: ' + err.message });
    }
};

// BACKEND COPY - 69 shops + common - V21 WORLD
const TEMPLATE_MAP = {
    'kirana':'retail','thela':'retail','pansari':'retail','general':'retail','achar-shop':'retail','grocery-sweet':'retail','battery':'retail','bartan':'retail','plastic':'retail','dairy':'mandi','chakki':'mandi','krishi':'agriculture','patanjali':'healthcare',
    'cloth':'fashion','saree-shop':'fashion','child-clothes':'fashion','kids-wear':'fashion','suit-shop':'fashion','winter-wear':'fashion','fabric-shop':'fashion','footwear':'fashion','purse':'fashion','kambal-shop':'fashion','mat-shop':'fashion','mattress-shop':'fashion','watch-shop':'fashion','jewellery':'fashion','beauty':'fashion','murti-shop':'handicraft',
    'restaurant':'food','dhaba':'food','hotel':'food','pizza':'food','bakery':'food','halwai':'food','juice':'food','tea':'food','fruit':'mandi','meat':'mandi','sabji':'mandi',
    'auto':'service','mobile':'service','mochi':'service','optical':'healthcare','photo-studio':'service','salon':'service','plumbing':'service','door-shop':'bulk','ply-board':'bulk','puja':'handicraft','painting':'handicraft','service':'service','paint-shop':'bulk',
    'clinic':'healthcare','hospital':'healthcare','medical':'healthcare','vet-clinic':'healthcare','vet-shop':'healthcare','nursery':'mandi',
    'rental':'rental','decoration-shop':'rental','charpai-shop':'rental','tripal-shop':'rental','flower':'mandi',
    'hardware':'bulk','brick':'bulk','tiles':'bulk','sanitary':'bulk','furniture':'bulk','electronics':'bulk','sports':'bulk','stationery':'education','toy-shop':'bulk',
    'csc':'csc','cyber-cafe':'csc','xerox':'csc','coaching':'education','petrol-pump':'fuel','common':'retail','other':'other'
};

function resolveTemplate(templateId) {
    const id = String(templateId || 'common').trim().toLowerCase();
    const mode = TEMPLATE_MAP[id] || 'retail';
    if (!TEMPLATE_MAP[id]) return { id: 'common', folder: 'common', type: 'common', businessMode: 'retail' };
    const dashPath = path.join(__dirname, '../../public/shop-templates', id, 'dashboard.html');
    if (!fs.existsSync(dashPath)) {
        console.log(`⚠️ Dashboard missing for ${id}, fallback to common but mode ${mode} keep`);
        return { id, folder: 'common', type: mode, businessMode: mode };
    }
    return { id, folder: id, type: mode, businessMode: mode };
}

router.post('/manager/create-shop-v2', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        const {
            shopName, ownerName, phone, contact, email,
            serviceType, categoryId, template, templateFolder,
            shopType, businessMode, icon, logo, range, address, description, bucket
        } = req.body;

        if (!shopName || !String(shopName).trim()) {
            return res.status(400).json({ success: false, error: 'Shop Name zaruri hai' });
        }

        const requestedTemplate = template || serviceType || categoryId || shopType || 'common';
        const tpl = resolveTemplate(requestedTemplate);
        let finalFolder = templateFolder && TEMPLATE_MAP[templateFolder] ? templateFolder : tpl.folder;
        const reqDashPath = path.join(__dirname, '../../public/shop-templates', finalFolder, 'dashboard.html');
        if (!fs.existsSync(reqDashPath)) finalFolder = 'common';
        
        const finalBusinessMode = businessMode || tpl.businessMode || 'retail';
        const finalType = shopType || tpl.id;

        const currentShopCount = await Shop.countDocuments({
            $or: [
                { areaCode: manager.areaCode },
                { managerCodes: manager.managerCode },
                { controlledBy: manager._id }
            ],
            isActive: true
        });
        const maxShops = manager.maxShops || 10;
        if (currentShopCount >= maxShops) {
            return res.status(403).json({
                success: false,
                error: `Shop limit reached. Max allowed: ${maxShops}. Contact admin to increase limit.`
            });
        }

        const existingShop = await Shop.findOne({
            shopName: String(shopName).trim(),
            areaCode: manager.areaCode
        });
        if (existingShop) {
            return res.status(400).json({ success: false, error: 'Shop with this name already exists in your area' });
        }

        const area = await Area.findOne({ areaCode: manager.areaCode }).lean();
        const city = area?.city || manager.city || 'Surat';
        const state = area?.state || manager.state || 'Gujarat';

        const addressObj = (address && typeof address === 'object')
          ? address
            : { line1: address || '', city, state, pincode: area?.pincode || '' };

        const newShop = new Shop({
            shopName: String(shopName).trim(),
            ownerName: ownerName || manager.name,
            phone: phone || contact || '',
            contact: contact || phone || '',
            email: email || '',
            address: {
                line1: addressObj.line1 || '',
                city: addressObj.city || city,
                state: addressObj.state || state,
                pincode: addressObj.pincode || area?.pincode || ''
            },
            icon: icon || '🏪',
            logo: logo || '',
            range: parseInt(range) || 5000,
            description: description || '',
            serviceType: tpl.id,
            categoryId: tpl.id,
            template: tpl.id,
            templateFolder: finalFolder,
            folder: finalFolder,
            module: tpl.id,
            shopType: finalType,
            businessMode: finalBusinessMode,
            bucket: bucket || manager.bucket || 'DEFAULT',
            areaCode: manager.areaCode,
            areaName: area?.areaName || manager.areaName,
            city, state,
            managerCodes: [manager.managerCode],
            claimedBy: manager.managerCode,
            controlledBy: manager._id,
            ownerId: manager._id,
            createdBy: manager._id,
            location: {
                type: 'Point',
                coordinates: [area?.centerLng || 72.8311, area?.centerLat || 21.1702]
            },
            status: 'approved',
            isActive: true,
            isVerified: true,
            worldEnabled: true,
            isWorldShop: true
        });

        await newShop.save();
        await Manager.findByIdAndUpdate(manager._id, { $inc: { currentShopCount: 1 } });

        const dashboardUrl = `/shop-templates/${finalFolder}/dashboard.html?shopId=${newShop._id}`;
        console.log(`✅ Shop Created: ${newShop.shopName} | Template: ${tpl.id} | Mode: ${finalBusinessMode} | Folder: ${finalFolder} | By: ${manager.name}`);

        res.json({
            success: true,
            message: 'Shop created successfully',
            shop: newShop,
            dashboardUrl,
            currentCount: currentShopCount + 1,
            maxShops
        });

    } catch (err) {
        console.error('❌ Create Shop Error:', err);
        if (err.code === 11000) {
            return res.status(400).json({ success: false, error: 'Shop already exists with same details' });
        }
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
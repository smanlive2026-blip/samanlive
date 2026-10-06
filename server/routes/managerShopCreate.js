// ========================================
// SHOP CREATE - AREA MANAGER ONLY
// File: server/routes/managerShopCreate.js
// Mount: app.use('/api', require('./routes/managerShopCreate'))
// API: POST /api/manager/create-shop-v2
// Template Map (Frontend): shop-template-map.js
// Dashboard: /shop-templates/{folder}/dashboard.html?shopId=
// Fallback: common
// ========================================
const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const Manager = require('../models/Manager');
const Area = require('../models/Area');

// ========== AUTH - Manager Token ==========
const authManager = async (req, res, next) => {
    try {
        const token = (req.headers.authorization || '').replace('Bearer ', '').trim() || req.query.token;
        if (!token) return res.status(401).json({ success: false, error: 'No token provided' });
        const manager = await Manager.findOne({ loginToken: token, status: true });
        if (!manager) return res.status(403).json({ success: false, error: 'Manager not found' });
        req.manager = manager;
        next();
    } catch (err) {
        res.status(401).json({ success: false, error: 'Auth failed: ' + err.message });
    }
};

// ========== TEMPLATE MAP - BACKEND COPY ==========
// Frontend wale shop-template-map.js se id -> folder/type
// Naya template bane to yahan ek line jod dena, warna common jayega
const TEMPLATE_MAP = {
    'auto':'product','achar-shop':'product','bakery':'product','bartan':'product','battery':'product',
    'beauty':'service','brick':'product','chakki':'service','charpai-shop':'product','child-clothes':'fashion',
    'clinic':'service','cloth':'fashion','dairy':'product','decoration-shop':'service','door-shop':'product',
    'electronics':'product','fabric-shop':'fashion','flower':'product','footwear':'fashion','fruit':'product',
    'furniture':'product','general':'common','grocery-sweet':'product','halwai':'product','hardware':'product',
    'jewellery':'product','juice':'product','kambal-shop':'product','kids-wear':'fashion','kirana':'product',
    'krishi':'product','mat-shop':'product','mattress-shop':'product','meat':'product','medical':'product',
    'mobile':'product','mochi':'service','murti-shop':'product','nursery':'product','optical':'product',
    'paint-shop':'product','painting':'product','pansari':'product','patanjali':'product','photo-studio':'service',
    'pizza':'food','plastic':'product','plumbing':'product','ply-board':'product','puja':'product',
    'purse':'fashion','rental':'rental','restaurant':'food','sabji':'product','salon':'service',
    'sanitary':'product','saree-shop':'fashion','service':'service','sports':'product','stationery':'product',
    'suit-shop':'fashion','tea':'food','thela':'product','tiles':'product','toy-shop':'product',
    'tripal-shop':'product','vet-clinic':'service','vet-shop':'product','watch-shop':'product','winter-wear':'fashion',
    'common':'common'
};
function resolveTemplate(templateId) {
    const id = String(templateId || 'common').trim();
    if (TEMPLATE_MAP[id]) return { id, folder: id, type: TEMPLATE_MAP[id] };
    return { id: 'common', folder: 'common', type: 'common' };
}

// ========== CREATE SHOP ==========
router.post('/manager/create-shop-v2', authManager, async (req, res) => {
    try {
        const manager = req.manager;
        const {
            shopName, ownerName, phone, contact, email,
            serviceType, categoryId, template, templateFolder,
            shopType, icon, logo, range, address, description, bucket
        } = req.body;

        if (!shopName ||!String(shopName).trim()) {
            return res.status(400).json({ success: false, error: 'Shop Name zaruri hai' });
        }

        // 1. Template resolve - dropdown wali id se hi folder banega
        const requestedTemplate = template || serviceType || categoryId || 'common';
        const tpl = resolveTemplate(requestedTemplate);
        const finalFolder = templateFolder && TEMPLATE_MAP[templateFolder]? templateFolder : tpl.folder;
        const finalType = shopType || tpl.type;

        // 2. Shop limit check
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

        // 3. Duplicate check - same area me same naam nahi
        const existingShop = await Shop.findOne({
            shopName: String(shopName).trim(),
            areaCode: manager.areaCode
        });
        if (existingShop) {
            return res.status(400).json({ success: false, error: 'Shop with this name already exists in your area' });
        }

        // 4. Area details
        const area = await Area.findOne({ areaCode: manager.areaCode }).lean();
        const city = area?.city || manager.city || 'Surat';
        const state = area?.state || manager.state || 'Gujarat';

        // Address normalize - frontend string bhejta hai
        const addressObj = (address && typeof address === 'object')
           ? address
            : { line1: address || '', city, state, pincode: area?.pincode || '' };

        // 5. Shop create - teeno pehchan ek saath save hogi
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

            // ✅ Template system - yahi dashboard decide karega
            serviceType: tpl.id,
            categoryId: tpl.id,
            template: tpl.id,
            templateFolder: finalFolder,
            folder: finalFolder,
            module: tpl.id,
            shopType: finalType,

            bucket: bucket || manager.bucket || 'DEFAULT',
            areaCode: manager.areaCode,
            areaName: area?.areaName || manager.areaName,
            city, state,
            managerCodes: [manager.managerCode],

            // Claim system - manager hi owner/controller
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
            isVerified: true
        });

        await newShop.save();
        await Manager.findByIdAndUpdate(manager._id, { $inc: { currentShopCount: 1 } });

        const dashboardUrl = `/shop-templates/${finalFolder}/dashboard.html?shopId=${newShop._id}`;
        console.log(`✅ Shop Created: ${newShop.shopName} | Template: ${tpl.id} | Folder: ${finalFolder} | By: ${manager.name}`);

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
        // Duplicate key wala saaf message
        if (err.code === 11000) {
            return res.status(400).json({ success: false, error: 'Shop already exists with same details' });
        }
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
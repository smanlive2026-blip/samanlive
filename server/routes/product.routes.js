/**
 * FILE: server/routes/product.routes.js
 * KAAM: Sabhi product ki API yahi se chalegi - Add, Get, Update, Delete
 * KON USE KAREGA: Shop Dashboard, Admin Panel, Area Manager
 * KYA HO RAHA:
 * 1. POST /add - Naya product add - Shop/Manager/Admin
 * 2. GET /shop/:shopId - Ek shop ke product - Customer/Shop
 * 3. GET /admin/all - Sabhi shop ke product filter ke saath - Admin/Manager  
 * 4. PUT /update/:id - Product update
 * 5. DELETE /delete/:id - Product delete
 */
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth'); // login check ke liye
const authManager = require('../middleware/authManager'); // manager check

// === 1. EK SHOP KE PRODUCTS LANA - PUBLIC API ===
// URL: GET /api/products/shop/68a1b2c3?template=fruit
router.get('/shop/:shopId', async (req, res) => {
    try {
        const { shopId } = req.params;
        const { template } = req.query;

        const products = await Product.find({ 
            shopId, 
            template, 
            isActive: true,
            stock: { $gt: 0 } // sirf stock wale
        }).sort({ createdAt: -1 });

        res.json({ success: true, products });
    } catch (e) {
        console.error("Shop Product Fetch Error:", e);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// === 2. PRODUCT ADD KARNA - SHOP/MANAGER/ADMIN ===
// URL: POST /api/products/add
// BODY: {shopId, template, name, price, extra: {}}
router.post('/add', auth, async (req, res) => {
    try {
        const productData = {
            ...req.body,
            createdBy: req.user._id,
            createdByRole: req.user.role // 'shop', 'admin', 'area_manager'
        };

        const product = new Product(productData);
        await product.save();

        res.json({ success: true, message: "Product add ho gaya", product });
    } catch (e) {
        console.error("Product Add Error:", e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// === 3. ADMIN/AREA MANAGER - SABHI PRODUCT FILTER KE SAATH ===
// URL: GET /api/products/admin/all?template=fruit&area=Surat
router.get('/admin/all', auth, async (req, res) => {
    try {
        const filters = { ...req.query };
        // area ke hisab se filter karna ho to Shop collection join karna padega
        
        const products = await Product.find(filters)
            .populate('shopId', 'shopName area city') // shop ka naam bhi aa jaye
            .sort({ createdAt: -1 })
            .limit(500); // zyada load na ho

        res.json({ success: true, products, total: products.length });
    } catch (e) {
        console.error("Admin Product Fetch Error:", e);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// === 4. PRODUCT UPDATE KARNA ===
// URL: PUT /api/products/update/68a1b2c3
router.put('/update/:id', auth, async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true }
        );
        
        if(!product) return res.status(404).json({ success: false, message: "Product nahi mila" });
        
        res.json({ success: true, message: "Product update ho gaya", product });
    } catch (e) {
        console.error("Product Update Error:", e);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// === 5. PRODUCT DELETE KARNA ===
// URL: DELETE /api/products/delete/68a1b2c3
router.delete('/delete/:id', auth, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        
        if(!product) return res.status(404).json({ success: false, message: "Product nahi mila" });
        
        res.json({ success: true, message: "Product delete ho gaya" });
    } catch (e) {
        console.error("Product Delete Error:", e);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// === 6. SINGLE PRODUCT LANA ===
router.get('/single/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('shopId', 'shopName');
        res.json({ success: true, product });
    } catch (e) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

module.exports = router;
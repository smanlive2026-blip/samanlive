// ========================================
// FILE: routes/admin.js 
// Kaam: Sirf Category Master ke liye Admin API
// ========================================
const express = require('express');
const router = express.Router();
const CategoryMaster = require('../models/CategoryMaster');

// 1. Kisi category ke template products lana
// URL: GET /api/admin/category-master/kirana
router.get('/category-master/:category', async (req,res)=>{
    try{
        const data = await CategoryMaster.findOne({category: req.params.category.toLowerCase()});
        res.json({success: true, products: data?.products || []});
    }catch(e){ 
        console.error('Get Category Error:', e);
        res.status(500).json({success:false, error:e.message})
    }
});

// 2. Category me naya product add karna
// URL: POST /api/admin/category-master/add-product
router.post('/category-master/add-product', async (req,res)=>{
    try{
        const {category, name, category: subCat, price, stock, image} = req.body;
        if(!category || !name) return res.status(400).json({success:false, error: 'Category and Name required'});
        
        await CategoryMaster.updateOne(
            {category: category.toLowerCase()},
            {$push: {products: {
                name, 
                category: subCat || 'General', 
                price: Number(price) || 0, 
                stock: Number(stock) || 100, 
                image: image || 'https://via.placeholder.com/150'
            }}},
            {upsert: true} // category nahi hai to bana dega
        );
        res.json({success: true, message: 'Product added to template'});
    }catch(e){ 
        console.error('Add Product Error:', e);
        res.status(500).json({success:false, error:e.message})
    }
});

// 3. Template se product delete karna
// URL: DELETE /api/admin/category-master/product/64f1...
router.delete('/category-master/product/:id', async (req,res)=>{
    try{
        await CategoryMaster.updateOne(
            {},
            {$pull: {products: {_id: req.params.id}}}
        );
        res.json({success: true, message: 'Product deleted'});
    }catch(e){ 
        console.error('Delete Product Error:', e);
        res.status(500).json({success:false, error:e.message})
    }
});

module.exports = router;
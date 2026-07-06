const express = require('express');
const router = express.Router();
const CategoryMaster = require('../models/CategoryMaster');

// 1. Kisi category ke products lana
router.get('/category-master/:category', async (req,res)=>{
    try{
        const data = await CategoryMaster.findOne({category: req.params.category.toLowerCase()});
        res.json({success: true, products: data?.products || []});
    }catch(e){ res.status(500).json({success:false, error:e.message})}
});

// 2. Category me product add karna
router.post('/category-master/add-product', async (req,res)=>{
    try{
        const {category, name, subCategory, price, stock, image} = req.body;
        await CategoryMaster.updateOne(
            {category: category.toLowerCase()},
            {$push: {products: {name, category: subCategory, price, stock, image}}},
            {upsert: true}
        );
        res.json({success: true, message: 'Product added to template'});
    }catch(e){ res.status(500).json({success:false, error:e.message})}
});

// 3. Template se product delete
router.delete('/category-master/product/:id', async (req,res)=>{
    try{
        await CategoryMaster.updateOne(
            {},
            {$pull: {products: {_id: req.params.id}}}
        );
        res.json({success: true});
    }catch(e){ res.status(500).json({success:false, error:e.message})}
});

module.exports = router;
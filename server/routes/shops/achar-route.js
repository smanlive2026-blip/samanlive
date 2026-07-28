const express = require('express');
const router = express.Router();
const Achar = require('../../models/shops/Achar');
const Shop = require('../../models/Shop');

// ========================================
// ACHAR ROUTES - /api/shops/achar
// ========================================

// 1. GET SINGLE ACHAR
router.get('/item/:id', async (req, res) => {
    try {
        const product = await Achar.findById(req.params.id);
        if(!product) return res.status(404).json({ success: false, message: 'Achar nahi mila' });
        res.json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. GET ALL ACHAR FOR A SHOP
router.get('/:shopId', async (req, res) => {
    try {
        const { shopId } = req.params;
        const { category, search } = req.query;

        let query = { shopId, isActive: true };

        if(category) query.category = category;
        if(search) query.name = { $regex: search, $options: 'i' };

        const products = await Achar.find(query).sort({ createdAt: -1 });
        
        res.json({ 
            success: true, 
            count: products.length,
            products 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. ADD NEW ACHAR
router.post('/', async (req, res) => {
    try {
        const { shopId, name, category, price500, price1kg, stock, description, jarType, spiceLevel, image, images } = req.body; // CHANGED: image add

        if(!shopId || !name || !price1kg) {
            return res.status(400).json({ success: false, message: 'ShopId, Name, Price1kg jaruri hai' });
        }

        const shop = await Shop.findById(shopId);
        if(!shop) return res.status(404).json({ success: false, message: 'Shop nahi mila' });

        const newAchar = new Achar({
            shopId,
            name,
            category: category || 'Aam',
            price500: price500 || 0,
            price1kg,
            price: price1kg,
            stock: stock || 0,
            description: description || '',
            jarType: jarType || 'Glass',
            spiceLevel: spiceLevel || 'Medium',
            image: image || 'https://placehold.co/400/eab308/fff?text=Achar', // CHANGED
            images: images || [] // CHANGED
        });

        await newAchar.save();
        res.status(201).json({ success: true, message: 'Achar add ho gaya', product: newAchar });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 4. UPDATE ACHAR
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if(req.body.price1kg) req.body.price = req.body.price1kg; // price sync

        const updated = await Achar.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        
        if(!updated) return res.status(404).json({ success: false, message: 'Achar nahi mila' });
        
        res.json({ success: true, message: 'Update ho gaya', product: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 5. DELETE ACHAR
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Achar.findByIdAndDelete(req.params.id);
        if(!deleted) return res.status(404).json({ success: false, message: 'Achar nahi mila' });
        res.json({ success: true, message: 'Delete ho gaya' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 6. LOW STOCK ALERT
router.get('/low-stock/:shopId', async (req, res) => {
    try {
        const products = await Achar.find({ 
            shopId: req.params.shopId, 
            stock: { $lt: 2 },
            isActive: true 
        }).sort({ stock: 1 });
        res.json({ success: true, products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 7. UPDATE STOCK
router.put('/stock/:id', async (req, res) => {
    try {
        const { quantity } = req.body;
        const product = await Achar.findById(req.params.id);
        if(!product) return res.status(404).json({ success: false, message: 'Achar nahi mila' });

        product.stock = product.stock - quantity;
        if(product.stock < 0) product.stock = 0;
        await product.save();

        res.json({ success: true, message: 'Stock updated', product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
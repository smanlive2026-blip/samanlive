const express = require('express');
const router = express.Router();
const Achar = require('../../models/shops/Achar');
const Shop = require('../../models/Shop');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// ========================================
// CLOUDINARY CONFIG
// ========================================
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// MULTER STORAGE FOR ACHAR IMAGES
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'achar-shop/products',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 800, height: 800, crop: 'limit' }]
    }
});
const upload = multer({ storage: storage });

// ========================================
// ACHAR ROUTES - /api/shops/achar
// ========================================

// 1. UPLOAD IMAGE - NEW ROUTE ADDED
router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if(!req.file) return res.status(400).json({ success: false, message: 'Image nahi mili' });
        res.json({ 
            success: true, 
            url: req.file.path, // cloudinary url
            message: 'Upload ho gaya' 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. GET SINGLE ACHAR
router.get('/item/:id', async (req, res) => {
    try {
        const product = await Achar.findById(req.params.id);
        if(!product) return res.status(404).json({ success: false, message: 'Achar nahi mila' });
        res.json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. GET ALL ACHAR FOR A SHOP
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

// 4. ADD NEW ACHAR
router.post('/', async (req, res) => {
    try {
        console.log("BODY RECEIVED:", req.body); // debug ke liye

        const { shopId, name, category, price500, price1kg, stock, description, jarType, spiceLevel, image, images, isActive } = req.body;

        if(!shopId || !name) {
            return res.status(400).json({ success: false, message: 'ShopId aur Name jaruri hai' });
        }
        if(price1kg === undefined || price1kg === null) {
            return res.status(400).json({ success: false, message: 'Price1kg jaruri hai' });
        }

        // Shop check hata diya kyunki ab shopId String hai
        // const shop = await Shop.findById(shopId); 

        const newAchar = new Achar({
            shopId: String(shopId),
            name: String(name).trim(),
            category: category || 'Aam',
            price500: Number(price500) || 0,
            price1kg: Number(price1kg),
            price: Number(price1kg), // auto sync
            stock: Number(stock) || 0,
            description: description || '',
            jarType: jarType || 'Glass',
            spiceLevel: spiceLevel || 'Medium',
            image: image || 'https://placehold.co/400/eab308/fff?text=Achar',
            images: images || [],
            isActive: isActive !== undefined ? isActive : true
        });

        await newAchar.save();
        
        console.log("SAVED:", newAchar.name);
        res.status(201).json({ success: true, message: 'Achar add ho gaya', product: newAchar });

    } catch (error) {
        console.log("ADD ACHAR ERROR FULL:", error.message); 
        console.log("ERROR STACK:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});


// 5. UPDATE ACHAR
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if(req.body.price1kg!== undefined) req.body.price = req.body.price1kg; // price sync

        const updated = await Achar.findByIdAndUpdate(id, req.body, { new: true, runValidators: false }); // runValidators false kar de

        if(!updated) return res.status(404).json({ success: false, message: 'Achar nahi mila' });

        res.json({ success: true, message: 'Update ho gaya', product: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 6. DELETE ACHAR
router.delete('/:id', async (req, res) => {
    try {
        // soft delete kar rahe hain
        const deleted = await Achar.findByIdAndUpdate(req.params.id, { isActive: false });
        if(!deleted) return res.status(404).json({ success: false, message: 'Achar nahi mila' });
        res.json({ success: true, message: 'Delete ho gaya' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 7. LOW STOCK ALERT
router.get('/low-stock/:shopId', async (req, res) => {
    try {
        const products = await Achar.find({ 
            shopId: req.params.shopId, 
            stock: { $lt: 5 },
            isActive: true 
        }).sort({ stock: 1 });
        res.json({ success: true, products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 8. UPDATE STOCK
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
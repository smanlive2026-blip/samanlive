const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const MasterProduct = require('../../models/MasterProduct');

// FOLDER BANEGA AGAR NAHI HAI
const uploadDir = './public/local-market/assets/library/';
if (!fs.existsSync(uploadDir)){ fs.mkdirSync(uploadDir, { recursive: true }); }

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'))
});
const upload = multer({ storage });

// 1. GET PRODUCTS
router.get('/products', async (req, res) => {
    try {
        const search = req.query.search || '';
        const category = req.query.category || '';
        let query = {};
        if(search) query.name = { $regex: search, $options: 'i' };
        if(category) query.categoryId = category;

        const products = await MasterProduct.find(query).populate('categoryId', 'name').sort({ createdAt: -1 });
        res.json({ products, total: products.length });
    } catch(err) { res.status(500).json({ message: err.message }); }
});

// 2. GET CATEGORIES
router.get('/categories', async (req, res) => {
    try {
        const products = await MasterProduct.find().populate('categoryId', 'name');
        const grouped = {};
        products.forEach(p => {
            if(p.categoryId) {
                if(!grouped[p.categoryId._id]) grouped[p.categoryId._id] = { _id: p.categoryId._id, name: p.categoryId.name, count: 0 };
                grouped[p.categoryId._id].count++;
            }
        });
        res.json(Object.values(grouped));
    } catch(err) { res.status(500).json({ message: err.message }); }
});

// 3. ADD PRODUCT
router.post('/add-product', upload.array('photos', 10), async (req, res) => {
    try {
        const photos = req.files.map(f => `/local-market/assets/library/${f.filename}`);
        const newProduct = new MasterProduct({
            name: req.body.name,
            categoryId: req.body.category,
            brand: req.body.brand,
            description: req.body.description,
            image: photos[0],
            photos: photos
        });
        await newProduct.save();
        res.json({ success: true, product: newProduct });
    } catch(err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
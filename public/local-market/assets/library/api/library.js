const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Product = require('../../../../models/Product'); // 4 baar upar jana padega

const storage = multer.diskStorage({
    destination: './public/local-market/assets/library/', // PHOTOS YAHI SAVE HONGI
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.get('/products', async (req, res) => {
    const page = parseInt(req.query.page) || 1; const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search || ''; const category = req.query.category || '';
    let query = {}; if(search) query.name = { $regex: search, $options: 'i' }; if(category) query.category = category;
    const products = await Product.find(query).skip((page-1)*limit).limit(limit);
    const total = await Product.countDocuments(query);
    res.json({ products, total });
});

router.get('/categories', async (req, res) => {
    const categories = await Product.aggregate([{ $group: { _id: "$category", count: { $sum: 1 }}}]);
    res.json(categories.map(c => ({ _id: c._id, name: c._id, count: c.count })));
});

router.post('/add-product', upload.array('photos', 10), async (req, res) => {
    const photos = req.files.map(f => `/local-market/assets/library/${f.filename}`);
    const newProduct = new Product({ name: req.body.name, category: req.body.category, brand: req.body.brand, photos });
    await newProduct.save(); res.json({ success: true });
});

module.exports = router;
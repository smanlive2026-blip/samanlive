const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ===== MODEL =====
const masterProductSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    brand: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String, default: '' }, // single image
    images: [{ type: String }], // multiple images
    barcode: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const MasterProduct = mongoose.model('MasterProduct', masterProductSchema);

// ===== GET ALL MASTER PRODUCTS =====
// GET /api/master-products
router.get('/', async (req, res) => {
    try {
        const products = await MasterProduct.find({ isActive: true })
            .populate('categoryId', 'name')
            .sort({ createdAt: -1 });
        
        // category ko seedha bhej de frontend ke liye
        const result = products.map(p => ({
            ...p._doc,
            category: p.categoryId
        }));
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ===== GET SINGLE PRODUCT =====
// GET /api/master-products/:id
router.get('/:id', async (req, res) => {
    try {
        const product = await MasterProduct.findById(req.params.id).populate('categoryId');
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ===== ADD NEW MASTER PRODUCT =====
// POST /api/master-products
router.post('/', async (req, res) => {
    try {
        const { name, categoryId, brand, description, image, images, barcode } = req.body;
        
        if (!name || !categoryId) {
            return res.status(400).json({ message: 'Name and Category are required' });
        }

        const newProduct = new MasterProduct({
            name,
            categoryId,
            brand,
            description,
            image,
            images: images || [],
            barcode
        });

        const saved = await newProduct.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// ===== UPDATE MASTER PRODUCT =====
// PUT /api/master-products/:id
router.put('/:id', async (req, res) => {
    try {
        const updated = await MasterProduct.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: 'Product not found' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// ===== DELETE MASTER PRODUCT =====
// DELETE /api/master-products/:id
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await MasterProduct.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
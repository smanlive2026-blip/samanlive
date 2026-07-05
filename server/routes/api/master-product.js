const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const masterProductSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
    brand: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    images: [{ type: String }],
    barcode: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const MasterProduct = mongoose.model('MasterProduct', masterProductSchema);

router.get('/', async (req, res) => {
    try {
        const products = await MasterProduct.find({ isActive: true }).populate('categoryId').sort({ createdAt: -1 });
        const result = products.map(p => ({ ...p._doc, category: p.categoryId }));
        res.json(result);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', async (req, res) => {
    try {
        const product = await MasterProduct.findById(req.params.id).populate('categoryId');
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', async (req, res) => {
    try {
        const { name, categoryId, brand, description, image, images, barcode } = req.body;
        if (!name || !categoryId) return res.status(400).json({ message: 'Name and Category are required' });
        const newProduct = new MasterProduct({ name, categoryId, brand, description, image, images: images || [], barcode });
        const saved = await newProduct.save();
        res.status(201).json(saved);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', async (req, res) => {
    try {
        const updated = await MasterProduct.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('categoryId');
        if (!updated) return res.status(404).json({ message: 'Product not found' });
        res.json(updated);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
    try {
        const deleted = await MasterProduct.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
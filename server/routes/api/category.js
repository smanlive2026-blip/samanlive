const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    icon: { type: String, default: 'fa-box' },
    createdAt: { type: Date, default: Date.now }
});
const Category = mongoose.model('Category', categorySchema);

router.get('/', async (req, res) => {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
});

router.post('/', async (req, res) => {
    const category = new Category(req.body);
    const saved = await category.save();
    res.json(saved);
});

module.exports = router;
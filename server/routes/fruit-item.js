const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');

// BODY SIZE 10MB
router.use(express.json({ limit: '10mb' }));
router.use(express.urlencoded({ limit: '10mb', extended: true }));

// 0. SHOP KA DATA LANA
router.get('/:shopId', async (req, res) => {
    try {
        console.log("GETTING SHOP:", req.params.shopId);
        const shop = await Shop.findById(req.params.shopId);
        if(!shop) return res.status(404).json({success: false, message: "Shop not found"});
        res.json({ success: true, shop });
    } catch (err) {
        console.error("GET SHOP ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 1. NAYA FRUIT ADD KARNA
router.post('/:shopId/fruit', async (req, res) => {
    try {
        const { item } = req.body;
        console.log("ADDING FRUIT TO SHOP:", req.params.shopId, item.name);

        const shop = await Shop.findByIdAndUpdate(
            req.params.shopId,
            { $push: { items: item } },
            { new: true }
        );
        if(!shop) return res.status(404).json({success: false, message: "Shop not found"});
        res.json({ success: true, shop });
    } catch (err) {
        console.error("ADD FRUIT ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 2. FRUIT UPDATE KARNA
router.put('/:shopId/fruit/:fruitId', async (req, res) => {
    try {
        const { item } = req.body;
        console.log("UPDATING FRUIT:", req.params.fruitId);

        const shop = await Shop.findOneAndUpdate(
            { _id: req.params.shopId, "items.id": req.params.fruitId },
            { $set: { "items.$": item } },
            { new: true }
        );
        if(!shop) return res.status(404).json({success: false, message: "Shop or Fruit not found"});
        res.json({ success: true, shop });
    } catch (err) {
        console.error("UPDATE FRUIT ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 3. FRUIT DELETE KARNA - YAHI BRACKET THEEK KIYA
router.delete('/:shopId/fruit/:fruitId', async (req, res) => {
    try {
        await Shop.findByIdAndUpdate(
            req.params.shopId,
            { $pull: { items: { id: req.params.fruitId } } } // Yaha }) 2 band the
        );
        res.json({ success: true });
    } catch (err) {
        console.error("DELETE FRUIT ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
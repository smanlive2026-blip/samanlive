const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop'); // apna model path check kar lena

// BODY SIZE 10MB KAR DIYA KYUKI PHOTO URL BADI HOTI HAI
router.use(express.json({ limit: '10mb' }));
router.use(express.urlencoded({ limit: '10mb', extended: true }));

// 1. NAYA FRUIT ADD KARNA
// POST /api/shops/:shopId/fruit
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
// PUT /api/shops/:shopId/fruit/:fruitId
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

// 3. FRUIT DELETE KARNA
// DELETE /api/shops/:shopId/fruit/:fruitId
router.delete('/:shopId/fruit/:fruitId', async (req, res) => {
    try {
        await Shop.findByIdAndUpdate(
            req.params.shopId,
            { $pull: { items: { id: req.params.fruitId } } }
        );
        res.json({ success: true });
    } catch (err) {
        console.error("DELETE FRUIT ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
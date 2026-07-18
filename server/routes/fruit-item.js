// KEVAL FRUIT ITEM ADD/UPDATE/DELETE KE LIYE HAI YE FILE.
// PURANE /api/shops/:shopId WALE PUT KO CHHEDNA MAT HAI
const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');

// BODY SIZE BADHA DIYA KYUKI PHOTO URL BADI HOTI HAI
router.use(express.json({ limit: '10mb' }));
router.use(express.urlencoded({ limit: '10mb', extended: true }));

// 1. EK NAYA FRUIT ADD KARNA
router.post('/:shopId/fruit', async (req, res) => {
    try {
        const { item } = req.body;
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

// 2. EK FRUIT UPDATE KARNA
router.put('/:shopId/fruit/:fruitId', async (req, res) => {
    try {
        const { item } = req.body;
        const shop = await Shop.findOneAndUpdate(
            { _id: req.params.shopId, "items.id": req.params.fruitId }, // UPDATED: _id ki jagah id bhi check
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

// 3. EK FRUIT DELETE KARNA
router.delete('/:shopId/fruit/:fruitId', async (req, res) => {
    try {
        await Shop.findByIdAndUpdate(
            req.params.shopId,
            { $pull: { items: { id: req.params.fruitId } } } // UPDATED: id se delete
        );
        res.json({ success: true });
    } catch (err) {
        console.error("DELETE FRUIT ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
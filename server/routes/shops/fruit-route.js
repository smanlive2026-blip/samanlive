const express = require('express');
const router = express.Router();
const Shop = require('../../models/shops/Fruit'); // ✅ path change kiya
const { authManager } = require('../../middleware/authManager');
const { getShopId } = require('../../utils/shopId');

// BODY SIZE 10MB
router.use(express.json({ limit: '10mb' }));
router.use(express.urlencoded({ limit: '10mb', extended: true }));

// 0. GET SHOP DATA
router.get('/:shopId', authManager, async (req, res) => {
    try {
        const shopId = getShopId(req);
        console.log("GETTING SHOP:", shopId);

        const shop = await Shop.findOne({ _id: shopId }).lean();
        if(!shop) return res.status(404).json({success: false, message: "Shop not found"});

        shop.totalCustomers = shop.totalCustomers || 0;
        shop.revenue = shop.revenue || 0;
        shop.todaySales = shop.todaySales || 0;

        res.json({ success: true, shop });
    } catch (err) {
        console.error("GET SHOP ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 1. UPDATE SHOP
router.put('/:shopId', authManager, async (req, res) => {
    try {
        const shopId = getShopId(req);
        const updateData = req.body;
        console.log("UPDATING SHOP:", shopId, updateData);

        const shop = await Shop.findOneAndUpdate(
            { _id: shopId },
            { $set: updateData },
            { new: true, runValidators: true }
        );
        if(!shop) return res.status(404).json({success: false, message: "Shop not found"});
        res.json({ success: true, shop });
    } catch (err) {
        console.error("UPDATE SHOP ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 2. ADD FRUIT
router.post('/:shopId/fruit', authManager, async (req, res) => {
    try {
        const shopId = getShopId(req);
        const { item } = req.body;
        console.log("ADDING FRUIT TO SHOP:", shopId, item.name);

        if(!item.id) item.id = new Date().getTime().toString();

        const shop = await Shop.findOneAndUpdate(
            { _id: shopId },
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

// 3. UPDATE FRUIT
router.put('/:shopId/fruit/:fruitId', authManager, async (req, res) => {
    try {
        const shopId = getShopId(req);
        const { fruitId } = req.params;
        const { item } = req.body;
        console.log("UPDATING FRUIT:", fruitId);

        const shop = await Shop.findOneAndUpdate(
            { _id: shopId, "items.id": fruitId },
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

// 4. DELETE FRUIT
router.delete('/:shopId/fruit/:fruitId', authManager, async (req, res) => {
    try {
        const shopId = getShopId(req);
        const { fruitId } = req.params;

        await Shop.findOneAndUpdate(
            { _id: shopId },
            { $pull: { items: { id: fruitId }}}
        );
        res.json({ success: true, message: "Fruit deleted" });
    } catch (err) {
        console.error("DELETE FRUIT ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
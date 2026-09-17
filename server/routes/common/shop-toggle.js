// LOCATION: server/routes/common/shop-toggle.js

const express = require('express');
const router = express.Router();
const Shop = require('../../models/Shop');
const { getShopId } = require('../../utils/shopId');

// PUT /api/shop-toggle/:shopId - Sabhi 60 shops ke liye ek hi toggle API
router.put('/:shopId', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const { isOpen } = req.body;

    if (typeof isOpen!== 'boolean') {
      return res.status(400).json({ success: false, message: 'isOpen boolean hona chahiye' });
    }

    // 1. Main Shop collection me save (yehi nearby-shops API use karta hai)
    const shop = await Shop.findByIdAndUpdate(
      shopId,
      { isOpen: isOpen, 'settings.isOpen': isOpen },
      { new: true }
    );

    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

    // 2. Alag model (Achar.js, Kirana.js etc) me bhi sync karo taaki purana code na toote
    try {
      const templateName = (shop.template || 'achar').toLowerCase();
      const modelMap = {
        'achar': 'Achar', 'kirana': 'Kirana', 'cloth': 'Cloth',
        'fruit': 'Fruit', 'furniture': 'Furniture', 'auto': 'Auto'
      };
      const modelFileName = modelMap[templateName] || 'Achar';
      const DynamicModel = require(`../../models/shops/${modelFileName}`);
      await DynamicModel.findOneAndUpdate(
        { shopId: shopId },
        { $set: { isOpen: isOpen, 'settings.isOpen': isOpen } },
        { upsert: true }
      );
    } catch (e) {
      // Agar model file nahi hai toh ignore karo, main Shop me save ho gaya hai wahi kaafi hai
      console.log('Dynamic model sync skip:', e.message);
    }

    res.json({ success: true, isOpen: shop.isOpen, message: shop.isOpen? 'Shop Open' : 'Shop Closed' });

  } catch (err) {
    console.log('SHOP TOGGLE ERROR:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/shop-toggle/:shopId - Customer view aur nearby ke liye status check
router.get('/:shopId', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const shop = await Shop.findById(shopId).lean();
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

    const isOpen = shop.isOpen?? shop.settings?.isOpen?? true;
    res.json({ success: true, isOpen: isOpen });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
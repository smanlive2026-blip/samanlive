const express = require('express');
const router = express.Router();
const Shop = require('../../models/Shop'); // Main shop collection
const { getShopId } = require('../../utils/shopId');

// GET PURI SHOP DATA
router.get('/:shopId', async (req, res) => {
  try {
    const shopId = getShopId(req);
    console.log("GENERAL GET CALLED FOR:", shopId);

    const shop = await Shop.findById(shopId).lean();
    if(!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

    const finalData = {
      shopId: shop._id,
      shopName: shop.shopName || shop.name || 'General Shop',
      name: shop.shopName || shop.name || 'General Shop',
      items: shop.products || [], // products yahi se aayenge
      orders: shop.orders || [],
      isOpen: shop.isOpen ?? true,
      announcement: shop.announcement || '',
      bannerPhotoUrl: shop.banner || shop.bannerPhotoUrl || '',
      ownerPhotoUrl: shop.ownerPhotoUrl || '',
      phone: shop.phone || shop.contact || '',
      address: shop.address || ''
    }

    res.json({ success: true, shop: finalData });
  } catch(err) {
    console.log("GENERAL GET ERROR:", err)
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST NEW ORDER
router.post('/:shopId/order', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const orderData = req.body;
    const trackingId = 'GEN' + Date.now().toString().slice(-8);

    const newOrder = {
       ...orderData,
        trackingId: trackingId,
        status: 'pending',
        createdAt: new Date()
    };

    await Shop.findByIdAndUpdate(
      shopId,
      { $push: { orders: newOrder } },
      { new: true }
    );

    res.json({ success: true, trackingId: trackingId });
  } catch(err) {
    console.log("GENERAL ORDER ERROR:", err)
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
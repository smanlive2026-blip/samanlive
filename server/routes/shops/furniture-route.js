const express = require('express');
const router = express.Router();
const Furniture = require('../../models/shops/Furniture');
const Order = require('../../models/common/Order');
const Shop = require('../../models/common/shop-route');
const { authenticateToken, isShopOwner } = require('../common/auth');

// 1. GET PURI SHOP DATA - 2 model merge karke
router.get('/:shopId', async (req, res) => {
  try {
    const [furniture, shop] = await Promise.all([
        Furniture.findOne({ shopId: req.params.shopId }),
        Shop.findOne({ shopId: req.params.shopId })
    ]);
    
    if(!furniture && !shop) return res.status(404).json({ success: false, message: 'Shop not found' });
    
    res.json({ success: true, data: { ...shop?._doc, ...furniture?._doc } });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

// 2-4. ITEM CRUD - Sirf Furniture model me
router.post('/:shopId/item', authenticateToken, isShopOwner, async (req, res) => {
  try {
    const shop = await Furniture.findOneAndUpdate(
      { shopId: req.params.shopId },
      { $push: { items: {...req.body, id: Date.now().toString()} } },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: shop });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/:shopId/item/:itemId', authenticateToken, isShopOwner, async (req, res) => {
  try {
    const shop = await Furniture.findOneAndUpdate(
      { shopId: req.params.shopId, 'items.id': req.params.itemId },
      { $set: { 'items.$': req.body } },
      { new: true }
    );
    res.json({ success: true, data: shop });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/:shopId/item/:itemId', authenticateToken, isShopOwner, async (req, res) => {
  try {
    const shop = await Furniture.findOneAndUpdate(
      { shopId: req.params.shopId },
      { $pull: { items: { id: req.params.itemId } } },
      { new: true }
    );
    res.json({ success: true, data: shop });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

// 5-7. ORDER - Ab Common Order model me jayega
router.post('/:shopId/order', async (req, res) => {
  try {
    const newOrder = new Order({
        ...req.body,
        shopId: req.params.shopId,
        shopName: 'Furniture',
        orderId: 'ORD_' + Date.now()
    });
    await newOrder.save();
    res.json({ success: true, data: newOrder });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/:shopId/orders', async (req, res) => {
  try {
    const orders = await Order.find({shopId: req.params.shopId}).sort({createdAt: -1});
    res.json({ success: true, data: orders });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/:shopId/order/:orderId', authenticateToken, isShopOwner, async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { shopId: req.params.shopId, orderId: req.params.orderId },
      { $set: { status: req.body.status } },
      { new: true }
    );
    res.json({ success: true, data: order });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

// 8-10. OFFER - Furniture model me hi rahega
router.post('/:shopId/offer', authenticateToken, isShopOwner, async (req, res) => {
    const shop = await Furniture.findOneAndUpdate(
      { shopId: req.params.shopId },
      { $push: { offers: {...req.body, id: Date.now().toString()} } },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: shop });
});
router.get('/:shopId/offers', async (req, res) => {
    const shop = await Furniture.findOne({ shopId: req.params.shopId });
    res.json({ success: true, data: shop?.offers || [] });
});
router.delete('/:shopId/offer/:offerId', authenticateToken, isShopOwner, async (req, res) => {
    const shop = await Furniture.findOneAndUpdate(
      { shopId: req.params.shopId },
      { $pull: { offers: { id: req.params.offerId } } },
      { new: true }
    );
    res.json({ success: true, data: shop });
});

// 11-12. REVIEW - Furniture model me hi rahega
router.post('/:shopId/review', async (req, res) => {
    const shop = await Furniture.findOneAndUpdate(
      { shopId: req.params.shopId },
      { $push: { reviews: {...req.body, id: Date.now().toString(), createdAt: new Date()} } },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: shop });
});
router.get('/:shopId/reviews', async (req, res) => {
    const shop = await Furniture.findOne({ shopId: req.params.shopId });
    res.json({ success: true, data: shop?.reviews || [] });
});

// 13. SETTINGS UPDATE - Ab Shop model me jayega photo/location ke liye
router.put('/:shopId', authenticateToken, isShopOwner, async (req, res) => {
  try {
    const shop = await Shop.findOneAndUpdate(
      { shopId: req.params.shopId },
      { $set: req.body }, // ownerPhotoUrl, location, isOpen etc
      { new: true, upsert: true }
    );
    res.json({ success: true, data: shop });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
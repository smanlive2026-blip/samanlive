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
    
    if(!shop) return res.status(404).json({ success: false, message: 'Shop not found' }); // PEHLE SHOP CHECK
    
    // Dono ko merge kar do. Furniture na ho to bhi chalega
    const mergedData = {
        ...shop._doc,
        ...furniture?._doc,
        items: furniture?.items || [],
        offers: furniture?.offers || [],
        reviews: furniture?.reviews || []
    };
    
    res.json({ success: true, data: mergedData });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

// BAKE KA SARA CODE WAISA HI RAHEGA JAISE PEHLE DIYA THA
// ... ITEM CRUD, ORDER, OFFER ...

router.post('/:shopId/item', authenticateToken, isShopOwner, async (req, res) => {
  try {
    const newItem = {...req.body, id: Date.now().toString() };
    const shop = await Furniture.findOneAndUpdate(
      { shopId: req.params.shopId },
      { $push: { items: newItem } },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: newItem });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/:shopId/item/:itemId', authenticateToken, isShopOwner, async (req, res) => {
  try {
    const shop = await Furniture.findOneAndUpdate(
      { shopId: req.params.shopId, 'items.id': req.params.itemId },
      { $set: { 'items.$': req.body } },
      { new: true }
    );
    const updatedItem = shop.items.find(i => i.id === req.params.itemId);
    res.json({ success: true, data: updatedItem });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/:shopId/item/:itemId', authenticateToken, isShopOwner, async (req, res) => {
  try {
    await Furniture.findOneAndUpdate(
      { shopId: req.params.shopId },
      { $pull: { items: { id: req.params.itemId } } },
      { new: true }
    );
    res.json({ success: true });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/:shopId/order', async (req, res) => {
  try {
    const newOrder = new Order({...req.body, shopId: req.params.shopId, shopName: 'Furniture', orderId: 'ORD_' + Date.now() });
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

router.put('/:shopId', authenticateToken, isShopOwner, async (req, res) => {
  try {
    const shop = await Shop.findOneAndUpdate(
      { shopId: req.params.shopId },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: shop });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
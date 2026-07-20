const express = require('express');
const router = express.Router();
const Furniture = require('../../models/shops/furniture');
const Order = require('../../models/order'); 
const Shop = require('../../models/Shop');

// 1. GET PURI SHOP DATA
router.get('/:shopId', async (req, res) => {
  try {
    const [furniture, shop] = await Promise.all([
        Furniture.findOne({ shopId: req.params.shopId }),
        Shop.findById(req.params.shopId)
    ]);
    
    if(!shop) return res.status(404).json({ success: false, message: 'Shop not found' });
    
    res.json({ 
      success: true, 
      shop: {
        ...shop._doc, 
        items: furniture?.items || [],
        offers: furniture?.offers || [],
        reviews: furniture?.reviews || []
      }
    });
  } catch(err) { 
    console.log(err);
    res.status(500).json({ success: false, error: err.message }); 
  }
});

// 2. ADD ITEM
router.post('/:shopId/item', async (req, res) => {
  try {
    const newItem = {...req.body, id: Date.now().toString() };
    await Furniture.findOneAndUpdate(
      { shopId: req.params.shopId },
      { $push: { items: newItem } },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: newItem });
  } catch(err) { 
    console.log(err);
    res.status(500).json({ success: false, error: err.message }); 
  }
});

// 3. UPDATE ITEM
router.put('/:shopId/item/:itemId', async (req, res) => {
  try {
    const shop = await Furniture.findOneAndUpdate(
      { shopId: req.params.shopId, 'items.id': req.params.itemId },
      { $set: { 'items.$': req.body } },
      { new: true }
    );
    const updatedItem = shop.items.find(i => i.id === req.params.itemId);
    res.json({ success: true, data: updatedItem });
  } catch(err) { 
    console.log(err);
    res.status(500).json({ success: false, error: err.message }); 
  }
});

// 4. DELETE ITEM - YAHI BRACKET THEEK KIYA
router.delete('/:shopId/item/:itemId', async (req, res) => {
  try {
    await Furniture.findOneAndUpdate(
      { shopId: req.params.shopId },
      { $pull: { items: { id: req.params.itemId } }}, // <- yaha ) band kiya
      { new: true }
    );
    res.json({ success: true });
  } catch(err) { 
    console.log(err);
    res.status(500).json({ success: false, error: err.message }); 
  }
});

module.exports = router;
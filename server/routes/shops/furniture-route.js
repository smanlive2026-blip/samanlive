const express = require('express');
const router = express.Router();
const Furniture = require('../../models/shops/Furniture');
const Order = require('../../models/Order'); 
const Shop = require('../../models/Shop');

// 0. UPDATE PURA SHOP - YE NAYA ADD KAR
router.put('/:shopId', async (req, res) => {
  try {
    const updated = await Furniture.findOneAndUpdate(
      { shopId: req.params.shopId },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: updated });
  } catch(err) { 
    res.status(500).json({ success: false, error: err.message }); 
  }
});

// 0.5. GET ORDERS - YE BHI NAYA ADD KAR
router.get('/:shopId/orders', async (req, res) => {
  try {
    const furniture = await Furniture.findOne({ shopId: req.params.shopId });
    res.json({ success: true, data: furniture?.orders || [] });
  } catch(err) { 
    res.status(500).json({ success: false, error: err.message }); 
  }
});

// 1. GET PURI SHOP DATA - TERA WALA
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
        ...furniture?._doc, // <- ye add kiya taki announcement, isOpen bhi aa jaye
        items: furniture?.items || [],
        orders: furniture?.orders || [],
        offers: furniture?.offers || [],
        reviews: furniture?.reviews || []
      }
    });
  } catch(err) { 
    res.status(500).json({ success: false, error: err.message }); 
  }
});

// 2. ADD ITEM - TERA WALA
router.post('/:shopId/item', async (req, res) => {
  try {
    const newItem = {...req.body, id: Date.now().toString() }; // id theek hai
    const updated = await Furniture.findOneAndUpdate(
      { shopId: req.params.shopId },
      { $push: { items: newItem } },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: newItem });
  } catch(err) { 
    res.status(500).json({ success: false, error: err.message }); 
  }
});

// 3. UPDATE ITEM - TERA WALA
router.put('/:shopId/item/:itemId', async (req, res) => {
  try {
    await Furniture.findOneAndUpdate(
      { shopId: req.params.shopId, 'items.id': req.params.itemId },
      { $set: { 'items.$': req.body } },
      { new: true }
    );
    res.json({ success: true });
  } catch(err) { 
    res.status(500).json({ success: false, error: err.message }); 
  }
});

// 4. DELETE ITEM - TERA WALA
router.delete('/:shopId/item/:itemId', async (req, res) => {
  try {
    await Furniture.findOneAndUpdate(
      { shopId: req.params.shopId },
      { $pull: { items: { id: req.params.itemId } }},
      { new: true }
    );
    res.json({ success: true });
  } catch(err) { 
    res.status(500).json({ success: false, error: err.message }); 
  }
});

module.exports = router;
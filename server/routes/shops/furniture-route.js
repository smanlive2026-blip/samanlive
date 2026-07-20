const express = require('express');
const router = express.Router();
const Furniture = require('../../models/shops/Furniture');
const Shop = require('../../models/Shop');

// 1. GET PURI SHOP DATA - Dashboard + Customer View ke liye
router.get('/:shopId', async (req, res) => {
  try {
    const shopId = req.params.shopId;
    
    const [shop, furniture] = await Promise.all([
        Shop.findById(shopId),
        Furniture.findOne({ shopId: shopId })
    ]);
    
    if(!shop) return res.status(404).json({ success: false, message: 'Shop not found' });
    
    res.json({ 
      success: true, 
      shop: {
        ...shop._doc, // shopName, owner, phone, etc
        items: furniture?.items || [],
        orders: furniture?.orders || [],
        offers: furniture?.offers || [],
        reviews: furniture?.reviews || [],
        location: furniture?.location || {},
        settings: furniture?.settings || {},
        isOpen: furniture?.settings?.isOpen ?? true,
        announcement: furniture?.settings?.announcement || '',
        ownerPhotoUrl: furniture?.settings?.ownerPhotoUrl || ''
      }
    });
  } catch(err) { 
    console.log(err)
    res.status(500).json({ success: false, error: err.message }); 
  }
});

// 2. ADD ITEM - Product Library + Add Product se
router.post('/:shopId/item', async (req, res) => {
  try {
    const newItem = {...req.body, id: Date.now().toString() };
    await Furniture.findOneAndUpdate(
      { shopId: req.params.shopId },
      { $push: { items: newItem } },
      { new: true, upsert: true } // upsert=true zaruri hai
    );
    res.json({ success: true, data: newItem });
  } catch(err) { 
    res.status(500).json({ success: false, error: err.message }); 
  }
});

// 3. UPDATE ITEM - Edit + Toggle + Image Upload
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

// 4. DELETE ITEM
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

// 5. UPDATE PURA SHOP - Announcement, Timing, Toggle
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

// 6. GET ORDERS - Dashboard Stats ke liye
router.get('/:shopId/orders', async (req, res) => {
  try {
    const furniture = await Furniture.findOne({ shopId: req.params.shopId });
    res.json({ success: true, data: furniture?.orders || [] });
  } catch(err) { 
    res.status(500).json({ success: false, error: err.message }); 
  }
});

module.exports = router;
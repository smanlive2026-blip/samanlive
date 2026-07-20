const express = require('express');
const router = express.Router();
const Furniture = require('../../models/shops/Furniture');
const Shop = require('../../models/Shop');

// GET PURI SHOP DATA
router.get('/:shopId', async (req, res) => {
  try {
    const shopId = req.params.shopId;
    console.log("GET CALLED FOR SHOPID:", shopId); // LOG 1
    
    const [shop, furniture] = await Promise.all([
        Shop.findById(shopId),
        Furniture.findOne({ shopId: shopId })
    ]);
    
    console.log("SHOP FOUND:", !!shop); // LOG 2
    console.log("FURNITURE FOUND:", !!furniture); // LOG 3
    console.log("ITEMS COUNT:", furniture?.items?.length || 0); // LOG 4
    
    if(!shop) return res.status(404).json({ success: false, message: 'Shop not found' });
    
    const finalData = {
        ...shop._doc,
        items: furniture?.items || [],
        orders: furniture?.orders || [],
        settings: furniture?.settings || {},
        isOpen: furniture?.settings?.isOpen ?? true,
        announcement: furniture?.settings?.announcement || ''
    }

    res.json({ success: true, shop: finalData });
  } catch(err) { 
    console.log("GET ERROR:", err)
    res.status(500).json({ success: false, error: err.message }); 
  }
});

// ADD ITEM
router.post('/:shopId/item', async (req, res) => {
  try {
    const newItem = {...req.body, id: Date.now().toString() };
    console.log("ADDING ITEM TO:", req.params.shopId, newItem.name) // LOG 5
    await Furniture.findOneAndUpdate(
      { shopId: req.params.shopId },
      { $push: { items: newItem } },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: newItem });
  } catch(err) { 
    res.status(500).json({ success: false, error: err.message }); 
  }
});

// UPDATE ITEM
router.put('/:shopId/item/:itemId', async (req, res) => {
  try {
    await Furniture.findOneAndUpdate(
      { shopId: req.params.shopId, 'items.id': req.params.itemId },
      { $set: { 'items.$': req.body } }
    );
    res.json({ success: true });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE ITEM
router.delete('/:shopId/item/:itemId', async (req, res) => {
  try {
    await Furniture.findOneAndUpdate(
      { shopId: req.params.shopId },
      { $pull: { items: { id: req.params.itemId } }}
    );
    res.json({ success: true });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

// UPDATE SHOP
router.put('/:shopId', async (req, res) => {
  try {
    const updated = await Furniture.findOneAndUpdate(
      { shopId: req.params.shopId },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: updated });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET ORDERS
router.get('/:shopId/orders', async (req, res) => {
  try {
    const furniture = await Furniture.findOne({ shopId: req.params.shopId });
    res.json({ success: true, data: furniture?.orders || [] });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
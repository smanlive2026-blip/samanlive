const express = require('express');
const router = express.Router();
const Furniture = require('../../models/shops/Furniture');
const Shop = require('../../models/Shop');

// GET PURI SHOP DATA - DASHBOARD + CUSTOMER VIEW DONO KE LIYE
router.get('/:shopId', async (req, res) => {
  try {
    const shopId = req.params.shopId;
    console.log("GET CALLED FOR SHOPID:", shopId);
    
    const [shop, furniture] = await Promise.all([
        Shop.findById(shopId).lean(), // .lean() add kiya
        Furniture.findOne({ shopId: shopId }).lean()
    ]);
    
    console.log("SHOP FOUND:", !!shop);
    console.log("FURNITURE FOUND:", !!furniture);
    console.log("ITEMS COUNT:", furniture?.items?.length || 0);
    
    if(!shop) return res.status(404).json({ success: false, message: 'Shop not found' });
    
    const finalData = {
        ...shop, // ._doc hata diya
        items: furniture?.items || [],
        orders: furniture?.orders || [],
        settings: furniture?.settings || {},
        isOpen: furniture?.settings?.isOpen ?? true,
        announcement: furniture?.settings?.announcement || '',
        shopId: shop._id
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
    
    // PEHLE CHECK KARO DOC HAI YA NAHI
    let furniture = await Furniture.findOne({ shopId: req.params.shopId });
    
    if(!furniture){
      // NAHI HAI TO NAYA BANAO
      furniture = new Furniture({
        shopId: req.params.shopId,
        items: [newItem]
      });
      await furniture.save();
    } else {
      // HAI TO PUSH KAR DO
      furniture.items.push(newItem);
      await furniture.save();
    }
    
    console.log("SAVED IN DB:", furniture.items.length)
    res.json({ success: true, data: newItem });
  } catch(err) { 
    console.log("POST ERROR:", err)
    res.status(500).json({ success: false, error: err.message }); 
  }
});

// UPDATE ITEM
router.put('/:shopId/item/:itemId', async (req, res) => {
  try {
    const result = await Furniture.findOneAndUpdate(
      { shopId: req.params.shopId, 'items.id': req.params.itemId },
      { $set: { 'items.$': req.body } },
      { new: true }
    );
    res.json({ success: true, data: result });
  } catch(err) { 
    console.log("UPDATE ERROR:", err)
    res.status(500).json({ success: false, error: err.message }); 
  }
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

// UPDATE SHOP SETTINGS
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
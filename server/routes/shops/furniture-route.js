const express = require('express');
const router = express.Router();
const Furniture = require('../../models/shops/Furniture');
const Shop = require('../../models/Shop');

// GET PURI SHOP DATA
router.get('/:shopId', async (req, res) => {
  try {
    const shopId = req.params.shopId;
    console.log("GET CALLED FOR SHOPID:", shopId);

    const [shop, furniture] = await Promise.all([
        Shop.findById(shopId).lean(),
        Furniture.findOne({ shopId: shopId }).lean()
    ]);

    if(!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

    const finalData = {
      ...shop,
        items: furniture?.items || [],
        orders: furniture?.orders || [],
        settings: furniture?.settings || {},
        isOpen: furniture?.settings?.isOpen?? true,
        announcement: furniture?.settings?.announcement || '',
        ownerPhotoUrl: furniture?.ownerPhotoUrl || '',
        bannerPhotoUrl: furniture?.bannerPhotoUrl || '',
        shopId: shop._id
    }

    console.log("ITEMS COUNT:", finalData.items.length);
    res.json({ success: true, shop: finalData });
  } catch(err) {
    console.log("GET ERROR:", err)
    res.status(500).json({ success: false, error: err.message });
  }
});

// ADD ITEM - NUCLEAR FIX
router.post('/:shopId/item', async (req, res) => {
  try {
    const itemData = req.body.item || req.body;
    const newItem = {...itemData, id: itemData.id || Date.now().toString() };

    // PEHLE FIND KARO, NAHI HAI TO BANAO
    let furniture = await Furniture.findOne({ shopId: req.params.shopId });

    if(furniture){
        furniture.items.push(newItem);
    } else {
        furniture = new Furniture({ shopId: req.params.shopId, items: [newItem] });
    }

    await furniture.save(); // SAVE KARNE KE BAAD PAKKA MILEGA

    console.log("SAVED IN DB - TOTAL ITEMS:", furniture.items.length)
    res.json({ success: true, data: newItem });
  } catch(err) {
    console.log("POST ERROR:", err)
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE ITEM
router.put('/:shopId/item/:itemId', async (req, res) => {
  try {
    const itemData = req.body.item || req.body;
    await Furniture.findOneAndUpdate(
      { shopId: req.params.shopId, 'items.id': req.params.itemId },
      { $set: { 'items.$': itemData } },
      { new: true }
    );
    res.json({ success: true });
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
    const settings = req.body.item || req.body;
    await Furniture.findOneAndUpdate(
      { shopId: req.params.shopId },
      { $set: { settings: settings } },
      { new: true, upsert: true }
    );
    res.json({ success: true });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const Furniture = require('../../models/shops/Furniture');
const Shop = require('../../models/Shop');
const { Types } = require('mongoose'); // UPDATE: ObjectId fix ke liye mongoose import kiya

// GET PURI SHOP DATA - SAB ITEMS KE SATH
router.get('/:shopId', async (req, res) => {
  try {
    const shopId = req.params.shopId;
    console.log("GET CALLED FOR SHOPID:", shopId);

    // UPDATE: Cast to ObjectId error fix. String ID ko ObjectId me convert kar rahe
    if(!Types.ObjectId.isValid(shopId)){
        return res.status(400).json({ success: false, message: 'Invalid ShopId format' });
    }
    const shop = await Shop.findById(new Types.ObjectId(shopId)).lean(); // UPDATE: yaha ObjectId wrap kiya

    if(!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

    // UPDATE: shopId ko string me save karte hai furniture me bhi, isliye direct use kiya
    let furniture = await Furniture.findOne({ shopId: shopId });
    if(!furniture){
        furniture = await Furniture.create({ shopId: shopId, items: [] }); // UPDATE: nahi mila to bana diya
    }

    const finalData = {
      ...shop,
        items: furniture.items || [], // YAHI PE TERE 10 DIN WALE PRODUCT AYENGE
        orders: furniture.orders || [],
        settings: furniture.settings || {},
        isOpen: furniture.settings?.isOpen?? true,
        announcement: furniture.settings?.announcement || '',
        ownerPhotoUrl: furniture.ownerPhotoUrl || '',
        bannerPhotoUrl: furniture.bannerPhotoUrl || '',
        shopId: shop._id
    }

    console.log("TOTAL ITEMS IN DB:", finalData.items.length);
    res.json({ success: true, shop: finalData });
  } catch(err) {
    console.log("GET ERROR:", err)
    res.status(500).json({ success: false, error: err.message });
  }
});

// ADD ITEM
router.post('/:shopId/item', async (req, res) => {
  try {
    const itemData = req.body.item || req.body;
    const newItem = {...itemData, id: itemData.id || Date.now().toString() };

    let furniture = await Furniture.findOne({ shopId: req.params.shopId });
    if(!furniture){
        furniture = await Furniture.create({ shopId: req.params.shopId, items: [newItem] }); // UPDATE: pehle baar me create
    } else {
        furniture.items.push(newItem);
        await furniture.save();
    }

    console.log("SAVED IN DB - TOTAL ITEMS NOW:", furniture.items.length)
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
  } catch(err) {
    console.log("DELETE ERROR:", err)
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE SHOP SETTINGS + PHOTO
router.put('/:shopId', async (req, res) => {
  try {
    const updateData = req.body.item || req.body;
    const updated = await Furniture.findOneAndUpdate(
      { shopId: req.params.shopId },
      { $set: updateData },
      { new: true, upsert: true, setDefaultsOnInsert: true } // UPDATE: upsert laga diya taaki doc na ho to ban jaye
    );
    res.json({ success: true, data: updated });
  } catch(err) {
    console.log("SETTINGS ERROR:", err)
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
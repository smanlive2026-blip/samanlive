const express = require('express');
const router = express.Router();
const Furniture = require('../../models/shops/Furniture');
const Shop = require('../../models/Shop');
const { getShopId } = require('../../utils/shopId'); // ID fix ke liye

// GET PURI SHOP DATA - SAB FORMAT SUPPORT
router.get('/:shopId', async (req, res) => {
  try {
    const shopId = getShopId(req); // NUCLEAR FIX
    console.log("GET CALLED FOR SHOPID:", shopId);

    const shop = await Shop.findById(shopId).lean();
    if(!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

    let furniture = await Furniture.findOne({ shopId: shopId });
    if(!furniture){
        furniture = await Furniture.create({ shopId: shopId, items: [] });
    }

    // KISI BHI FORMAT KE ITEM KO NORMALIZE KAR DIYA
    const normalizedItems = (furniture.items || []).map(item => ({
     ...item.toObject? item.toObject() : item,
      image: item.image || item.img || '',
      id: item.id || item._id?.toString()
    }));

    const finalData = {
     ...shop,
      items: normalizedItems,
      orders: furniture.orders || [],
      settings: furniture.settings || {},
      isOpen: furniture.settings?.isOpen?? true,
      announcement: furniture.settings?.announcement || '',
      ownerPhotoUrl: furniture.settings?.ownerPhotoUrl || furniture.ownerPhotoUrl || '',
      bannerPhotoUrl: furniture.bannerPhotoUrl || furniture.settings?.bannerPhotoUrl || '',
      phone: furniture.phone || '',
      shopId: shop._id
    }

    console.log("BANNER BHEJ RAHA HU:", finalData.bannerPhotoUrl);
    console.log("TOTAL ITEMS IN DB:", finalData.items.length);
    res.json({ success: true, shop: finalData });
  } catch(err) {
    console.log("GET ERROR:", err)
    res.status(500).json({ success: false, error: err.message });
  }
});

// ADD ITEM - NUCLEAR FIX
router.post('/:shopId/item', async (req, res) => {
  try {
    const shopId = getShopId(req); // NUCLEAR FIX
    const itemData = req.body.item || req.body;
    console.log("RECEIVED ITEM DATA:", itemData);

    if(!itemData.name) return res.status(400).json({ success: false, message: 'Product name is required' });

    const newItem = {
     ...itemData,
      id: itemData.id || Date.now().toString(),
      image: itemData.image || itemData.img || '',
      img: itemData.image || itemData.img || '',
      createdAt: new Date()
    };

    let furniture = await Furniture.findOne({ shopId: shopId });
    if(!furniture){
        furniture = await Furniture.create({ shopId: shopId, items: [newItem] });
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
    const shopId = getShopId(req); // NUCLEAR FIX
    const itemData = req.body.item || req.body;
    itemData.image = itemData.image || itemData.img || '';
    itemData.img = itemData.image || itemData.img || '';

    await Furniture.findOneAndUpdate(
      { shopId: shopId, 'items.id': req.params.itemId },
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
    const shopId = getShopId(req); // NUCLEAR FIX
    await Furniture.findOneAndUpdate(
      { shopId: shopId },
      { $pull: { items: { id: req.params.itemId } }}
    );
    res.json({ success: true });
  } catch(err) {
    console.log("DELETE ERROR:", err)
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE SHOP SETTINGS + PHOTO - NUCLEAR VERSION
router.put('/:shopId', async (req, res) => {
  try {
    const shopId = getShopId(req); // NUCLEAR FIX
    const updateData = req.body;
    console.log("=== PUT HIT ===", shopId);
    console.log("Body:", updateData);

    let furniture = await Furniture.findOne({ shopId: shopId });
    if(!furniture){
        console.log("Furniture doc nahi mila, naya bana raha hu");
        furniture = await Furniture.create({ shopId: shopId });
    }

    // Seedha set karo
    if(updateData.bannerPhotoUrl) furniture.bannerPhotoUrl = updateData.bannerPhotoUrl;
    if(updateData.ownerPhotoUrl) furniture.ownerPhotoUrl = updateData.ownerPhotoUrl;
    if('phone' in updateData) furniture.phone = updateData.phone;

    if(updateData.settings){
        furniture.settings = furniture.settings || {};
        if(updateData.settings.bannerPhotoUrl) furniture.settings.bannerPhotoUrl = updateData.settings.bannerPhotoUrl;
        if(updateData.settings.ownerPhotoUrl) furniture.settings.ownerPhotoUrl = updateData.settings.ownerPhotoUrl;
        if(updateData.settings.openTime) furniture.settings.openTime = updateData.settings.openTime;
        if(updateData.settings.closeTime) furniture.settings.closeTime = updateData.settings.closeTime;
        if('isOpen' in updateData.settings) furniture.settings.isOpen = updateData.settings.isOpen;
        if('announcement' in updateData.settings) furniture.settings.announcement = updateData.settings.announcement;
    }

    await furniture.save();
    console.log("SAVE HO GAYA:", furniture.bannerPhotoUrl);

    res.json({ success: true, data: furniture });
  } catch(err) {
    console.log("SETTINGS ERROR:", err)
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET ORDERS - Dashboard ke liye
router.get('/:shopId/orders', async (req, res) => {
  try {
    const shopId = getShopId(req); // NUCLEAR FIX
    const furniture = await Furniture.findOne({ shopId: shopId }).lean();
    if(!furniture) return res.json({ success: true, data: [] });

    const orders = (furniture.orders || []).reverse();
    res.json({ success: true, data: orders });
  } catch(err) {
    console.log("ORDERS GET ERROR:", err)
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST NEW ORDER - Customer se order aayega
router.post('/:shopId/order', async (req, res) => {
  try {
    const shopId = getShopId(req); // NUCLEAR FIX
    const orderData = req.body;
    const trackingId = 'FUR' + Date.now().toString().slice(-8);

    const newOrder = {
       ...orderData,
        trackingId: trackingId,
        status: 'pending',
        createdAt: new Date()
    };

    await Furniture.findOneAndUpdate(
      { shopId: shopId },
      { $push: { orders: newOrder } },
      { new: true, upsert: true }
    );

    res.json({ success: true, trackingId: trackingId });
  } catch(err) {
    console.log("ORDER POST ERROR:", err)
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
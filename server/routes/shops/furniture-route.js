const express = require('express');
const router = express.Router();
const Furniture = require('../../models/shops/Furniture');
const Shop = require('../../models/Shop');
const { Types } = require('mongoose'); // UPDATE: ObjectId error fix

// GET PURI SHOP DATA - SAB FORMAT SUPPORT
router.get('/:shopId', async (req, res) => {
  try {
    const shopId = req.params.shopId;
    console.log("GET CALLED FOR SHOPID:", shopId);

    if(!Types.ObjectId.isValid(shopId)){
        return res.status(400).json({ success: false, message: 'Invalid ShopId format' });
    }
    const shop = await Shop.findById(new Types.ObjectId(shopId)).lean();
    if(!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

    let furniture = await Furniture.findOne({ shopId: shopId });
    if(!furniture){
        furniture = await Furniture.create({ shopId: shopId, items: [] });
    }

    // UPDATE: KISI BHI FORMAT KE ITEM KO NORMALIZE KAR DIYA
    const normalizedItems = (furniture.items || []).map(item => ({
       ...item,
        image: item.image || item.img || '', // UPDATE: img ya image dono se chalega
        id: item.id || item._id?.toString() // UPDATE: _id bhi support
    }));

    const finalData = {
      ...shop,
        items: normalizedItems, // UPDATE: normalized items bhej rahe
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

// ADD ITEM - NUCLEAR FIX
router.post('/:shopId/item', async (req, res) => {
  try {
    const itemData = req.body.item || req.body; // UPDATE: dono format support
    console.log("RECEIVED ITEM DATA:", itemData);

    if(!itemData.name) return res.status(400).json({ success: false, message: 'Product name is required' });

    // UPDATE: image aur img dono ko merge kar diya
    const newItem = {
       ...itemData,
        id: itemData.id || Date.now().toString(),
        image: itemData.image || itemData.img || '', // UPDATE: dono me se koi bhi ho
        img: itemData.image || itemData.img || '', // UPDATE: purane data ke liye
        createdAt: new Date()
    };

    let furniture = await Furniture.findOne({ shopId: req.params.shopId });
    if(!furniture){
        furniture = await Furniture.create({ shopId: req.params.shopId, items: [newItem] });
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
    // UPDATE: update me bhi image/img fix
    itemData.image = itemData.image || itemData.img || '';
    itemData.img = itemData.image || itemData.img || '';

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
    const setObj = {};
    
    // 1. seedha wale keys
    if('isOpen' in updateData){
        setObj['settings.isOpen'] = updateData.isOpen;
    }
    if('announcement' in updateData){
        setObj['settings.announcement'] = updateData.announcement;
    }
    if('bannerPhotoUrl' in updateData){
        setObj['settings.bannerPhotoUrl'] = updateData.bannerPhotoUrl;
    }
    if('ownerPhotoUrl' in updateData){
        setObj['settings.ownerPhotoUrl'] = updateData.ownerPhotoUrl;
    }

    // 2. agar settings object ke andar aaya to
    if(updateData.settings){
        if(updateData.settings.bannerPhotoUrl)
            setObj['settings.bannerPhotoUrl'] = updateData.settings.bannerPhotoUrl;
        if(updateData.settings.ownerPhotoUrl)
            setObj['settings.ownerPhotoUrl'] = updateData.settings.ownerPhotoUrl;
        if(updateData.settings.openTime)
            setObj['settings.openTime'] = updateData.settings.openTime;
        if(updateData.settings.closeTime)
            setObj['settings.closeTime'] = updateData.settings.closeTime;
        if('isOpen' in updateData.settings)
            setObj['settings.isOpen'] = updateData.settings.isOpen;
        if('announcement' in updateData.settings)
            setObj['settings.announcement'] = updateData.settings.announcement;
    }

    const updated = await Furniture.findOneAndUpdate(
      { shopId: req.params.shopId },
      { $set: setObj },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, data: updated });
  } catch(err) {
    console.log("SETTINGS ERROR:", err)
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET ORDERS - Dashboard ke liye
router.get('/:shopId/orders', async (req, res) => {
  try {
    const furniture = await Furniture.findOne({ shopId: req.params.shopId }).lean();
    if(!furniture) return res.json({ success: true, data: [] });
    
    // latest pehle aaye isliye reverse
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
    const orderData = req.body;
    const trackingId = 'FUR' + Date.now().toString().slice(-8); // FUR12345678

    const newOrder = {
        ...orderData,
        trackingId: trackingId,
        status: 'pending',
        createdAt: new Date()
    };

    await Furniture.findOneAndUpdate(
      { shopId: req.params.shopId },
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
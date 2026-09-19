// LOCATION: server/routes/shops/sports-route.js
const express = require('express');
const router = express.Router();
const Sports = require('../../models/shops/Sports');
const Shop = require('../../models/Shop'); // main shop model

// Helper
async function getOrCreateSports(shopId){
  let sports = await Sports.findOne({ shopId });
  if(!sports){
    const mainShop = await Shop.findById(shopId).lean().catch(()=>null);
    sports = await Sports.create({
      shopId,
      shopName: mainShop?.name || 'Sports World',
      settings: {
        shopName: mainShop?.name || 'Sports World',
        address: mainShop?.address || '',
        phone: mainShop?.phone || '',
        announcement: 'FREE SHIPPING ABOVE ₹499 • 6 MONTH WARRANTY • GENUINE BRANDS',
        isOpen: true
      }
    });
  }
  // sync items array for old dashboard
  if(sports.products?.length &&!sports.items?.length){
    sports.items = sports.products;
  }
  return sports;
}

// GET FULL SHOP DATA
router.get('/:shopId', async (req, res) => {
  try {
    const sports = await getOrCreateSports(req.params.shopId);
    const lowStock = sports.products.filter(p => p.stock <= (p.lowStockLimit||5));
    res.json({
      success: true,
      shop: {
       ...sports.toObject(),
        lowStock,
        products: sports.products,
        items: sports.products // for old code compatibility
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ADD SINGLE PRODUCT
router.post('/:shopId/item', async (req, res) => {
  try {
    const sports = await getOrCreateSports(req.params.shopId);
    sports.products.push(req.body);
    sports.items = sports.products;
    await sports.save();
    res.json({ success: true, message: 'Product Added' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// BULK ADD - 100 PRODUCTS EK SATH
router.post('/:shopId/bulk', async (req, res) => {
  try {
    const { products } = req.body;
    if(!Array.isArray(products)) return res.status(400).json({ success: false, message: 'products array needed' });
    const sports = await getOrCreateSports(req.params.shopId);
    sports.products.push(...products);
    sports.items = sports.products;
    await sports.save();
    res.json({ success: true, message: `${products.length} products added` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// UPDATE
router.put('/:shopId/item/:itemId', async (req, res) => {
  try {
    const sports = await Sports.findOne({ shopId: req.params.shopId });
    const product = sports.products.id(req.params.itemId);
    if(!product) return res.status(404).json({ success: false, message: 'Product not found' });
    Object.assign(product, req.body);
    sports.items = sports.products;
    await sports.save();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE
router.delete('/:shopId/item/:itemId', async (req, res) => {
  try {
    const sports = await Sports.findOne({ shopId: req.params.shopId });
    if(!sports) return res.status(404).json({ success: false });
    sports.products.pull({ _id: req.params.itemId });
    sports.items = sports.products;
    await sports.save();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// SETTINGS + TOGGLE
router.put('/:shopId/settings', async (req, res) => {
  try {
    const { isOpen, shopName, address, phone, announcement, deliveryCharge, minOrder } = req.body;
    const updateObj = {};
    if(typeof isOpen === 'boolean') updateObj['settings.isOpen'] = isOpen;
    if(shopName) { updateObj['settings.shopName'] = shopName; updateObj['shopName'] = shopName; }
    if(address!== undefined) updateObj['settings.address'] = address;
    if(phone!== undefined) updateObj['settings.phone'] = phone;
    if(announcement!== undefined) updateObj['settings.announcement'] = announcement;
    if(deliveryCharge!== undefined) updateObj['settings.deliveryCharge'] = deliveryCharge;
    if(minOrder!== undefined) updateObj['settings.minOrder'] = minOrder;

    const sports = await Sports.findOneAndUpdate(
      { shopId: req.params.shopId },
      { $set: updateObj },
      { new: true, upsert: true }
    );

    if(typeof isOpen === 'boolean'){
      await Shop.findByIdAndUpdate(req.params.shopId, { isOpen }).catch(()=>{});
    }
    res.json({ success: true, shop: sports });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
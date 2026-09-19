// LOCATION: server/routes/shops/kirana-route.js
const express = require('express');
const router = express.Router();
const Kirana = require('../../models/shops/Kirana');
const Shop = require('../../models/Shop');

// Helper to get shop
async function getOrCreateKirana(shopId){
  let kirana = await Kirana.findOne({ shopId });
  if(!kirana){
    const mainShop = await Shop.findById(shopId).lean().catch(()=>null);
    kirana = await Kirana.create({
      shopId,
      shopName: mainShop?.name || 'Kirana Store',
      settings: { shopName: mainShop?.name||'Kirana Store', address: mainShop?.address||'', phone: mainShop?.phone||'', isOpen: true }
    });
  }
  return kirana;
}

// GET FULL SHOP DATA
router.get('/:shopId', async (req, res) => {
  try {
    const kirana = await getOrCreateKirana(req.params.shopId);
    const lowStock = kirana.products.filter(p => p.stock <= (p.lowStockLimit||10));
    res.json({ success: true, shop: {...kirana.toObject(), lowStock } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ADD SINGLE PRODUCT
router.post('/:shopId/item', async (req, res) => {
  try {
    const kirana = await getOrCreateKirana(req.params.shopId);
    kirana.products.push(req.body);
    await kirana.save();
    res.json({ success: true, message: 'Product Added' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// BULK ADD - 100 PRODUCTS EK SATH
router.post('/:shopId/bulk', async (req, res) => {
  try {
    const { products } = req.body; // array
    if(!Array.isArray(products)) return res.status(400).json({ success: false, message: 'products array needed' });
    const kirana = await getOrCreateKirana(req.params.shopId);
    kirana.products.push(...products);
    await kirana.save();
    res.json({ success: true, message: `${products.length} products added` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// UPDATE
router.put('/:shopId/item/:itemId', async (req, res) => {
  try {
    const kirana = await Kirana.findOne({ shopId: req.params.shopId });
    const product = kirana.products.id(req.params.itemId);
    if(!product) return res.status(404).json({ success: false });
    Object.assign(product, req.body);
    await kirana.save();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE
router.delete('/:shopId/item/:itemId', async (req, res) => {
  try {
    const kirana = await Kirana.findOne({ shopId: req.params.shopId });
    kirana.products.pull({ _id: req.params.itemId });
    await kirana.save();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// SETTINGS + TOGGLE
router.put('/:shopId/settings', async (req, res) => {
  try {
    const { isOpen, shopName, address, phone, deliveryCharge, minOrder } = req.body;
    const kirana = await Kirana.findOneAndUpdate(
      { shopId: req.params.shopId },
      { $set: { 'settings.isOpen': isOpen, 'settings.shopName': shopName, 'settings.address': address, 'settings.phone': phone, 'settings.deliveryCharge': deliveryCharge, 'settings.minOrder': minOrder } },
      { new: true, upsert: true }
    );
    if(typeof isOpen === 'boolean'){
      await Shop.findByIdAndUpdate(req.params.shopId, { isOpen }).catch(()=>{});
    }
    res.json({ success: true, shop: kirana });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
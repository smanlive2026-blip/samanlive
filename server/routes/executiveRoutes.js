// LOCATION: server/routes/executiveRoutes.js - EXECUTIVE ROUTES - V14 FINAL - KINGMAKER LOGIC
const express = require('express');
const router = express.Router();
const Executive = require('../models/Executive');
const ProductPool = require('../models/ProductPool');
const AreaDemand = require('../models/AreaDemand');
const WorldProduct = require('../models/WorldProduct');
const ProductAssignment = require('../models/ProductAssignment');

router.post('/register', async (req, res) => {
  try {
    const { name, phone, assignedAreas, assignedShopTypes } = req.body;
    if (!name || !phone) return res.status(400).json({ success: false, error: 'Name phone required' });
    const exists = await Executive.findOne({ phone });
    if (exists) return res.status(400).json({ success: false, error: 'Phone exists' });
    const ex = await Executive.create({ name, phone, assignedAreas: assignedAreas || [], assignedShopTypes: assignedShopTypes || [] });
    res.json({ success: true, data: ex });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/list', async (req, res) => {
  try { const list = await Executive.find().sort({ createdAt: -1 }); res.json({ success: true, data: list }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/product-pool', async (req, res) => {
  try {
    const { status = 'pending', category, area, pmId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (area) filter.areaTags = new RegExp(area, 'i');
    if (pmId) filter.productManagerId = pmId;
    const pool = await ProductPool.find(filter).populate('productManagerId').sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, data: pool });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.put('/product-pool/:id/approve', async (req, res) => {
  try {
    const { finalPrice, executiveNote } = req.body;
    const updated = await ProductPool.findByIdAndUpdate(req.params.id, { status: 'approved', finalPrice, executiveNote }, { new: true });
    res.json({ success: true, data: updated });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.put('/product-pool/:id/reject', async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const updated = await ProductPool.findByIdAndUpdate(req.params.id, { status: 'rejected', rejectionReason }, { new: true });
    res.json({ success: true, data: updated });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ASSIGN - MOST IMPORTANT - Converts ProductPool to WorldProduct
router.post('/assign', async (req, res) => {
  try {
    const { productPoolId, executiveId, areaManagerId, areaName, shopType, finalPrice, commission } = req.body;
    if (!productPoolId || !areaName) return res.status(400).json({ success: false, error: 'productPoolId and areaName required' });
    const pool = await ProductPool.findById(productPoolId).populate('productManagerId');
    if (!pool) return res.status(404).json({ success: false, error: 'Pool not found' });

    const finalPriceToUse = finalPrice || pool.finalPrice || pool.suggestedPrice || (pool.basePrice * 1.25);
    const profit = finalPriceToUse - pool.basePrice;

    // Create WorldProduct - visible to shops
    const worldProduct = await WorldProduct.create({
      name: pool.name,
      description: pool.description,
      category: pool.category,
      images: pool.images,
      thumbnail: pool.thumbnail || pool.images[0],
      price: finalPriceToUse,
      basePrice: pool.basePrice,
      stock: pool.stock,
      unit: pool.unit,
      area: areaName,
      shopType: shopType || 'kirana',
      ownerId: pool.productManagerId._id,
      ownerRole: 'product_manager',
      executiveId: executiveId,
      isFromProductPool: true,
      productPoolId: pool._id,
      commission: commission || pool.commission,
      isActive: true,
    });

    pool.status = 'assigned';
    pool.assignedTo = { areaManagerId, areaName, shopType };
    pool.finalPrice = finalPriceToUse;
    pool.worldProductId = worldProduct._id;
    await pool.save();

    // Log assignment
    await ProductAssignment.create({
      productPoolId: pool._id,
      productManagerId: pool.productManagerId._id,
      executiveId,
      areaManagerId,
      areaName,
      shopType,
      basePrice: pool.basePrice,
      finalPrice: finalPriceToUse,
      profit,
      commissionSnapshot: commission || pool.commission,
      worldProductId: worldProduct._id,
    });

    // Increment executive totalAssigned
    if (executiveId) await Executive.findByIdAndUpdate(executiveId, { $inc: { totalAssigned: 1 } });

    res.json({ success: true, data: { worldProduct, pool } });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: e.message }); }
});

router.get('/area-demands', async (req, res) => {
  try {
    const { status = 'open' } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const demands = await AreaDemand.find(filter).sort({ priority: -1, createdAt: -1 }).limit(200);
    res.json({ success: true, data: demands });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await Executive.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
// LOCATION: server/routes/areaDemandRoutes.js - AREA DEMAND ROUTES - V14 FINAL
const express = require('express');
const router = express.Router();
const AreaDemand = require('../models/AreaDemand');

router.post('/create', async (req, res) => {
  try {
    const { areaManagerId, areaName, productName, quantity } = req.body;
    if (!areaManagerId || !areaName || !productName || !quantity) return res.status(400).json({ success: false, error: 'Missing required' });
    const demand = await AreaDemand.create(req.body);
    res.json({ success: true, data: demand });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/my/:areaManagerId', async (req, res) => {
  try { const list = await AreaDemand.find({ areaManagerId: req.params.areaManagerId }).sort({ createdAt: -1 }); res.json({ success: true, data: list }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/list', async (req, res) => {
  try { const list = await AreaDemand.find().sort({ createdAt: -1 }); res.json({ success: true, data: list }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.put('/fulfill/:id', async (req, res) => {
  try {
    const { fulfilledBy, fulfilledByExecutive } = req.body;
    const updated = await AreaDemand.findByIdAndUpdate(req.params.id, { status: 'fulfilled', fulfilledBy, fulfilledByExecutive }, { new: true });
    res.json({ success: true, data: updated });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
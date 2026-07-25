const express = require('express');
const router = express.Router();
const Auto = require('../../models/shops/Auto');
const Shop = require('../../models/Shop');
const { getShopId } = require('../../utils/shopId');

// GET FULL AUTO SHOP DATA
router.get('/:shopId', async (req, res) => {
  try {
    const shopId = getShopId(req); // ✅ String me convert ho jayega
    console.log("AUTO GET CALLED FOR:", shopId);

    let autoData = await Auto.findOne({ shopId }).lean();
    const shopInfo = await Shop.findById(shopId).lean();

    if(!autoData){
      // pehli baar khul raha to khali bana de
      autoData = await Auto.create({ shopId, shopName: shopInfo?.shopName });
    }

    // STATS CALCULATE
    const today = new Date().toDateString();
    const todayJobs = autoData.serviceJobs.filter(j => new Date(j.createdAt).toDateString() === today);
    const todayRevenue = todayJobs.reduce((sum, j) => sum + (j.totalAmount || 0), 0);

    const response = {
      success: true,
      shop: {
        shopId: shopId,
        shopName: shopInfo?.shopName || autoData.shopName || 'Auto Parts',
        parts: autoData.parts || [],
        serviceJobs: autoData.serviceJobs || [],
        services: autoData.services || [],
        stats: {
          vehicles: autoData.serviceJobs.filter(j => j.status!== 'delivered').length,
          service: todayJobs.length,
          revenue: todayRevenue,
          parts: autoData.parts.length
        },
        lowStock: autoData.parts.filter(p => p.stock <= p.lowStockLimit)
      }
    }
    res.json(response);
  } catch(err) {
    console.log("AUTO GET ERROR:", err)
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST NEW PART
router.post('/:shopId/part', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const part = req.body;
    const auto = await Auto.findOneAndUpdate(
      { shopId },
      { $push: { parts: part } },
      { new: true, upsert: true }
    );
    res.json({ success: true, part: auto.parts[auto.parts.length - 1] });
  } catch(err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST NEW SERVICE JOB
router.post('/:shopId/service', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const job = req.body;
    job.totalAmount = job.services.reduce((sum, s) => sum + s.price, 0);
    const auto = await Auto.findOneAndUpdate(
      { shopId },
      { $push: { serviceJobs: job } },
      { new: true, upsert: true }
    );
    res.json({ success: true, job: auto.serviceJobs[auto.serviceJobs.length - 1] });
  } catch(err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE JOB STATUS
router.put('/:shopId/service/:jobId', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const { status } = req.body;
    await Auto.updateOne(
      { shopId, "serviceJobs._id": req.params.jobId },
      { $set: { "serviceJobs.$.status": status }}
    );
    res.json({ success: true });
  } catch(err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
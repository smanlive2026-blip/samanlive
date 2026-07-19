const express = require('express');
const router = express.Router();
const Shop = require('../../models/Shop');

// GET SHOP DATA
router.get('/get/:shopId', async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId);
    if(!shop) return res.status(404).json({success: false, message: 'Shop not found'});
    res.json({ success: true, data: shop });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

// UPDATE SHOP DATA
router.put('/update/:shopId', async (req, res) => {
  try {
    const shop = await Shop.findByIdAndUpdate(
      req.params.shopId,
      { $set: req.body },
      { new: true }
    );
    res.json({ success: true, data: shop });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
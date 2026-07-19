const express = require('express');
const router = express.Router();
const Shop = require('../../models/common/Shop');

// PHOTO/LOCATION/SETTINGS UPDATE
router.put('/:shopId', async (req, res) => {
  try {
    const shop = await Shop.findOneAndUpdate(
      { shopId: req.params.shopId },
      { $set: req.body }, // ownerPhotoUrl, location, isOpen
      { new: true, upsert: true }
    );
    res.json({ success: true, data: shop });
  } catch(err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
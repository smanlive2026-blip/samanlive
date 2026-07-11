const express = require('express');
const router = express.Router();
const locationCtrl = require('../controllers/locationController');

router.post('/user', locationCtrl.updateUserLocation);
router.post('/shop', locationCtrl.updateShopLocation);
router.get('/nearby-shops', locationCtrl.getNearbyShops);

module.exports = router;
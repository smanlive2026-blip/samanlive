const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');
const shopCtrl = require('../controllers/shopController'); // <-- Bas 2 dot, 3 nahi

// Admin Routes - Sabhi shop dekhega
router.get('/shops', verifyToken, isAdmin, shopCtrl.getAllShops);

// User Routes - Apni shop dekhega
router.get('/my-shops', verifyToken, shopCtrl.getMyShops);

// Public Route - Koi bhi shop detail dekh sakta hai
router.get('/shops/:id', shopCtrl.getShopById);

// Create Shop - User aur Admin dono
router.post('/shops', verifyToken, shopCtrl.createShop);

// Update/Delete - Owner ya Admin
router.put('/shops/:id', verifyToken, shopCtrl.updateShop);
router.delete('/shops/:id', verifyToken, shopCtrl.deleteShop);

module.exports = router;
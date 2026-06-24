const express = require('express');
const router = express.Router();
// ✅ auth.js ki jagah authenticateToken.js se import kar
const { authenticateToken, requireAdmin } = require('../middleware/authenticateToken'); 
const shopCtrl = require('../../public/controllers/shopController'); // <-- 3 dot sahi hai

// Admin Routes - Sabhi shop dekhega
router.get('/shops', authenticateToken, requireAdmin, shopCtrl.getAllShops);

// User Routes - Apni shop dekhega  
router.get('/my-shops', authenticateToken, shopCtrl.getMyShops);

// Public Route - Koi bhi shop detail dekh sakta hai
router.get('/shops/:id', shopCtrl.getShopById);

// Create Shop - User aur Admin dono
router.post('/shops', authenticateToken, shopCtrl.createShop);

// Update/Delete - Owner ya Admin
router.put('/shops/:id', authenticateToken, shopCtrl.updateShop);
router.delete('/shops/:id', authenticateToken, shopCtrl.deleteShop);

module.exports = router;

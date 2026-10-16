// LOCATION: server/routes/common/cart.routes.js - V13 SERVER CART - MINIMAL localStorage
const express = require('express');
const router = express.Router();

// In-memory cart store - Mongo pe load nahi dalna, fast hai
// Production me Redis use karna, abhi memory hi theek hai
let cartStore = {}; // { buyerId: { supplierId: [items] } }

// POST /api/common/cart/sync - CartCore sync karega
router.post('/sync', async (req, res) => {
  try {
    const { buyerId, buyerRole, supplierId, items } = req.body;
    if (!buyerId ||!supplierId) {
      return res.status(400).json({ success: false, message: 'buyerId, supplierId required' });
    }

    if (!cartStore[buyerId]) cartStore[buyerId] = {};
    cartStore[buyerId][supplierId] = items || [];

    // 1 hour me auto clear - memory bachane ko
    setTimeout(() => {
      if (cartStore[buyerId] && cartStore[buyerId][supplierId]) {
        // delete nahi karna, rehne do
      }
    }, 1000 * 60 * 60);

    res.json({ success: true, message: 'Cart synced', carts: cartStore[buyerId] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/common/cart?buyerId=xxx - restore ke liye
router.get('/', (req, res) => {
  const { buyerId } = req.query;
  if (!buyerId) return res.json({ success: true, carts: {} });
  res.json({ success: true, carts: cartStore[buyerId] || {} });
});

// POST /api/common/cart/clear
router.post('/clear', (req, res) => {
  const { buyerId, supplierId } = req.body;
  if (!buyerId) return res.json({ success: true });
  if (supplierId) {
    if (cartStore[buyerId]) delete cartStore[buyerId][supplierId];
  } else {
    delete cartStore[buyerId];
  }
  res.json({ success: true, message: 'Cleared' });
});

module.exports = router;
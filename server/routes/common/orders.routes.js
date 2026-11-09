// LOCATION: server/routes/common/orders.routes.js - V1 FINAL - 7 ROLE WISE
const express = require('express');
const router = express.Router();
const Order = require('../../models/Order');

// ===== HELPER - Kaun kya kar sakta hai =====
const CAN_CHANGE = {
  // Shop Owner kya kar sakta hai
  shop_owner: ['confirmed', 'cancelled', 'packed'],
  // Area Manager kya kar sakta hai
  'area-manager': ['assigned'],
  // Delivery Boy kya kar sakta hai
  delivery_boy: ['picked', 'delivered'],
  // Admin / Executive sirf dekh sakta hai, status nahi badlega
  admin: [],
  executive: [],
  product_manager: [],
  customer: ['cancelled'], // Customer sirf placed me cancel kar sakta hai
};

// ===== 1. ORDER BANANA - Sirf Customer / Shop Owner (Bulk ke liye) =====
// POST /api/common/orders/create
router.post('/create', async (req, res) => {
  try {
    const { buyerId, buyerRole, supplierId, supplierRole, items, totalAmount, deliveryAddress, paymentMode, shopId, areaId } = req.body;

    if (!buyerId || !supplierId || !items?.length)
      return res.status(400).json({ success: false, message: 'buyerId, supplierId, items chahiye' });

    if (!totalAmount || totalAmount <= 0)
      return res.status(400).json({ success: false, message: 'totalAmount sahi nahi hai' });

    const order = await Order.create({
      buyerId,
      buyerRole: buyerRole || 'customer',
      buyerShopId: req.body.buyerShopId || null,
      buyerAreaId: req.body.buyerAreaId || null,
      supplierId,
      supplierRole: supplierRole || 'shop_owner',
      supplierShopId: shopId || supplierId,
      shopId: shopId || supplierId,
      shopType: req.body.shopType || '',
      areaId: areaId || null,
      items: items.map(i => ({
        productId: i.productId || i._id || '',
        name: i.name,
        price: Number(i.price || 0),
        quantity: Number(i.qty || i.quantity || 1),
        qty: Number(i.qty || i.quantity || 1),
        image: i.image || i.thumbnail || '',
        shopId: shopId || supplierId,
      })),
      totalAmount: Number(totalAmount),
      total: Number(totalAmount),
      deliveryAddress: deliveryAddress || {},
      paymentMethod: paymentMode || 'cod',
      paymentMode: paymentMode || 'cod',
      paymentStatus: 'pending',
      orderStatus: 'placed',
      isBulkOrder: buyerRole === 'shop_owner' || buyerRole === 'area_manager',
    });

    res.json({ success: true, orderId: order.orderId, order });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===== 2. LIST - Har Role Ko Uska Hissa Hi Dikhega =====
// GET /api/common/orders/list?role=shop_owner&id=SHOP_ID
// GET /api/common/orders/list?role=customer&id=BUYER_ID
// GET /api/common/orders/list?role=area-manager&id=AREA_ID
// GET /api/common/orders/list?role=delivery_boy&id=DELIVERY_BOY_ID
// GET /api/common/orders/list?role=executive
// GET /api/common/orders/list?role=admin
router.get('/list', async (req, res) => {
  try {
    const { role, id, status, limit = 50 } = req.query;
    let query = {};

    if (role === 'customer') query.buyerId = id;
    else if (role === 'shop_owner') query.supplierId = id; // Shop ka order
    else if (role === 'area-manager') query.areaId = id; // Area ke saare order
    else if (role === 'delivery_boy') query.deliveryBoyId = id; // Uske assign order
    else if (role === 'executive' || role === 'admin') query = {}; // Sab dekh sakta hai
    else if (role === 'product_manager') query.supplierId = id; // Uska bulk order

    if (status) query.orderStatus = status;

    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(Number(limit)).lean();
    res.json({ success: true, total: orders.length, orders });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===== 3. EK ORDER KA DETAIL =====
// GET /api/common/orders/detail/:orderId
router.get('/detail/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId }).lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order nahi mila' });
    res.json({ success: true, order });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===== 4. STATUS BADALNA - Role Check Ke Saath =====
// PUT /api/common/orders/:orderId/status
// Body: { role, userId, newStatus, deliveryBoyId }
router.put('/:orderId/status', async (req, res) => {
  try {
    const { role, userId, newStatus, deliveryBoyId } = req.body;
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Order nahi mila' });

    // 1. Ye role ye status badal sakta hai ya nahi?
    if (!CAN_CHANGE[role]?.includes(newStatus))
      return res.status(403).json({ success: false, message: `${role} ko ${newStatus} karne ka haq nahi hai` });

    // 2. Customer sirf placed ko cancel kar sakta hai
    if (role === 'customer' && order.orderStatus !== 'placed')
      return res.status(403).json({ success: false, message: 'Ab cancel nahi ho sakta, dukaan ne accept kar liya' });

    // 3. Shop Owner sirf apna order badal sakta hai
    if (role === 'shop_owner' && String(order.supplierId) !== String(userId) && String(order.shopId) !== String(userId))
      return res.status(403).json({ success: false, message: 'Ye order tumhari dukaan ka nahi hai' });

    // 4. Delivery Boy sirf apna assign order badal sakta hai
    if (role === 'delivery_boy' && String(order.deliveryBoyId) !== String(userId))
      return res.status(403).json({ success: false, message: 'Ye order tumhe assign nahi hai' });

    order.orderStatus = newStatus;
    if (newStatus === 'delivered') order.paymentStatus = order.paymentMode === 'cod' ? 'paid' : order.paymentStatus;
    await order.save();

    res.json({ success: true, message: `Order ${newStatus} ho gaya`, order });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===== 5. AREA MANAGER - DELIVERY BOY ASSIGN KAREGA =====
// PUT /api/common/orders/:orderId/assign
// Body: { areaManagerId, deliveryBoyId }
router.put('/:orderId/assign', async (req, res) => {
  try {
    const { deliveryBoyId } = req.body;
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Order nahi mila' });
    if (order.orderStatus !== 'packed')
      return res.status(400).json({ success: false, message: 'Pehle dukaan ko pack karna hoga, tabhi assign hoga' });

    order.deliveryBoyId = deliveryBoyId;
    order.orderStatus = 'assigned';
    await order.save();
    res.json({ success: true, message: 'Delivery Boy assign ho gaya', order });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===== 6. TRACK - Customer Ke Liye =====
// GET /api/common/orders/track/:orderId
router.get('/track/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId }).lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order nahi mila' });
    res.json({
      success: true,
      status: order.orderStatus,
      deliveryBoyId: order.deliveryBoyId || null,
      order,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
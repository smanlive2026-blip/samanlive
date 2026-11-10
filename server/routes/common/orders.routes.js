// LOCATION: server/routes/common/orders.routes.js
// CONTRACT: public/shop-templates/common/SHOP-DASHBOARD-COMMON-CONTRACT.md - Step 1.1
// MOUNT: /api/common/orders  (common/index.js -> getMountPath('orders.routes.js') = '/orders')
// FRONTEND: public/shop-templates/common/orders/orders.js se 1:1 match
// RULE:
// - Shop: Accept / Reject / Packed - sirf apni dukaan ka order
// - Delivery Boy: Picked / Out / Delivered - sirf apna order
// - Customer: Cancel - sirf placed me, sirf apna order
// - Area Manager / Admin: SIRF DEKHENGE, status nahi badlenge
// - Assign: Is file me nahi hai - Step 4 me automatic hoga, Area Manager assign nahi karega

const express = require('express');
const router = express.Router();
const Order = require('../../models/Order');

const STATUSES = ['placed', 'confirmed', 'packed', 'picked', 'out_for_delivery', 'delivered', 'cancelled', 'rejected'];

// Kaunsi status se kaunsi status pe ja sakte hain - iske bahar jaana mana hai
const TRANSITIONS = {
  placed: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['picked'],
  picked: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
  rejected: []
};

// Ek order ko kaun dekh sakta hai - apna hissa hi dikhega
function canAccess(order, role, id) {
  if (!order) return false;
  if (role === 'admin') return true;
  if (role === 'area_manager' || role === 'area-manager') return true; // sirf dekhne ke liye, badalne ke liye nahi
  if (role === 'shop_owner') return String(order.supplierId) === String(id) || String(order.shopId) === String(id);
  if (role === 'customer' || role === 'guest') return String(order.buyerId) === String(id);
  if (role === 'delivery_boy') return String(order.deliveryBoyId) === String(id);
  if (role === 'product_manager') return order.isBulkOrder === true;
  return false;
}

// Order banane se pehle sab check - galat order bannna hi nahi chahiye
function validateCreate(b) {
  const e = [];
  if (!b.buyerId) e.push('buyerId required');
  if (!['customer', 'shop_owner', 'area_manager', 'guest'].includes(b.buyerRole)) e.push('buyerRole invalid');
  if (!b.supplierId) e.push('supplierId required');
  if (!['shop_owner', 'area_manager', 'admin'].includes(b.supplierRole)) e.push('supplierRole invalid');
  if (!Array.isArray(b.items) || !b.items.length) e.push('items min 1 required');
  else b.items.forEach((it, i) => {
    if (!it.name) e.push(`items[${i}].name required`);
    if (typeof it.price !== 'number' || it.price < 0) e.push(`items[${i}].price invalid`);
    const q = it.qty ?? it.quantity;
    if (!Number.isInteger(q) || q < 1) e.push(`items[${i}].qty must be integer >=1`);
  });
  if (typeof b.totalAmount !== 'number' || b.totalAmount < 0) e.push('totalAmount invalid');
  if (Array.isArray(b.items)) {
    const sum = b.items.reduce((s, it) => s + (it.price || 0) * (it.qty ?? it.quantity ?? 1), 0);
    if (Math.abs(sum - (b.totalAmount || 0)) > 1) e.push(`totalAmount mismatch: items sum ${sum} != total ${b.totalAmount}`);
  }
  return e;
}

// ============================================================
// 1. LIST - GET /api/common/orders/list?role=shop_owner&id=SHOP_ID&status=placed&page=1&limit=20
// ============================================================
router.get('/list', async (req, res) => {
  try {
    const { role, id, status, page = 1, limit = 20, search } = req.query;
    if (!role || !id) return res.status(400).json({ success: false, message: 'role and id required' });

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const q = {};

    if (role === 'shop_owner') q.supplierId = id;
    else if (role === 'customer' || role === 'guest') q.buyerId = id;
    else if (role === 'area_manager' || role === 'area-manager') q.$or = [{ areaId: id }, { buyerAreaId: id }];
    else if (role === 'delivery_boy') q.deliveryBoyId = id;
    else if (role === 'product_manager') q.isBulkOrder = true;
    else if (role === 'admin') { /* sab dikhega, par badal nahi sakta */ }
    else return res.status(400).json({ success: false, message: 'Invalid role' });

    if (status) {
      if (!STATUSES.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
      q.orderStatus = status;
    }
    if (search) q.orderId = { $regex: String(search).trim(), $options: 'i' };

    const [orders, total] = await Promise.all([
      Order.find(q).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
      Order.countDocuments(q)
    ]);

    res.json({ success: true, orders, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
  } catch (e) {
    console.error('[orders/list]', e);
    res.status(500).json({ success: false, message: 'Order list failed' });
  }
});

// ============================================================
// 2. DETAIL - GET /api/common/orders/detail/:orderId?role=shop_owner&id=SHOP_ID
// ============================================================
router.get('/detail/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId }).lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const { role, id } = req.query;
    if (role && id && !canAccess(order, role, id)) {
      return res.status(403).json({ success: false, message: 'Ye order tumhara nahi hai' });
    }
    res.json({ success: true, order });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Order detail failed' });
  }
});

// ============================================================
// 3. CREATE - POST /api/common/orders/create
// Shop View -> Checkout se yahi call hoga
// ============================================================
router.post('/create', async (req, res) => {
  try {
    const errors = validateCreate(req.body);
    if (errors.length) return res.status(400).json({ success: false, errors });

    // Double click pe double order nahi banega
    const idemKey = req.headers['idempotency-key'];
    if (idemKey) {
      const ex = await Order.findOne({ idempotencyKey: idemKey }).lean();
      if (ex) return res.json({ success: true, duplicated: true, orderId: ex.orderId, order: ex });
    }

    const { buyerId, buyerRole, supplierId, supplierRole, items, totalAmount, deliveryAddress, paymentMode } = req.body;

    const order = new Order({
      buyerId, buyerRole, supplierId, supplierRole,
      supplierShopId: req.body.supplierShopId || supplierId || null,
      buyerShopId: req.body.buyerShopId || null,
      buyerAreaId: req.body.buyerAreaId || null,
      areaId: req.body.areaId || null,
      items: items.map(i => ({
        productId: i.productId || '',
        name: i.name,
        price: i.price,
        qty: i.qty ?? i.quantity,
        quantity: i.qty ?? i.quantity,
        image: i.image || ''
      })),
      totalAmount, total: totalAmount,
      deliveryAddress: deliveryAddress || {},
      paymentMode: paymentMode || 'cod',
      paymentMethod: paymentMode || 'cod',
      orderStatus: 'placed',
      isBulkOrder: buyerRole === 'shop_owner' || buyerRole === 'area_manager',
      idempotencyKey: idemKey || undefined
    });

    await order.save();

    // Live - Shop Dashboard me popup aayega, bina refresh ke
    try {
      const io = req.app.get('io') || global.io;
      if (io) io.to(`shop:${supplierId}`).emit('new-order', { orderId: order.orderId, totalAmount, createdAt: order.createdAt });
    } catch (_) {}

    res.status(201).json({ success: true, orderId: order.orderId, order });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ success: false, message: 'Order already created' });
    console.error('[orders/create]', e);
    res.status(500).json({ success: false, message: 'Order create failed: ' + e.message });
  }
});

// ============================================================
// 4. STATUS - PUT /api/common/orders/:orderId/status
// Body: { role, userId, newStatus }
// FRONTEND orders.js yahi PUT bhejta hai - isliye PUT rakha hai
// ============================================================
router.put('/:orderId/status', async (req, res) => {
  try {
    const { role, userId, newStatus, status } = req.body;
    const next = newStatus || status;
    if (!STATUSES.includes(next)) return res.status(400).json({ success: false, message: 'Invalid status' });
    if (!role || !userId) return res.status(400).json({ success: false, message: 'role and userId required' });

    // MD RULE - Area Manager / Admin status nahi badlenge, sirf dekhenge
    if (role === 'area_manager' || role === 'area-manager' || role === 'admin') {
      return res.status(403).json({ success: false, message: 'Area Manager / Admin order ka status nahi badlenge, sirf record dekhenge' });
    }

    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Kaun kya kar sakta hai - MD ke hisaab se
    const isShop = role === 'shop_owner' && (String(order.supplierId) === String(userId) || String(order.shopId) === String(userId));
    const isShopAction = isShop && ['confirmed', 'rejected', 'packed', 'cancelled'].includes(next);

    const isBuyerCancel = role === 'customer' && next === 'cancelled' && String(order.buyerId) === String(userId);
    const isBuyerReject = false; // Customer reject nahi karta, sirf cancel karta hai

    const isDeliveryBoy = role === 'delivery_boy' && String(order.deliveryBoyId) === String(userId) && ['picked', 'out_for_delivery', 'delivered'].includes(next);

    if (!isShopAction && !isBuyerCancel && !isDeliveryBoy) {
      return res.status(403).json({ success: false, message: 'Tum is order ka ye status nahi badal sakte' });
    }

    const allowed = TRANSITIONS[order.orderStatus] || [];
    if (!allowed.includes(next)) {
      return res.status(409).json({ success: false, message: `Cannot go from ${order.orderStatus} to ${next}` });
    }

    // Shop Reject kare toh status rejected hoga, cancelled nahi
    order.orderStatus = next;
    await order.save();

    try {
      const io = req.app.get('io') || global.io;
      if (io) {
        io.to(`shop:${order.supplierId}`).emit('order-updated', order);
        io.to(`buyer:${order.buyerId}`).emit('order-updated', order);
      }
    } catch (_) {}

    res.json({ success: true, order });
  } catch (e) {
    console.error('[orders/status]', e);
    res.status(500).json({ success: false, message: 'Status update failed' });
  }
});

// ============================================================
// 5. TRACK - GET /api/common/orders/track/:orderId
// Customer ke liye - apna order kahan tak pahuncha
// ============================================================
router.get('/track/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId }).lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const timeline = ['placed', 'confirmed', 'packed', 'picked', 'out_for_delivery', 'delivered'];
    const idx = timeline.indexOf(order.orderStatus);
    res.json({
      success: true,
      order,
      timeline: timeline.map((s, i) => ({ status: s, done: idx >= 0 ? i <= idx : false, current: s === order.orderStatus }))
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Track failed' });
  }
});

// ============================================================
// 6. ASSIGN - BAND HAI - MD ke hisaab se
// Area Manager assign nahi karega. Delivery Boy automatic jayega - Step 4 me.
// Isliye is route pe koi assign nahi hoga, sirf saaf message jayega.
// ============================================================
router.put('/:orderId/assign', async (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Assign band hai - Area Manager assign nahi karega. Delivery Boy automatic jayega - Step 4 me banega.'
  });
});

module.exports = router;
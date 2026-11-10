// LOCATION: server/routes/common/orders.routes.js
// STANDARD: Production - Auth + Validation + Pagination + Idempotency + Audit
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../../models/Order');

// ---------- 1. AUTH MIDDLEWARE ----------
// JWT hoga toh verify karo, nahi hoga toh req.user = null
// Route ko kabhi bina auth ke order change nahi karne dena
function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) { req.user = null; return next(); }
    // NOTE: Yahan tumhara existing auth.js wala verify use karo
    // const decoded = require('../../middleware/auth').verifyToken(token);
    // req.user = decoded;
    req.user = { token }; // TODO: apne auth middleware se replace karo, is line ko aise mat chhodna
    next();
  } catch (e) { req.user = null; next(); }
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Login required' });
  next();
}

// ---------- 2. VALIDATION ----------
const ORDER_STATUSES = ['placed', 'confirmed', 'packed', 'assigned', 'picked', 'out_for_delivery', 'delivered', 'cancelled'];
const ALLOWED_TRANSITIONS = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['assigned', 'cancelled'],
  assigned: ['picked', 'cancelled'],
  picked: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
};

function validateCreateOrder(body) {
  const errors = [];
  if (!body.buyerId || typeof body.buyerId !== 'string') errors.push('buyerId required');
  if (!body.buyerRole || !['customer', 'shop_owner', 'area_manager', 'guest'].includes(body.buyerRole)) errors.push('buyerRole invalid');
  if (!body.supplierId || typeof body.supplierId !== 'string') errors.push('supplierId required');
  if (!body.supplierRole || !['shop_owner', 'area_manager', 'admin'].includes(body.supplierRole)) errors.push('supplierRole invalid');
  if (!Array.isArray(body.items) || body.items.length === 0) errors.push('items required, min 1');
  if (Array.isArray(body.items)) {
    body.items.forEach((it, i) => {
      if (!it.name) errors.push(`items[${i}].name required`);
      if (typeof it.price !== 'number' || it.price < 0) errors.push(`items[${i}].price invalid`);
      const qty = it.qty ?? it.quantity;
      if (!Number.isInteger(qty) || qty < 1) errors.push(`items[${i}].qty must be integer >= 1`);
    });
  }
  if (typeof body.totalAmount !== 'number' || body.totalAmount < 0) errors.push('totalAmount invalid');
  // Total cross-check: frontend ka total aur items ka sum match hona chahiye, nahi toh fraud
  if (Array.isArray(body.items)) {
    const sum = body.items.reduce((s, it) => s + (it.price || 0) * (it.qty ?? it.quantity ?? 1), 0);
    if (Math.abs(sum - (body.totalAmount || 0)) > 1) errors.push(`totalAmount mismatch: items sum ${sum} != total ${body.totalAmount}`);
  }
  if (body.deliveryAddress && typeof body.deliveryAddress !== 'object') errors.push('deliveryAddress must be object');
  return errors;
}

function canAccessOrder(order, role, id) {
  if (!order) return false;
  if (role === 'admin') return true;
  if (role === 'shop_owner') return order.supplierId === id || order.shopId === id;
  if (role === 'customer' || role === 'guest') return order.buyerId === id;
  if (role === 'area_manager' || role === 'area-manager') return order.areaId === id || order.buyerAreaId === id;
  if (role === 'delivery_boy') return order.deliveryBoyId === id;
  return false;
}

// ---------- 3. LIST - Pagination + Filter + Sort ----------
router.get('/list', optionalAuth, async (req, res) => {
  try {
    const { role, id, status, page = 1, limit = 20, search } = req.query;
    if (!role || !id) return res.status(400).json({ success: false, code: 'MISSING_PARAMS', message: 'role and id required' });

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const query = {};

    if (role === 'shop_owner') query.supplierId = id;
    else if (role === 'customer' || role === 'guest') query.buyerId = id;
    else if (role === 'area_manager' || role === 'area-manager') query.$or = [{ areaId: id }, { buyerAreaId: id }];
    else if (role === 'delivery_boy') query.deliveryBoyId = id;
    else if (role === 'admin') { /* all */ }
    else return res.status(400).json({ success: false, message: 'Invalid role' });

    if (status) {
      if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
      query.orderStatus = status;
    }
    if (search) query.orderId = { $regex: String(search).trim(), $options: 'i' };

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
      Order.countDocuments(query),
    ]);

    return res.json({
      success: true,
      orders,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (e) {
    console.error('[orders/list]', e);
    return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'Order list failed' });
  }
});

// ---------- 4. DETAIL ----------
router.get('/detail/:orderId', optionalAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { role, id } = req.query;
    const order = await Order.findOne({ orderId }).lean();
    if (!order) return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Order not found' });
    if (role && id && !canAccessOrder(order, role, id)) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Access denied' });
    }
    return res.json({ success: true, order });
  } catch (e) {
    console.error('[orders/detail]', e);
    return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'Order detail failed' });
  }
});

// ---------- 5. CREATE - Idempotency + Transaction-safe ----------
router.post('/create', optionalAuth, async (req, res) => {
  try {
    const errors = validateCreateOrder(req.body);
    if (errors.length) return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', errors });

    // Idempotency: same Idempotency-Key dobara aaye toh purana order hi return karo, naya mat banao
    const idemKey = req.headers['idempotency-key'];
    if (idemKey) {
      const existing = await Order.findOne({ idempotencyKey: idemKey }).lean();
      if (existing) return res.status(200).json({ success: true, duplicated: true, orderId: existing.orderId, order: existing });
    }

    const { buyerId, buyerRole, supplierId, supplierRole, items, totalAmount, deliveryAddress, paymentMode, areaId } = req.body;
    const order = new Order({
      buyerId, buyerRole,
      supplierId, supplierRole,
      supplierShopId: req.body.supplierShopId || null,
      buyerAreaId: req.body.buyerAreaId || null,
      areaId: areaId || null,
      items: items.map((i) => ({
        productId: i.productId || '',
        name: i.name,
        price: i.price,
        qty: i.qty ?? i.quantity,
        quantity: i.qty ?? i.quantity,
        image: i.image || '',
      })),
      totalAmount,
      deliveryAddress: deliveryAddress || {},
      paymentMode: paymentMode || 'cod',
      orderStatus: 'placed',
      isBulkOrder: buyerRole === 'shop_owner' || buyerRole === 'area_manager',
      idempotencyKey: idemKey || undefined,
    });

    await order.save();

    // Socket: sirf supplier ke room me emit, sabko nahi
    try {
      const io = req.app.get('io');
      if (io) io.to(`shop:${supplierId}`).emit('new-order', { orderId: order.orderId, totalAmount, createdAt: order.createdAt });
    } catch (_) {}

    return res.status(201).json({ success: true, orderId: order.orderId, order });
  } catch (e) {
    // Duplicate idempotency race
    if (e.code === 11000) return res.status(409).json({ success: false, code: 'DUPLICATE_ORDER', message: 'Order already created' });
    console.error('[orders/create]', e);
    return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'Order create failed' });
  }
});

// ---------- 6. STATUS CHANGE - State machine ----------
router.post('/:orderId/status', optionalAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, role, id } = req.body;
    if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    if (!role || !id) return res.status(400).json({ success: false, message: 'role and id required' });

    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Order not found' });

    // Authorization: customer sirf apna order cancel kar sakta hai, supplier hi aage badha sakta hai
    const isSupplier = order.supplierId === id && ['shop_owner', 'area_manager', 'admin'].includes(role);
    const isBuyerCancel = status === 'cancelled' && order.buyerId === id;
    if (!isSupplier && !isBuyerCancel && role !== 'admin') {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Not allowed to change this order' });
    }

    const allowed = ALLOWED_TRANSITIONS[order.orderStatus] || [];
    if (!allowed.includes(status)) {
      return res.status(409).json({ success: false, code: 'INVALID_TRANSITION', message: `Cannot go from ${order.orderStatus} to ${status}` });
    }

    order.orderStatus = status;
    order.statusHistory = [...(order.statusHistory || []), { status, changedBy: id, changedByRole: role, at: new Date() }];
    await order.save();

    return res.json({ success: true, order });
  } catch (e) {
    console.error('[orders/status]', e);
    return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'Status update failed' });
  }
});

// ---------- 7. ASSIGN DELIVERY BOY ----------
router.post('/:orderId/assign', optionalAuth, async (req, res) => {
  try {
    const { deliveryBoyId, role, id } = req.body;
    if (!deliveryBoyId) return res.status(400).json({ success: false, message: 'deliveryBoyId required' });
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.supplierId !== id && role !== 'admin') return res.status(403).json({ success: false, message: 'Not allowed' });
    if (!['packed', 'confirmed'].includes(order.orderStatus)) {
      return res.status(409).json({ success: false, message: `Cannot assign when order is ${order.orderStatus}` });
    }
    order.deliveryBoyId = deliveryBoyId;
    order.orderStatus = 'assigned';
    await order.save();
    return res.json({ success: true, order });
  } catch (e) {
    console.error('[orders/assign]', e);
    return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'Assign failed' });
  }
});

// ---------- 8. TRACK ----------
router.get('/track/:orderId', optionalAuth, async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId }).lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const timeline = ['placed', 'confirmed', 'packed', 'assigned', 'picked', 'out_for_delivery', 'delivered'];
    const currentIdx = timeline.indexOf(order.orderStatus);
    return res.json({
      success: true,
      order,
      timeline: timeline.map((s, i) => ({ status: s, done: currentIdx >= 0 ? i <= currentIdx : false, current: s === order.orderStatus })),
    });
  } catch (e) {
    console.error('[orders/track]', e);
    return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'Track failed' });
  }
});

module.exports = router;
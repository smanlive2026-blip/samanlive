// LOCATION: server/routes/common/checkout.routes.js - V13 HIERARCHY CHECKOUT + WALLET + SOCKET
const express = require('express');
const router = express.Router();
const Order = require('../../models/Order');
const Wallet = require('../../models/Wallet');

// Helper: Wallet get or create
async function getOrCreateWallet(userId, role, shopId = null, areaId = null){
  let wallet = await Wallet.findOne({ userId, role });
  if (!wallet) {
    wallet = new Wallet({ userId, role, shopId, areaId, balance: 0 });
    await wallet.save();
  }
  return wallet;
}

// POST /api/common/checkout - hierarchy-checkout.js se call ayega
router.post('/', async (req, res) => {
  try {
    const {
      buyerId, buyerRole, buyerShopId, buyerAreaId,
      supplierId, supplierRole, supplierShopId, shopId, areaId,
      items, addressId, address, paymentMode, isBulkOrder, total, totalAmount,
      gstInvoiceNeeded, gstNumber
    } = req.body;

    // Validation
    if (!buyerId ||!supplierId ||!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'buyerId, supplierId, items required' });
    }

    // RoleHierarchy server side double check
    const hierarchy = {
      admin: [],
      area_manager: ['admin'],
      shop_owner: ['admin','area_manager'],
      customer: ['shop_owner','area_manager','admin']
    };
    const allowed = hierarchy[buyerRole] || [];
    if (buyerRole!== 'guest' && buyerRole === supplierRole) {
      // same role block
      if (buyerRole!== 'customer') {
        return res.status(403).json({ success: false, message: 'Same role buying blocked' });
      }
    }
    if (buyerRole!== 'guest' &&!allowed.includes(supplierRole) && buyerRole!== 'customer') {
      // customer ko sab allowed, but others check
      if (!(buyerRole === 'customer' && ['shop_owner','area_manager','admin'].includes(supplierRole))) {
        if (buyerRole!== 'guest') {
          return res.status(403).json({ success: false, message: `${buyerRole} cannot buy from ${supplierRole}` });
        }
      }
    }

    const finalTotal = total || totalAmount || items.reduce((s,i)=> s + (i.price * (i.qty||i.quantity||1)), 0);

    // Commission: 5% if supplier!= admin
    let commissionAmount = 0;
    let supplierEarning = finalTotal;
    if (supplierRole!== 'admin') {
      commissionAmount = Math.round(finalTotal * 0.05);
      supplierEarning = finalTotal - commissionAmount;
    }

    // Create Order
    const order = new Order({
      buyerId,
      buyerRole: buyerRole || 'customer',
      buyerShopId: buyerShopId || null,
      buyerAreaId: buyerAreaId || null,
      supplierId,
      supplierRole,
      supplierShopId: supplierShopId || null,
      shopId: shopId || supplierShopId || supplierId,
      areaId: areaId || buyerAreaId || null,
      isBulkOrder: isBulkOrder || (buyerRole!== 'customer' && buyerRole!== 'guest'),
      items: items.map(it=> ({
        productId: it.productId || it._id || it.id,
        name: it.name || it.title,
        price: it.price,
        quantity: it.qty || it.quantity || 1,
        qty: it.qty || it.quantity || 1,
        image: it.image || it.images?.[0] || '',
        ownerRole: it.ownerRole || supplierRole,
        ownerId: it.ownerId || supplierId,
        shopId: it.shopId || shopId
      })),
      totalAmount: finalTotal,
      total: finalTotal,
      commissionAmount,
      supplierEarning,
      deliveryAddress: address || {},
      addressId: addressId || null,
      paymentMethod: paymentMode || 'cod',
      paymentMode: paymentMode || 'cod',
      paymentStatus: (paymentMode === 'cod' || paymentMode === 'credit')? 'pending' : 'paid',
      orderStatus: 'placed',
      gstInvoiceNeeded: gstInvoiceNeeded || false,
      gstNumber: gstNumber || null,
      userId: buyerId, // backward compat
      shopType: supplierRole
    });

    await order.save();

    // WALLET UPDATE
    try {
      // Supplier wallet credit
      const supplierWallet = await getOrCreateWallet(supplierId, supplierRole, supplierShopId, areaId);
      await supplierWallet.credit(order._id, finalTotal, commissionAmount, buyerRole, buyerId, paymentMode);

      // Admin wallet commission
      if (commissionAmount > 0) {
        // Admin wallet - pehla admin dhoondo ya default admin id
        let adminWallet = await Wallet.findOne({ role: 'admin' });
        if (!adminWallet) {
          adminWallet = new Wallet({ userId: 'admin_default', role: 'admin', balance: 0 });
          await adminWallet.save();
        }
        await adminWallet.addCommission(order._id, commissionAmount, supplierRole, supplierId);
      }

      // Agar buyer ne wallet se pay kiya
      if (paymentMode === 'wallet' && buyerRole!== 'customer' && buyerRole!== 'guest') {
        const buyerWallet = await getOrCreateWallet(buyerId, buyerRole, buyerShopId, buyerAreaId);
        await buyerWallet.debit(order._id, finalTotal, supplierRole, supplierId, 'wallet');
        order.walletDeducted = true;
        await order.save();
      }
    } catch (walletErr) {
      console.error('Wallet error:', walletErr.message);
      // Order fail nahi karna, wallet baad me adjust ho jayega
    }

    // SOCKET EMIT - LIVE ORDER POPUP
    try {
      if (global.io) {
        // Shop dashboard ko
        global.io.to(`shop:${supplierId}`).emit('new-order', order);
        global.io.to(`shop:${shopId || supplierId}`).emit('new-order', order);
        // Area manager ko bhi agar supplier area_manager hai
        global.io.emit('new-order', order); // global for admin panel
        console.log(`🔔 Socket emit new-order for shop:${supplierId}`);
      }
    } catch (sockErr) {
      console.error('Socket emit failed:', sockErr.message);
    }

    // Clear cart store
    // (cart.routes.js ka store clear karna - require cache se)
    try {
      const cartModule = require('./cart.routes.js');
      // direct cartStore access nahi, but client khud clear karega
    } catch(e){}

    res.json({
      success: true,
      message: 'Order placed successfully',
      orderId: order.orderId,
      _id: order._id,
      order: order,
      total: finalTotal,
      commission: commissionAmount,
      earning: supplierEarning
    });

  } catch (e) {
    console.error('Checkout error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/common/checkout/my-orders?buyerId=xxx
router.get('/my-orders', async (req, res) => {
  try {
    const { buyerId, supplierId, role } = req.query;
    let query = {};
    if (buyerId) query.buyerId = buyerId;
    if (supplierId) query.supplierId = supplierId;
    if (role) {
      // agar role=shop_owner toh uske orders jahan woh supplier hai
      if (['shop_owner','area_manager','admin'].includes(role) && supplierId) {
        query.supplierId = supplierId;
      }
    }
    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: orders });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
// LOCATION: server/routes/common/checkout.routes.js - V6 WORLD CLASS - SUPPLIER ROLE FIXED - GUEST + WALLET + COMMISSION + SOCKET
const express = require('express');
const router = express.Router();
const Order = require('../../models/Order');
const User = require('../../models/User');
const WorldProduct = require('../../models/WorldProduct');

// ========== HELPERS ==========
async function getUserByBuyerId(buyerId){
  if(!buyerId) return null;
  if(buyerId.startsWith('guest_')) return null;
  let id = buyerId;
  if(id.startsWith('user_')) id = id.replace('user_','');
  try{
    if(id.length===24){
      const u = await User.findById(id);
      if(u) return u;
    }
    const phone = id.split('_')[0].replace(/\D/g,'').slice(-10);
    if(phone && phone.length>=10){
      return await User.findOne({ phone });
    }
  }catch(e){}
  return null;
}

function normalizeSupplierRole(role){
  const allowed = ['shop_owner','area_manager','admin'];
  if(!role || role==='null' || role==='undefined' || role==='' || role==='unknown') return 'shop_owner';
  role = String(role).toLowerCase().trim();
  if(!allowed.includes(role)) return 'shop_owner';
  return role;
}

function normalizeBuyerRole(role){
  const allowed = ['customer','shop_owner','area_manager','admin','guest'];
  if(!role || role==='') return 'customer';
  role = String(role).toLowerCase().trim();
  if(!allowed.includes(role)) return 'customer';
  return role;
}

// ========== PLACE ORDER - MAIN ==========
router.post('/:shopId/place', async (req, res) => {
  try{
    const paramShopId = req.params.shopId;
    let {
      buyerId, buyerRole, buyerShopId, buyerAreaId,
      supplierId, supplierRole, supplierShopId,
      items, total, totalAmount, subtotal,
      commissionAmount, addressId, addressText, deliveryAddress,
      paymentMethod, paymentMode, isBulkOrder,
      gstInvoiceNeeded, gstNumber
    } = req.body;

    // ---- VALIDATION: items ----
    if(!items || !Array.isArray(items) || items.length===0){
      return res.status(400).json({ success: false, message: 'Cart khali hai - items missing' });
    }

    // ---- FIX 1: supplierId / shopId default ----
    // Screenshot wala bug yahi tha - supplierId khali ja raha tha
    let finalShopId = paramShopId || supplierId || items[0]?.shopId || '';
    let finalSupplierId = supplierId || paramShopId || items[0]?.shopId || items[0]?.ownerId || finalShopId;
    let finalSupplierRole = normalizeSupplierRole(supplierRole || items[0]?.ownerRole || items[0]?.shopOwnerRole || 'shop_owner');
    let finalSupplierShopId = supplierShopId || finalShopId || finalSupplierId;

    if(!finalShopId || finalShopId==='unknown'){
      return res.status(400).json({ success: false, message: 'Shop ID missing - shopId required' });
    }
    if(!finalSupplierId || finalSupplierId==='unknown'){
      finalSupplierId = finalShopId;
    }

    // ---- FIX 2: buyerId / buyerRole default ----
    let headerBuyerId = req.headers['x-buyer-id'] || req.headers['x-buyerid'] || '';
    let finalBuyerId = buyerId || headerBuyerId || '';
    if(!finalBuyerId){
      finalBuyerId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2,5);
    }
    let finalBuyerRole = normalizeBuyerRole(buyerRole || headerBuyerId?.startsWith('user_') ? 'customer' : 'customer');
    // Agar buyerId user_ se start hai to customer
    if(finalBuyerId.startsWith('user_') && finalBuyerRole==='guest') finalBuyerRole = 'customer';
    if(finalBuyerId.startsWith('guest_') && finalBuyerRole!=='guest') finalBuyerRole = 'guest';

    // ---- FIX 3: amounts ----
    let calcTotal = Number(totalAmount || total || 0);
    if(!calcTotal || calcTotal===0){
      calcTotal = items.reduce((s,i)=> s + (Number(i.price||0) * Number(i.qty||i.quantity||1)), 0);
    }
    let calcSubtotal = Number(subtotal || calcTotal);
    let calcCommission = Number(commissionAmount || 0);
    if(!calcCommission && finalSupplierRole!=='admin'){
      calcCommission = Math.round(calcTotal * 0.05); // 5% commission
    }

    // ---- FIX 4: delivery address ----
    let finalDeliveryAddress = deliveryAddress || {};
    if(typeof finalDeliveryAddress === 'string'){
      finalDeliveryAddress = { full: finalDeliveryAddress, fullAddress: finalDeliveryAddress };
    }
    if(!finalDeliveryAddress.full && addressText){
      finalDeliveryAddress.full = addressText;
      finalDeliveryAddress.fullAddress = addressText;
    }
    if(!finalDeliveryAddress.full){
      finalDeliveryAddress.full = addressText || 'Local Delivery';
    }

    // Agar logged user hai aur addressId hai to DB se address nikalo
    if(finalBuyerId && addressId && !String(addressId).startsWith('local_')){
      try{
        const user = await getUserByBuyerId(finalBuyerId);
        if(user && user.addresses && user.addresses.length>0){
          let addr = null;
          try{ addr = user.addresses.id(addressId); }catch(e){}
          if(!addr) addr = user.addresses.find(a=> String(a._id)===String(addressId));
          if(addr){
            finalDeliveryAddress = {
              name: addr.name || user.name || 'Customer',
              phone: addr.phone || user.phone || '',
              line1: addr.line1 || '',
              line2: addr.line2 || '',
              city: addr.city || '',
              state: addr.state || '',
              pincode: addr.pincode || '',
              label: addr.label || 'Home',
              full: addr.full || `${addr.line1||''} ${addr.line2?','+addr.line2:''}, ${addr.city||''}, ${addr.state||''} - ${addr.pincode||''}`,
              fullAddress: addr.full || `${addr.line1||''} ${addr.line2?','+addr.line2:''}, ${addr.city||''}, ${addr.state||''} - ${addr.pincode||''}`
            };
          }
        }
      }catch(e){
        console.log('Address fetch fail', e.message);
      }
    }

    // ---- FINAL ORDER ID ----
    const orderId = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2,4).toUpperCase();

    // ---- CREATE ORDER ----
    const orderDoc = {
      orderId: orderId,
      // Backward compat
      shopId: finalShopId,
      userId: finalBuyerId,
      userKey: finalBuyerId,
      // New hierarchy fields - REQUIRED
      buyerId: finalBuyerId,
      buyerRole: finalBuyerRole,
      buyerShopId: buyerShopId || null,
      buyerAreaId: buyerAreaId || null,
      supplierId: finalSupplierId,
      supplierRole: finalSupplierRole,
      supplierShopId: finalSupplierShopId,
      shopType: req.body.shopType || items[0]?.shopType || 'general',
      areaId: buyerAreaId || null,
      isBulkOrder: !!isBulkOrder || finalBuyerRole!=='customer',
      // Items
      items: items.map(it=>({
        productId: String(it.productId || it._id || ''),
        name: it.name || it.title || 'Product',
        price: Number(it.price||0),
        quantity: Number(it.qty||it.quantity||1),
        qty: Number(it.qty||it.quantity||1),
        image: it.image || it.thumbnail || '',
        unit: it.unit || '',
        shopId: it.shopId || finalShopId,
        ownerId: it.ownerId || finalSupplierId,
        ownerRole: normalizeSupplierRole(it.ownerRole || finalSupplierRole),
        shopName: it.shopName || ''
      })),
      totalAmount: calcTotal,
      total: calcTotal,
      subtotal: calcSubtotal,
      commissionAmount: calcCommission,
      supplierEarning: calcTotal - calcCommission,
      addressId: addressId || null,
      addressText: addressText || finalDeliveryAddress.full || '',
      deliveryAddress: finalDeliveryAddress,
      paymentMethod: paymentMethod || paymentMode || 'cod',
      paymentMode: paymentMode || paymentMethod || 'cod',
      orderStatus: 'placed',
      status: 'placed',
      paymentStatus: (paymentMode==='cod' || paymentMethod==='cod') ? 'pending' : 'pending',
      gstInvoiceNeeded: !!gstInvoiceNeeded,
      gstNumber: gstNumber || null,
      trackingId: 'TRK' + Date.now()
    };

    const order = await Order.create(orderDoc);

    // ---- SOCKET EMIT - SHOP DASHBOARD PE LIVE NOTIFICATION ----
    try{
      if(global.io){
        global.io.to(`shop:${finalShopId}`).emit('new-order', order);
        global.io.to(`shop:${finalSupplierId}`).emit('new-order', order);
        global.io.emit('new-order-global', { shopId: finalShopId, orderId: order.orderId });
        console.log(`🔔 Socket emitted new-order to shop:${finalShopId} & shop:${finalSupplierId}`);
      }
    }catch(e){
      console.log('Socket emit fail', e.message);
    }

    // ---- STOCK REDUCE (optional - low priority) ----
    try{
      for(let it of items){
        if(it.productId){
          await WorldProduct.findByIdAndUpdate(it.productId, { $inc: { stock: -Number(it.qty||1) } }).catch(()=>{});
        }
      }
    }catch(e){}

    console.log(`✅ ORDER PLACED WORLD CLASS: ${orderId} buyer=${finalBuyerId}(${finalBuyerRole}) supplier=${finalSupplierId}(${finalSupplierRole}) total=₹${calcTotal}`);

    return res.json({
      success: true,
      orderId: order.orderId,
      order: order,
      message: 'Order placed successfully - supplierRole fixed'
    });

  }catch(e){
    console.error('❌ Checkout place error:', e);
    if(e.name==='ValidationError'){
      const firstErr = Object.values(e.errors)[0];
      return res.status(400).json({
        success: false,
        message: `Order validation failed: ${firstErr?.message || e.message}`,
        error: e.errors,
        details: `supplierRole=${req.body.supplierRole} supplierId=${req.body.supplierId} shopId=${req.params.shopId}`
      });
    }
    return res.status(500).json({ success: false, message: e.message });
  }
});

// ========== MY ORDERS (CUSTOMER) ==========
router.get('/orders/my', async (req, res) => {
  try{
    let buyerId = req.headers['x-buyer-id'] || req.query.buyerId || req.user?._id || '';
    if(!buyerId){
      return res.json({ success: true, orders: [], message: 'buyerId missing' });
    }
    // guest_xxx aur user_xxx dono try karo
    const buyerIds = [buyerId];
    if(buyerId.startsWith('user_')) buyerIds.push(buyerId.replace('user_',''));
    if(buyerId.startsWith('guest_')) buyerIds.push(buyerId.replace('guest_',''));
    buyerIds.push(buyerId.replace('user_','').replace('guest_',''));

    const orders = await Order.find({
      $or: [
        { buyerId: { $in: buyerIds } },
        { userId: { $in: buyerIds } },
        { buyerId: buyerId }
      ]
    }).sort({ createdAt: -1 }).limit(100);

    res.json({ success: true, orders, count: orders.length });
  }catch(e){
    console.error('My orders error', e);
    res.json({ success: true, orders: [], error: e.message });
  }
});

// ========== SHOP ORDERS (SHOP OWNER) ==========
router.get('/orders/shop/:shopId', async (req, res) => {
  try{
    const shopId = req.params.shopId;
    const orders = await Order.find({
      $or: [
        { shopId: shopId },
        { supplierId: shopId },
        { supplierShopId: shopId }
      ]
    }).sort({ createdAt: -1 }).limit(200);

    res.json({ success: true, orders, count: orders.length });
  }catch(e){
    res.json({ success: true, orders: [], error: e.message });
  }
});

// ========== SINGLE ORDER ==========
router.get('/order/:orderId', async (req, res) => {
  try{
    const order = await Order.findOne({ orderId: req.params.orderId });
    if(!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  }catch(e){
    res.status(500).json({ success: false, message: e.message });
  }
});

// ========== UPDATE ORDER STATUS (SHOP OWNER) ==========
router.put('/order/:orderId/status', async (req, res) => {
  try{
    const { status, orderStatus } = req.body;
    const finalStatus = status || orderStatus;
    const allowed = ['placed','confirmed','accepted','packed','shipped','out_for_delivery','delivered','cancelled'];
    if(!allowed.includes(finalStatus)){
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const order = await Order.findOneAndUpdate(
      { orderId: req.params.orderId },
      { orderStatus: finalStatus, status: finalStatus },
      { new: true }
    );
    if(!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if(global.io){
      global.io.to(`shop:${order.shopId}`).emit('order-status-updated', order);
      global.io.to(`user:${order.buyerId}`).emit('order-status-updated', order);
    }
    res.json({ success: true, order });
  }catch(e){
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
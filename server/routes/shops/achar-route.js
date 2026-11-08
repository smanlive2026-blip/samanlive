// ========================================
// V28 - COMMON ORDERS - Dashboard <-> Common Checkout ka jod
// Checkout Common se hota hai, isliye order Order collection me banta hai.
// Dashboard yahin se orders dikhayega + status badlega.
// ========================================
router.get('/:shopId/common-orders', async (req, res) => {
  try{
    const shopId = getShopId(req);
    if(!isValidId(shopId)) return res.status(400).json({ success: false, message: 'Invalid ShopId' });
    const Order = require('../../models/Order');
    const orders = await Order.find({
      $or: [{ shopId }, { supplierId: shopId }, { supplierShopId: shopId }]
    }).sort({ createdAt: -1 }).limit(100).lean();
    const mapped = orders.map(o => ({
      _id: String(o._id),
      orderId: o.orderId || o.trackingId || ('ORD-' + String(o._id).slice(-6).toUpperCase()),
      trackingId: o.orderId || o.trackingId || '',
      customerName: o.deliveryAddress?.name || o.customerName || o.buyerId || 'Customer',
      phone: o.deliveryAddress?.phone || o.customerPhone || '',
      address: o.deliveryAddress?.full || o.deliveryAddress?.line1 || o.address || '',
      items: (o.items || []).map(it => ({
        name: it.name || it.title || 'Item',
        qty: Number(it.qty || it.quantity || 1),
        price: Number(it.price || 0),
        image: it.image || '',
        variant: it.variant || ''
      })),
      total: Number(o.totalAmount || o.total || 0),
      paymentMethod: o.paymentMethod || o.paymentMode || 'cod',
      status: o.orderStatus || o.status || 'placed',
      createdAt: o.createdAt
    }));
    res.json({ success: true, data: mapped });
  }catch(e){ res.status(500).json({ success: false, error: e.message }); }
});

router.put('/:shopId/common-orders/:orderId/status', async (req, res) => {
  try{
    const shopId = getShopId(req);
    if(!isValidId(shopId)) return res.status(400).json({ success: false, message: 'Invalid ShopId' });
    const status = String(req.body?.status || '').trim();
    const allowed = ['placed', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];
    if(!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Galat status' });
    const Order = require('../../models/Order');
    const q = { $or: [{ shopId }, { supplierId: shopId }, { supplierShopId: shopId }] };
    let order = null;
    if(mongoose.Types.ObjectId.isValid(req.params.orderId)) order = await Order.findOne({ _id: req.params.orderId, ...q });
    if(!order) order = await Order.findOne({ orderId: req.params.orderId, ...q });
    if(!order) return res.status(404).json({ success: false, message: 'Order nahi mila' });
    order.orderStatus = status;
    order.status = status;
    await order.save();
    res.json({ success: true, message: 'Status update ho gaya', data: { orderId: order.orderId, status } });
  }catch(e){ res.status(500).json({ success: false, error: e.message }); }
});
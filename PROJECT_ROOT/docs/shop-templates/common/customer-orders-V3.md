Le bhai *ek hi MD file me pura CUSTOMER-ORDERS V3* - same tere checkout wale style me - isko `PROJECT_ROOT/docs/customer-orders-V3.md` me daal de, ek baar me sab copy-paste:
# CUSTOMER ORDERS MODULE - COMPLETE DOCUMENTATION - V3 FIXED FINAL
## LOCATION: public/shop-templates/common/customer-orders/ - 7 FILES - SERVER CART CONNECTED

> Cart V3 + Checkout V3 + Role Hierarchy + Order Tracking + Cancel + Return + Invoice - Ek hi flow 70 shop template, Customer App, Shop Dashboard, Area Manager sab me same lagega.

---

### 1. FOLDER STRUCTURE - 7 FILES

common/customer-orders/
├── my-orders.html # UI - My orders list + tabs + search + filter modal
├── my-orders.js V3 FIXED # Logic - GET /api/common/checkout/orders/my?buyerId - stable guest_id + XSS safe
├── track-order.html V3 FIXED # UI - Map + timeline + delivery boy card + summary
├── track-order-live.js V3 FIXED # Logic - Live tracking - mapInterval + pollInterval separate + join-buyer
├── cancel-order.html V3 FIXED # UI - Reason select + refund info + success
├── return-order.html V3 FIXED # UI - Item select + reason + image upload max 4
└── invoice-download.html V3 FIXED # UI - Invoice table + QR + print + share

---

### 2. FIXED CODE VERSIONS - KYA CHANGE KIYA TUNE

#### 2.1 Cart V3 -> My Orders V3 + Track V3 Connection

**Pehle Bug:**
- my-orders.html me `localStorage userId` + `GET /api/common/customer-orders/${shopId}/${userId}` 404
- track-order.html me `onclick="openOrder('${orderId}')"` XSS injection + map static + `CartCore.addItem` not exist
- track-order-live.js me `updateInterval` same var map movement + polling dono ke liye -> overwrite -> map freeze
- cancel-order.html + return-order.html me `POST /api/common/customer-orders/${orderId}/cancel` 404
- invoice-download.html me totals 0 if API missing + no esc()
- Result: Guest ke orders gayab, Cancel fail, Return memory leak, My orders XSS

**Fix Jo Tune Kiya (Is MD me locked):**
- Sab jagah `sessionStorage guest_id` stable - ek hi function `getBuyerInfo()`:
```js
function getBuyerInfo(){
  let gid = sessionStorage.getItem('guest_id');
  if(!gid){ gid = 'guest_'+Date.now()+'_'+Math.random().toString(36).substr(2,5); sessionStorage.setItem('guest_id', gid); }
  return {
    buyerId: RoleHierarchy?.getMyId() || window.currentUser?._id || gid,
    buyerRole: RoleHierarchy?.getMyRole() || 'customer'
  };
}
function getApiBase(){ return window.API_BASE || window.EnvConfig?.API_BASE || window.location.origin; }
function getAuthHeaders(){
  const token = (AuthCore?.getToken && AuthCore.getToken()) || localStorage.getItem('TOKEN') || localStorage.getItem('token') || '';
  return { 'Content-Type':'application/json', ...(token?{'Authorization':`Bearer ${token}`}:{}), 'x-buyer-id': getBuyerInfo().buyerId };
}
function esc(s){ return String(s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
- API unified: Primary `GET /api/common/checkout/orders/my?buyerId=xxx`, Track `GET /api/common/track/:orderId` fallback `GET /api/common/orders/:shopId/:orderId`, Cancel `POST /api/common/orders/:orderId/cancel`, Return `POST /api/common/orders/:orderId/return`
- Socket: `join-buyer` + `join-order` + `leave` on destroy
- XSS safe: `esc()` everywhere + `data-order-id` + `addEventListener` no inline onclick + `encodeURIComponent(orderId, shopId)`

---

### 3. HAR FILE KA PURA LOGIC

#### 3.1 my-orders.html V3 FIXED + my-orders.js V3 FIXED

*my-orders.html:*
- Header: back button, title My Orders, #ordersCount, filter button ⚙️ -> open modal
- Search: #ordersSearch input `Search by order ID, shop, item...`
- Tabs: data-filter all, placed, confirmed, out_for_delivery, delivered, cancelled ->.order-tab active
- List: #ordersList skeleton.sk-line shimmer, then.order-card cards
- Empty: #ordersEmpty icon 📦, No orders yet, Start Shopping button -> /
- Filter Modal: #ordersFilterModal backdrop blur + #filter-box, #filterDate select all/today/week/month, #filterShop select all shops (populate from orders), Clear + Apply buttons

*my-orders.js V3 - MyOrdersCore + MyOrders Class (dono same logic, ek hi use karo):*
- `shopId = URL shopId`, `buyerInfo = getBuyerInfo()`
- `orders = []`, `filteredOrders = []`, `filters = {status:all, date:all, shop:all, search:''}`, `sortBy = newest`
- `init()` -> `loadUser()` -> `loadOrders()` -> `bindSearch()` + `bindEvents()` -> `initSocket()` + populate shop filter
- `loadUser()` -> `UserCore.getUser()` if exists -> update buyerId
- `loadOrders()`:
    1. TRY 1: `GET ${API_BASE}/api/common/checkout/orders/my?buyerId=buyerId&t=Date.now()` headers `x-buyer-id` + token, credentials include, no-store
    2. If success orders>0 -> set + render + return
    3. TRY 2: `GET /api/user/orders?t=...` fallback old
    4. TRY 3: `localStorage myOrders` JSON parse fallback demo
    5. Catch -> empty + render error
- `populateShopFilter()` -> Set of shopId/supplierId from orders -> #filterShop options
- `applyFilters()` / `applyFilters()`:
    - Status: `(status||orderStatus||placed).toLowerCase() == filter`
    - Date: today -> toDateString() == now, week -> >= weekAgo (now-7 days), month -> >= monthAgo (now-1 month)
    - Shop: `(shopId||supplierId) == filterShop`
    - Search: orderId||shopName||items[].name includes q lower
    - Sort: newest `b.createdAt - a.createdAt`, oldest reverse, amount_high/low `total`
- `render()` / `renderFiltered()`:
    - countAll = orders.length, ordersCount = filtered.length + ' orders'
    - If filtered 0 -> list display none, empty display block
    - Else list display flex, empty none
    - Map: `orderId||_id`, shortId = slice(-6).toUpperCase(), status lower, shopName esc, date locale, itemsStr = items slice 0,3 map name join ', ' esc, total = totalAmount||total, count = items.length
    - HTML: `.order-card data-order-id=esc(orderId)` -> top id + status badge, shop • date, items, bottom total • count + relativeTime
    - Bind click safely: `card.addEventListener('click', ()=> openOrder(data-order-id))` no inline
- `getRelativeTime(date)` -> Just now <1 min, Xm ago <60, Xh ago <24, Xd ago else
- `openOrder(orderId)` -> `/shop-templates/common/customer-orders/track-order.html?orderId=encode(orderId)&shopId=shopId`
- `updateCounts()` -> counts per status -> `[data-count=status]` innerText
- `bindSearch()` -> #ordersSearch input -> filters.search = value -> applyFilters()
- `bindEvents()` tabs click -> remove active all, add active, filter = dataset.filter, filters.status = filter, applyFilters()
- Filter modal: ordersFilterBtn click -> display grid, closeFilter/backdrop click -> none, applyFilter click -> filters.date = filterDate.value, filters.shop = filterShop.value, applyFilters + hide, clearFilter -> reset filters + inputs + apply
- `initSocket()` -> `SocketCore.on('order-updated', order=> findIndex orderId||_id == orderId||_id, if found merge else unshift, applyFilters + updateCounts)` + `emit('join-buyer', buyerId)`
- `cancelOrder(orderId, reason)` -> `POST /api/common/orders/orderId/cancel` {reason, shopId, buyerId} + Toast
- `reorder(orderId)` -> find order, `await CartCore.ready`, loop items -> product = {_id: productId||_id, name, price, image, ownerId: ownerId||supplierId||shopId, ownerRole, shopId, shopName} -> `await CartCore.add(product, qty)`, Toast + redirect `cart.html?shopId=sid`

*Link:*
- checkout/order-success.html -> My Orders button -> `my-orders.html?shopId=shopId`
- Track -> Back -> My Orders

#### 3.2 track-order.html V3 FIXED + track-order-live.js V3 FIXED

*track-order.html:*
- Header: back, Track Order, #trackOrderId #ORD----, Help button 💬
- Map wrap: #trackMap height 220px placeholder 🗺️ Live tracking map, delivery-boy-card absolute bottom left right bg white rounded 14px shadow, img #deliveryBoyAvatar, #deliveryBoyName, #deliveryBoyPhone, #deliveryBoyStatus, call btn 📞
- Timeline wrap: #estimatedDelivery, #trackTimeline 5 items data-status placed, confirmed, preparing, out_for_delivery, delivered -> dot + content b + span time + p + icon
- Summary: #trackItems list, #trackTotal
- Actions: #cancelOrderBtn display none, #reorderBtn none, #downloadInvoiceBtn

*track-order.html JS - TrackOrder Class V3:*
- `orderId = URL orderId`, `shopId = URL shopId`, `buyerInfo = getBuyerInfo()`, `order = null`, `mapInterval = null`
- `getBuyerInfo()`, `getApiBase()`, `getAuthHeaders()`, `esc()` same
- `init()` -> check orderId missing -> showError, else #trackOrderId = slice(-6), loadOrder() + initLiveMap() + initSocket() + bindEvents()
- `loadOrder()`:
    - TRY 1: `GET /api/common/track/orderId` headers, cache no-store
    - TRY 2: if shopId + no data -> `GET /api/common/orders/shopId/orderId`
    - TRY 3: demo fallback order {orderId, totalAmount:299, items:, status:placed}
    - Set this.order = data.order||data, render(data)
- `initLiveMap()`:
    - #trackMap innerHTML live simulation gradient bg + repeating grid + white card 🚚 Delivery Boy Live + lat lng + ● Live + bottom bar 1.2 km away 8 mins
    - `mapInterval = setInterval` every 3 sec if status out_for_delivery -> lat+=random_0.0005, lng same -> renderMap() again
    - If Google Maps present -> `new google.maps.Map` center lat lng, marker green-dot
    - If Leaflet L present -> `L.map.setView` + `L.tileLayer` + `L.marker`
- `render(data)`:
    - shortId, total = totalAmount||total, items = order.items
    - #trackTotal, #trackItems = items map `name x qty` + price esc
    - Timeline: statusOrder = [placed, confirmed, preparing, out_for_delivery, delivered], currentIndex = indexOf currentStatus, loop timeline-item add done if idx<currentIndex, active if idx==currentIndex
    - If cancelled -> timeline innerHTML = red cancelled card with cancelledAt + cancelReason esc
    - Delivery card display flex if out_for_delivery/delivered/preparing, update name phone status if order has
    - Estimated delivery if exists -> localeString
    - Actions: cancelBtn display block if placed||confirmed else none, reorderBtn block if delivered||cancelled else none, if delivered clear mapInterval + Toast delivered
- `initSocket()` -> on delivery-update if orderId==this.orderId -> updateLocation + loadOrder(), on order-updated if orderId||_id == this.orderId -> updateUI, emit join-order + join-buyer
- `updateLocation(location)` if lat -> if map+marker setPosition/setLatLng + setCenter/setView, calculate distance haversine + eta = distance_8 mins, update #deliveryBoyStatus
- `calculateDistance(lat1,lon1,lat2,lon2)` haversine R=6371
- `bindEvents()` back -> clear mapInterval + history.back(), help -> alert shopPhone, callDeliveryBoy -> phone replace non digits -> tel:, cancel -> confirm -> redirect cancel-order.html?orderId=encode&shopId=encode, invoice -> redirect invoice-download.html?orderId&shopId, reorder -> wait CartCore.ready, loop items CartCore.add(product, qty) + redirect cart.html?shopId
- `destroy()` -> clear mapInterval + emit leave-order + leave-buyer
- `showError(msg)` -> root innerHTML warning + Go Back[Sample]

*track-order-live.js V3 FIXED - TrackOrderLive Class:*
- Same as TrackOrder but separate intervals: `mapInterval` for map movement 3 sec, `pollInterval` for polling 15 sec if socket not connected
- `getBuyerInfo()` + `getApiBase()` + `getAuthHeaders()` same
- `init()` -> loadOrder + initMap + initSocket + startLiveUpdates + bindEvents
- `loadOrder()` same TRY 1 track, TRY 2 orders/shopId/orderId, fallback demo with location lat lng
- `initMap()` check google, L, else static
- `initStaticMap()` same simulation + `mapInterval` clear before set, only move if out_for_delivery
- `initGoogleMap()` try center from deliveryBoyLocation||21.1702,72.8311, disableDefaultUI, poi off, marker green-dot, catch -> static
- `initLeafletMap()` same try L.map setView, tileLayer openstreetmap, marker, catch static
- `initSocket()` delivery-update -> updateLocation + updateUI, order-updated -> updateUI, emit join-order + join-buyer (FIX)
- `startLiveUpdates()` -> `pollInterval = setInterval` 15 sec if!SocketCore||!isConnected() -> loadOrder(), clear before set (FIX separate var)
- `updateLocation()` same as track-order
- `updateUI()` timeline done/active, delivery card show, estimatedDelivery, delivered -> Toast + stopTracking(), cancelled -> stopTracking()
- `stopTracking()` -> clear mapInterval + pollInterval + geolocation watch, set null
- `bindEvents()` back -> destroy + history.back(), Notification permission only if `isSecureContext` + click once (not every reload)
- `destroy()` -> stopTracking + emit leave-order + leave-buyer

#### 3.3 cancel-order.html V3 FIXED

*HTML:*
- Header back, Cancel Order
- Info: icon 😔, Why cancel?, #cancelOrderId #ORD----, #cancelOrderTotal ₹0, Please select reason
- Reasons: 5 radio ordered_by_mistake, found_better_price, delivery_time_long, change_mind, other ->.reason-option +.reason-content b+span + check ✓
- Extra: #cancelExtra display none -> #cancelExtraText textarea optional
- Refund: #refundText icon 💰
- Actions: Keep Order secondary, Confirm Cancel primary danger disabled
- Success: #cancelSuccess fixed inset white z-index 9999 grid center display none -> success icon ✅, cancelled text, Back to Orders button

*JS - CancelOrder Class V3:*
- `orderId = URL orderId`, `shopId = URL shopId`, `buyerInfo = getBuyerInfo()`, `selectedReason = null`
- `getBuyerInfo()`, `getApiBase()`, `getAuthHeaders()`, `esc()` same
- `init()` -> check orderId missing -> alert back, #cancelOrderId slice(-6), load order details TRY 1 `GET /api/common/orders/shopId/orderId` + headers, TRY 2 `GET /api/common/track/orderId`, if order -> total = totalAmount||total -> #cancelOrderTotal, paymentMethod lower -> if cod -> refundText = COD no refund else ₹total refund to paymentMethod uppercase 2-3 days, bindEvents()
- `bindEvents()` -> radio change -> selectedReason = value, confirmBtn disabled false, cancelExtra display other?block:none, back/keep -> history.back(), confirm -> confirmCancel(), backToOrders -> my-orders.html?shopId=encode
- `confirmCancel()` -> if no selectedReason -> Toast warning, btn text Cancelling... disabled true, extra = #cancelExtraText trim, url = `${base}/api/common/orders/${encode(orderId)}/cancel`, payload {reason:selectedReason, extraText:extra, shopId, buyerId, buyerRole}, if ApiCore.post else fetch POST headers credentials include body JSON, if data.success==false throw, else #cancelSuccess display grid, #cancelSuccessText = Order #short cancelled + refund text, Toast success, vibrate 50, catch -> Toast error + btn text Confirm Cancel disabled false

#### 3.4 return-order.html V3 FIXED

*HTML:*
- Header back, Return Order
- Info: Select items to return, #returnOrderId #ORD----
- #returnItems loading, then.return-item checkbox + img + info b+span + price
- Reason wrap: #returnReason select damaged, wrong_item, quality_issue, expired, not_needed, other, #returnImagesWrap upload box 📷 Add Photos input file multiple hidden accept image/_ + #returnImagesPreview flex wrap, #returnComments textarea
- Policy: 4 li 7 days, unused original packaging, refund 2-3 days after pickup, perishables non-returnable
- Actions: Cancel secondary, Submit Return primary disabled

*JS - ReturnOrder Class V3:*
- `orderId, shopId, buyerInfo = getBuyerInfo(), selectedItems=[], images=[]`
- `getBuyerInfo()`, `getApiBase()`, `getAuthHeaders()`, `esc()` same
- `init()` -> check orderId missing -> alert back, #returnOrderId slice(-6), loadOrderItems(), bindEvents()
- `loadOrderItems()`:
    - TRY 1 `GET /api/common/orders/shopId/orderId`, TRY 2 `GET /api/common/track/orderId`, fallback sample Product 1
    - container #returnItems innerHTML = order.items map id esc, name esc, price esc, qty esc, variant esc, img esc + onerror placeholder, checkbox value=id data-price data-name, img, info, price
    - checkbox change -> closest.return-item toggle selected class checked, updateSelected()
- `updateSelected()` -> selectedItems = Array.from checked map {productId:value, name:dataset.name, price:dataset.price}, btn disabled =!(selectedItems.length>0 && reason)
- `bindEvents()` back/cancel -> history.back(), returnReason change -> updateSelected(), returnImages change -> files slice 0, 4-images.length, max 4 alert, size >2MB alert return, FileReader load -> images push result, wrap div preview-img-wrap img preview-img + button preview-remove ✕ click -> splice + wrap.remove(), append to preview, reset input value='', submitReturn click
- `submitReturn()` -> if selected 0 -> warning, if no reason -> warning, btn text Submitting disabled true, comments trim, base url `${base}/api/common/orders/${encode(orderId)}/return`, payload {shopId, buyerId, buyerRole, items:selectedItems, reason, comments, images}, if ApiCore.post else fetch POST headers credentials body JSON, if success false throw, Toast success, setTimeout redirect my-orders.html?shopId=encode 1200, catch error + btn enable

#### 3.5 invoice-download.html V3 FIXED

*HTML:*
- Actions bar sticky top: back, Share ↗️, Download PDF ⬇️ primary
- #invoiceContent bg white rounded 16px border: header flex justify between border-bottom 2px black: brand img #invoiceShopLogo + #invoiceShopName + #invoiceShopAddress, meta h1 INVOICE + #invoiceNumber #INV-0000 + #invoiceDate
- Bill to grid 1fr 1fr bg #f8fafc rounded: Bill To #invoiceCustomerName #invoiceCustomerPhone #invoiceCustomerAddress, Order Details #invoiceOrderId #invoicePaymentMethod #invoiceOrderStatus
- Table: thead Item Qty Price Total, tbody #invoiceItemsBody Loading, tfoot Subtotal #invoiceSubtotal, Delivery #invoiceDelivery, Discount #invoiceDiscount green, Total Paid #invoiceTotal bold
- Footer flex justify between border-top dashed: Thank you 🙏, computer generated no signature, #invoiceFssai, QR canvas #invoiceQrCanvas display none + #invoiceQrCode placeholder QR + Scan to verify
- Note: Save invoice for warranty...

*JS - InvoiceDownload Class V3:*
- `orderId, shopId, buyerInfo = getBuyerInfo(), order=null`
- `getBuyerInfo()`, `getApiBase()`, `getAuthHeaders()`, `esc()` same
- `init()` -> check orderId missing -> alert back, loadInvoice + bindEvents
- `loadInvoice()` -> if Loader show Generating..., TRY 1 GET /api/common/orders/shopId/orderId headers no-store, TRY 2 GET /api/common/track/orderId, TRY 3 demo fallback {orderId, totalAmount 299, subtotal 279, delivery 20, discount 0, items [{name Sample}], customerName, shopName, payment COD, status delivered}, set order + render, catch -> tbody Failed to load esc(e.message), finally Loader hide
- `render(order)` safe esc, shopName supplierName||Local Shop, shopAddress shopFullAddress||Surat, shopLogo src if exists, shortId slice(-6), #invoiceNumber #INV-shortId, #invoiceDate locale, orderId #short, deliveryAddress addr = deliveryAddress||address||{}, customerName = customerName||addr.name||buyerName, phone = customerPhone||addr.phone||buyerPhone, address = string? addr : fullAddress||text||line1||customerAddress, paymentMethod uppercase, orderStatus uppercase, subtotalCalc = items reduce price_qty, subtotal = order.subtotal||subtotalAmount||subtotalCalc, delivery = deliveryCharge||delivery||0, discount = discount||0, total = totalAmount||total||subtotal+delivery-discount, #invoiceSubtotal etc innerText ₹, FSSAI if exists, items tbody = items map idx+1 name variant totalLine price*qty esc, QR #invoiceQrCode innerText shortId title Order verify origin
- `bindEvents()` back history.back(), download -> trackEvent invoice_downloaded + window.print(), share -> if navigator.share share title Invoice #short + url else clipboard.writeText + Toast copied else prompt

---

### 4. SERVER SIDE - ROUTES + MODEL - KAISE JUDEGA

#### 4.1 server/routes/common/index.js - Add these (ya alag customer-orders.routes.js banao)
const express = require('express');
const router = express.Router();
const Order = require('../../models/Order');

// 1. GET My Orders - my-orders.html V3 + my-orders.js V3
// GET /api/common/checkout/orders/my?buyerId=xxx
router.get('/checkout/orders/my', async (req,res)=>{
  try{
    const buyerId = req.query.buyerId || req.headers['x-buyer-id'] || req.user?._id;
    if(!buyerId) return res.json({ success:true, orders: [] });
    const orders = await Order.find({ buyerId }).sort({ createdAt: -1 }).limit(50);
    res.json({ success:true, orders });
  }catch(e){ res.status(500).json({ success:false, message:e.message }); }
});

// 2. GET Track Order - track-order.html + track-order-live.js + invoice + return + cancel
// GET /api/common/track/:orderId
router.get('/track/:orderId', async (req,res)=>{
  try{
    const order = await Order.findOne({ orderId: req.params.orderId });
    if(!order) return res.status(404).json({ success:false, message:'Order not found' });
    res.json({ success:true, status: order.status, order, estimatedDelivery: order.estimatedDelivery, location: order.deliveryBoyLocation });
  }catch(e){ res.status(500).json({ success:false }); }
});

// 3. GET Order by shopId + orderId - invoice, return, cancel, track fallback
// GET /api/common/orders/:shopId/:orderId
router.get('/orders/:shopId/:orderId', async (req,res)=>{
  try{
    const { shopId, orderId } = req.params;
    const order = await Order.findOne({ orderId, $or:[{shopId},{supplierId: shopId}] });
    if(!order) return res.status(404).json({ success:false });
    res.json({ success:true, order });
  }catch(e){ res.status(500).json({ success:false }); }
});

// 4. POST Cancel - cancel-order.html V3
// POST /api/common/orders/:orderId/cancel { reason, extraText, shopId, buyerId, buyerRole }
router.post('/orders/:orderId/cancel', async (req,res)=>{
  try{
    const { orderId } = req.params;
    const { reason, extraText, buyerId } = req.body;
    const order = await Order.findOne({ orderId });
    if(!order) return res.status(404).json({ success:false, message:'Order not found' });
    if(['delivered','cancelled'].includes(order.status)) return res.status(400).json({ success:false, message:'Cannot cancel' });
    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelReason = reason;
    order.extraText = extraText;
    await order.save();
    if(global.io){
      global.io.to(`order_${orderId}`).emit('order-updated', order);
      global.io.to(`buyer_${buyerId||order.buyerId}`).emit('order-updated', order);
    }
    res.json({ success:true, order });
  }catch(e){ res.status(500).json({ success:false, message:e.message }); }
});

// 5. POST Return - return-order.html V3
// POST /api/common/orders/:orderId/return { items, reason, comments, images, shopId, buyerId }
router.post('/orders/:orderId/return', async (req,res)=>{
  try{
    const { orderId } = req.params;
    const { items, reason, comments, images, buyerId } = req.body;
    if(!items || items.length===0) return res.status(400).json({ success:false, message:'Select items' });
    const order = await Order.findOne({ orderId });
    if(!order) return res.status(404).json({ success:false });
    order.returnRequest = { items, reason, comments, images: (images||[]).slice(0,4), status:'pending', createdAt:new Date() };
    order.status = 'returned';
    await order.save();
    if(global.io) global.io.to(`order_${orderId}`).emit('order-updated', order);
    res.json({ success:true, order });
  }catch(e){ res.status(500).json({ success:false, message:e.message }); }
});

// 6. Compatibility - /api/user/orders old my-orders.html fallback
router.get('/user/orders', async (req,res)=>{
  const buyerId = req.user?._id || req.headers['x-buyer-id'] || req.query.buyerId;
  const orders = await Order.find({ buyerId }).sort({ createdAt:-1 });
  res.json({ orders });
});

module.exports = router;
Mount in server.js:
app.use('/api/common', require('./routes/common/index.js'));
Socket in server.js:
const io = require('socket.io')(server);
global.io = io;
io.on('connection', socket=>{
  socket.on('join-order', orderId=> socket.join(`order_${orderId}`));
  socket.on('leave-order', orderId=> socket.leave(`order_${orderId}`));
  socket.on('join-buyer', buyerId=> socket.join(`buyer_${buyerId}`));
  socket.on('leave-buyer', buyerId=> socket.leave(`buyer_${buyerId}`));
});
#### 4.2 Order.js Model Fields (full list)
orderId String unique index,
buyerId String index required - RoleHierarchy.getMyId() || sessionStorage guest_id,
buyerRole String,
buyerName, buyerPhone, customerName, customerPhone, customerAddress String,
deliveryAddress Object { name, phone, fullAddress, lat, lng },
shopId, supplierId String index, supplierRole String,
shopName, shopAddress, shopLogo, shopPhone, fssai String,
items Array [{ productId, _id, name, title, price, qty, quantity, variant, image, shopId, ownerId, ownerRole, shopName }],
subtotal, subtotalAmount, deliveryCharge, delivery, discount, total, totalAmount Number,
status enum [placed, confirmed, preparing, out_for_delivery, delivered, cancelled, returned, returned_pending] default placed index,
orderStatus String alias,
paymentMethod enum [cod, upi, online, wallet] default COD,
paymentMode String,
deliveryBoyName, deliveryBoyPhone String,
deliveryBoyLocation { lat, lng },
deliveryBoyStatus String,
estimatedDelivery Date,
confirmedAt, cancelledAt Date,
cancelReason, extraText String,
returnRequest { items Array, reason String, comments String, images [String] max 4, status default pending, createdAt Date },
timestamps createdAt updatedAt
Indexes: buyerId+createdAt desc, shopId+status
---

### 5. LINK KAISE HOGA - 5 JAGAH - EXACT SCRIPT TAGS

#### A) CUSTOMER APP - Main App - public/index.html + nearby-shops.html + assets/js/app.js + profile/js/orders.js
<head>
  <script src="/assets/js/role-hierarchy.js"></script>
  <script src="/shop-templates/common/core/api-core.js"></script>
  <script src="/shop-templates/common/core/auth-core.js"></script>
  <script src="/shop-templates/common/core/socket-core.js"></script>
  <script src="/shop-templates/common/cart/cart-core.js?v=3"></script>
  <script src="/shop-templates/common/cart/cart-count.js"></script>
</head>
<body>
  <header><span data-cart-count>0</span></header>
  <!-- Product card -->
  <button onclick="CartCore.add({...product, shopId: shopId, ownerId: shopId, ownerRole:'shop_owner', shopName: 'Sharma Kirana'}, 1)">Add to Cart</button>

  <!-- My Orders link -->
  <a href="/shop-templates/common/customer-orders/my-orders.html?shopId=${shopId}">My Orders</a>

  <!-- Go to checkout override for customer -->
  <script>
    CartCore.goToCheckout = (sid)=> location.href = `/shop-templates/common/checkout/address-select.html?shopId=${encodeURIComponent(sid)}&supplierId=${encodeURIComponent(sid)}`;
  </script>
</body>
Flow: index.html Add to Cart -> cart-drawer Checkout -> address-select.html?shopId=xxx -> payment-select.html?shopId&addressId -> COD Place -> order-success.html?orderId -> my-orders.html -> track-order.html?orderId&shopId -> cancel/invoice/return

#### B) SHOP DASHBOARD - shop_owner as buyer - Bulk Order + My Orders same
*File:* `public/shop-templates/kirana/dashboard.html` + `customer-orders/my-orders.html`
<script src="/assets/js/role-hierarchy.js"></script>
<script src="/shop-templates/common/cart/cart-core.js?v=3"></script>
<script src="/shop-templates/common/customer-orders/my-orders.js?v=3"></script>
<!-- My Orders tab -->
<div id="ordersList"></div>
<div id="ordersEmpty"></div>
<button id="ordersFilterBtn"></button>
<input id="ordersSearch">
<select id="filterDate"></select><select id="filterShop"></select>
Link: Shop dashboard bulk checkout.html?supplierId=areaManagerId -> order-success -> my-orders.html?shopId=areaManagerId shows bulk orders

#### C) 70 SHOP TEMPLATES - common/customer-orders same for all
<!-- Every shop-templates/xxx/customer-view.html -->
<script src="../../assets/js/role-hierarchy.js"></script>
<script src="../common/cart/cart-core.js?v=3"></script>
<!-- Track link in order history -->
<a href="../common/customer-orders/track-order.html?orderId=${orderId}&shopId=${shopId}">Track</a>
All 70 shops use same `../common/customer-orders/` files - no duplicate.

#### D) AREA MANAGER - area_manager as buyer - My Orders bulk
<!-- public/area-manager.html -->
<script src="/assets/js/role-hierarchy.js"></script>
<script src="/shop-templates/common/cart/cart-core.js?v=3"></script>
<a href="/shop-templates/common/customer-orders/my-orders.html">My Bulk Orders</a>
Flow: area-manager Buy from Admin Pool -> checkout.html?supplierId=admin_pool&supplierRole=admin -> my-orders.html shows bulk orders with GST section in invoice-download.html

#### E) ADMIN PANEL - admin viewer - orders.html
<!-- public/admin-panel/orders.html -->
<script>
  // Admin sees all orders, not just buyerId
  fetch('/api/admin/orders?status=all', {credentials:'include'}).then(r=>r.json()).then(data=> render(data.orders));
  // Or use my-orders logic with buyerId=admin to see admin's own orders
</script>
---

### 6. TESTING CHECKLIST - FINAL V3

1. Guest flow: Incognito -> Add to Cart -> sessionStorage guest_id stable? Reload -> same guest_id?
2. Checkout -> order-success.html?orderId=ORD... -> my-orders.html?buyerId=guest_xxx -> order list show?
3. My Orders search: orderId partial search works?
4. Tabs: All/Placed/Out for delivery/Delivered/Cancelled filter correct?
5. Filter modal: Date today/week/month + Shop filter Apply works? Clear resets?
6. Track: timeline done/active correct per status? Cancelled red card?
7. Live map: out_for_delivery -> map moves every 3 sec? poll 15 sec if socket disconnected?
8. Cancel: placed/confirmed -> cancel-order.html -> reason select -> Confirm -> success grid + my-orders live update via socket?
9. Return: delivered -> return-order.html -> select items + reason + 4 images max 2MB + submit -> my-orders status returned?
10. Invoice: subtotal calc if API missing? ₹ correct? Print hides actions bar? Share copies link?
11. XSS: order name `<script>alert` -> esc() -> shows as text not execute?
12. Socket: join-buyer + join-order -> order-updated event updates my-orders + track without reload?

---

### 7. NEXT MD - orders/ + track/

Iske baad `orders/` module - shop owner ko orders kaise dikhenge (orders.html, orders.js, order-detail.html, order-detail.js, bulk-orders.html, new-order-popup.html)
Uske liye bhejna:
- orders/orders.html, orders.js, order-detail.html, order-detail.js, bulk-orders.html
- track/track-order.html (common/track vs customer-orders/track diff)
- server/routes/orders.js + server/routes/shops/*.js

---

END - CUSTOMER ORDERS V3 FULLY CONNECTED - 7 FILES + ROUTES + MODEL
Ye ek hi file me sab hai. Isko daal de `docs/customer-orders-V3.md`. Ab pura module ka single source of truth.
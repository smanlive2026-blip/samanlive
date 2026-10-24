# CUSTOMER-ORDERS MODULE - FULL DOC - V3 FIXED FINAL
## LOCATION: public/shop-templates/common/customer-orders/ - 7 FILES - POST CHECKOUT

> Checkout ke baad customer apna order kahan dekhega, cancel kaise karega, return kaise karega, invoice kaise download karega, live track kaise karega - ye sab is module me.

---

### 1. FILES - 7

| File | Kaam |
| :--- | :--- |
| my-orders.html + my-orders.js | All orders list + tabs All/Placed/On Way/Delivered/Cancelled + filter modal + search |
| cancel-order.html | Cancel reason select + extra text + refund info + confirm cancel |
| return-order.html | Select items to return + reason + images upload + policy |
| invoice-download.html | Invoice UI - shop logo, bill to, order details, items table, subtotal, delivery, discount, total, FSSAI, QR, Print/Share |
| track-order-live.js + track-order.html (common/track/) | Live map - Google/Leaflet/Static fallback + socket delivery-update + distance calc + ETA |

---

### 2. HAR FILE KA PURA LOGIC - CODE DEKH KE

#### 2.1 my-orders.html (World Class)

**UI:**
- Header: back button, title My Orders, count `ordersCount`, filter button
- Tabs: All (countAll), Placed, Out_for_delivery (On Way), Delivered, Cancelled - data-filter
- List: #ordersList skeleton, #ordersEmpty icon 📦 + Start Shopping button
- Filter Modal: #ordersFilterModal backdrop + box slideUp - date range all/today/week/month, shop select, Clear/Apply

**JS - MyOrders Class (inline):**
- `shopId = URL shopId`, `userId = currentUser._id || localStorage userId`
- `orders = []`, `filter = all`
- `init()` -> `loadOrders()` + `bindEvents()`
- `loadOrders()`:
    - url = `/api/user/orders` or `/api/common/customer-orders/${shopId}/${userId}` if shopId
    - If ApiCore -> `ApiCore.get(...)` else `JSON.parse(localStorage myOrders)`
    - `this.orders = data.orders || data`
    - `render()`
- `render()`:
    - filtered = filter all? all : filter by status
    - countAll, ordersCount update
    - If filtered 0 -> list hide, empty show
    - Else list innerHTML = filtered.map order -> `<div class="order-card" onclick="openOrder(orderId)"><top><span order-id #slice-6 upper><span status class><div shopName • date><div items map name join><bottom><span total • items length><span relativeTime></div>`
- `getRelativeTime(date)` -> mins ago, hrs ago, days ago
- `openOrder(orderId)` -> `location.href = /shop-templates/common/customer-orders/track-order.html?orderId=xxx&shopId=yyy` or `track-order.html`
- `bindEvents()` -> tabs click -> remove active all, add active clicked, filter = dataset.filter, render(); backToShop history.back(), startShopping -> /, filterBtn -> show modal, closeFilter + backdrop -> hide

**BUG FIX:** userId ko sessionStorage guest_id se lo + RoleHierarchy.getMyId() - warna guest orders nahi dikhenge

#### 2.2 my-orders.js - MyOrdersCore (Advanced Version)

**Class MyOrdersCore:**
- Same shopId, userId, orders, filteredOrders, filters {status, date, shop, search}, sortBy newest, page 1, limit 20
- `init()` -> loadUser + loadOrders + bindSearch + initSocket
- `loadUser()` -> UserCore.getUser() -> userId
- `loadOrders()` -> Loader.show, if shopId -> ApiCore.get `/api/common/customer-orders/${shopId}/${userId}` else `/api/user/orders`, orders = data.orders||data, filtered = [...orders], render(), updateCounts(), Loader.hide
- `updateCounts()` -> counts all + each status -> query `[data-count=status]` innerText
- `applyFilters()`:
    - result = [...orders]
    - status filter if not all -> filter status
    - date filter: today -> toDateString == now, week -> last 7 days, month -> last month
    - search filter lower -> orderId includes q or shopName includes q or items some name includes q
    - sort: newest date desc, oldest asc, amount_high total desc, amount_low asc
    - filteredOrders = result, render()
- `render()` -> container #ordersList, if filtered 0 -> empty show, else innerHTML cards simple
- `bindSearch()` -> #ordersSearch input -> filters.search = value -> applyFilters()
- `initSocket()` -> SocketCore.on order-updated -> find index, update or unshift, applyFilters()
- `cancelOrder(orderId, reason)` -> ApiCore.post `/api/common/customer-orders/${orderId}/cancel`, Toast, loadOrders()
- `reorder(orderId)` -> find order, for item in order.items -> CartCore.addItem(item), Toast, redirect cart.html?shopId

**FIX:** ApiCore.post URL `/api/common/customer-orders/${orderId}/cancel` ko `/api/common/orders/${orderId}/cancel` banao - same as cancel-order.html

#### 2.3 cancel-order.html - World Class Cancel

**UI:**
- Header back, title Cancel Order
- Order info: icon 😔, Why cancel, Order #ORD---- #cancelOrderId, #cancelOrderTotal, Please select reason
- Reasons: 5 radio - ordered_by_mistake, found_better_price, delivery_time_long, change_mind, other - each label reason-option with input hidden, content b+span, check ✓
- Extra: #cancelExtra textarea optional, display none until other selected
- Refund info: 💰, Refund Information, #refundText default 2-3 business days
- Actions: Keep Order (history.back), Confirm Cancel disabled primary danger
- Success: #cancelSuccess fixed inset grid place-items center - icon ✅, Order Cancelled, #cancelSuccessText, Back to Orders button

**JS - CancelOrder Class:**
- `orderId = URL orderId`, `shopId = URL shopId`, `selectedReason = null`
- `init()` -> #cancelOrderId slice -6 upper, try ApiCore.get `/api/common/orders/${shopId}/${orderId}` -> order.total -> #cancelOrderTotal, if paymentMethod COD -> refundText = This was COD order no refund needed
- `bindEvents()`:
    - input[name=reason] change -> selectedReason = value, confirmBtn disabled false, cancelExtra display = value==other? block:none
    - cancelBack, keepOrderBtn -> history.back()
    - confirmCancelBtn -> confirmCancel()
    - backToOrdersBtn -> location.href `/shop-templates/common/customer-orders/my-orders.html?shopId=xxx`
- `confirmCancel()`:
    - if !selectedReason -> Toast warning
    - btn text Cancelling... disabled true
    - extra = #cancelExtraText value
    - ApiCore.post `/api/common/customer-orders/${orderId}/cancel` {reason, extraText, shopId}
    - Success -> #cancelSuccess display grid, #cancelSuccessText Order #slice cancelled, Toast success, vibrate 50
    - Catch -> Toast error, btn text Confirm Cancel, disabled false

**FIX:** Post URL `/api/common/orders/${orderId}/cancel` with body {reason, extraText, shopId, buyerId} + getBuyerInfo() buyerId

#### 2.4 return-order.html - World Class Return

**UI:**
- Header back, title Return Order
- Order info: Select items to return, Order #ORD---- #returnOrderId
- #returnItems container - JS se load
- Reason wrap: b Reason, select #returnReason options damaged, wrong_item, quality_issue, expired, not_needed, other
- Images wrap: b Upload images optional, label upload-box input file #returnImages accept image/* multiple hidden, 📷 Add Photos, #returnImagesPreview
- Label comments, textarea #returnComments
- Policy: b Return Policy ul 4 li 7 days, unused original packaging, refund 2-3 days, perishables non-returnable
- Actions: Cancel (history.back), Submit Return Request disabled

**JS - ReturnOrder Class:**
- `orderId = URL orderId`, `shopId = URL shopId`, `selectedItems = []`, `images = []`
- `init()` -> #returnOrderId slice -6 upper, loadOrderItems(), bindEvents()
- `loadOrderItems()`:
    - ApiCore.get `/api/common/orders/${shopId}/${orderId}` -> order.items
    - Else sample item
    - Container innerHTML = items.map item -> `<label class="return-item"><input checkbox value=_id||productId data-price price data-name name><img src image><div info><b>name</b><span>Qty qty • variant</span></div><span price>₹price</span></label>`
    - Checkboxes change -> closest .return-item toggle selected class if checked, updateSelected()
- `updateSelected()`:
    - selectedItems = from checked inputs map {productId value, name dataset.name, price dataset.price}
    - btn disabled = !(selectedItems>0 && reason)
- `bindEvents()`:
    - returnBack, cancelReturn -> history.back()
    - returnReason change -> updateSelected()
    - returnImages change -> files Array, each FileReader load -> push result to images, create img preview-img append to #returnImagesPreview
    - submitReturn -> submitReturn()
- `submitReturn()`:
    - If 0 items -> Toast warning
    - If !reason -> Toast warning
    - Btn Submitting... disabled true
    - comments = #returnComments value
    - ApiCore.post `/api/common/customer-orders/${orderId}/return` {shopId, items:selectedItems, reason, comments, images}
    - Toast success, setTimeout 1500 redirect my-orders.html?shopId

**FIX:** Same endpoint fix + buyerId add

#### 2.5 invoice-download.html - World Class Invoice

**UI:**
- Actions bar sticky: Back button, Share, Download PDF primary
- #invoiceContent bg white margin 12 radius 16 padding 24 border - invoice for print
    - Header flex space-between: brand flex gap 12 - logo #invoiceShopLogo 48x48, #invoiceShopName, #invoiceShopAddress + meta text-right H1 INVOICE, #invoiceNumber #INV-0000, #invoiceDate
    - Bill-to grid 1fr 1fr gap 16 bg #f8fafc padding 12 radius 12 - Bill To: #invoiceCustomerName, #invoiceCustomerPhone, #invoiceCustomerAddress + Order Details: #invoiceOrderId, #invoicePaymentMethod, #invoiceOrderStatus
    - Table invoice-table width 100% collapse - thead Item Qty Price Total, tbody #invoiceItemsBody loading, tfoot Subtotal #invoiceSubtotal, Delivery #invoiceDelivery, Discount #invoiceDiscount green, Total Paid #invoiceTotal b
    - Footer flex space-between: note Thank you 🙏, computer generated, #invoiceFssai + QR #invoiceQrCode placeholder QR + Scan to verify
- Note: 💡 Save invoice for warranty

**CSS Print:** @media print actions-bar, note display none, content margin 0 border none

**JS - InvoiceDownload Class:**
- `orderId = URL orderId`, `shopId = URL shopId`, `order = null`
- `init()` -> loadInvoice() + bindEvents()
- `loadInvoice()`:
    - Loader.show Generating invoice...
    - If ApiCore -> ApiCore.get `/api/common/orders/${shopId}/${orderId}` -> order = data.order||data else sample order
    - render(order)
    - Loader.hide, catch -> tbody Failed to load
- `render(order)`:
    - shopName, shopAddress, invoiceNumber #INV- slice -6 upper, date localeDateString, orderId, customerName, phone, address, paymentMethod, status, subtotal||total, deliveryCharge, discount, total, shopLogo src
    - tbody = items map `<tr><td><b>idx. name</b><br><span variant></span></td><td>qty</td><td>price</td><td>price*qty</td></tr>`
- `bindEvents()`:
    - Back history.back()
    - Download -> window.print(), ApiCore.trackEvent invoice_downloaded {orderId, shopId}
    - Share -> if navigator.share -> share title Invoice #slice-6 + url else clipboard.writeText url + Toast link copied

**FIX:** Endpoint same + buyerId check

#### 2.6 track-order-live.js - World Class Live Track - 350+ lines

**Class TrackOrderLive:**
- `orderId = URL orderId`, `shopId = URL shopId`, `map, marker, deliveryBoyMarker, watchId, order, updateInterval, mapInitialized false`
- `init()`:
    - If !orderId error
    - await loadOrder(), initMap(), initSocket(), startLiveUpdates(), bindEvents(), log Live tracking started
- `loadOrder()`:
    - If ApiCore -> ApiCore.get `/api/common/track/${orderId}` else sample {success, status out_for_delivery, location lat 21.1702 lng 72.8311, order}
    - order = data.order||data, updateUI(data)
- `initMap()`:
    - #trackMap element, if google maps exists -> initGoogleMap() else if L (Leaflet) -> initLeafletMap() else initStaticMap(), mapInitialized true
- `initStaticMap()`:
    - lat 21.1702 lng 72.8311, updateMapVisual() innerHTML div gradient bg + repeating linear grid + card white - icon 🚚, Delivery Boy Live, lat lng, badge ● Live Tracking + bottom bar black - 📍 1.2 km away + ⏱️ 8 mins
    - updateInterval = setInterval 3 sec lat+= random-0.5*0.0005 lng+= same + updateMapVisual() - simulate movement
- `initGoogleMap()`:
    - center lat lng, new google.maps.Map #trackMap center zoom 14 disableDefaultUI styles poi off, marker new google.maps.Marker position center map icon green-dot title Delivery Boy, catch -> initStaticMap()
- `initLeafletMap()`:
    - L.map #trackMap setView 21.1702,72.8311 zoom 14, tileLayer openstreetmap add, marker L.marker add, catch static
- `initSocket()`:
    - If SocketCore -> on delivery-update data orderId==this.orderId -> updateLocation(data.location||data), updateUI(data); on order-updated orderId==this.orderId -> updateUI status; emit join-order orderId
- `startLiveUpdates()`:
    - updateInterval = setInterval 15 sec if !SocketCore or !isConnected -> loadOrder()
- `updateLocation(location)`:
    - If !lat return, if map+marker -> if google marker.setPosition + map.setCenter else marker.setLatLng + setView, calculate distance 21.1702,72.8311 to location via calculateDistance, eta max 2 round distance*8 mins per km, #deliveryBoyStatus innerText `distance km away • eta mins`
- `calculateDistance(lat1,lon1,lat2,lon2)` haversine R 6371 dLat dLon a sin sin + cos cos sin sin c 2 atan2 sqrt a sqrt 1-a return R*c
- `updateUI(data)`:
    - status lower, statusOrder ['placed','confirmed','preparing','out_for_delivery','delivered'], currentIndex = indexOf status, .timeline-item each remove done active, if idx<currentIndex add done else if idx==currentIndex add active
    - If out_for_delivery or delivered -> #deliveryBoyCard display flex
    - If estimatedDelivery -> #estimatedDelivery innerText Estimated time localeTimeString
    - If delivered -> Toast delivered 🎉 + stopTracking()
- `stopTracking()` clearInterval updateInterval, clearWatch watchId
- `bindEvents()` -> #trackBack history.back(), Notification request permission if default
- `destroy()` stopTracking + SocketCore emit leave-order orderId

**Init:** window.TrackOrderLive = new TrackOrderLive(), DOMContentLoaded init(), beforeunload destroy()

**FIX:** API `/api/common/track/:orderId` should return {status, location:{lat,lng}, order, estimatedDelivery} + socket room join-order

---

### 3. SERVER SIDE - ROUTES - KAISE JUDEGA

#### File: server/routes/common/index.js me add - FINAL UNIFIED

```js
// My orders - GET - buyerId from query + auth
router.get('/checkout/orders/my', async (req,res)=>{
  try{
    let buyerId = req.query.buyerId || req.user?._id || req.headers['x-buyer-id'];
    if(!buyerId){
      // Try session guest_id from cookie? Fallback empty
      return res.json({success:true, orders:[]});
    }
    const orders = await Order.find({ buyerId }).sort({createdAt:-1}).limit(50);
    res.json({success:true, orders});
  }catch(e){ res.json({success:true, orders:[]}); }
});

// Get single order - GET /api/common/orders/:shopId/:orderId
router.get('/orders/:shopId/:orderId', async (req,res)=>{
  try{
    const order = await Order.findOne({ orderId: req.params.orderId, shopId: req.params.shopId });
    if(!order) order = await Order.findOne({ orderId: req.params.orderId });
    if(!order) return res.status(404).json({success:false, message:'Order not found'});
    res.json({success:true, order});
  }catch(e){ res.status(500).json({success:false}); }
});

// Cancel - POST /api/common/orders/:orderId/cancel
router.post('/orders/:orderId/cancel', async (req,res)=>{
  try{
    const { reason, extraText, shopId, buyerId } = req.body;
    const order = await Order.findOne({ orderId: req.params.orderId });
    if(!order) return res.status(404).json({success:false});
    if(order.orderStatus === 'delivered' || order.orderStatus === 'cancelled') return res.status(400).json({success:false, message:'Cannot cancel'});
    order.orderStatus = 'cancelled';
    order.cancelReason = reason;
    order.cancelExtra = extraText;
    order.cancelledAt = new Date();
    await order.save();
    res.json({success:true, order});
  }catch(e){ res.status(500).json({success:false, message:e.message}); }
});

// Return - POST /api/common/orders/:orderId/return
router.post('/orders/:orderId/return', async (req,res)=>{
  try{
    const { shopId, items, reason, comments, images } = req.body;
    const order = await Order.findOne({ orderId: req.params.orderId });
    if(!order) return res.status(404).json({success:false});
    if(order.orderStatus !== 'delivered') return res.status(400).json({success:false, message:'Only delivered orders can be returned'});
    order.returnRequest = { items, reason, comments, images, status:'requested', requestedAt:new Date() };
    order.orderStatus = 'return_requested';
    await order.save();
    res.json({success:true});
  }catch(e){ res.status(500).json({success:false}); }
});

// Track - GET /api/common/track/:orderId
router.get('/track/:orderId', async (req,res)=>{
  try{
    const order = await Order.findOne({ orderId: req.params.orderId });
    if(!order) return res.status(404).json({success:false});
    // Simulate live location if out_for_delivery
    let location = { lat:21.1702, lng:72.8311 };
    if(order.deliveryBoyLocation) location = order.deliveryBoyLocation;
    res.json({success:true, status: order.orderStatus, location, order, estimatedDelivery: order.estimatedDelivery});
  }catch(e){ res.status(500).json({success:false}); }
});
```

**Order.js Model Add Fields:**
```js
cancelReason: String,
cancelExtra: String,
cancelledAt: Date,
returnRequest: { items: Array, reason: String, comments: String, images: Array, status: String enum [requested, approved, rejected, picked, refunded], requestedAt: Date },
deliveryBoyLocation: { lat: Number, lng: Number },
estimatedDelivery: Date,
```

**Socket - server.js:**
```js
io.on('connection', (socket)=>{
  socket.on('join-order', (orderId)=> socket.join('order_'+orderId));
  socket.on('leave-order', (orderId)=> socket.leave('order_'+orderId));
  // When delivery boy updates location -> io.to('order_'+orderId).emit('delivery-update', {orderId, location})
  // When order status changes -> io.to('order_'+orderId).emit('order-updated', order)
});
```

---

### 4. LINK KAISE HOGA - 5 JAGAH

#### A) SHOP DASHBOARD - shop_owner as seller - Orders dekhega + Cancel/Return handle
**File:** `public/shop-templates/kirana/dashboard.html` Tab "Orders"

```html
<!-- Orders tab -->
<div id="ordersList"></div>
<script src="/shop-templates/common/customer-orders/my-orders.js"></script>
<script>
  // As seller, fetch orders where supplierId = myShopId
  fetch(`/api/common/orders/my-as-seller?shopId=${myShopId}`)
    .then(r=>r.json()).then(data=> renderSellerOrders(data.orders));
  // Cancel request from customer -> seller can approve
</script>
```

#### B) CUSTOMER VIEW - customer as buyer - My Orders + Cancel + Return + Invoice + Track
**File:** `kirana/customer-view.html` -> My Orders button

```html
<a href="/shop-templates/common/customer-orders/my-orders.html?shopId=${shopId}">My Orders</a>

<!-- my-orders.html card click -->
openOrder(orderId) -> /shop-templates/common/customer-orders/track-order.html?orderId=xxx&shopId=yyy

<!-- track-order.html page has buttons -->
<button onclick="location.href=`./cancel-order.html?orderId=${orderId}&shopId=${shopId}`">Cancel</button>
<button onclick="location.href=`./return-order.html?orderId=${orderId}&shopId=${shopId}`">Return</button>
<button onclick="location.href=`./invoice-download.html?orderId=${orderId}&shopId=${shopId}`">Invoice</button>
```

Inject:
```html
<script src="/assets/js/role-hierarchy.js"></script>
<script src="/shop-templates/common/core/api-core.js"></script>
<script src="/shop-templates/common/customer-orders/my-orders.js"></script>
```

#### C) CUSTOMER APP - Main App - public/index.html + profile/orders.js
**File:** `public/profile/js/orders.js` + `public/profile.html` Tab Orders

```html
<!-- profile.html orders tab uses same my-orders.html logic -->
<script src="/shop-templates/common/customer-orders/my-orders.js"></script>
<!-- my-orders.html without shopId -> GET /api/user/orders -->
```

Flow: index.html -> Profile -> Orders -> My Orders (all shops) -> Track -> Cancel/Return/Invoice

#### D) AREA MANAGER - area_manager as buyer + seller
**File:** `public/area-manager.html` Tabs "My Orders (as buyer from Admin)" + "Shop Orders (as seller to Shop Owners)"

- As buyer: `my-orders.html?shopId=admin_pool` -> Cancel/Return to admin
- As seller: Seller orders where supplierId = areaManagerId

#### E) ADMIN PANEL - admin as super - All Orders + Cancel/Return approvals
**File:** `public/admin-panel/orders.html`

```html
<script>
  fetch('/api/admin/orders?status=cancelled,return_requested')
    .then(r=>r.json()).then(data=> renderAdminOrders(data.orders));
  // Approve cancel, approve return, process refund
</script>
```

---

### 5. TESTING CHECKLIST

1. My Orders load -> ordersCount correct? Tabs filter work? Search filter?
2. Order card click -> track-order.html?orderId&shopId -> map static shows?
3. Cancel-order.html -> reason select -> confirm btn enable? Extra textarea show if other? Confirm -> POST /api/common/orders/:orderId/cancel -> success screen -> Back to Orders?
4. COD order cancel -> refund text No refund needed?
5. Return-order.html -> items load? Checkbox select -> selected class? Reason select -> Submit enable? Images upload preview? Submit -> POST /api/common/orders/:orderId/return -> redirect my-orders?
6. Invoice-download.html -> invoiceNumber #INV-xxx, shopName, customerName, items table, subtotal delivery discount total, Print (window.print) works? Share clipboard?
7. Track-order-live.js -> map init static fallback? Socket join-order? Live update simulate every 3 sec? Distance ETA calc? Timeline done/active? Delivered -> Toast?
8. Guest user (sessionStorage guest_id) -> my-orders? Orders empty? Should show login prompt.

---

### 6. NEXT MODULE - wallet/, finance/, delivery/

Iske baad wallet + finance + delivery boy assign. Uske liye bhejo:
- common/wallet/wallet.html, wallet.js, expense.html
- common/finance/gst-invoice.html, payout-history.html
- common/delivery/delivery-boy-assign.html, delivery-status.html
- server/routes/deliveryManager.js

---

END - CUSTOMER-ORDERS MODULE FULLY CONNECTED TO CHECKOUT V3 + CART V3
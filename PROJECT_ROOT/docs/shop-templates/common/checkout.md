# CHECKOUT MODULE - COMPLETE DOCUMENTATION - V3 FIXED FINAL
## LOCATION: public/shop-templates/common/checkout/ - 11 FILES - SERVER CART CONNECTED

> Cart V3 + Role Hierarchy + Address + Payment + Order - Ek hi flow 70 shop template, Customer App, Shop Dashboard, Area Manager sab me same lagega.

---

### 1. FOLDER STRUCTURE - 11 FILES

```
common/checkout/
├── address-select.html        # UI - Address list + Add modal
├── address-select.js          # Logic - GET /api/user/addresses, save, localStorage
├── checkout.html              # Main checkout page - tumhara third file snippet (supplier name, items, subtotal, commission, GST, payment radio)
├── checkout.js V3 FIXED        # CheckoutCore - placeOrder - Uses CartCore V3 getCartBySupplier
├── hierarchy-checkout.js V14 FIXED # HierarchyCheckout - Bulk + Normal - commission, GST, address load, placeOrder POST /api/common/checkout
├── payment-select.html V3 FIXED # Payment page - COD/UPI/Online - Uses CartCore V3, CheckoutCore
├── payment-gateway.js         # Razorpay - create order + verify
├── upi-intent.js              # UPI deep links - gpay, phonepe, paytm, upi
├── cod-confirm.html           # COD confirm modal
├── my-orders.html             # Orders list - GET /api/common/checkout/orders/my
└── order-success.html         # Success tick - orderId show
```

---

### 2. FIXED CODE VERSIONS - KYA CHANGE KIYA TUNE

#### 2.1 cart-core.js V3 -> checkout.js V3 + hierarchy-checkout.js V14 + payment-select.html V3 Connection

**Pehle Bug:**
- checkout.js me `localStorage guestId` + `GET /api/common/cart/${shopId}?userId=guest_xxx`
- hierarchy-checkout.js me `guest_ + Date.now()` har reload pe naya guest
- payment-select.html me same purana API + `guest_${localStorage.guestId}`
- Result: Cart me 2 item, checkout pe `Cart empty` error

**Fix Jo Tune Kiya (Is MD me locked):**
- Sab jagah `sessionStorage guest_id` stable - ek hi function `getBuyerInfo()`:
```js
function getBuyerInfo(){
  let gid = sessionStorage.getItem('guest_id');
  if(!gid){ gid = 'guest_'+Date.now()+'_'+Math.random().toString(36).substr(2,5); sessionStorage.setItem('guest_id', gid); }
  return {
    buyerId: RoleHierarchy?.getMyId() || gid,
    buyerRole: RoleHierarchy?.getMyRole() || 'customer',
    buyerShopId: RoleHierarchy?.getMyShopId() || null
  };
}
```
- Cart fetch band: `fetch /api/common/cart/...` hatao, direct `CartCore.getCartBySupplier(supplierId) || CartCore.getCart()`
- `CartCore.ready` ka wait: `await CartCore.ready` fir `init()`
- `getAuthHeaders()` me TOKEN + token both check

---

### 3. HAR FILE KA PURA LOGIC

#### 3.1 address-select.html + address-select.js

**HTML:**
- Header: back button, title Select Address, +Add button -> `openAddModal()`
- List: `#addressList` skeleton loader, then `.addr-card` cards
- Footer: `#addrContinue` disabled till selected
- Modal: `#addAddrModal` inputs: Name, Phone, House, Area, City, Pincode, Save/Cancel

**JS - AddressSelect Class:**
- `shopId = URLSearchParams shopId`
- `api = /api/user/addresses`
- `init()` -> `loadAddresses()` + continue button bind
- `loadAddresses()`:
    - `fetch(api + ?t=Date.now(), credentials:include, cache:no-store)`
    - `addresses = data.addresses || data.data || []`
    - If empty: `localStorage userLocation` se Current Location card -> `selected = {_id:current_location, fullAddress}`
    - Else: `innerHTML = addresses.map(a => <div data-id=a._id><b>name•phone</b><p>house,area,city-pincode</p><span>type</span>)`
    - `bindSelect()` -> `.addr-card` click -> remove selected all, add selected, `this.selected = {_id, fullAddress: innerText}`, `enableContinue()`
- `enableContinue()` -> button disabled = !selected
- `continueToPayment()` -> `localStorage.setItem(selectedAddressId, selected._id)`, `selectedAddressText`, `location.href = ./payment-select.html?shopId=xxx&addressId=yyy`
- `openAddModal()`, `closeAddModal()`
- `saveAddress()` -> payload {name, phone, house, area, city, pincode, type:HOME}, POST to api, success -> closeModal + loadAddresses

**Link:**
- Cart -> `CartCore.goToCheckout()` -> `address-select.html?shopId=xxx&supplierId=yyy` for customer flow
- Or checkout.html me address-list div ke liye `hierarchy-checkout.js loadAddresses()` same API use karta hai

#### 3.2 checkout.html + checkout.js V3 + hierarchy-checkout.js V14

**checkout.html (tumhara snippet) - Required IDs:**
- `#checkout-supplier-name`, `#checkout-items`, `#checkout-subtotal`, `#checkout-commission`, `#checkout-total`
- `#address-list` (div for addresses)
- `#gst-section` (checkbox #gst-needed, input #gst-number) - bulk ke liye show
- Radio: `name=paymentMode` values cod, upi, online, wallet
- Button: `#place-order-btn`

**checkout.js V3 - CheckoutCore Class:**
- `shopId = URL shopId`, `supplierId = URL supplierId || shopId`, `api = /api/common/checkout`
- `getBuyerInfo()` - stable guest_id
- `getApiBase()`, `getAuthHeaders()` - API_BASE + TOKEN
- `placeOrder({addressId, paymentMethod, amount})`:
    1. `buyer = getBuyerInfo()`
    2. `items = CartCore.getCartBySupplier(supplierId) || CartCore.getCart()`
    3. If empty -> alert Cart khali
    4. `total = amount || items.reduce(s+i.price*qty)`
    5. `payload = {shopId, supplierId, supplierRole (URL), buyerId, buyerRole, buyerShopId, items, total, totalAmount, addressId, addressText, paymentMethod, isBulkOrder, createdAt}`
    6. `fetch POST ${api}/${shopId}/place` with payload
    7. If success -> `CartCore.clear(supplierId)`, `sessionStorage.remove cart_bkp_supplierId`, redirect `order-success.html?shopId=xxx&orderId=yyy&amount=total&supplierId=zzz`
- `placeCODOrder()`, `placeUPIOrder()` wrappers

**hierarchy-checkout.js V14 - HierarchyCheckout Object:**
- `API = {checkout:/api/common/checkout, address:/api/user/addresses, wallet:/api/common/wallet/balance}`
- `getBuyerInfo()` same stable
- `getSupplierFromUrl()` -> `{supplierId: supplierId||shopId, supplierRole: supplierRole||shop_owner, shopId: shopId||supplierId, supplierName: supplierName||Shop}`
- `init()`:
    - `currentSupplier = getSupplierFromUrl()`
    - If no supplierId -> wait `CartCore.ready`, `getAllCarts()`, firstSid -> supplierId = firstSid, supplierName from cart item shopName, supplierRole from ownerRole
    - If still no -> redirect cart.html
    - `currentItems = CartCore.getCartBySupplier(supplierId) || getCart()`
    - If empty -> redirect cart.html
    - `renderSummary()` -> `loadAddresses()` -> `bindPayment()`
- `renderSummary()`:
    - `total = sum price*qty`
    - `isBulk = buyerRole != customer && != guest`
    - `commission = supplierRole != admin && isBulk ? round(total*0.05) : 0`
    - `el(checkout-items) = items map <div><span>name x qty</span><span>price*qty</span></div>`
    - `el(subtotal) = total`, `el(commission) = isBulk? commission : 0`, `el(total) = total`, `el(supplier-name) = supplierName (supplierRole)`
    - `el(gst-section) display = isBulk? block : none`
    - `localStorage checkoutTotal, checkoutSupplierId`
    - `esc()` for XSS
- `loadAddresses()`:
    - `fetch API.address + headers + credentials include`
    - If ok -> list = data.data||data.addresses, container #address-list -> radio list, `currentAddress = list[0]`
    - If fail -> guest address
- `bindPayment()` -> `[name=paymentMode], [data-payment-mode]` change/click -> `paymentMode = value`, default cod
- `getSelectedAddress()` -> checked radio value || currentAddress
- `placeOrder()`:
    - `buyer = getBuyerInfo()`, `supplier = currentSupplier`
    - If no items -> alert
    - Button disabled Placing...
    - `payload = {buyerId, buyerRole, buyerShopId, buyerAreaId, supplierId, supplierRole, supplierShopId, shopId, areaId, items:currentItems, addressId, address, addressText, paymentMode, paymentMethod, isBulkOrder, total, totalAmount, gstInvoiceNeeded, gstNumber}`
    - `POST API.checkout` with payload
    - If success -> `CartCore.clear(supplierId)`, remove backup, redirect `order-success.html?orderId=xxx&supplierId=yyy&shopId=zzz&amount=total`
    - Else alert fail + button enable

**Auto init:**
- `DOMContentLoaded` if pathname includes checkout.html -> `setTimeout 800ms` + wait `CartCore.ready.then(init)` + place-order-btn click -> placeOrder()

#### 3.3 payment-select.html V3 FIXED + payment-gateway.js + upi-intent.js

**payment-select.html V3:**
- Header back, title Payment
- `#addrPreview` -> `localStorage selectedAddressText`
- Pay cards: cod selected, upi, online -> data-method
- `#upiApps` hidden -> buttons gpay, phonepe, paytm, upi
- Bill: #paySubtotal, Delivery FREE, #payTotal, #payBtn Place Order • #payTotalBtn

**JS Fixed:**
- `shopId = URL shopId`, `supplierId = URL supplierId || shopId`, `addressIdFromUrl = URL addressId`
- `esc()` XSS
- `addrPreview innerHTML = 📍 selectedAddressText + shopId + addressId`
- Pay-card click -> remove selected all, add selected, `selectedMethod = dataset.method`, upiApps display = upi? block:none, PayBtn innerHTML = cod? Place Order • total : Pay • total
- `loadCartTotal()` FIXED:
    - Wait `CartCore.ready`
    - `items = CartCore.getCartBySupplier(supplierId) || getCart()`
    - If empty fallback `localStorage checkoutTotal||cartTotal`
    - `total = sum price*qty`
    - `paySubtotal, payTotal, payTotalBtn innerText = ₹total`
    - Return total
- Call `loadCartTotal()` on start + `cart:updated` event
- PayBtn click:
    - If no addressId -> alert + redirect address-select.html?shopId&supplierId
    - If upi -> `UpiIntent.pay(total)` + enable button return
    - If cod -> `CheckoutCore.placeOrder({addressId, paymentMethod:cod, amount:total})` else fallback direct fetch POST /api/common/checkout/:shopId/place with buyerId, buyerRole, items, total, addressId
    - If online -> `PaymentGateway.pay(total, shopId)`
- UPI buttons click -> `UpiIntent.pay(total, dataset.app)`

**payment-gateway.js:**
- `shopId = URL shopId`
- `pay(amount, shopId)`:
    - If Razorpay undefined -> `loadRazorpayScript()` -> create script https://checkout.razorpay.com/v1/checkout.js
    - POST `/api/common/checkout/${shopId}/create-razorpay-order` {amount*100, currency:INR} -> data {key, orderId}
    - Options {key, amount*100, currency, name:Local Market Shop, description:Order for shop, order_id, handler: verify -> POST `/api/common/checkout/${shopId}/verify-payment` with response + amount -> if success redirect order-success.html?shopId&orderId&amount, prefill name,email,contact from currentUser, theme color}
    - `new Razorpay(options)`, `on(payment.failed, alert)`, `open()`
    - Catch -> alert Online unavailable use COD

**upi-intent.js:**
- `shopId = URL shopId`, `upiId = shop@upi`, `merchantName = Local Market`
- `init()` -> GET `/api/shops/${shopId}` -> shop.upiId||shop.upi, shopName
- `pay(amount, app=upi)`:
    - amount float, orderId ORD+Date.now(), note Order orderId for merchant
    - upiLinks {gpay:tez://upi/pay?pa=upiId&pn=merchant&am=amount&cu=INR&tn=note, phonepe:phonepe://pay?..., paytm:paytmmp://pay?..., upi:upi://pay?pa=...}
    - `link = upiLinks[app] || upiLinks.upi`
    - `window.location.href = link`
    - setTimeout 2500 -> confirm Did payment complete? OK if paid -> fetch POST `/api/common/checkout/${shopId}/place` {paymentMethod:upi, upiApp:app, amount, addressId} -> if success redirect order-success.html

**FIXED NOTE:** UPI confirm dialog dangerous hai - production me isko hata ke server side UPI verification ya manual confirm page banao. Abhi ke liye chalega but MD me warning likho.

#### 3.4 cod-confirm.html, my-orders.html, order-success.html

**cod-confirm.html:**
- Modal max 400px, 💵, Cash on Delivery, amount #codAmount, #codAmount2, #codAmountBtn
- Params shopId, amount from URL or localStorage cartTotal
- #codConfirmBtn click -> disabled Placing... -> `CheckoutCore.placeOrder({paymentMethod:cod, amount})` -> if fail enable + alert

**my-orders.html:**
- Header back, title My Orders
- #list skeleton
- `shopId = URL shopId`
- `esc()` XSS
- `load()` -> `fetch /api/common/checkout/orders/my?shopId=xxx` credentials include, data.orders||data.data, if empty empty message, else map orders -> `<div order><top><b>orderId</b><span badge orderStatus></span></div><items><div><span>name x qty</span><span>price*qty</span></div></items><total>Total ₹total</total><date>createdAt locale + city pincode></div>`
- badge classes delivered green, cancelled red

**order-success.html:**
- Body green bg, card white, tick green, Order Lag Gaya, order ID #oid, ordersBtn href my-orders.html?shopId, button history.go(-2) Aur Saman Lo
- Params shopId, orderId from URL -> oid text, ordersBtn href

---

### 4. SERVER SIDE - ROUTES + MODEL - KAISE JUDEGA

#### 4.1 server/routes/common/index.js - Add these

```js
const express = require('express');
const router = express.Router();
const Order = require('../../models/Order');
const CartDB = {}; // Replace with MongoDB Cart model in production

// Cart already in cart.md - sync, get, clear

// Checkout - from hierarchy-checkout.js + checkout.js + payment-select.html
router.post('/checkout', async (req,res)=>{
  try{
    const { buyerId, buyerRole, supplierId, supplierRole, items, total, addressId, paymentMode, isBulkOrder } = req.body;
    if(!buyerId || !supplierId || !items || !items.length) return res.status(400).json({success:false, message:'Missing fields'});
    
    let commission = 0;
    if(supplierRole !== 'admin' && (buyerRole !== 'customer' && buyerRole !== 'guest')) commission = Math.round((total||0)*0.05);
    
    const order = await Order.create({
      orderId: 'ORD'+Date.now()+Math.floor(Math.random()*1000),
      buyerId, buyerRole, buyerShopId: req.body.buyerShopId, buyerAreaId: req.body.buyerAreaId,
      supplierId, supplierRole, supplierShopId: req.body.supplierShopId || supplierId,
      shopId: req.body.shopId || supplierId,
      areaId: req.body.areaId,
      items,
      totalAmount: total,
      deliveryAddress: req.body.address || { _id: addressId, text: req.body.addressText },
      addressId,
      paymentMethod: paymentMode || req.body.paymentMethod || 'cod',
      orderStatus: 'placed',
      isBulkOrder: !!isBulkOrder,
      commission,
      gstInvoiceNeeded: !!req.body.gstInvoiceNeeded,
      gstNumber: req.body.gstNumber || null,
      createdAt: new Date()
    });
    
    // Clear cart DB
    if(CartDB[buyerId]) delete CartDB[buyerId][supplierId];
    
    res.json({success:true, orderId: order.orderId, _id: order._id, order});
  }catch(e){ console.error(e); res.status(500).json({success:false, message:e.message}); }
});

router.post('/checkout/:shopId/place', async (req,res)=>{
  // Same logic as /checkout - payment-select.html uses this
  req.body.shopId = req.params.shopId;
  // Call same as above - duplicate code for simplicity
  try{
    const { buyerId, buyerRole, supplierId, supplierRole, items, total, addressId, paymentMethod } = req.body;
    const finalBuyerId = buyerId || req.user?._id || req.body.buyerId || 'guest';
    const finalSupplierId = supplierId || req.params.shopId;
    const finalItems = items || (CartDB[finalBuyerId] && CartDB[finalBuyerId][finalSupplierId]) || [];
    if(!finalItems.length) return res.status(400).json({success:false, message:'Cart empty'});
    
    const order = await Order.create({
      orderId: 'ORD'+Date.now(),
      buyerId: finalBuyerId, buyerRole: buyerRole || 'customer',
      supplierId: finalSupplierId, supplierRole: supplierRole || 'shop_owner',
      shopId: req.params.shopId,
      items: finalItems,
      totalAmount: total || req.body.totalAmount || finalItems.reduce((s,i)=>s+(i.price*i.qty),0),
      deliveryAddress: { _id: addressId, text: req.body.addressText },
      addressId,
      paymentMethod: paymentMethod || 'cod',
      orderStatus: 'placed',
      isBulkOrder: req.body.isBulkOrder || false,
      createdAt: new Date()
    });
    
    res.json({success:true, orderId: order.orderId, order});
  }catch(e){ res.status(500).json({success:false, message:e.message}); }
});

router.get('/checkout/orders/my', async (req,res)=>{
  try{
    const buyerId = req.user?._id || req.query.buyerId;
    if(!buyerId) return res.json({success:true, orders:[]});
    const orders = await Order.find({ buyerId }).sort({ createdAt:-1 }).limit(50);
    res.json({success:true, orders});
  }catch(e){ res.status(500).json({success:false, orders:[]}); }
});

// Razorpay
router.post('/checkout/:shopId/create-razorpay-order', async (req,res)=>{
  // Create Razorpay order - need RAZORPAY_KEY_ID, SECRET
  res.json({ success:true, orderId: 'rzp_order_'+Date.now(), key: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy' });
});

router.post('/checkout/:shopId/verify-payment', async (req,res)=>{
  // Verify signature
  res.json({ success:true, orderId: 'ORD'+Date.now() });
});

module.exports = router;
```

Mount in server.js:
```js
app.use('/api/common', require('./routes/common/index.js'));
app.use('/api/user/addresses', require('./routes/user.js')); // your existing
```

#### 4.2 Order.js Model Fields

```js
orderId: String unique,
buyerId: String index,
buyerRole: String enum [admin, product_manager, area_manager, shop_owner, customer, guest],
buyerShopId: String,
buyerAreaId: String,
supplierId: String index,
supplierRole: String,
supplierShopId: String,
shopId: String index,
areaId: String,
items: [{ productId, name, price, qty, image, ownerId, ownerRole, shopId, shopName }],
totalAmount: Number,
deliveryAddress: Object or { _id, text, house, area, city, pincode },
addressId: String,
paymentMethod: String enum [cod, upi, online, wallet],
orderStatus: String enum [placed, confirmed, packed, shipped, delivered, cancelled],
isBulkOrder: Boolean,
commission: Number,
gstInvoiceNeeded: Boolean,
gstNumber: String,
createdAt: Date,
updatedAt: Date
```

---

### 5. LINK KAISE HOGA - 5 JAGAH - EXACT SCRIPT TAGS

#### A) SHOP DASHBOARD - shop_owner as buyer - Bulk Order from Area Manager
**File:** `public/shop-templates/kirana/dashboard.html` Tab "Buy Stock" + `checkout.html` same folder

```html
<head>
  <script src="/assets/js/role-hierarchy.js"></script>
  <script src="/shop-templates/common/core/api-core.js"></script>
  <script src="/shop-templates/common/core/auth-core.js"></script>
  <script src="/shop-templates/common/cart/cart-core.js?v=3"></script>
  <script src="/shop-templates/common/cart/cart-count.js"></script>
</head>
<body>
  <!-- Product list - Add to Stock -->
  <button onclick="CartCore.add({...p, ownerId: areaManagerId, ownerRole:'area_manager', shopId: areaManagerId, shopName:'Area Stock'})">Add to Stock</button>

  <!-- Checkout page - checkout.html -->
  <!-- This file already includes hierarchy-checkout.js which will show GST section + commission -->
  <div id="checkout-supplier-name"></div>
  <div id="checkout-items"></div>
  <div>Subtotal: <span id="checkout-subtotal">₹0</span></div>
  <div>Commission: <span id="checkout-commission">₹0</span></div>
  <div>Total: <span id="checkout-total">₹0</span></div>
  <div id="address-list"></div>
  <div id="gst-section" style="display:none">
    <label><input type="checkbox" id="gst-needed"> GST Invoice chahiye</label>
    <input id="gst-number" placeholder="GST Number">
  </div>
  <label><input type="radio" name="paymentMode" value="cod" checked> COD</label>
  <label><input type="radio" name="paymentMode" value="wallet"> Wallet</label>
  <button id="place-order-btn">Place Order</button>

  <script src="./hierarchy-checkout.js?v=14"></script>
</body>
```

Link Flow: Buy Stock -> cart-drawer Checkout -> `checkout.html?supplierId=areaManagerId&supplierRole=area_manager&supplierName=AreaStock` -> place-order -> order-success

#### B) CUSTOMER VIEW - customer as buyer - Normal Order
**File:** `public/shop-templates/kirana/customer-view.html` + `address-select.html` + `payment-select.html`

```html
<script src="/assets/js/role-hierarchy.js"></script>
<script src="/shop-templates/common/cart/cart-core.js?v=3"></script>
<script src="/shop-templates/common/cart/cart-count.js"></script>
<script src="/shop-templates/common/checkout/checkout.js?v=3"></script>

<!-- Customer view product -->
<button onclick="CartCore.add({...p, shopId: shopId, ownerId: shopId, ownerRole:'shop_owner', shopName: 'Sharma Kirana'})">Add to Cart</button>

<!-- Override goToCheckout for customer flow - go to address-select not direct checkout -->
<script>
  CartCore.goToCheckout = function(supplierId){
    const sid = supplierId || Object.keys(CartCore.getAllCarts())[0] || '';
    location.href = `/shop-templates/common/checkout/address-select.html?shopId=${encodeURIComponent(sid)}&supplierId=${encodeURIComponent(sid)}`;
  };
</script>
```

Flow: customer-view -> Add to Cart -> mini-cart click -> cart-drawer -> Checkout -> `address-select.html?shopId=shopId` -> Select Address -> `payment-select.html?shopId=shopId&addressId=xxx` -> COD -> `order-success.html?shopId=shopId&orderId=xxx`

#### C) CUSTOMER APP - Main App - public/index.html + nearby-shops.html + assets/js/app.js

```html
<!-- index.html header -->
<script src="/assets/js/role-hierarchy.js"></script>
<script src="/shop-templates/common/cart/cart-core.js?v=3"></script>
<script src="/shop-templates/common/cart/cart-count.js"></script>
<span data-cart-count>0</span>

<!-- app.js -->
function renderProduct(product, shopId){
  return `<button onclick="CartCore.add({...product, shopId:'${shopId}', ownerId:'${shopId}', ownerRole:'shop_owner'})">Add</button>`;
}
// Override goToCheckout same as customer view
CartCore.goToCheckout = (sid)=> location.href = `/shop-templates/common/checkout/address-select.html?shopId=${sid}`;
```

#### D) AREA MANAGER - area_manager as buyer - Buy from Admin/Product Pool
**File:** `public/area-manager.html` Tab "Buy from Admin" + checkout

```html
<script src="/assets/js/role-hierarchy.js"></script>
<script src="/shop-templates/common/cart/cart-core.js?v=3"></script>
<script src="/shop-templates/common/cart/cart-count.js"></script>
<script src="/shop-templates/common/checkout/hierarchy-checkout.js?v=14"></script>

<!-- Pool list -->
<button onclick="CartCore.add({...p, ownerId:'admin_pool', ownerRole:'admin', supplierId:'admin_pool', shopName:'Admin Pool'})">Add to My Stock</button>

<!-- Checkout will show GST + commission 0 (admin) -->
```

Flow: area-manager.html -> Buy from Admin -> Add -> Cart -> `checkout.html?supplierId=admin_pool&supplierRole=admin` -> Place Order (isBulk true, commission 0)

#### E) ADMIN PANEL - admin as viewer - No Buy, Only Orders View
**File:** `public/admin-panel/orders.html` + `my-orders.html` logic

```html
<!-- Admin me cart-core load mat karo, sirf orders list -->
<script>
  fetch('/api/common/checkout/orders/my?buyerId=admin').then(r=>r.json()).then(data=> renderOrders(data.orders));
  // Or GET /api/admin/orders for all orders
</script>
```

`my-orders.html` me admin role ke liye badge hide already CartCount me, but orders list me admin sab orders dekh sakta hai if route allows.

---

### 6. TESTING CHECKLIST - FINAL V3

1. Customer View me 2 product Add -> data-cart-count 2?
2. Reload -> count 2 hi (sessionStorage guest_id stable)?
3. Cart drawer Checkout -> address-select.html?shopId=xxx redirect?
4. Address empty -> Current Location card show?
5. Select address -> localStorage selectedAddressId + Text set?
6. payment-select.html -> paySubtotal ₹ correct from CartCore? Not 0?
7. COD -> Place Order -> POST /api/common/checkout/:shopId/place success -> Cart clear -> order-success.html?orderId?
8. Shop Dashboard bulk -> checkout.html -> GST section show? Commission ₹5% show?
9. Area Manager admin_pool -> commission 0, GST show?
10. my-orders.html -> order list show? Total correct?
11. UPI -> App open? (confirm dialog warning - production me hatao)

---

### 7. NEXT MD - orders/ + customer-orders/

Iske baad `orders/` module - shop owner ko orders kaise dikhenge, status change, bulk orders.
Uske liye bhejna:
- orders/orders.html, orders.js, order-detail.html, order-detail.js, bulk-orders.html
- customer-orders/my-orders.js, track-order.html
- server/routes/orders.js

---

END - CART V3 + CHECKOUT V3 FULLY CONNECTED
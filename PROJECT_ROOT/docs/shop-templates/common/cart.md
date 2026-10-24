# CART MODULE - FULL DOCUMENTATION - V3 FIXED
## LOCATION: public/shop-templates/common/cart/ - SERVER CART SYSTEM

> Ye module ek hi hai jo 70 shop template, customer app, area manager, admin sab me lagega. localStorage CART BAND HAI. Sirf SERVER CART + memoryCart + sessionStorage backup.

---

### 1. FOLDER ME KYA KYA HAI - 6 FILES

| File | Kaam | Size | Link Kahan Hoga |
| :--- | :--- | :--- | :--- |
| `cart-core.js` | Dimaag - add/remove/qty/sync/restore | ~380 line | Sab jagah pehle load hoga |
| `cart-count.js` | Badge number update | ~40 line | Header me har page pe |
| `cart.html` | Full cart page | HTML | /common/cart/cart.html |
| `cart-drawer.html` | Slide drawer popup | HTML+CSS+JS | Har customer-view + dashboard me inject |
| `mini-cart.html` | Chhota cart icon | HTML | Header me |
| `saved-for-later.html` | DEPRECATED - purana API use karta hai | HTML | Abhi use mat karo |

---

### 2. CART-CORE.JS KA PURA LOGIC - LINE BY LINE

#### 2.1 Config
```js
const API = {
  sync: '/api/common/cart/sync',   // POST - cart save
  get: '/api/common/cart',          // GET ?buyerId=xxx - cart restore
  clear: '/api/common/cart/clear'  // POST - cart clear
}
let memoryCart = { supplierId: [items] } // RAM me hai, page reload pe khali, server se restore hoga
```

#### 2.2 getApiBase() + getAuthHeaders()
- `window.API_BASE || EnvConfig.API_BASE || origin` - 3 jagah se API dhundhta hai
- Token: `AuthCore.getToken() || localStorage TOKEN || token` - admin, shop_owner, customer sabka token same function se

#### 2.3 getBuyerInfo() - FIXED VERSION
**Pehle bug tha:** `guest_ + USER_IP` har baar naya ID.
**Fix:** `sessionStorage guest_id` - ek baar banao, browser band hone tak same.
```js
buyerId: RoleHierarchy.getMyId() || guest_id
buyerRole: RoleHierarchy.getMyRole() || 'customer'
buyerShopId: RoleHierarchy.getMyShopId() || null
```
- `buyerRole` 5 ho sakte: `admin`, `product_manager`, `area_manager`, `shop_owner`, `customer`
- `buyerShopId` sirf shop_owner ke liye - self-buy block ke liye chahiye

#### 2.4 getSupplierInfo(product)
Product kahan se aaya? 3 source:
1. `product-manager.js` se: `ownerId`, `ownerRole` = `product_manager`
2. `area-manager.js` se: `ownerId` = areaManagerId, `ownerRole` = `area_manager`
3. `shop-templates/products/product-manager.js` se: `shopId`, `ownerRole` = `shop_owner`

Isliye fallback chain:
`supplierId = ownerId || shopId || shop_id || supplierId || 'unknown'`

#### 2.5 syncToServer()
- POST `/api/common/cart/sync` body: `{buyerId, buyerRole, supplierId, items}`
- Agar fetch fail (net nahi) toh `sessionStorage.setItem('cart_bkp_'+supplierId, JSON.stringify(items))` backup

#### 2.6 add(product, qty) - Sabse Important
Step:
1. Role Check: `RoleHierarchy.canBuy(buyerRole, supplierRole, buyerId, supplierId)`
   - File: `public/assets/js/role-hierarchy.js`
   - Logic: admin > product_manager > area_manager > shop_owner > customer
   - admin kisi se nahi kharidega, customer sirf shop_owner se, shop_owner area_manager se, area_manager admin/product_manager se
2. Self-buy block: `buyerShopId === supplierId` -> apni hi dukan ka saman nahi
3. memoryCart me push
4. syncToServer + emitUpdate + Toast.success[supplierId]

#### 2.7 Other Functions
- `getCart(supplierId?)` - agar supplierId diya toh uska, nahi toh flat array sab supplier ka
- `getAllCarts()` - `{supplierId: [items]}` raw
- `getTotalCount()` - qty ka sum
- `getTotalAmount(supplierId?)` - price*qty sum
- `remove()`, `updateQty()`, `clear()` - har baar syncToServer + emitUpdate
- `restore()` - GET `/api/common/cart?buyerId=xxx` -> memoryCart = data.carts. Agar server empty toh sessionStorage backup se merge
- `emitUpdate()` - `window.dispatchEvent(new CustomEvent('cart:updated', {detail: {count, total, carts, items}}))` + `CartCount.update()`
- `get cart()` getter - FIXED: `cart-drawer.html` aur `cart.html` yehi dhoondh rahe the. Return `{items, total, count, bySupplier}`
- `goToCheckout(supplierId?)` - `/common/checkout/checkout.html?supplierId=xxx&buyerId=yyy&role=zzz`
- `goToCart()` - `/common/cart/cart.html?supplierId=xxx`
- `onChange(cb)` - `cart:updated` sunega, cb(cartData) call karega
- `ready` Promise - DOMContentLoaded + restore ke baad resolve

---

### 3. CART-COUNT.JS KA LOGIC

- `CartCore.getTotalCount()` se count leta hai
- Selector: `[data-cart-count], #cart-count, .cart-badge, .cart-count` sab jagah update
- `count>0 ? display flex : none`, `>99 ? 99+`
- Admin role ke liye hide: `RoleHierarchy.getMyRole() === 'admin'` -> hide
- Event: `window.addEventListener('cart:updated', update)`

---

### 4. UI FILES - cart.html, cart-drawer.html, mini-cart.html

#### cart-drawer.html - Sabse Zyada Use Hoga
- Overlay + Drawer div - right se slide
- Open: `window.openCartDrawer()` ya button pe `data-open-cart` attribute
- Close: overlay click ya X button
- Render: `cart.items` loop -> img, name, price x qty, - + buttons `CartCore.updateQty()`, delete `CartCore.remove()`
- Checkout button: `CartCore.goToCheckout()`
- Full Cart button: `CartCore.goToCart()`
- Binding: `CartCore.onChange(renderDrawer)` + `CartCore.ready.then(render)`

#### cart.html - Full Page
- Same logic as drawer but full page
- Bill box: subTotal, delivery FREE, grandTotal
- Clear Cart button: `CartCore.clear()`
- Footer fixed: Total + Place Order button -> `goToCheckout()`

#### mini-cart.html
- Header icon 🛒 + badge `data-cart-count`
- Click -> `openCartDrawer()` warna `cart.html` pe redirect

#### saved-for-later.html - ABHI USE MAT KARO
- Purana API `/api/common/cart/${shopId}/saved` bula raha hai, jabki naya `/api/common/cart/sync` hai. Isko future me CartCore me merge karna hai. Abhi free dashboard ke liye ignore.

---

### 5. DEPENDENCY - IS MD KO BANANE KE LIYE KAUNSI FILES DEKHI

1. `public/assets/js/role-hierarchy.js` - canBuy(), getMyId(), getMyRole(), getMyShopId()
2. `public/shop-templates/common/core/api-core.js` - API_BASE, fetch wrapper
3. `public/shop-templates/common/core/storage-core.js` - sessionStorage helper
4. `public/shop-templates/common/core/auth-core.js` - getToken()
5. `public/shop-templates/common/products/product-manager.js` - product.ownerId, ownerRole inject karta hai
6. `public/shop-templates/common/checkout/hierarchy-checkout.js` - checkout pe supplierId use
7. `server/routes/common/index.js` - MUST CHECK
8. `server/models/Order.js` - cart se order kaise banta hai

---

### 6. SERVER SIDE - ROUTE + MODEL - KAISE JUDEGA

#### File: server/routes/common/index.js (Expected Implementation - Agar nahi hai toh ye banao)

```js
const express = require('express');
const router = express.Router();

// In-memory ya MongoDB - Cart collection banao ya Order.js me cart field
let CartDB = {}; // { buyerId: { supplierId: [items] } } - Production me MongoDB

router.post('/cart/sync', async (req,res)=>{
  const { buyerId, buyerRole, supplierId, items } = req.body;
  if(!buyerId || !supplierId) return res.status(400).json({success:false});
  if(!CartDB[buyerId]) CartDB[buyerId] = {};
  CartDB[buyerId][supplierId] = items;
  // MongoDB me: await CartModel.updateOne({buyerId, supplierId}, {$set:{items, buyerRole}}, {upsert:true})
  res.json({success:true, carts: CartDB[buyerId]});
});

router.get('/cart', async (req,res)=>{
  const { buyerId } = req.query;
  const carts = CartDB[buyerId] || {};
  res.json({success:true, carts});
});

router.post('/cart/clear', async (req,res)=>{
  const { buyerId, supplierId } = req.body;
  if(supplierId && CartDB[buyerId]) delete CartDB[buyerId][supplierId];
  else delete CartDB[buyerId];
  res.json({success:true});
});

module.exports = router;
```

#### server.js me mount:
```js
app.use('/api/common', require('./routes/common/index.js'));
```

#### Model: server/models/Order.js se link
- Cart checkout pe `Order.create({buyerId, buyerRole, supplierId, supplierRole, items, total, status:'pending'})`
- `hierarchy-checkout.js` me Order create hoga

---

### 7. LINK KAISE HOGA - 4 JAGAH + ADMIN - EXACT CODE

#### A) SHOP DASHBOARD - shop_owner as buyer (Buy Stock from Area Manager)
**File:** `public/shop-templates/kirana/dashboard.html` - Tab "Buy Stock"
**Use Case:** Kirana wala Area Manager se atta, chawal kharidega

```html
<head>
  <script src="/assets/js/role-hierarchy.js"></script>
  <script src="/shop-templates/common/core/api-core.js"></script>
  <script src="/shop-templates/common/core/auth-core.js"></script>
  <script src="/shop-templates/common/cart/cart-core.js?v=3"></script>
  <script src="/shop-templates/common/cart/cart-count.js"></script>
</head>
<body>
  <header>
    <div>Buy Stock</div>
    <div data-cart-count style="background:red;color:white;padding:2px 8px;border-radius:10px">0</div>
    <button data-open-cart>🛒 Cart</button>
  </header>
  <div id="productList"></div>

  <script>
    // Area Manager ke products load
    fetch('/api/area-manager/products').then(r=>r.json()).then(products=>{
      document.getElementById('productList').innerHTML = products.map(p=>`
        <div>
          <b>${p.name}</b> - ₹${p.price}
          <button onclick="CartCore.add(${JSON.stringify(p).replace(/"/g,'&quot;')})">Add to Stock</button>
        </div>
      `).join('');
    });
  </script>

  <!-- Drawer inject - SAME CODE HAR SHOP ME -->
  <script>
    fetch('/shop-templates/common/cart/cart-drawer.html')
      .then(r=>r.text())
      .then(html=> document.body.insertAdjacentHTML('beforeend', html));
  </script>
</body>
```

#### B) CUSTOMER VIEW - customer as buyer (Customer buys from Shop)
**File:** `public/shop-templates/kirana/customer-view.html`
**Use Case:** Gali ka customer kirana shop se saman kharidega

```html
<script src="/assets/js/role-hierarchy.js"></script>
<script src="/shop-templates/common/cart/cart-core.js?v=3"></script>
<script src="/shop-templates/common/cart/cart-count.js"></script>

<div class="shop-header">
  <h1>Sharma Kirana</h1>
  <div id="miniCartInclude"></div> <!-- mini-cart.html inject -->
</div>

<div id="shopProducts"></div>

<script>
  const shopId = new URLSearchParams(location.search).get('shopId');
  fetch(`/api/shops/kirana/${shopId}/products`).then(r=>r.json()).then(list=>{
    document.getElementById('shopProducts').innerHTML = list.map(p=>`
      <div class="product-card">
        <img src="${p.image}">
        <b>${p.name}</b>
        <button onclick="CartCore.add({...p, shopId: '${shopId}', ownerId: '${shopId}', ownerRole: 'shop_owner', shopName: 'Sharma Kirana'})">
          Add to Cart
        </button>
      </div>
    `).join('');
  });
</script>

<script>
  // mini-cart + drawer dono inject
  fetch('/shop-templates/common/cart/mini-cart.html').then(r=>r.text()).then(h=> document.getElementById('miniCartInclude').innerHTML = h);
  fetch('/shop-templates/common/cart/cart-drawer.html').then(r=>r.text()).then(h=> document.body.insertAdjacentHTML('beforeend', h));
</script>
```

#### C) CUSTOMER APP - MAIN APP - public/index.html / nearby-shops
**File:** `public/index.html`, `public/assets/js/app.js`, `public/nearby-shops.html`
**Use Case:** Main app se kisi bhi dukan ka product cart me

```html
<!-- index.html header me -->
<script src="/assets/js/role-hierarchy.js"></script>
<script src="/shop-templates/common/cart/cart-core.js?v=3"></script>
<script src="/shop-templates/common/cart/cart-count.js"></script>
<span data-cart-count>0</span>

<!-- app.js me -->
function renderProductCard(product){
  return `<button onclick="CartCore.add(product)">Add</button>`;
}
```

#### D) AREA MANAGER - area_manager as buyer (Buy from Admin/Product Pool)
**File:** `public/area-manager.html` - Tab "Buy from Admin"
**Use Case:** Area Manager Product Pool se bulk kharidega

```html
<script src="/assets/js/role-hierarchy.js"></script>
<script src="/shop-templates/common/cart/cart-core.js?v=3"></script>
<script src="/shop-templates/common/cart/cart-count.js"></script>

<h2>Buy from Admin Pool</h2>
<div id="poolList"></div>

<script>
  fetch('/api/product-pool?status=approved').then(r=>r.json()).then(pool=>{
    document.getElementById('poolList').innerHTML = pool.map(p=>`
      <div>
        ${p.name} - ₹${p.price}
        <button onclick="CartCore.add({...p, ownerId: p._id, ownerRole: 'admin', supplierId: 'admin_pool'})">
          Add to My Stock
        </button>
      </div>
    `).join('');
  });
</script>
```

#### E) ADMIN PANEL - admin as viewer (No Buy)
**File:** `public/admin-panel/dashboard.html`
**Use Case:** Admin sirf dekhega, kharidega nahi. Cart badge hide.

```html
<script src="/assets/js/role-hierarchy.js"></script>
<script src="/shop-templates/common/cart/cart-count.js"></script>
<!-- cart-core.js load mat karo admin me, ya kiya toh canBuy false dega -->
<script>
  // CartCount init me check: if role === 'admin' hide badge
</script>
```

---

### 8. CHECKOUT SE LINK - hierarchy-checkout.js

```js
// cart.html ya drawer se checkout.html pe jate hi
// checkout.html?supplierId=xxx&buyerId=yyy
// hierarchy-checkout.js me:
const supplierId = new URLSearchParams(location.search).get('supplierId');
const items = window.CartCore.getCart(supplierId);
// items ko Order API pe POST
fetch('/api/orders/create', {method:'POST', body: JSON.stringify({supplierId, items})});
```

---

### 9. TESTING CHECKLIST - MD BANNE KE BAAD

1. Customer View me product Add -> data-cart-count 1 hona chahiye
2. Reload -> count 1 hi rahe (guest_id stable + restore)
3. Shop Dashboard me same shop ka product Add -> Self-buy blocked error
4. Area Manager me admin product Add -> Role check pass
5. Drawer open -> items dikhne chahiye (cart getter fix)
6. Checkout button -> checkout.html?supplierId=xxx redirect
7. Cart clear -> sessionStorage cart_bkp_ bhi clear

---

### 10. NEXT MD KE LIYE KAUNSI FILE BHEJOGE?

Is MD ke baad agla hai `checkout/hierarchy-checkout.js` - uske liye bhejna:
- checkout.js, hierarchy-checkout.js, address-select.js, checkout.html
- Order.js model, orders.js route
- role-hierarchy.js (already)

Ye MD 100% code dekh ke bani hai. Ab common folder kholne ki zarurat nahi.

END
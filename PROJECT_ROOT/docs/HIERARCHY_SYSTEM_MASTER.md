# ==============================================================================
# PROJECT: FULL HIERARCHY COMMERCE SYSTEM - MASTER BLUEPRINT
# FILE NAME: docs/FULL_HIERARCHY_MASTER.md
# PURPOSE: Ye file VS Code me rakhni hai. Jab bhi AI ko dikhaoge, AI is file se pura flow samajh ke sahi code dega.
# DATE: 16 Oct 2026
# ==============================================================================

## PART 1: TERA BUSINESS MODEL KYA HAI? (FINAL LOCKED)
Ye normal Amazon jaisa nahi hai. Ye 4-Level Supply Chain hai.

LEVEL 3 = ADMIN (Super Supplier)
    - Role ID: admin
    - Kya bechta hai: Sab kuch bulk me
    - Kisse bechta hai: Area Manager ko, Shop Owner ko, Customer ko bhi
    - Kharidega kisse se: Kisi se nahi
    - File: admin-panel/dashboard.html, adminRoutes.js, server/models/Manager.js

LEVEL 2 = AREA MANAGER (Distributor)
    - Role ID: area_manager
    - Kharidega: ADMIN se
    - Bechega: SHOP OWNER ko (dukan ka maal) + CUSTOMER ko (retail)
    - File: area-manager.html, areaManagerRoutes.js, Manager.js model

LEVEL 1 = SHOP OWNER (Retailer - 70+ Shop Templates)
    - Role ID: shop_owner
    - Kharidega: AREA MANAGER se + ADMIN se
    - Bechega: CUSTOMER ko
    - File: shop-templates/{kirana,dairy,cloth...}/dashboard.html, dashboard.js, Shop.js model, shopRoutes.js

LEVEL 0 = CUSTOMER (End User - Main App)
    - Role ID: customer / user / null (guest)
    - Kharidega: SHOP OWNER se + AREA MANAGER se + ADMIN se
    - Bechega: Kisi ko nahi
    - File: public/index.html, public/nearby-shops.html, public/assets/js/app.js, User.js model

RULE LOCKED: RoleHierarchy.canBuy(buyerRole, supplierRole) = true/false
admin: []
area_manager: ['admin']
shop_owner: ['area_manager', 'admin']
customer: ['shop_owner', 'area_manager', 'admin']
Self-buy BLOCKED: shop_owner apni hi shopId se nahi kharid sakta.

## PART 2: CART SYSTEM - EK HI CART, ROLE WALA

FILE 1: public/assets/js/role-hierarchy.js [NAYI FILE - SABSE PEHLE BANANI HAI]
Purpose: Kaun kisse kharid sakta hai
Connects to: app.js, nearby-shops.js, cart-core.js, product-manager.js, server/routes/common/index.js
Code:
window.RoleHierarchy = {
  admin: [],
  area_manager: ['admin'],
  shop_owner: ['admin','area_manager'],
  customer: ['shop_owner','area_manager','admin'],
  canBuy(buyer, supplier){
    if(!buyer || buyer==='guest') buyer='customer';
    if(buyer===supplier) return false;
    return (this[buyer]||[]).includes(supplier);
  },
  getMyRole(){ return localStorage.getItem('USER_ROLE') || window.USER_ROLE || 'customer'; }
};

FILE 2: public/shop-templates/common/cart/cart-core.js [EXISTING - FULL REWRITE]
Purpose: Ek hi source, role aware, shopId aware
Connects to: role-hierarchy.js, storage-core.js, api-core.js, cart-count.js, checkout.js / hierarchy-checkout.js, Order.js
Logic:
- getShopId() -> URL?shopId=xxx or lastShopId
- getBuyerInfo() -> buyerId, buyerRole, buyerShopId
- getSupplierInfo(product) -> supplierId, supplierRole from product.ownerId, product.ownerRole
- Cart Key: cart_${buyerRole}_${buyerId}_${supplierId}
- add(product, qty): check canBuy + self block + save localStorage + dispatchEvent('cart:updated') + sync POST /api/common/cart/sync
- remove, updateQty, clear, getCart(supplierId), getAllCartsForBuyer(), syncToServer()

FILE 3: public/shop-templates/common/cart/cart-count.js [REWRITE]
Purpose: Header badge
Connects to: cart-core.js (event), all html with [data-cart-count]
Logic: getAllCartsForBuyer() -> total qty sum -> update badges. If MY_ROLE==admin hide.

FILE 4: public/shop-templates/common/cart/cart.html + cart-drawer.html + mini-cart.html
Header: "Aap {supplierName} ({supplierRole}) se kharid rahe ho"
List: image, name, qty +/-, price, ownerRole badge
If buyerRole==shop_owner -> Bulk Order Mode + GST checkbox
Bottom: Subtotal, Delivery Charge, Commission, Total
Button: Checkout with {supplierName} -> checkout.html?supplierId=xxx&supplierRole=yyy
Connects: cart-core.js, hierarchy-checkout.js, address-select.js

## PART 3: CHECKOUT & PAYMENT SYSTEM

FILE 5: public/shop-templates/common/checkout/hierarchy-checkout.js [NAYI FILE - MUST]
Connects: cart-core.js, role-hierarchy.js, address-select.js, payment-select.html, payment-gateway.js, upi-intent.js, cod-confirm.html, common/index.js, Wallet.js, Order.js, socket-core.js
Flow:
1. URL se supplierId, supplierRole lo, buyerRole localStorage se
2. CartCore.getCart(supplierId)
3. If buyer==shop_owner -> GST mandatory, shop address auto, gst-invoice.html show
4. If buyer==customer -> delivery address from profile/addresses.html
5. Payment: customer=COD/UPI/Online (payment-gateway.js), shop_owner/area_manager=Wallet+UPI+Credit+COD
6. Wallet balance check if buyer!=customer via wallet.js
7. POST /api/common/checkout {buyerId, buyerRole, buyerShopId, supplierId, supplierRole, shopId, items, addressId, paymentMode, isBulkOrder, total, commission}
8. Success -> clear cart -> order-success.html -> socket emit

FILE 6: checkout.js [WRAPPER], payment-gateway.js, upi-intent.js, cod-confirm.html, address-select.js, address-select.html, payment-select.html, my-orders.html, order-success.html
All call hierarchy-checkout.js

FILE 7: server/models/Order.js [ADD FIELDS]
Add: buyerId, buyerRole enum, buyerShopId, supplierId, supplierRole enum, shopId, isBulkOrder Boolean, items[{productId,name,qty,price,ownerRole,ownerId}], totalAmount, commissionAmount (5% if supplier!=admin), supplierEarning, paymentMode, paymentStatus, orderStatus, gstInvoiceNeeded
Connects: common/index.js, orders.js, areaManagerRoutes.js, adminRoutes.js, socket-core.js, my-orders.js

FILE 8: server/models/Wallet.js [NAYI]
Fields: userId, role, shopId, balance, transactions[{orderId, type, amount, commission, fromRole, toRole, timestamp}]
Connects: Order.js, common/index.js, finance/wallet.html, payout-history.html

FILE 9: server/routes/common/index.js [MAJOR CHANGE]
POST /api/common/cart/sync
POST /api/common/checkout:
    1. Verify canBuy server side
    2. Check stock WorldProduct.js / TemplateProduct.js
    3. Commission = total*0.05 if supplier!=admin else 0
    4. Create Order
    5. Wallet: supplier + (total-commission), admin + commission, buyer deduct if wallet mode
    6. io.emit('new-order', order) for socket-core.js
GET /api/common/orders/my-orders?role=xxx
Connects: Order.js, Wallet.js, WorldProduct.js, role-hierarchy.js, socket-core.js

## PART 4: MAIN APP - CUSTOMER VIEW

FILE 10: public/index.html + assets/js/app.js + nearby-shops.js + product-core.js + shop-create.js + shop-template-map.js
MY_ROLE = USER_ROLE
Fetch /api/world-products?viewerRole=MY_ROLE
- customer -> ownerRole in [shop_owner, area_manager, admin]
- shop_owner -> [area_manager, admin]
- area_manager -> [admin]
Render card with badge "Sold by: Raju Kirana (Shop Owner)"
Add button -> CartCore.add(product with ownerRole, ownerId)
If ownerId==MY_SHOP_ID && MY_ROLE==shop_owner -> hide Add
Include: bottom-nav.html, toast.html, location.core.js, location.user.js
Connects: role-hierarchy.js, shop-template-map.js, location.core.js, cart-core.js, product-manager.js

FILE 11: nearby-shops.html + shop-templates/*/customer-view.html + user-view.html + shop-view.html
Same filter per shop

## PART 5: SHOP DASHBOARD

FILE 12: shop-templates/{kirana...}/dashboard.html + dashboard.js + common/dashboard.html + dashboard-core.js + common/core/api-core.js + auth-core.js
Tabs:
Tab1 My Orders (Customer ne mujhse kharida) -> orders/orders.html + live-orders.html + new-order-popup.html + socket-core.js + delivery-boy-assign.js + delivery-status.html
Tab2 Buy Stock (Maine Manager se kharida) -> app.js reuse, viewerRole=shop_owner, products where ownerRole=area_manager -> cart-core.js buyerRole=shop_owner -> hierarchy-checkout.js isBulkOrder=true + bulk-orders.html
Tab3 My Products -> inventory/inventory.html, inventory.js, low-stock-alert.html, product-form.html, product-manager.js, barcode-scanner.html
Tab4 Wallet -> finance/wallet.html, profit-loss.html, payout-history.html, expense.html, gst-invoice.html
Tab5 Profile -> profile/*, shop-info.html, shop-timing.html, open-close.html, delivery-settings.html
Connects: dashboard-core.js, auth-core.js, orders.js, wallet.js, role-hierarchy.js, app.js reuse, socket-core.js, cart-core.js

FILE 13: shop-templates/common/orders/orders.js + order-detail.js + delivery-boy-assign.js + delivery-route-optimize.js
Connects: Order where supplierId==myShopId, socket-core.js on new-order

FILE 14: finance/wallet.js + wallet.html + payout-history.html + profit-loss.html + expense.js
Connects: Wallet.js model, shows credit from customer, debit for buying from manager

## PART 6: AREA MANAGER DASHBOARD

FILE 15: area-manager.html + assets/js/area-manager.js + areaManagerRoutes.js + Manager.js + Area.js + cities.html + areas.html
Tabs:
Tab1 Shops in My Area -> shops.html filtered by Area.js
Tab2 Orders (Shop Owners bought from me + Customers bought from me) -> orders where supplierId==managerId
Tab3 Buy from Admin (Bulk) -> app.js viewerRole=area_manager -> ownerRole=admin -> cart-core.js buyerRole=area_manager -> checkout -> bulk-orders.html
Tab4 Delivery -> delivery.html, delivery-boy.html, delivery-proof.html, delivery-route-optimize.js
Tab5 Wallet + Reports -> common-finance.html, reports.html, payout-history.html
Connects: areaRoutes.js, Order.js, cart-core.js, Wallet.js, socket-core.js

## PART 7: ADMIN PANEL

FILE 16: admin-panel/dashboard.html + orders.html + shops.html + managers.html + users.html + areas.html + categories.html + comman-control-shop/* + adminRoutes.js + userAdmin.js + shopViewRoutes.js + _PROJECT-CONNECTION-MAP.html + connection-map.js + launcher-master.js
- All Orders any buyerRole/supplierRole
- Wallet: Admin commission total
- Add products ownerRole=admin via world-product.routes.js
- Finance: common-finance.html, profit-loss.html, expense.html
- Connection map me hierarchy lines green
Connects: All routes, Order.js, Wallet.js, TemplateProduct.js, WorldProduct.js

## PART 8: DELIVERY SYSTEM

FILE 17: delivery-boy.html + common/delivery/* + deliveryManager.js + location.js + track-core.js + customer-orders/track-order.html + track-order-live.js + my-orders.js + invoice-download.html
If buyerRole=customer -> home delivery -> delivery-boy-assign.html + delivery-route-optimize.js + delivery-status.html + track-order-live.js
If buyerRole=shop_owner bulk -> self-delivery.html or transporter
If buyerRole=area_manager bulk -> transporter
Connects: Order.js, location.core.js, location.shop.js

## PART 9: FULL CONNECTION LIST

1. role-hierarchy.js -> app.js, nearby-shops.js, cart-core.js, product-manager.js, common/index.js
2. cart-core.js -> role-hierarchy.js, storage-core.js, api-core.js, cart-count.js, cart.html, hierarchy-checkout.js
3. cart-count.js -> cart-core.js, index.html, customer-view.html, dashboard.html (hide), area-manager.html (hide)
4. cart.html/drawer/mini -> cart-core.js, hierarchy-checkout.js, address-select, payment-select
5. hierarchy-checkout.js -> cart-core.js, role-hierarchy.js, address-select.js, payment-gateway.js, upi-intent.js, cod-confirm.html, common/index.js, Wallet.js, Order.js, socket-core.js
6. checkout.js -> hierarchy-checkout.js wrapper
7. address-select.js -> checkout, User.js, Shop.js
8. payment-gateway.js + upi-intent.js -> hierarchy-checkout.js, common/index.js, wallet.js
9. product-manager.js -> role-hierarchy.js, WorldProduct.js, TemplateProduct.js, cart-core.js
10. app.js -> role-hierarchy.js, product-core.js, location.core.js, shop-template-map.js, cart-core.js, product-manager.js
11. nearby-shops.js -> app.js, role-hierarchy.js, location.shop.js
12. Order.js -> common/index.js, orders.js, areaManagerRoutes.js, adminRoutes.js, wallet.js, socket-core.js, my-orders.js, deliveryManager.js
13. Wallet.js -> Order.js, common/index.js, wallet.html, payout-history.html
14. common/index.js -> Order.js, Wallet.js, WorldProduct.js, role-hierarchy.js, socket-core.js
15. dashboard.js shop -> orders.js, wallet.js, product-manager.js, role-hierarchy.js, app.js Buy Stock, socket-core.js, cart-core.js for buying
16. area-manager.js -> Area.js, Manager.js, orders, app.js Buy from Admin, cart-core.js, Wallet.js
17. admin.js + connection-map.js -> All routes, Order.js, Wallet.js, _PROJECT-CONNECTION-MAP.html
18. socket-core.js -> server.js io, Order.js, orders.js, live-orders.html, new-order-popup.html
19. my-orders.js + track-order-live.js -> Order.js, common/index.js, track-core.js
20. wallet.js finance -> Wallet.js model

## PART 10: PAYMENT FLOW DIAGRAM

FLOW A: CUSTOMER BUYS FROM SHOP OWNER
index.html -> app.js viewerRole=customer -> WorldProduct ownerRole=shop_owner -> product-card.js -> CartCore.add buyerRole=customer supplierRole=shop_owner supplierId=shop123 -> cart.html -> hierarchy-checkout.js -> address-select.html customer address -> payment-select.html COD/UPI -> POST /api/common/checkout -> Order create buyerRole=customer supplierRole=shop_owner -> Wallet: shop_owner +95 admin +5 -> socket-core.js emit -> shop dashboard orders.js popup -> delivery-boy-assign.js -> track-order.html -> order-success.html

FLOW B: SHOP OWNER BUYS FROM AREA MANAGER BULK
shop-templates/kirana/dashboard.html Tab Buy Stock -> app.js viewerRole=shop_owner -> WorldProduct ownerRole=area_manager area=hisArea -> Add -> cart-core.js buyerRole=shop_owner supplierRole=area_manager -> cart.html Bulk Order -> hierarchy-checkout.js address=shop address auto GST checkbox -> payment Wallet+UPI -> POST -> Order buyerRole=shop_owner supplierRole=area_manager isBulkOrder=true -> Wallet manager +4750 admin +250 -> socket -> area-manager.html

FLOW C: AREA MANAGER BUYS FROM ADMIN
area-manager.html Tab Buy from Admin -> app.js viewerRole=area_manager -> WorldProduct ownerRole=admin -> cart-core.js buyerRole=area_manager supplierRole=admin -> checkout -> POST -> Order buyerRole=area_manager supplierRole=admin -> Wallet admin full -> socket admin-panel

## PART 11: FILE COUNTS
Nayi: 3 (role-hierarchy.js, Wallet.js, hierarchy-checkout.js)
Badlav: 10 (cart-core.js, cart-count.js, Order.js, common/index.js, app.js, nearby-shops.js, product-manager.js, checkout.js, dashboard.js, area-manager.js)
Total touch: 13 files. 70 shop templates me sirf 2 script tag jodna: role-hierarchy.js + cart-core.js

## PART 12: AI FINAL INSTRUCTION
Jab ye file dikhayi jaye:
1. role-hierarchy.js pehle check karo
2. alag cart mat banao, cart-core.js ek hai, key buyerRole+supplierId se
3. hierarchy-checkout.js use karo normal checkout.js nahi
4. Order me 4 fields mandatory: buyerRole, supplierRole, buyerId, supplierId
5. Wallet commission 5% if supplier!=admin
6. app.js me viewerRole filter
7. shop dashboard 2 mode: Sell to Customer + Buy from Manager
8. Admin only sell
9. socket emit mandatory for live order
10. _PROJECT-CONNECTION-MAP.html me hierarchy green

END OF FILE
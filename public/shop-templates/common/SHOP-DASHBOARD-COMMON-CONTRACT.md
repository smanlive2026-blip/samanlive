Haan bhai, ab final MD bana deta hu. Isko is naam se rakhna:

*`public/shop-templates/common/SHOP-DASHBOARD-COMMON-CONTRACT.md`*

Iske bahar koi code nahi banega. Jo code isse alag hoga, wo code galat hoga.

---
# SHOP DASHBOARD x COMMON - CONTRACT - FINAL
# File: public/shop-templates/common/SHOP-DASHBOARD-COMMON-CONTRACT.md
# Ye file hi sach hai. Iske bahar koi code nahi banega.
# Agar koi code is file se alag hai, toh code galat hai, ye file sahi hai.
# Last Update: 10 Nov 2026 - Shop Dashboard + Common ke liye FINAL

---

## 0. EK LINE ME PURA PROJECT SAMAJH

Customer - Shop View se order karega
    |
    v
Shop Dashboard - Accept -> Packed karega
    |
    v
Delivery Boy - Shop ka apna, nahi toh nearby koi bhi - Picked -> Delivered karega
    |
    v
Area Manager - Sirf record dekhega, kuch nahi karega
    |
    v
Admin - Sirf details dekhega, kuch nahi karega

---

## 1. NAAM KA JHAGDA KHATAM - YE SAB EK HI CHEEZ HAIN

### 1.1 Customer = User - Ek hi aadmi hai, do alag aadmi nahi hain
- Customer bol lo ya User bol lo, baat ek hi aadmi ki ho rahi hai.
- Wo aadmi jo dukaan se samaan khareedta hai.
- Aage se MD me, code me, button me - jahan Customer likha hoga, wahan User bhi samjha jayega.
- Alag-alag role nahi banega Customer aur User ka.

### 1.2 Shop View = Customer View = User View - Ek hi page hai, 3 naam se pada hai
- Ye wo page hai jahan Customer dukaan ka maal dekhta hai, Cart me dalta hai, Checkout pe jata hai.
- Aaj iske 3 naam pade hue hain, kaam teeno ka ek hi hai:

| Naam | Kitni dukaan me hai | Kaunsi dukaan |
| --- | --- | --- |
| `customer-view.html` | 66 dukaan | Dairy, Bakery, Sabji, Mobile, Patanjali, aur baaki sab |
| `user-view.html` | 4 dukaan | Kirana, Medical, Restaurant, Sports |
| `shop-view.html` | 1 dukaan | Cloth |

- Total 72 dukaan, 3 naam, 1 kaam.
- **Aage se asli naam sirf ek hoga - `shop-view.html`**
- Purani wali 3 naam ko ek naam pe laana hai, naya page nahi banana hai.
- Flower wali dukaan me `customer-view.htm` hai - ye typo hai, `.html` karna hai.

### 1.3 Shop Dashboard = Dukaan wala page - Customer wala page nahi hai
- Shop Dashboard - dukaan wale ka page hai. Jahan order aata hai, jahan Accept / Packed hota hai.
- Shop View - customer ka page hai. Jahan maal dekha jata hai, order kiya jata hai.
- Dono ko kabhi mix nahi karna hai.

---

## 2. PEHCHAN - SHOP KAUNSI HAI, BANDA KAUN HAI

### 2.1 ShopId kahan se aayega
1. Pehle URL se - `dashboard.html?shopId=XYZ`
2. URL me nahi hai toh `localStorage` se - `last_shopId`
3. Dono me nahi hai toh dashboard khulega hi nahi.
   Dikhayega - "Shop ID Missing, My Shops pe jao"
   Khaali dashboard, purana data, dusri dukaan ka data - kabhi nahi dikhayega.

### 2.2 Banda kaun hai - Shop Dashboard pe
- Token `localStorage` se - `TOKEN`
- Token se `/api/auth/me` ya `/api/common/profile/me` pe puchenge - ye kaun hai
- Uska `role` hona chahiye `shop_owner`
- Agar `role` customer / delivery_boy / area_manager hai, toh Shop Dashboard nahi khulega.
- Shop ka `ownerId` aur bande ka `_id` match hona chahiye.
- Match nahi hua toh - "Ye dukaan tumhari nahi hai"

### 2.3 Banda kaun hai - Shop View pe
- Customer login ho ya na ho, maal dekh sakta hai.
- Order karte waqt pehchan chahiye - phone / login.
- Guest bhi order kar sakta hai, par uska `buyerId` guest wala hoga.
- Shop View pe kabhi Shop Dashboard ka button nahi dikhega.
- Shop View pe kabhi dusri dukaan ka order nahi dikhega.

### 2.4 Ek dukaan, ek hi sach
- Dashboard me jo `shopId` hai, har common call me wahi `shopId` jayega.
- Shop View me jo `shopId` hai, usi dukaan ko order jayega.
- Koi common function apne man se `shopId` nahi badlega.
- Koi common function dusri dukaan ka data nahi layega.

---

## 3. SHOP DASHBOARD KYA KAREGA, KYA NAHI KAREGA

### 3.1 Karega - Sirf ye 5 kaam
1. **Dukaan dikhayega** - Naam, Photo, Open / Closed, Aaj ka hisaab
2. **Tab dikhayega** - Orders, Products, Inventory, Wallet, Marketing, Reviews, Delivery (sirf dekhna), Banner, Share, Settings, Profile
3. **Common ko bulayega** - Tab dabane pe common wala page `iframe` ya naye page me kholega, `shopId` ke saath
4. **Live sunega** - Socket se `join-shop` karega, naya order aane pe popup + awaaz dega
5. **Dukaan Open / Close karega** - `shop-toggle` se

### 3.2 Nahi karega - Ye sab COMMON ka kaam hai ya dusre ka kaam hai
- Order ka list banana - COMMON karega
- Order Accept / Packed ka button chalana - COMMON karega
- Product add / edit karna - COMMON karega
- Wallet ka balance nikalna - COMMON karega
- Coupon banana - COMMON karega
- Review ka jawab dena - COMMON karega
- Delivery boy assign karna - YE SHOP KA KAAM HI NAHI HAI
- Order Delivered karna - YE BHI SHOP KA KAAM NAHI HAI, Delivery Boy ka hai
- Area Manager ka record dekhna - Ye Shop ka kaam nahi hai

### 3.3 Dashboard me koi business logic nahi hoga
- Dashboard ki file me `fetch('/api/...')` karke order / wallet / product ka data nahi nikala jayega.
- Dashboard sirf `shopId` nikalega, `AuthCore` se banda check karega, `SocketCore` se live sunega.
- Baaki sab common ke JS / HTML ko de dega.

---

## 4. COMMON KYA KAREGA, KYA NAHI KAREGA

### 4.1 Common ka rule
- Common ko nahi pata hona chahiye ki dukaan Kirana hai ya Bakery.
- Common ko sirf `shopId` + `shopType` milega URL se.
- `shopType` sirf dikhne ke liye hai - rang, naam, seed data.
- Kaam sabke liye ek jaisa hoga.

### 4.2 Common ke 2 hisse hain

**A. Core - Neeche wali neev - jo har dashboard ke khulte hi chalegi**

| Core File | Kaam | Shop Dashboard me kya dikhega |
| --- | --- | --- |
| `core/storage-core.js` | shopId / user ko sambhalna | Kuch nahi dikhega, andar kaam karega |
| `core/auth-core.js` | Token check, banda kaun hai | Galat banda ho toh dashboard rok dega |
| `core/api-core.js` | Har API call me token lagana, retry karna | Kuch nahi dikhega, har call peeche se sahi jayegi |
| `core/socket-core.js` | Live sunna - `join-shop` | Naya order aane pe popup + awaaz |
| `core/dashboard-core.js` | Dashboard ka malik - shop + stats load karna, har 30 sec refresh | Upar dukaan ka naam, aaj ke order / paisa |
| `core/error-handler.js` | Galti aaye toh sahi message dikhana | "Order nahi mila" jaisa saaf message, khaali page nahi |

**B. Business - Dukaan wale ka asli kaam - tab dabane pe khulega**

| Tab | Common Page | Shop wala kya karega | Shop wala kya NAHI karega |
| --- | --- | --- | --- |
| Orders | `common/orders/orders.html` | Order dekhega, Accept / Reject karega, Packed karega | Assign nahi karega, Delivered nahi karega |
| Order Detail | `common/orders/order-detail.html` | Ek order ka pura detail dekhega, customer ko call / WhatsApp karega | Dusri dukaan ka order nahi dekhega |
| Products | `common/products/product-form.html` | Naya maal add karega, price badlega | Dusri dukaan ka maal nahi badlega |
| Inventory | `common/inventory/inventory.html` | Stock dekhega, kam stock ka alert dekhega | - |
| Wallet / Finance | `common/finance/wallet.html` | Balance dekhega, is order me kitna mila, commission kitna kata | Paisa nikalne ka kaam yahan se nahi, sirf dekhna |
| Marketing | `common/marketing/coupons.html` | Coupon banayega | - |
| Reviews | `common/reviews/reviews.html` | Customer ke review ka jawab dega | Fake review nahi banayega |
| Delivery | `common/delivery/delivery-status.html` | Sirf dekhega - order kahan hai | Assign nahi karega |
| Banner | `common/banner/banner.html` | Apni dukaan ka banner badlega | - |
| Share | `common/share/qr-share.html` | Apni dukaan ka QR / link bhejega | - |
| Settings | `common/settings/settings.html` | Delivery charge, timing, language badlega | - |
| Profile | `common/profile/shop-info.html` | Dukaan ka naam, photo, address badlega | - |

### 4.3 Common me kya nahi hoga
- Common me koi `dashboard.html` ka design nahi hoga.
- Common me koi dusre role ka button nahi hoga.
  Matlab Orders wale page me Admin / Area Manager / Delivery Boy ka button nahi hoga.
  Sirf Shop wale ka button hoga - Accept / Reject / Packed.
- Common me `localStorage` se purana data dikhake kaam nahi chalaya jayega.
  API fail hui toh saaf likhega - "Order load nahi hua, dobara try karo"
  Purana order dikhake dukaan wale ko dhokha nahi dega.

---

## 5. SHOP VIEW - CUSTOMER KAHAN SE ORDER KAREGA

### 5.1 Shop View kya hai
- Ye Customer ka page hai.
- Customer yahan dukaan ka maal dekhta hai.
- Customer yahan Cart me maal dalta hai.
- Customer yahan se Checkout pe jata hai.

### 5.2 Shop View me kya hoga
1. Dukaan ka naam, photo, banner
2. Maal ki list - naam, price, photo
3. Search / Filter - maal dhundhna
4. Cart - maal jodna, hatana, total dekhna
5. Checkout button - `common/checkout/checkout.html` pe jayega
6. Dukaan Open hai ya Closed hai - ye dikhega, band hai toh order nahi hoga
7. Customer ka apna order track karne ka link - `my-orders.html`

### 5.3 Shop View me kya NAHI hoga
- Shop Dashboard ka button nahi hoga
- Order Accept / Packed ka button nahi hoga
- Wallet / Inventory / Staff ka button nahi hoga
- Dusri dukaan ka maal nahi dikhega
- Admin / Area Manager ka kuch nahi dikhega

### 5.4 Order banne ka rule - Shop View se
- Order me hamesha ye likha rahega:
    - Kis customer ne kiya - `buyerId`, `buyerRole = customer`
    - Kis dukaan ko kiya - `supplierId = shopId`, `supplierRole = shop_owner`
    - Kya manga - `items`
    - Kitne ka - `totalAmount`
    - Kahan bhejna hai - `deliveryAddress`
    - Kaise paisa dega - `paymentMode = cod / upi / online`
- Order banne ke baad, customer ko Order ID milega, aur wo apne order ko track kar payega.

---

## 6. ORDER KA PURA FLOW - FINAL - ISKO BADALNA NAHI HAI

### 6.1 Step 1 - Customer order karega
- Kahan se - Shop View se - `shop-view.html` / `customer-view.html` / `user-view.html` - teeno ek hi hain
- Kaise - Maal Cart me dalega, Checkout pe jayega, Address + Payment dega, Order karega
- Order kahan jayega - Sirf usi dukaan ke Shop Dashboard pe, jiska `shopId` URL me tha

### 6.2 Step 2 - Shop Dashboard pe order aayega
- Socket se `join-shop` wale room me `new-order` aayega
- Shop Dashboard me popup + awaaz aayegi - "Naya Order Aaya"
- Dukaan wala Orders tab kholega
- COMMON - `orders.html` - sirf is `shopId` ke order dikhayega
- Dukaan wala dekhega - kya manga, kitne ka, kahan bhejna hai, customer ka phone kya hai

### 6.3 Step 3 - Shop Accept / Reject karega
- **Accept** - Haan, maal hai, bhej dunga
- **Reject** - Maal nahi hai / dukaan band hai
- Reject hua toh order wahi khatam, customer ko pata chal jayega - "Dukaan ne reject kiya"
- Accept hua toh status hoga - `confirmed`

### 6.4 Step 4 - Shop Packed karega
- Dukaan wala maal pack karega
- Phir dabayega - **Packed**
- Status hoga - `packed`
- **YAHAN SHOP KA KAAM KHATAM**
- Shop ko ye nahi sochna ki delivery kaun karega

### 6.5 Step 5 - Delivery Boy ko order jayega
- Accept + Packed ke baad order Delivery Boy ko jayega.
- Delivery Boy kaun hoga - iska rule ye hai:

**A. Shop ka apna Delivery Boy hai toh:**
- Pehle usi ko jayega
- Usko order milega - dukaan kahan hai, ghar kahan hai, customer ka phone kya hai

**B. Shop ka apna Delivery Boy nahi hai toh:**
- **Nearby koi bhi Delivery Boy** ko jayega
- Jo boy us dukaan ke paas hai, jo free hai, usko milega
- Us boy ko ye nahi dikhega ki ye kis Area Manager ke area ka hai
- Usko sirf ye dikhega - dukaan kahan hai, ghar kahan hai

**C. Delivery Boy kya karega - Sirf 2 kaam:**
- **Picked** - Maal dukaan se utha liya
- **Delivered** - Customer ko de diya
- Delivery Boy order Accept / Packed nahi karega, wo Shop ka kaam tha
- Delivery Boy dusre boy ka order nahi dekhega, sirf apna order dekhega

### 6.6 Step 6 - Area Manager - SIRF RECORD DEKHEGA, KUCH NAHI KAREGA
- Area Manager order ko haath nahi lagayega.
- Na Accept karega, na Assign karega, na Delivered karega.
- Uske paas sirf record jayega, dekhne ke liye:

| Area Manager ko kya dikhega | Kya NAHI dikhega |
| --- | --- |
| Aaj mere area me kitne order hue | Accept / Assign / Delivered ka button |
| Kaunsi shop pe kitna order hua | Kisi ek order ko badalne ka button |
| Kaunsi shop pe kitni delivery hui | Customer ka pura address / phone - sirf zaroorat ho toh |
| Kaunsi delivery atki hui hai, kis wajah se atki hai - shop ne accept nahi kiya, ya boy ne pick nahi kiya | - |
| Kaunsa delivery boy kitni delivery kar raha hai | - |

- Matlab Area Manager ka dashboard ek **register** jaisa hoga.
- Jaise dukaan me hisaab ki copy hoti hai, waisa.
- Dekhna hai, karna kuch nahi hai.

### 6.7 Step 7 - Admin - SIRF DETAILS DEKHEGA, KUCH NAHI KAREGA
- Admin bhi order ko haath nahi lagayega.
- Admin ke paas sirf details jayengi:

| Admin ko kya dikhega | Kya NAHI dikhega |
| --- | --- |
| Aaj total kitne order hue | Accept / Packed / Assign / Delivered ka button |
| Kitne accept hue, kitne reject hue, kitne delivered hue | Kisi ek order ko badalne ka button |
| Kaunsi shop sabse zyada bech rahi, kaunsi slow hai | - |
| Kaunse area me kitna hua | - |
| Total paisa kitna ghuma, commission kitna bana | - |
| Koi order atka hai toh kahan atka hai, kiski wajah se atka hai | - |

- Admin ka kaam dekhna aur samajhna hai, order chalana nahi.
- Order chalana Shop + Delivery Boy ka kaam hai.

### 6.8 Status ke naam - Kaun kya dekhega

| Status | Kaun karega | Kaun dekhega |
| --- | --- | --- |
| `placed` | Customer - order kiya | Shop, Customer, Area Manager (record), Admin (details) |
| `confirmed` | Shop - Accept kiya | Shop, Customer, Delivery Boy, Area Manager, Admin |
| `packed` | Shop - Packed kiya | Shop, Customer, Delivery Boy, Area Manager, Admin |
| `picked` | Delivery Boy - Utha liya | Delivery Boy, Customer, Shop, Area Manager, Admin |
| `out_for_delivery` | Delivery Boy - Nikal gaya | Sab dekhenge, karega koi nahi |
| `delivered` | Delivery Boy - De diya | Sab dekhenge |
| `cancelled` | Customer (placed me) ya Shop (Reject) | Sab dekhenge |
| `rejected` | Shop ne mana kiya | Sab dekhenge |

- Shop ke page pe sirf dabane ke liye honge - Accept / Reject / Packed
- Baaki status Shop ke page pe sirf dekhne ke liye honge, dabane ke liye nahi.

---

## 7. PRODUCT MANAGER / EXECUTIVE - SHOP DASHBOARD SE KYA LENA DENA HAI

### 7.1 Product Manager
- Isko Customer wala chhota order nahi dikhega.
- Isko sirf **Bulk Order** dikhega - jab Shop wala ya Area Manager bada maal mangata hai.
- Isko Shop Dashboard ke andar ghusna nahi hai.
- Isko apna alag dashboard hai - `product-manager/dashboard.html`

### 7.2 Executive
- Isko ek-ek order ka detail nahi chahiye.
- Isko bada picture chahiye - kitni shop judi, kitne area me kaam ho raha, kahan order zyada aa raha.
- Isko bhi Shop Dashboard ke andar ghusna nahi hai.
- Isko apna alag dashboard hai - `executive/dashboard.html`

### 7.3 Shop Dashboard me in dono ka button nahi hoga
- Product Manager ka button Shop Dashboard me nahi hoga.
- Executive ka button Shop Dashboard me nahi hoga.
- Ye dono alag log hain, alag kaam hai.

---

## 8. API KA CONTRACT - SHOP DASHBOARD KE LIYE

### 8.1 Shop Dashboard se Common tak
- Har common page ko URL me ye milega:
  `?shopId=XYZ&shopType=kirana&role=shop_owner`
- Koi common page bina `shopId` ke nahi khulegi.

### 8.2 Shop View se Common tak
- Har Shop View se Checkout ko ye milega:
  `?shopId=XYZ&supplierId=XYZ&supplierRole=shop_owner&shopType=kirana`
- Checkout se Order banega, usi `shopId` pe jayega.

### 8.3 Common se Backend tak
- Har call me header me jayega:
  `Authorization: Bearer TOKEN`
  `x-buyer-id: USER_ID`
- Har call me `shopId` ya `supplierId` jayega, taaki backend sirf us dukaan ka data de.
- Backend me role check hoga - `shop_owner` hai toh sirf uski dukaan ka order milega.

### 8.4 Backend se jawab
- Sahi hua toh - `{ success: true, orders: [...], pagination: {...} }`
- Galat hua toh - `{ success: false, message: "saaf wajah" }`
- Khaali hai toh - `{ success: true, orders: [] }` - 404 nahi, khaali list.
- Kabhi bhi HTML error page nahi aayega, hamesha JSON aayega.

### 8.5 Socket ka contract
- Dashboard khulte hi - `join-shop` - `shop:SHOP_ID`
- Naya order - `new-order` - `{ orderId, totalAmount, createdAt }`
- Order badla - `order-updated` - `{ orderId, orderStatus }`
- Dukaan band / khuli - `shop-status-changed` - `{ shopId, isOpen }`
- Socket kat jaye toh apne aap dobara judega, dukaan wale ko refresh nahi karna padega.

---

## 9. HAR DUKAAN KE LIYE EK JAISA - KIRANA = BAKERY

### 9.1 Master kaun hai
- Aaj ke liye master hai - `kirana/dashboard.html`
- Kyunki usme common sabse zyada juda hai.
- Baaki sab dashboard ko isi jaisa banana hai.

### 9.2 Har dashboard me ye hona hi chahiye - nahi toh wo dashboard adhura hai
1. Upar - dukaan ka naam, photo, Open / Closed button
2. Neeche - wahi 12 tab - Orders, Products, Inventory, Wallet, Marketing, Reviews, Delivery (sirf dekhna), Banner, Share, Settings, Profile
3. Wahi core file - `storage, auth, api, socket, dashboard-core`
4. Wahi `shopId` wala rule
5. Wahi socket wala `join-shop`
6. Koi dashboard apna alag order / wallet ka code nahi likhega.

### 9.3 Kya alag hoga har dukaan me
- Sirf 3 cheez alag hogi:
    1. `shopType` - kirana / bakery / dairy
    2. Rang / naam / photo
    3. Seed data - Bakery me cake / bread, Kirana me aata / daal
- Kaam, button, flow - sab ek jaisa.

### 9.4 Chhote dashboard ki haalat
- Bakery, Sabji jaise 60+ dashboard me abhi common juda hi nahi hai.
- Unme sirf `dashboard.js` hai, common ka koi kaam nahi ho raha.
- Unko master jaisa banana hai, naya code nahi likhna hai.

---

## 10. KYA TOOTA HUA HAI ABHI - IS MD KE HISAAB SE

### 10.1 Toota hua - Pehle theek karna hai
1. `common/orders` ka backend route nahi hai - `orders.routes.js` missing hai, isliye Live Orders khaali rehta hai.
2. `new-order-sound.mp3` - 0 bytes hai, awaaz nahi aati.
3. `order-detail.html` - pura page nahi hai, sirf address ka tukda hai.
4. `shop-toggle` ka backend route nahi hai - dukaan band karne pe server pe save nahi hota.
5. `samanlive-bridge.js` - Mobile dashboard maangta hai, file hai hi nahi.
6. Chhote dashboard me common juda hi nahi hai - Bakery, Sabji jaise 60+ dashboard me sirf `dashboard.js` hai.
7. `dashboard-core.js` 2 baar load ho raha hai - `core/` wala + `js/` wala - isliye order 2 baar bajta hai.
8. Wallet 2 jagah hai - `finance/wallet.html` + `wallet/wallet.html` - dukaan wala confuse hota hai, ek hi hona chahiye.
9. `delivery-boy-assign.html` ka button Shop Dashboard me hai - ye Shop ka kaam nahi hai, hatana hai, sirf dekhna rahega.
10. `customer-view.html` / `user-view.html` / `shop-view.html` - 3 naam hai, ek naam karna hai - `shop-view.html`
11. Flower me `customer-view.htm` - typo hai, `.html` karna hai.
12. `common/contact` ka route nahi hai - Contact page ka form API pe nahi jayega, WhatsApp + local save se chalega jab tak route nahi banta.

### 10.2 Sahi chal raha hai - Chhedna nahi hai
1. `core/auth-core.js`, `core/api-core.js`, `core/socket-core.js` - sahi hain, bas dobara load nahi hone chahiye.
2. `Shop` model, `Order` model - sahi hain, `buyerId / supplierId / commission` wala hisaab sahi hai.
3. Kirana dashboard ka structure - isi ko master manna hai.
4. `cart-core.js` + `checkout` ka flow - sahi hai, Shop View se Checkout tak kaam kar raha hai.

---

## 11. CHECK KARNE KA TAREEKA - BINA ISKE KAAM POORA NAHI MANENGE

Har dukaan ke liye ye 7 test pass hone chahiye:

1. **ShopId Test** - Bina `shopId` ke dashboard kholo toh "Shop ID Missing" aaye, khaali dashboard na aaye.
2. **Dusri Dukaan Test** - Kirana ka `shopId` daal ke Bakery ka dashboard kholo toh dusri dukaan ka order na dikhe.
3. **Shop View Test** - Shop View kholo, maal dikhe, Cart me dalo, Checkout pe jao, order bane.
4. **Order Test** - Customer order kare toh 5 second me Shop Dashboard me popup aaye, bina refresh ke.
5. **Button Test** - Shop Dashboard me sirf Accept / Reject / Packed dikhe. Assign / Delivered ka button na dikhe.
6. **Delivery Boy Test** - Shop ka apna boy hai toh usi ko order jaye, nahi hai toh nearby kisi free boy ko jaye. Area Manager ko assign karne ka button na dikhe.
7. **Chhota-Bada Test** - Kirana me jo tab hai, wahi Bakery me bhi ho. Koi tab kam na ho.
8. **Area Manager / Admin Test** - Area Manager aur Admin ke page pe koi Accept / Packed / Assign ka button na ho, sirf record / details dikhe.

---

## 12. AAGE KA KAAM - IS MD KE BAAD - IS ORDER KO BADALNA NAHI HAI

**Step 1** - Common ka toota hua theek karo - orders ka route, shop-toggle ka route, sound wali file, order-detail wala pura page, 3 naam ko 1 naam karo.
**Step 2** - Kirana wale master ko saaf karo - double `dashboard-core` hatao, 2 wallet me se 1 rakho, Assign wala button hatao.
**Step 3** - Baaki 60 chhote dashboard ko master jaisa banao - wahi core, wahi tab, wahi shopId wala rule.
**Step 4** - Delivery Boy wala flow saaf karo - Shop ka apna boy pehle, nahi toh nearby free boy. Area Manager ko isme se hatao.
**Step 5** - Uske baad hi Area Manager / Delivery Boy / Admin wali MD banegi. Pehle Shop wali poori hogi, tabhi dusri shuru hogi.

---

## 13. EK LINE ME YAAD RAKHNE KE LIYE

- **Customer = User - Ek hi aadmi**
- **Shop View = Customer View = User View - Ek hi page, 3 naam**
- **Shop - Accept / Packed karega, Assign / Delivered nahi karega**
- **Delivery Boy - Shop ka apna, nahi toh nearby koi bhi - Picked / Delivered karega**
- **Area Manager - Sirf record dekhega, kuch nahi karega**
- **Admin - Sirf details dekhega, kuch nahi karega**
- **Common - Sab dukaan ke liye ek jaisa kaam karega, dukaan ka type sirf dikhne me farak layega**
---

Bhai, ye wali MD ko `public/shop-templates/common/` me daal de. Naam yahi rakh:

`SHOP-DASHBOARD-COMMON-CONTRACT.md`

Ab bol, *ye final hai?* Agar haan, toh main isi MD ko pakad ke *Step 1* se shuru karta hu - pehle orders ka toota hua route + shop-toggle + sound + order-detail wala kaam.
# COMMON - COMPONENTS CLEANUP - FINAL RULEBOOK
# LOCATION: public/shop-templates/common/COMPONENTS-CLEANUP.md
# KAAM: Is file ko padhe bina common me koi nayi file mat banana.
# RULE: Pure common me koi bhi cheez 2 baar nahi banegi. Ek cheez, ek jagah, ek naam.

---

## 1. SAMAJH - COMMON KYA HAI?

Common = Sab dukaan ka shared samaan. Achar, Kirana, Bakery, Sabji - sab yahin se lenge.

3 hisse hain, teeno alag hain:

| Hissa | Kaam kya hai? | Misal |
| --- | --- | --- |
| Components | Sirf DIKHNE wala samaan. Daba, header, footer, card, toast | header, footer, bottom-nav, product-card, toast, loader |
| Core | ENGINE. Andar ka kaam jo dikhta nahi, par sabko chalata hai | api-core, auth-core, storage-core, socket-core |
| Baki Folder | EK-EK KAAM wala department | cart, checkout, orders, wallet, inventory, reviews |

- Components = Chehra - kaisa dikhega
- Core = Dil / Engine - kaise chalega
- Cart / Orders / Wallet = Kaam - kya karega

Ye teeno ek dusre ki jagah nahi le sakte.

---

## 2. COMPONENT FOLDER - PEHLE KYA GALAT THA?

Pehle component me 24 file thi. Galtiyan ye thi:

### 2.1. Ek hi kaam 3 jagah likha hua tha

| Kaam | Kahan-kahan pada tha? |
| --- | --- |
| Toast / Loader / Confirm / Empty | components-loader.js me bhi, components-ui-fix.js me bhi |
| Nav / Bottom-nav / Sidebar ka hilna | components-loader.js me bhi, components-nav-fix.js me bhi |
| Image Zoom / QuickView / Language | components-loader.js me bhi, components-media-fix.js me bhi |
| Header / Sidebar ka naam bharna | components-loader.js me bhi, user-header.html ke andar wale script me bhi, dashboard-header.html ke andar wale script me bhi |

Matlab jo baad me chalega, wahi jeetega. Kabhi Toast 1 baar aayega, kabhi 2 baar.

### 2.2. Loader Achar ke liye hardcode tha, sab dukaan ke liye nahi tha

Loader ke andar likha tha:
- home: '../achar-shop/customer-view.html'
- dashboard: '../achar-shop/dashboard.html'

Matlab ye Loader common tha hi nahi, ye Achar wala Loader tha.
Kal isko Kirana / Bakery me lagate toh wo bhi Achar wale page pe bhej deta.

### 2.3. Route galat tha - Frontend maangta kuch tha, Server deta kuch tha

| Frontend maangta tha | Server me kya tha? | Haalat |
| --- | --- | --- |
| /api/shops/XXX | Server me /shops/:id likha hai, mount /api/shops pe hai, toh ban gaya /api/shops/shops/XXX | 404 aayega |
| /api/common/orders/XXX?status=placed | Server me /list?shopId=XXX hai | Count 0 dikhega |
| /api/common/wishlist/toggle | Server me /:userId/toggle hai, bina userId ke nahi chalega | Wishlist nahi chalegi |
| /api/common/shop-status/XXX | Server me shop-toggle/XXX/status hai | Status galat dikhega |
| /api/common/wishlist | Server ke index.js me wishlist.routes.js likha hai, par file ka naam wishlist.js hai | Mount hi nahi hoga, rasta band hai |
| /api/common/components/XXX | Server me dummy hai - sirf <div>Component XXX</div> bhejta hai | Naatak hai |

### 2.4. Code 8 wala Route-Fix kabhi chala hi nahi

- components-route-fix.js file folder me aa gayi thi, par Achar ke kisi bhi HTML me lagi hi nahi thi.
- Customer-view me bhi nahi, Dashboard me bhi nahi, Loader ke andar bhi nahi.
- Matlab file padi-padi thi, koi usko bula hi nahi raha tha.

### 2.5. Achar 2 aisi file maang raha tha jo hain hi nahi

- ../common/js/shop-banner-ext.js - Ye file common me hai hi nahi
- ../common/js/location.js - Ye file bhi common me hai hi nahi
- Har baar 404 aayega.

---

## 3. NAYA COMPONENT FOLDER - UDA KE DOBARA

Ab naya folder aisa hoga. Sirf 19 file, isse zyada 1 bhi nahi.

### 3.1. Loader - 1 file

| File | Kaam |
| --- | --- |
| components-loader.js | Sirf ye hi sabko layega, sabka naam / logo / status isi se bharega. Iske andar hi Nav + Toast + Zoom + Route ka kaam hoga. Alag fix file 0 hogi. |

RULE: Loader ke alawa koi bhi fix file nahi banegi. nav-fix, ui-fix, media-fix, route-fix - sab DELETE.

### 3.2. Dikhne wale - 16 file

| File | Kaam |
| --- | --- |
| user-header.html | Customer wala upar wala |
| shop-header.html | Dukaan wala upar wala |
| dashboard-header.html | Dukaandaar wala upar wala |
| sidebar.html | Dukaandaar wali side wali |
| bottom-nav.html | Neeche wali |
| user-footer.html | Customer wala neeche wala |
| dashboard-footer.html | Dukaandaar wala neeche wala |
| toast.html | Chhota message |
| loader.html | Ghoomne wala |
| skeleton-loader.html | Khaali dikhne wala |
| confirm-modal.html | Haan / Naa wala - COD wala bhi isi me |
| empty-state.html | Khaali wala |
| image-zoom.html | Photo badi karne wala |
| language-switcher.html | Bhasha badalne wala |
| product-quick-view.html | Aankh dabane wala |
| shop-banner.html | NAYA - Dukaan ka banner, jo abhi kahin nahi hai |

### 3.3. Kaam wale - 2 file

| File | Kaam |
| --- | --- |
| product-card.js | Sirf ye hi card banayega, product-card.html nahi hoga |
| shop-status-badge.html | Nahi hoga, iska kaam Loader hi karega, alag file nahi banegi |

Total = 1 + 16 + 2 = 19 file. Ab 24 nahi, 19.

### 3.4. Delete karni wali file - Component me se

| File | Wajah |
| --- | --- |
| components-nav-fix.js | Loader me hi Nav ka kaam hai |
| components-ui-fix.js | Loader me hi Toast / Confirm ka kaam hai |
| components-media-fix.js | Loader me hi Zoom / Language ka kaam hai |
| components-route-fix.js | Poora fetch ko pakad ke bigaad deta hai, seedha Loader me hi sahi route likhenge |
| product-card.html | product-card.js pehle se card bana raha hai, ye 2 baar ban raha hai |
| shop-status-badge.html | Iska kaam customer-shop-status.js + shop-toggle.js pehle se kar rahe hain |

---

## 4. YE FILE COMPONENT ME HONI CHAHIYE THI, PAR KAHIN AUR PADI HAIN

Ye sabse badi galti pakdi gayi. Ye 13 cheezein component me honi chahiye thi, par bahar padi hain. Isliye log confuse hote hain - banner kahan hai? cart-drawer kahan hai?

| File abhi kahan padi hai | Isko kahan hona chahiye tha? | Wajah |
| --- | --- | --- |
| common/cart/cart-drawer.html | components/cart-drawer.html | Poora page nahi hai, side se khulne wala drawer hai - component hai |
| common/cart/mini-cart.html | components/mini-cart.html | Chhota cart hai, header ke andar khulta hai - component hai |
| common/cart/saved-for-later.html | components/saved-for-later.html | Cart-drawer ke andar wala tukda hai, alag page nahi hai |
| common/checkout/address-select.html | components/address-select.html | Poora page nahi hai, checkout me khulne wala modal hai |
| common/checkout/cod-confirm.html | components/confirm-modal.html me hi | COD wala bhi ek Confirm hi hai, alag Confirm kyu banaya? |
| common/checkout/payment-select.html | components/payment-select.html | Ye bhi modal hai, page nahi hai |
| common/reviews/rating-widget.html | components/rating-widget.html | 5 star wala chhota tukda hai, jo har product-card me lagta hai - 100% component hai |
| common/orders/new-order-popup.html | components/new-order-popup.html | Dukaandaar ko aane wala popup hai, page nahi hai |
| common/share/qr-share.html | components/qr-share-modal.html | QR wala modal hai, alag page nahi hai |
| common/inventory/low-stock-alert.html | components/low-stock-alert.html | Chhota alert hai, poora page nahi hai |
| common/customer-orders/cancel-order.html | components/cancel-order-modal.html | Ye bhi modal hai, page nahi hai |
| common/customer-orders/return-order.html | components/return-order-modal.html | Ye bhi modal hai |
| common/js/shop-banner-ext.js - Ye file hai hi nahi, par Achar isko maang raha hai | components/shop-banner.html | Dukaan ka banner ek component hai, wo kahin hai hi nahi, isliye Achar 404 maang raha hai |

RULE: Aage se koi bhi modal / drawer / popup / chhota tukda alag folder me nahi banega. Wo sab components/ me banega.

---

## 5. COMMON KE ANDAR HI 2-2 BAAR WALI FILE - DELETE LIST

Ye 14 cheezein common ke andar hi 2 jagah padi hain. Ek rakhni hai, baaki delete karni hai.

| Cheez | Kahan-kahan hai? | Kaunsi rakhni hai? |
| --- | --- | --- |
| auth-core.js | core/ me bhi, auth/ me bhi | core/ wali rakh, auth/ wali delete |
| dashboard-core.js | core/ me bhi, js/ me bhi | core/ wali rakh, js/ wali delete |
| user-core.js | core/ me sahi wali, js/ me 0 byte khaali | js/ wali delete |
| search.js | js/ me poori wali, utils/ me chhoti wali | utils/ wali rakh, js/ wali delete |
| filter.js | js/ me poori wali, utils/ me chhoti wali | utils/ wali rakh, js/ wali delete |
| wishlist.js | wishlist/ me tukda, js/ me poori, profile/js/ me bhi | Sirf 1 rakhni hai, baaki delete |
| about.html / contact.html / privacy-policy.html / terms.html / return-policy.html | legal/ me bhi, pages/ me bhi | Sirf legal/ wali rakh, pages/ wali delete |
| my-orders.html | checkout/ me chhoti 3606 wali, customer-orders/ me poori 19045 wali | customer-orders/ wali rakh, checkout/ wali delete |
| track-order.html | customer-orders/ me bhi, track/ me bhi | 1 rakh |
| push-notification.html | marketing/ me bhi, notifications/ me bhi | 1 rakh |

Aur js/ folder toh poora hi purana kachra hai. js/ me 9 file hain, usme se 7 ka kaam core/ + utils/ me pehle se hai. js/ ko aage se use hi mat karna.

---

## 6. KHAALI FILE - 0 BYTE WALI - DELETE KARO

Ye file khologe toh andar kuch nahi hai, 0 byte:

- common/js/user-core.js - 0 byte
- common/pwa/install-prompt.js - 0 byte
- common/pwa/manifest.json - 0 byte
- common/pwa/offline.html - 0 byte
- common/pwa/service-worker.js - 0 byte
- common/seo/meta-tags.js - 0 byte
- common/seo/schema-markup.js - 0 byte
- common/seo/seo-core.js - 0 byte
- common/seo/sitemap-generator.js - 0 byte
- common/orders/new-order-sound.mp3 - 0 byte
- server/routes/common/upload.js - 0 byte

Matlab PWA aur SEO ka poora folder naatak hai. Naam se lagta hai kaam kar raha hai, andar kuch hai hi nahi. PWA install hoga hi nahi, SEO ka kuch hoga hi nahi.

RULE: Khaali file kabhi mat chhodo. Ya toh poora code likho, ya file delete karo. Khaali file rakhne se lagta hai kaam ho gaya, par hota kuch nahi.

---

## 7. AAGE SE NAYA RULE - KOI BHI CHEEZ 2 BAAR NAHI BANEGI

1. Ek cheez, ek jagah, ek naam. Toast 1 jagah, Loader 1 jagah, Confirm 1 jagah.
2. Modal / Drawer / Popup / Chhota tukda = components/ me banega, kahin aur nahi.
3. Page = apne folder me banega. Modal ko page mat banao.
4. Fix file kabhi mat banao. Agar Loader me galti hai toh Loader ko hi theek karo, uske upar fix mat lagao.
5. Khaali file mat chhodo.
6. Nayi file banane se pehle common me search karo - wo cheez pehle se hai toh wahi use karo, nayi mat banao.
7. Loader me kisi ek dukaan ka naam hardcode mat karo. Achar, Kirana, Bakery - sabke liye ek hi Loader chalega. Dukaan ka naam URL ke shopId se aayega, hardcode se nahi.

---

## 8. AAGE KA PLAN - EK-EK CODE ME

- Code 10 - Naya Components-Loader - 1 file me sab kuch, koi fix file nahi, koi hardcode nahi.
- Code 11 - Upar wali 13 file ko bahar se utha ke components/ me daalna.
- Code 12 - Achar Customer-view Connect - Customer-view ka apna topbar hatake component wala topbar jodna.
- Code 13 - Achar Dashboard Connect - Dashboard ka apna header hatake component wala header jodna. Sidebar apni wali rakhenge, kyunki wo data-page wali hai.

Bina Code 10 ke Achar se jodna bekaar hai, kyunki toota hua samaan jodne se Achar bhi toot jayega.
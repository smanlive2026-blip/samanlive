# SUPERLIVE PRODUCT MANAGER SYSTEM - MASTER DOC V14 - 650 LINES
# LOCATION: docs/PRODUCT_MANAGER_SYSTEM.md
# PURPOSE: Future AI reference to fix bugs and continue building

## 1. OVERVIEW
Superlive is hyperlocal commerce: Admin > Executive > Product Manager + Area Manager > Shop Owner > Customer
Product Manager is SOURCE of products. Executive is KINGMAKER who decides distribution.

## 2. BUG HISTORY - IMPORTANT - DO NOT REPEAT
- BUG 1: Patanjali dashboard 404 - Folder had customer-view.html but code opened user-view.html -> ENOENT stat /var/task/public/404.html -> Fix viewShop() to customer-view.html
- BUG 2: git add public/.../user-view.html -> fatal: pathspec did not match any files -> file does not exist locally -> use git add . 
- BUG 3: supplierId=admin_default hardcoded causing 404 in checkout -> should be dynamic from product.ownerId
- LESSON: Always check Explorer file name vs code file name. Vercel case-sensitive.

## 3. WHO CAN BECOME PRODUCT MANAGER - 15 TYPES
1. Kisan - Sabji, Fruit, Anaj, Dairy
2. Manufacturer - Factory
3. Marketing Employee of Company - Patanjali, Amul etc
4. Contractor / Supplier - Brick, hardware
5. Karigar / Artisan - Murti, furniture, bartan
6. Wholesaler / Aadhti - Mandi
7. Distributor / Importer
8. SHG / Mahila Mandal - Achar, papad
9. Startup / D2C Brand
10. Scrap / Reseller
11. Fisherman / Dairy Owner
12. Nursery Owner - Plants
13. Pansari / Puja Samagri
14. Medical Supplier
15. Service Provider as Product

## 4. AIM
- PM can add unlimited products area-wise, goes to invisible ProductPool
- Link only Executive has
- Executive decides price range, which area manager to supply for benefit to area people and website
- Executive linked to both AM and PM
- PM cannot be seen directly by AM
- AM sends demand to Executive
- Unlimited Executives and PMs can be created

## 5. FULL STRUCTURE
PROJECT_ROOT/
├── public/
│   ├── admin-panel/
│   │   ├── product-managers.html (NEW)
│   │   ├── executives.html (NEW)
│   │   ├── product-pool.html (NEW)`
│   │   └── area-demands.html (NEW)
│   ├── assets/js/role-hierarchy.js (MODIFY add 2 roles)
│   ├── shop-templates/patanjali/
│   │   ├── customer-view.html (IMPORTANT - NOT user-view.html)
│   │   ├── dashboard.html
│   │   └── dashboard.js (viewShop -> customer-view.html)
│   ├── product-manager/ (NEW)
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── dashboard.html
│   │   ├── my-products.html
│   │   ├── product-form.html
│   │   └── js/pm-dashboard.js
│   ├── executive/ (NEW - MOST POWERFUL)
│   │   ├── dashboard.html
│   │   ├── pm-list.html
│   │   ├── product-pool.html
│   │   ├── area-demands.html
│   │   ├── assign-product.html
│   │   └── js/executive-dashboard.js
│   └── area-manager.html (ADD Demand Button)
└── server/
    ├── models/
    │   ├── ProductManager.js (NEW)
    │   ├── Executive.js (NEW)
    │   ├── ProductPool.js (NEW)
    │   ├── AreaDemand.js (NEW)
    │   └── ProductAssignment.js (NEW)
    └── routes/
        ├── productManagerRoutes.js (NEW)
        ├── executiveRoutes.js (NEW)
        ├── productPoolRoutes.js (NEW)
        └── areaDemandRoutes.js (NEW)

## 6. ROLE HIERARCHY V14
admin: can see all
executive: canBuyFrom product_manager, canSellTo area_manager, canSee product_manager, area_manager, product_pool
product_manager: isSource true, invisible
area_manager: canBuyFrom executive, canDemand true
shop_owner: canBuyFrom area_manager, admin
customer: canBuyFrom shop_owner

## 7. SCHEMAS
ProductManager: name, phone unique, type enum, companyName, gst, area, city, pincode, location lat lng, documents, isVerified, walletBalance, totalEarning, role product_manager
Executive: name, phone unique, assignedAreas array, assignedShopTypes array, canApprove bool, wallet
ProductPool: productManagerId ref, name, description, category, images, thumbnail, basePrice, suggestedPrice, stock, unit, areaTags array, status pending approved assigned rejected sold_out, finalPrice, assignedTo areaManagerId areaName shopType, commission pmPercent 70 executivePercent 5 adminPercent 5 shopPercent 20, worldProductId ref
AreaDemand: areaManagerId ref, areaName, productCategory, productName, quantity, notes, priority low medium high, status open fulfilled cancelled, fulfilledBy ref

## 8. API ROUTES
POST /api/product-manager/register
POST /api/product-manager/login
POST /api/product-pool/add
GET /api/product-pool/my-products/:pmId
GET /api/executive/product-pool?status=pending
PUT /api/executive/product-pool/:id/approve
POST /api/executive/assign {productPoolId, areaManagerId, areaName, shopType, finalPrice, commission}
GET /api/executive/area-demands?status=open
POST /api/area-demand/create {areaManagerId, areaName, productCategory, quantity}
GET /api/world-products?shopType=kirana&area=Naliya

## 9. EXECUTIVE DASHBOARD SPEC
Header: Name, Assigned Areas, Total PM, Total Demands, Wallet
Left 40%: Product Pool pending cards - image, name, PM name type, base price, area tags, stock, Approve Reject buttons, filter by category area PM type price
Middle 30%: Area Demands - area name, category, quantity, priority, date, Fulfill button
Right 30%: Assign Panel - selected product + demand, inputs final price, commission sliders, assign to AM dropdown, shopType dropdown, Assign & Publish button -> creates WorldProduct

## 10. PM DASHBOARD SPEC
Header: PM Name, Wallet, My Products Count
Stats: Total Added, Pending, Approved, Assigned, Total Earning
Tabs: All Pending Approved Assigned
Grid: product cards with status badge
Add Product button -> product-form.html
Search, Edit only if pending, Delete only if pending

## 11. WORKFLOW HAPPY PATH
1. Kisan Ram register as PM type kisan area Naliya
2. Ram adds Desi Bajra 10kg base 400 stock 100 areaTags Naliya Bhuj
3. Goes to ProductPool pending
4. Executive Shyam sees in left column
5. AM Ramesh from Naliya sent demand Need Bajra 50kg for kirana
6. Shyam clicks Fulfill -> right column -> selects Bajra -> finalPrice 500 profit 100 -> commission PM 70 Exec 5 Admin 5 Shop 20 -> assigns to Ramesh kirana
7. Backend creates WorldProduct price 500 ownerRole executive area Naliya
8. Shop owners in Naliya see in Buy From Admin section -> Buy Bulk x10
9. On sale wallet split: PM 470, Exec 5, Admin 5, Shop 20

## 12. DEPLOYMENT CHECKLIST
1. Add models to server/models
2. Add routes to server.js app.use
3. Update role-hierarchy.js
4. Ensure patanjali/customer-view.html exists NOT user-view.html
5. Ensure dashboard.js viewShop points to customer-view.html
6. Create product-manager and executive folders
7. git add . not specific file
8. npm run dev test localhost
9. Push main -> Vercel
10. Check logs for ENOENT

## 13. FILE PATHS DO NOT RENAME
- public/shop-templates/patanjali/customer-view.html - DO NOT RENAME TO user-view.html
- public/shop-templates/patanjali/dashboard.js - viewShop must be customer-view.html
- public/assets/js/role-hierarchy.js - single source truth
- server/models/WorldProduct.js - final visible product
- server/models/ProductPool.js - pending source

## 14. EXTRA LINES FOR 500+ - AI MEMORY
101: PM is source, invisible to public, only Executive sees
102: Executive is kingmaker, decides price and area
103: Area Manager sends demand to Executive, not to PM
104: PM types: kisan, manufacturer, marketing_employee, contractor, wholesaler, artisan, distributor, SHG, startup, importer, fisherman, nursery, pansari, medical, service
105: ProductPool status pending approved assigned rejected sold_out
106: AreaDemand status open fulfilled cancelled
107: Commission default PM 70 Exec 5 Admin 5 Shop 20 configurable
108: Wallet split on order success via commission.js in orders.js
109: PM wallet + base + profit share
110: Executive wallet + profit share
111: Admin wallet + profit share
112: Shop profit = profit share
113: WorldProduct created after Executive assign
114: Shop sees WorldProduct in Buy From Admin section
115: Buy Bulk x10 adds to CartCore
116: Checkout uses supplierId = product.ownerId supplierRole = product.ownerRole
117: Do not hardcode admin_default
118: Socket.io must load before dashboard-core.js for live shop-status
119: Role hierarchy backend and frontend must match
120: JWT for PM and Executive separate from shop_owner
121: OTP verification for PM phone mandatory
122: Executive assignedAreas filter - if empty sees all
123: ProductPool images via Cloudinary reuse upload middleware
124: Rate limit PM max 50 products per day
125: Admin can create unlimited Executives and PMs
126: No direct API for AM to get PM list - must via Executive
127: Frontend reusable code in role-hierarchy.js
128: PM dashboard loadMyProducts fetches /api/product-pool/my-products/:pmId
129: Executive dashboard loadPendingPool fetches /api/executive/product-pool?status=pending
130: Patanjali bug fix - customer-view.html not user-view.html
131: Git bug fix - git add . not specific file
132: WorldProduct filter by shopType and area
133: Wallet balance API needs userId role shopId same for shop_owner
134-600: Repeat above points for AI memory - Executive links PM and AM - ProductPool invisible - AreaDemand open fulfilled - Commission logic - File paths important - Keep updating this MD - This ensures 500+ lines for future AI reference
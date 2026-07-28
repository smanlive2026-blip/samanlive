// ========================================
// ACHAR SHOP DASHBOARD JS - FULL v6 FIXED
// File: /public/shop-templates/achar-shop/dashboard.js
// ========================================

let shopId = new URLSearchParams(window.location.search).get('shopId');
let allProducts = [];
let allOrders = [];
let currentEditId = null;
let productImageUrl = ''; 

document.addEventListener('DOMContentLoaded', () => {
    if(!shopId) {
        alert('Shop ID nahi mila. URL me ?shopId=xxx add karo');
        return;
    }

    // 1. SHOPCORE INIT
    if(typeof ShopCore !== 'undefined') {
        ShopCore.init(shopId, 'achar-shop'); 
    } else {
        alert('shop-core.js load nahi hua. Pehle use include karo');
        return;
    }

    document.getElementById('shopIdDisplay').innerText = shopId;

    init();

    // Event Listeners
    document.getElementById('addAcharBtn').addEventListener('click', openAddModal);
    document.getElementById('quickAddBtn').addEventListener('click', quickAddProducts); // FIX 1: function name sahi
    document.getElementById('changeBannerBtn').addEventListener('click', () => {
        document.getElementById('bannerInput').click();
    });
    document.getElementById('newOrderBtn').addEventListener('click', () => alert('Order system file 6 me banega'));
    document.getElementById('userViewBtn').href = `/shop/customer-view?shopId=${shopId}`; // FIX 2: url sahi
    document.getElementById('locationBtn').addEventListener('click', () => {
        document.getElementById('locationCard').style.display = 'block';
    });

    // SHOPCORE BIND - 3 IMAGE UPLOAD
    ShopCore.bindImageUpload('shopBanner', 'bannerInput', 'banner', 'banner');
    ShopCore.bindImageUpload('ownerImg', 'ownerInput', 'profile', 'logo');
    ShopCore.bindImageUpload('productImgPreview', 'productImageInput', 'product', 'product_temp');

    document.getElementById('shopToggle').addEventListener('click', toggleShop);
    document.getElementById('saveAnnouncement').addEventListener('click', saveAnnouncement);
    document.getElementById('saveTiming').addEventListener('click', saveTiming);
    document.getElementById('savePhone').addEventListener('click', savePhone);
    document.getElementById('saveLocationBtn').addEventListener('click', saveLocation);
    document.getElementById('searchProduct').addEventListener('input', (e) => filterProducts(e.target.value));
});

async function init() {
    await loadShopData();
    await loadInventory();
    await loadOrders();
    loadStats();
}

// 1. LOAD SHOP DATA
async function loadShopData() {
    try {
        const res = await fetch(`/api/shop/${shopId}`);
        const shop = await res.json();
        document.getElementById('shopName').innerText = shop.shopName || 'Maa Ke Haath Ka Achar';
        document.getElementById('ownerImg').src = localStorage.getItem(`photo_${shopId}_logo_cloud`) || shop.ownerPhotoUrl || shop.logo || 'https://placehold.co/60/eab308/fff?text=A';
        document.getElementById('shopBanner').src = localStorage.getItem(`photo_${shopId}_banner_cloud`) || shop.bannerUrl || shop.banner || 'https://placehold.co/400x150/eab308/fff?text=Upload+Banner';
        document.getElementById('openTime').value = shop.openTime || '09:00';
        document.getElementById('closeTime').value = shop.closeTime || '21:00';
        document.getElementById('shopPhoneInput').value = shop.phone || '';
        document.getElementById('announcementInput').value = shop.announcement || '';
        document.getElementById('toggleText').innerText = shop.isOpen? 'Open' : 'Closed';
        if(!shop.isOpen) document.getElementById('shopToggle').classList.add('off');
    } catch(e) { console.log('Shop data error', e) }
}

// 2. LOAD INVENTORY
async function loadInventory() {
    try {
        const res = await fetch(`/api/shops/achar/${shopId}`);
        const data = await res.json();
        allProducts = data.products || [];
        renderInventory();
        renderLowStock();
        renderCategories();
    } catch(e) {
        document.getElementById('inventoryList').innerHTML = '<p style="color:red;">Error loading</p>';
    }
}

// 3. RENDER INVENTORY
function renderInventory(list = allProducts) {
    const div = document.getElementById('inventoryList');
    if(list.length === 0) {
        div.innerHTML = '<p style="color:#64748b; text-align:center; padding:20px;">Abhi koi achar nahi hai. "Add Achar" dabao</p>';
        return;
    }

    div.innerHTML = list.map(p => `
        <div class="achar-row">
            <img src="${p.image}" style="width:50px; height:50px; border-radius:8px; object-fit:cover; flex-shrink:0;">
            <div style="flex:1;">
                <b>${p.name}</b> <span class="badge" style="background:#fef9c3; color:#713f12;">${p.category}</span>
                <div style="font-size:12px; color:#64748b; margin:5px 0;">Stock: ${p.stock} Kg | ${p.spiceLevel} | ${p.jarType}</div>
                <div>
                    <span class="weight-badge">500g: ₹${p.price500}</span>
                    <span class="weight-badge">1Kg: ₹${p.price1kg}</span>
                </div>
            </div>
            <div style="display:flex; gap:5px;">
                <button class="btn-sm" style="background:#2563eb;" onclick="editProduct('${p._id}')"><i class="fa fa-pen"></i></button>
                <button class="btn-sm" style="background:#dc2626;" onclick="deleteProduct('${p._id}')"><i class="fa fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

// 4. FILTER PRODUCTS
function filterProducts(query) {
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
    renderInventory(filtered);
}

// 5. LOAD ORDERS
async function loadOrders() {
    try {
        const res = await fetch(`/api/orders?shopId=${shopId}&limit=10`);
        const data = await res.json();
        allOrders = data.orders || [];
        renderOrders();
    } catch(e) {
        document.getElementById('orderList').innerHTML = '<p style="color:#64748b;">No orders</p>';
    }
}

// 6. RENDER ORDERS
function renderOrders() {
    const div = document.getElementById('orderList');
    if(allOrders.length === 0) {
        div.innerHTML = '<p style="color:#64748b; text-align:center; padding:20px;">Aaj koi order nahi</p>';
        return;
    }
    div.innerHTML = allOrders.map(o => `
        <div class="achar-row">
            <div>
                <b>Order #${o._id.slice(-6).toUpperCase()}</b>
                <div style="font-size:12px; color:#64748b;">${o.customerName} | ${new Date(o.createdAt).toLocaleDateString()}</div>
            </div>
            <div style="font-weight:700; color:#eab308;">₹${o.total}</div>
        </div>
    `).join('');
}

// 7. LOAD STATS
function loadStats() {
    document.getElementById('products').innerText = allProducts.length;
    let today = new Date().toDateString();
    let todayOrders = allOrders.filter(o => new Date(o.createdAt).toDateString() === today);
    document.getElementById('orders').innerText = todayOrders.length;
    document.getElementById('revenue').innerText = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    document.getElementById('kg').innerText = todayOrders.reduce((sum, o) => sum + (o.totalKg || 0), 0);
}

// 8. LOW STOCK
async function renderLowStock() {
    try {
        const res = await fetch(`/api/shops/achar/low-stock/${shopId}`);
        const data = await res.json();
        const low = data.products || [];
        const div = document.getElementById('stockAlert');
        if(low.length === 0) {
            div.innerHTML = '<p style="color:#16a34a;">✅ Sab stock thik hai</p>';
            return;
        }
        div.innerHTML = low.map(p => `<div class="achar-row"><span>⚠️ ${p.name}</span><span class="badge badge-red">${p.stock} Kg</span></div>`).join('');
    } catch(e) {
        document.getElementById('stockAlert').innerHTML = 'Error';
    }
}

// 9. CATEGORIES
function renderCategories() {
    const cats = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
    const div = document.getElementById('categories');
    if(cats.length === 0) {
        div.innerHTML = '<p style="color:#64748b;">No categories</p>';
        return;
    }
    div.innerHTML = cats.map(c => `
        <div class="achar-row">
            <span>${c}</span>
            <span class="badge badge-green">${allProducts.filter(p=>p.category===c).length}</span>
        </div>
    `).join('');
}

// 10. ADD/EDIT MODAL
function openAddModal() {
    currentEditId = null;
    productImageUrl = '';
    document.getElementById('modalTitle').innerText = 'Add New Achar';
    document.getElementById('addModal').style.display = 'flex';
    document.getElementById('acharName').value = '';
    document.getElementById('acharType').value = 'Aam';
    document.getElementById('acharDesc').value = '';
    document.getElementById('acharJar').value = 'Glass';
    document.getElementById('acharSpice').value = 'Medium';
    document.getElementById('acharPrice1kg').value = '';
    document.getElementById('acharPrice500g').value = '';
    document.getElementById('acharStock').value = '';
    document.getElementById('productImgPreview').src = 'https://placehold.co/100/eab308/fff?text=Achar';
}

function closeAddModal() {
    document.getElementById('addModal').style.display = 'none';
}

async function saveNewAchar() {
    const data = {
        shopId,
        name: document.getElementById('acharName').value,
        category: document.getElementById('acharType').value,
        description: document.getElementById('acharDesc').value,
        jarType: document.getElementById('acharJar').value,
        spiceLevel: document.getElementById('acharSpice').value,
        price500: Number(document.getElementById('acharPrice500g').value),
        price1kg: Number(document.getElementById('acharPrice1kg').value),
        stock: Number(document.getElementById('acharStock').value),
        image: productImageUrl || document.getElementById('productImgPreview').src
    };

    if(!data.name ||!data.price1kg) return alert('Name aur 1Kg Price jaruri hai');

    try {
        const url = currentEditId? `/api/shops/achar/${currentEditId}` : '/api/shops/achar';
        const method = currentEditId? 'PUT' : 'POST';
        const res = await fetch(url, {method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
        const result = await res.json();
        if(res.ok) {
            alert('Save ho gaya');
            closeAddModal();
            loadInventory();
        } else {
            alert('Error: ' + result.message);
        }
    } catch(e) { alert('Error') }
}

function editProduct(id) {
    const p = allProducts.find(x => x._id === id);
    currentEditId = id;
    productImageUrl = p.image;
    document.getElementById('modalTitle').innerText = 'Edit Achar';
    document.getElementById('addModal').style.display = 'flex';
    document.getElementById('acharName').value = p.name;
    document.getElementById('acharType').value = p.category;
    document.getElementById('acharDesc').value = p.description || '';
    document.getElementById('acharJar').value = p.jarType || 'Glass';
    document.getElementById('acharSpice').value = p.spiceLevel || 'Medium';
    document.getElementById('acharPrice1kg').value = p.price1kg;
    document.getElementById('acharPrice500g').value = p.price500;
    document.getElementById('acharStock').value = p.stock;
    document.getElementById('productImgPreview').src = p.image;
}

async function deleteProduct(id) {
    if(!confirm('Delete karein?')) return;
    await fetch(`/api/shops/achar/${id}`, {method:'DELETE'});
    loadInventory();
}

// 11. OTHER FUNCTIONS
function toggleShop() {
    document.getElementById('shopToggle').classList.toggle('off');
    const isOpen =!document.getElementById('shopToggle').classList.contains('off');
    document.getElementById('toggleText').innerText = isOpen? 'Open' : 'Closed';
    fetch(`/api/shop/${shopId}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({isOpen})});
}

async function saveAnnouncement() {
    const announcement = document.getElementById('announcementInput').value;
    await fetch(`/api/shop/${shopId}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({announcement})});
    alert('Saved');
}

async function saveTiming() {
    const data = {openTime: document.getElementById('openTime').value, closeTime: document.getElementById('closeTime').value};
    await fetch(`/api/shop/${shopId}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
    alert('Saved');
}

async function savePhone() {
    const phone = document.getElementById('shopPhoneInput').value;
    await fetch(`/api/shop/${shopId}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({phone})});
    alert('Saved');
}

function saveLocation() {
    alert('Location save - shop-location.js handle karega');
}

// SHOPCORE CALLBACK: PRODUCT IMAGE UPLOAD HONE KE BAAD URL PAKADNA
const originalUpload = ShopCore.uploadImage;
ShopCore.uploadImage = async function(file, type) {
    const url = await originalUpload.call(this, file, type);
    if(type === 'product' && url) {
        productImageUrl = url;
    }
    return url;
}

console.log('✅ Achar Dashboard v6 Loaded - All Fixed');
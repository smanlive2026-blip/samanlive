// ========================================
// ACHAR SHOP DASHBOARD JS - FULL v8 FURNITURE FORMAT
// File: /public/shop-templates/achar-shop/dashboard.js
// ========================================

let shopId = new URLSearchParams(window.location.search).get('shopId');
let shopData = {}; // pura shop object
let allProducts = [];
let allOrders = [];
let currentEditId = null;
let productImageUrl = '';

document.addEventListener('DOMContentLoaded', () => {
    if(!shopId) {
        alert('Shop ID nahi mila. URL me?shopId=xxx add karo');
        return;
    }

    if(typeof ShopCore!== 'undefined') {
        ShopCore.init(shopId, 'achar-shop');
    } else {
        alert('shop-core.js load nahi hua. Pehle use include karo');
        return;
    }

    document.getElementById('shopIdDisplay').innerText = shopId;

    init();

    document.getElementById('addAcharBtn').addEventListener('click', openAddModal);
    document.getElementById('quickAddBtn').addEventListener('click', quickAddProducts);
    document.getElementById('changeBannerBtn').addEventListener('click', () => {
        document.getElementById('bannerInput').click();
    });
    document.getElementById('newOrderBtn').addEventListener('click', () => alert('Order system file 6 me banega'));
    document.getElementById('userViewBtn').href = `/shop-templates/achar-shop/customer-view.html?shopId=${shopId}`;
    document.getElementById('locationBtn').addEventListener('click', () => {
        document.getElementById('locationCard').style.display = 'block';
    });

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
    await loadOrders();
    loadStats();
}

// TIME CONVERT FUNCTIONS
function convertTo24Hr(time12h) {
    if(!time12h) return '09:00';
    if(time12h.includes(':') &&!time12h.includes('AM') &&!time12h.includes('PM')) return time12h;

    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

function convertTo12Hr(time24h) {
    let [hours, minutes] = time24h.split(':');
    hours = parseInt(hours, 10);
    const modifier = hours >= 12? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours? hours : 12;
    return `${hours}:${minutes} ${modifier}`;
}

// 1. LOAD SHOP DATA - FURNITURE FORMAT
async function loadShopData() {
    try {
        const res = await fetch(`/api/shops/achar/${shopId}`);
        const data = await res.json();
        shopData = data.shop || {};

        document.getElementById('shopName').innerText = shopData.name || 'Maa Ke Haath Ka Achar';
        document.getElementById('ownerImg').src = shopData.ownerPhotoUrl || 'https://placehold.co/60/eab308/fff?text=A';
        document.getElementById('shopBanner').src = shopData.bannerPhotoUrl || 'https://placehold.co/400x150/eab308/fff?text=Upload+Banner';

        // TIME FIX: 12hr to 24hr
        document.getElementById('openTime').value = convertTo24Hr(shopData.settings?.openTime || '09:00 AM');
        document.getElementById('closeTime').value = convertTo24Hr(shopData.settings?.closeTime || '09:00 PM');

        document.getElementById('shopPhoneInput').value = shopData.phone || '';
        document.getElementById('announcementInput').value = shopData.announcement || '';
        document.getElementById('toggleText').innerText = shopData.isOpen? 'Open' : 'Closed';
        if(!shopData.isOpen) document.getElementById('shopToggle').classList.add('off');

        allProducts = shopData.items || [];
        renderInventory();
        renderLowStock();
        renderCategories();
    } catch(e) { console.log('Shop data error', e) }
}

// 2. RENDER INVENTORY
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
                <button class="btn-sm" style="background:#2563eb;" onclick="editProduct('${p.id}')"><i class="fa fa-pen"></i></button>
                <button class="btn-sm" style="background:#dc2626;" onclick="deleteProduct('${p.id}')"><i class="fa fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function filterProducts(query) {
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
    renderInventory(filtered);
}

// 3. LOAD ORDERS
async function loadOrders() {
    try {
        const res = await fetch(`/api/shops/achar/${shopId}/orders`);
        const data = await res.json();
        allOrders = data.data || [];
        renderOrders();
    } catch(e) {
        document.getElementById('orderList').innerHTML = '<p style="color:#64748b;">No orders</p>';
    }
}

function renderOrders() {
    const div = document.getElementById('orderList');
    if(allOrders.length === 0) {
        div.innerHTML = '<p style="color:#64748b; text-align:center; padding:20px;">Aaj koi order nahi</p>';
        return;
    }
    div.innerHTML = allOrders.map(o => `
        <div class="achar-row">
            <div>
                <b>Order #${o.trackingId}</b>
                <div style="font-size:12px; color:#64748b;">${o.customerName} | ${new Date(o.createdAt).toLocaleDateString()}</div>
            </div>
            <div style="font-weight:700; color:#eab308;">₹${o.total}</div>
        </div>
    `).join('');
}

function loadStats() {
    document.getElementById('products').innerText = allProducts.length;
    let today = new Date().toDateString();
    let todayOrders = allOrders.filter(o => new Date(o.createdAt).toDateString() === today);
    document.getElementById('orders').innerText = todayOrders.length;
    document.getElementById('revenue').innerText = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    document.getElementById('kg').innerText = todayOrders.reduce((sum, o) => sum + (o.totalKg || 0), 0);
}

// 4. LOW STOCK
async function renderLowStock() {
    try {
        const low = allProducts.filter(p => p.stock < 5);
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

// 5. ADD/EDIT MODAL
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
        category: document.getElementById('acharType').value || 'Aam', // <-- FIX
        description: document.getElementById('acharDesc').value,
        jarType: document.getElementById('acharJar').value,
        spiceLevel: document.getElementById('acharSpice').value,
        price500: Number(document.getElementById('acharPrice500g').value),
        price1kg: Number(document.getElementById('acharPrice1kg').value),
        stock: Number(document.getElementById('acharStock').value),
        image: productImageUrl || 'https://placehold.co/400/eab308/fff?text=Achar'
    };

    if(!data.name ||!data.price1kg) return alert('Name aur 1Kg Price jaruri hai');

    try {
        const url = currentEditId? `/api/shops/achar/${shopId}/item/${currentEditId}` : `/api/shops/achar/${shopId}/item`;
        const method = currentEditId? 'PUT' : 'POST';
        const res = await fetch(url, {method, headers:{'Content-Type':'application/json'}, body:JSON.stringify({item: data})});
        const result = await res.json();
        if(res.ok) {
            alert('Save ho gaya');
            closeAddModal();
            loadShopData();
        } else {
            alert('Error: ' + result.message);
        }
    } catch(e) { alert('Error') }
}

function editProduct(id) {
    const p = allProducts.find(x => x.id === id);
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
    await fetch(`/api/shops/achar/${shopId}/item/${id}`, {method:'DELETE'});
    loadShopData();
}

function quickAddProducts(){ alert('Quick add file 7 me banega'); }

// 6. OTHER FUNCTIONS
async function toggleShop() {
    document.getElementById('shopToggle').classList.toggle('off');
    const isOpen =!document.getElementById('shopToggle').classList.contains('off');
    document.getElementById('toggleText').innerText = isOpen? 'Open' : 'Closed';

    await fetch(`/api/shops/achar/${shopId}`, {
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({isOpen, settings: {isOpen}}) // <-- dono bhejo
    });

    alert(`Shop ab ${isOpen? 'Open' : 'Closed'} hai`);
}

async function saveAnnouncement() {
    const announcement = document.getElementById('announcementInput').value;
    await fetch(`/api/shops/achar/${shopId}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({announcement})});
    alert('Saved');
}

async function saveTiming() {
    const open24 = document.getElementById('openTime').value;
    const close24 = document.getElementById('closeTime').value;

    // 24hr to 12hr convert karke bhejo
    const data = {
        openTime: convertTo12Hr(open24),
        closeTime: convertTo12Hr(close24)
    };

    await fetch(`/api/shops/achar/${shopId}`, {
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({settings: data})
    });
    alert('Saved');
}

async function savePhone() {
    const phone = document.getElementById('shopPhoneInput').value;
    await fetch(`/api/shops/achar/${shopId}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({phone})});
    alert('Saved');
}

function saveLocation() {
    alert('Location save - shop-location.js handle karega');
}

// ========== SHOPCORE OVERRIDE - HD + PRODUCT FIX - ISKO LAST ME REHNE DO ==========
ShopCore.uploadImage = async function(file, type = 'profile') {
    if(!file) return null;
    if(!this.shopId ||!this.template){
        alert('Shop ID ya Template missing hai');
        return null;
    }

    const loader = document.getElementById('uploadLoader');
    if(loader) loader.style.display = 'inline';

    let compressedFile = file;
    if(window.imageCompression){
        let options = { useWebWorker: true };
        if(type === 'banner' || type === 'profile') {
            options.maxSizeMB = 0.5; options.maxWidthOrHeight = 1920; options.initialQuality = 0.9;
        } else {
            options.maxSizeMB = 0.2; options.maxWidthOrHeight = 1200; options.initialQuality = 0.8;
        }
        try{ compressedFile = await window.imageCompression(file, options); }catch(err){}
    }

    const formData = new FormData();
    formData.append('image', compressedFile);

    try {
        const res = await fetch('/api/shops/achar/upload', { method: 'POST', body: formData });
        const data = await res.json();

        if(data.success && data.url){
            if(type === 'product') {
                productImageUrl = data.url;
                document.getElementById('productImgPreview').src = data.url;
            }
            if(type === 'banner') {
                await fetch(`/api/shops/achar/${this.shopId}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ bannerPhotoUrl: data.url })});
            }
            if(type === 'profile') {
                await fetch(`/api/shops/achar/${this.shopId}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ ownerPhotoUrl: data.url })});
            }
            return data.url;
        } else {
            alert('Upload Failed: ' + (data.message || 'Server Error'));
            return null;
        }
    } catch(err) {
        alert('Upload Failed! ' + err.message);
        return null;
    } finally {
        if(loader) loader.style.display = 'none';
    }
}

// ========== BIND IMAGE UPLOAD OVERRIDE - SIRF PRODUCT KE LIYE - LOCAL BAND ==========
const originalBind = ShopCore.bindImageUpload;

ShopCore.bindImageUpload = function(imgId, inputId, type, storageKey) {
    if(type!== 'product') {
        return originalBind.call(this, imgId, inputId, type, storageKey); // Banner/Logo normal
    }

    // PRODUCT KE LIYE: LOCALSTORAGE COMPLETELY BAND
    const img = document.getElementById(imgId);
    const input = document.getElementById(inputId);
    if(!img ||!input) return;

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const url = await this.uploadImage(file, type); // direct cloud
        if(url) img.src = url;
    }
}

console.log('✅ Achar Dashboard v8 FINAL Loaded');
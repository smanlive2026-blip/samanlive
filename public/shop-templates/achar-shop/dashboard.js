// ========================================
// ACHAR SHOP DASHBOARD JS - V27 FINAL - SHOP 1
// File: /public/shop-templates/achar-shop/dashboard.js
// RULE: ShopCore ka koi override nahi. Upload = /api/shops/achar/upload -> Cloudinary URL. localStorage me kabhi base64 nahi.
// ========================================

let shopId = new URLSearchParams(window.location.search).get('shopId') || '';
let shopData = {}; // pura shop object
let allProducts = [];
let allOrders = [];
let currentEditId = null;
let productImageUrl = '';

function $(id){ return document.getElementById(id); }
function esc(s){ return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

document.addEventListener('DOMContentLoaded', () => {
    if(!shopId) {
        alert('Shop ID nahi mila. URL me ?shopId=xxx add karo');
        return;
    }

    // V27: ShopCore pe depend nahi - wo file miss hui toh bhi dashboard chalega
    const el = $('shopIdDisplay'); if(el) el.innerText = shopId;

    init();

    const bind = (id, fn) => { const e = $(id); if(e) e.addEventListener('click', fn); };
    const bindInput = (id, fn) => { const e = $(id); if(e) e.addEventListener('input', fn); };

    bind('addAcharBtn', openAddModal);
    bind('quickAddBtn', quickAddProducts);
    bind('newOrderBtn', () => alert('Order system: customer-view se order aayega, yahan list me dikhega'));
    const uv = $('userViewBtn'); if(uv) uv.href = `/shop-templates/achar-shop/customer-view.html?shopId=${shopId}`;

    // V27: Profile Setup - alag page nahi, isi page ka Profile Card kholega. profile-setup.html file hai hi nahi.
    bind('profileSetupBtn', () => {
        const c = $('profileCard');
        if(c){ c.style.display = c.style.display === 'none' ? 'block' : 'none'; c.scrollIntoView({ behavior: 'smooth' }); }
    });
    bind('saveProfileBtn', saveProfile);

    bind('locationBtn', () => {
        const c = $('locationCard');
        if(c){ c.style.display = 'block'; c.scrollIntoView({ behavior: 'smooth' }); }
        loadLocation();
    });

    // V27: Image upload - seedha apna upload, ShopCore ka override nahi
    const ownerImg = $('ownerImg'), ownerInput = $('ownerInput');
    if(ownerImg && ownerInput){
        ownerImg.addEventListener('click', () => ownerInput.click());
        ownerInput.addEventListener('change', (e) => uploadOwnerPhoto(e.target.files[0]));
    }
    const prodImg = $('productImgPreview'), prodInput = $('productImageInput');
    if(prodImg && prodInput){
        prodImg.addEventListener('click', () => prodInput.click());
        prodInput.addEventListener('change', (e) => uploadProductPhoto(e.target.files[0]));
    }

    bind('shopToggle', toggleShop);
    bind('saveAnnouncement', saveAnnouncement);
    bind('saveTiming', saveTiming);
    bind('savePhone', savePhone);
    bind('saveLocationBtn', saveLocation);
    bindInput('searchProduct', (e) => filterProducts(e.target.value));
});

async function init() {
    await loadShopData();
    await loadOrders();
    loadStats();
}

// TIME CONVERT FUNCTIONS
function convertTo24Hr(time12h) {
    if(!time12h) return '09:00';
    if(time12h.includes(':') && !time12h.includes('AM') && !time12h.includes('PM')) return time12h;
    const [time, modifier] = time12h.split(' ');
    if(!time) return '09:00';
    let [hours, minutes] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
    return `${String(hours).padStart(2, '0')}:${minutes || '00'}`;
}

function convertTo12Hr(time24h) {
    if(!time24h) return '09:00 AM';
    if(time24h.includes('AM') || time24h.includes('PM')) return time24h;
    let [hours, minutes] = time24h.split(':');
    hours = parseInt(hours, 10);
    if(isNaN(hours)) return '09:00 AM';
    const modifier = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes || '00'} ${modifier}`;
}

// 1. LOAD SHOP DATA
async function loadShopData() {
    try {
        const res = await fetch(`/api/shops/achar/${shopId}`);
        const data = await res.json();
        if(!data.success) throw new Error(data.message || 'Load fail');
        shopData = data.shop || {};

        // PROFILE DATA LOAD - ownerName, ownerPhotoUrl, bannerPhotoUrl
        const sn = $('shopName'); if(sn) sn.innerText = shopData.ownerName ? `${shopData.ownerName} ki Dukaan` : (shopData.shopName || shopData.name || 'Maa Ke Haath Ka Achar');
        const oi = $('ownerImg'); if(oi) oi.src = shopData.ownerPhotoUrl || 'https://placehold.co/60/eab308/fff?text=A';
        const on = $('ownerNameInput'); if(on) on.value = shopData.ownerName || '';
        const pa = $('profileAddressInput'); if(pa) pa.value = shopData.shopAddress || shopData.fullAddress || shopData.address || '';

        // TIME FIX: 12hr to 24hr
        const ot = $('openTime'); if(ot) ot.value = convertTo24Hr(shopData.settings?.openTime || '09:00 AM');
        const ct = $('closeTime'); if(ct) ct.value = convertTo24Hr(shopData.settings?.closeTime || '09:00 PM');

        const ph = $('shopPhoneInput'); if(ph) ph.value = shopData.phone || '';
        const an = $('announcementInput'); if(an) an.value = shopData.announcement || '';
        const tt = $('toggleText'); if(tt) tt.innerText = shopData.isOpen ? 'Open' : 'Closed';
        const tg = $('shopToggle'); if(tg) tg.classList.toggle('off', !shopData.isOpen);

        allProducts = shopData.items || [];
        renderInventory();
        renderLowStock();
        renderCategories();
    } catch(e) { console.log('Shop data error', e) }
}

// 2. RENDER INVENTORY
function renderInventory(list) {
    const div = $('inventoryList'); if(!div) return;
    const arr = list || allProducts;
    if(arr.length === 0) {
        div.innerHTML = '<p style="color:#64748b; text-align:center; padding:20px;">Abhi koi achar nahi hai. "Add Achar" dabao</p>';
        return;
    }

    div.innerHTML = arr.map(p => `
        <div class="achar-row">
            <img src="${esc(p.image)}" style="width:50px; height:50px; border-radius:8px; object-fit:cover; flex-shrink:0;" onerror="this.src='https://placehold.co/50/eab308/fff?text=A'">
            <div style="flex:1;">
                <b>${esc(p.name)}</b> <span class="badge" style="background:#fef9c3; color:#713f12;">${esc(p.category)}</span>
                <div style="font-size:12px; color:#64748b; margin:5px 0;">Stock: ${Number(p.stock) || 0} Kg | ${esc(p.spiceLevel)} | ${esc(p.jarType)}</div>
                <div>
                    <span class="weight-badge">500g: ₹${Number(p.price500) || 0}</span>
                    <span class="weight-badge">1Kg: ₹${Number(p.price1kg) || 0}</span>
                </div>
            </div>
            <div style="display:flex; gap:5px;">
                <button class="btn-sm" style="background:#2563eb;" onclick="editProduct('${esc(p.id)}')"><i class="fa fa-pen"></i></button>
                <button class="btn-sm" style="background:#dc2626;" onclick="deleteProduct('${esc(p.id)}')"><i class="fa fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function filterProducts(query) {
    const filtered = allProducts.filter(p => (p.name || '').toLowerCase().includes((query || '').toLowerCase()));
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
        const d = $('orderList'); if(d) d.innerHTML = '<p style="color:#64748b;">No orders</p>';
    }
}

function renderOrders() {
    const div = $('orderList'); if(!div) return;
    if(allOrders.length === 0) {
        div.innerHTML = '<p style="color:#64748b; text-align:center; padding:20px;">Aaj koi order nahi</p>';
        return;
    }
    div.innerHTML = allOrders.map(o => `
        <div class="achar-row">
            <div>
                <b>Order #${esc(o.trackingId)}</b>
                <div style="font-size:12px; color:#64748b;">${esc(o.customerName)} | ${o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : ''}</div>
            </div>
            <div style="font-weight:700; color:#eab308;">₹${Number(o.total) || 0}</div>
        </div>
    `).join('');
}

function loadStats() {
    const set = (id, v) => { const e = $(id); if(e) e.innerText = v; };
    set('products', allProducts.length);
    let today = new Date().toDateString();
    let todayOrders = allOrders.filter(o => o.createdAt && new Date(o.createdAt).toDateString() === today);
    set('orders', todayOrders.length);
    set('revenue', todayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0));
    set('kg', todayOrders.reduce((sum, o) => sum + (Number(o.totalKg) || 0), 0));
}

// 4. LOW STOCK
async function renderLowStock() {
    try {
        const low = allProducts.filter(p => (Number(p.stock) || 0) < 5);
        const div = $('stockAlert'); if(!div) return;
        if(low.length === 0) {
            div.innerHTML = '<p style="color:#16a34a;">✅ Sab stock thik hai</p>';
            return;
        }
        div.innerHTML = low.map(p => `<div class="achar-row"><span>⚠️ ${esc(p.name)}</span><span class="badge badge-red">${Number(p.stock) || 0} Kg</span></div>`).join('');
    } catch(e) {
        const d = $('stockAlert'); if(d) d.innerHTML = 'Error';
    }
}

function renderCategories() {
    const cats = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
    const div = $('categories'); if(!div) return;
    if(cats.length === 0) {
        div.innerHTML = '<p style="color:#64748b;">No categories</p>';
        return;
    }
    div.innerHTML = cats.map(c => `
        <div class="achar-row">
            <span>${esc(c)}</span>
            <span class="badge badge-green">${allProducts.filter(p => p.category === c).length}</span>
        </div>
    `).join('');
}

// 5. ADD/EDIT MODAL
function openAddModal() {
    currentEditId = null;
    productImageUrl = '';
    const t = $('modalTitle'); if(t) t.innerText = 'Add New Achar';
    const m = $('addModal'); if(m) m.style.display = 'flex';
    const set = (id, v) => { const e = $(id); if(e) e.value = v; };
    set('acharName', '');
    set('acharType', 'Aam');
    set('acharDesc', '');
    set('acharJar', 'Glass');
    set('acharSpice', 'Medium');
    set('acharPrice1kg', '');
    set('acharPrice500g', '');
    set('acharStock', '');
    const img = $('productImgPreview'); if(img) img.src = 'https://placehold.co/100/eab308/fff?text=Achar';
}

function closeAddModal() {
    const m = $('addModal'); if(m) m.style.display = 'none';
}

async function saveNewAchar() {
    const data = {
        name: ($('acharName')?.value || '').trim(),
        category: $('acharType')?.value || 'Aam',
        description: $('acharDesc')?.value || '',
        jarType: $('acharJar')?.value || 'Glass',
        spiceLevel: $('acharSpice')?.value || 'Medium',
        price500: Number($('acharPrice500g')?.value || 0),
        price1kg: Number($('acharPrice1kg')?.value || 0),
        stock: Number($('acharStock')?.value || 0),
        image: productImageUrl || 'https://placehold.co/400/eab308/fff?text=Achar'
    };

    if(!data.name || !data.price1kg) return alert('Name aur 1Kg Price jaruri hai');

    try {
        const url = currentEditId ? `/api/shops/achar/${shopId}/item/${currentEditId}` : `/api/shops/achar/${shopId}/item`;
        const method = currentEditId ? 'PUT' : 'POST';
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ item: data }) });
        const result = await res.json();
        if(res.ok) {
            alert('Save ho gaya');
            closeAddModal();
            loadShopData();
        } else {
            alert('Error: ' + (result.message || 'Save fail'));
        }
    } catch(e) { alert('Error: ' + e.message) }
}

function editProduct(id) {
    const p = allProducts.find(x => x.id === id);
    if(!p) return;
    currentEditId = id;
    productImageUrl = p.image || '';
    const t = $('modalTitle'); if(t) t.innerText = 'Edit Achar';
    const m = $('addModal'); if(m) m.style.display = 'flex';
    const set = (id2, v) => { const e = $(id2); if(e) e.value = v ?? ''; };
    set('acharName', p.name);
    set('acharType', p.category);
    set('acharDesc', p.description);
    set('acharJar', p.jarType);
    set('acharSpice', p.spiceLevel);
    set('acharPrice1kg', p.price1kg);
    set('acharPrice500g', p.price500);
    set('acharStock', p.stock);
    const img = $('productImgPreview'); if(img) img.src = p.image || '';
}

async function deleteProduct(id) {
    if(!confirm('Delete karein?')) return;
    await fetch(`/api/shops/achar/${shopId}/item/${id}`, { method: 'DELETE' });
    loadShopData();
}

function quickAddProducts(){
    alert('Quick Add jaldi aayega - abhi Add Achar se ek-ek karke add karo');
}

// 6. OTHER FUNCTIONS
async function toggleShop() {
    const tg = $('shopToggle'); if(!tg) return;
    tg.classList.toggle('off');
    const isOpen = !tg.classList.contains('off');
    const tt = $('toggleText'); if(tt) tt.innerText = isOpen ? 'Open' : 'Closed';

    await fetch(`/api/shops/achar/${shopId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen })
    });

    alert(`Shop ab ${isOpen ? 'Open' : 'Closed'} hai`);
}

async function saveAnnouncement() {
    const announcement = $('announcementInput')?.value || '';
    await fetch(`/api/shops/achar/${shopId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ announcement }) });
    alert('Saved');
}

async function saveTiming() {
    const open24 = $('openTime')?.value || '09:00';
    const close24 = $('closeTime')?.value || '21:00';
    const data = {
        openTime: convertTo12Hr(open24),
        closeTime: convertTo12Hr(close24)
    };
    await fetch(`/api/shops/achar/${shopId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openTime: data.openTime, closeTime: data.closeTime, settings: data })
    });
    alert('Saved');
}

async function savePhone() {
    const phone = ($('shopPhoneInput')?.value || '').replace(/\D/g, '').slice(-10);
    if(phone.length !== 10) return alert('10 digit phone bhejo');
    await fetch(`/api/shops/achar/${shopId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) });
    alert('Saved');
}

async function saveProfile() {
    const ownerName = ($('ownerNameInput')?.value || '').trim();
    const shopAddress = ($('profileAddressInput')?.value || '').trim();
    if(!ownerName && !shopAddress) return alert('Naam ya Address toh bharo');
    try{
        const res = await fetch(`/api/shops/achar/${shopId}/profile`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ownerName, shopAddress, fullAddress: shopAddress })
        });
        const d = await res.json();
        if(!d.success) throw new Error(d.message || 'Save fail');
        const st = $('profileStatus'); if(st){ st.innerHTML = '✅ Profile save ho gaya'; st.style.color = '#10b981'; }
        loadShopData();
    }catch(e){ alert('Profile save fail: ' + e.message); }
}

// V27: Upload - seedha apna route, koi ShopCore override nahi, koi Media double-upload nahi
async function uploadToAchar(file){
    if(!file) return null;
    if(file.size > 5 * 1024 * 1024){ alert('Photo 5MB se chhoti bhejo'); return null; }
    const fd = new FormData(); fd.append('image', file);
    const res = await fetch('/api/shops/achar/upload', { method: 'POST', body: fd });
    const d = await res.json();
    if(!d.success || !d.url) throw new Error(d.message || 'Upload fail');
    return d.url;
}

async function uploadOwnerPhoto(file){
    if(!file) return;
    try{
        const url = await uploadToAchar(file);
        const oi = $('ownerImg'); if(oi) oi.src = url;
        await fetch(`/api/shops/achar/${shopId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ownerPhotoUrl: url }) });
        alert('Owner photo save ho gayi');
    }catch(e){ alert('Upload fail: ' + e.message); }
}

async function uploadProductPhoto(file){
    if(!file) return;
    try{
        const url = await uploadToAchar(file);
        productImageUrl = url;
        const img = $('productImgPreview'); if(img) img.src = url;
    }catch(e){ alert('Upload fail: ' + e.message); }
}

// V27: Location - khud save karega, shop-location.js pe depend nahi
async function loadLocation(){
    try{
        const res = await fetch(`/api/shops/achar/${shopId}/location`);
        const d = await res.json();
        if(d.success && d.data){
            const lt = $('locationType'); if(lt) lt.value = d.data.locationType || 'fixed';
            const rg = $('deliveryRange'); if(rg) rg.value = d.data.deliveryRange ?? 5;
            const ad = $('shopAddress'); if(ad) ad.value = d.data.address || '';
            const st = $('locationStatus'); if(st) st.innerHTML = '✅ Already Set';
        }
    }catch(e){}
}

async function saveLocation() {
    const st = $('locationStatus');
    try{
        if(!navigator.geolocation) throw new Error('GPS nahi mila');
        const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 10000 }));
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        const res = await fetch(`/api/shops/achar/${shopId}/location`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lat, lng,
                type: $('locationType')?.value || 'fixed',
                range: Number($('deliveryRange')?.value || 5),
                address: $('shopAddress')?.value || ''
            })
        });
        const d = await res.json();
        if(!d.success) throw new Error(d.message || 'Save fail');
        if(st){ st.innerHTML = `✅ Saved! Lat:${lat.toFixed(4)} Lng:${lng.toFixed(4)}`; st.style.color = '#10b981'; }
    }catch(e){
        if(st){ st.innerHTML = `❌ ${e.message}`; st.style.color = '#ef4444'; }
        else alert('Location fail: ' + e.message);
    }
}

console.log('✅ Achar Dashboard V27 Loaded');
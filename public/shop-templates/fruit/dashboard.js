const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
const TEMPLATE_NAME = 'fruit';

document.getElementById('shopIdDisplay').innerText = shopId? shopId.substring(0, 8) + '...' : 'Demo';

// GLOBAL
let allShopFruits = [];

// 1. CORE INIT - SIRF 1 BAAR
if(shopId) {
    ShopCore.init(shopId, TEMPLATE_NAME);
    if(typeof ShopLocationManager !== 'undefined') {
        ShopLocationManager.init(shopId);
    }
} else {
    console.error("ShopId URL me nahi mila");
}

// CHANGED: API + LOCALSTORAGE DONO SUPPORT
async function loadShopData() {
    try {
        document.getElementById('loader').innerText = 'Loading...';
        let shop = null;

        // PEHLE API TRY KAR
        try{
            const res = await fetch(`/api/shops/${shopId}`);
            const result = await res.json();
            if(result.success) shop = result.shop;
        }catch(e){ console.log("API failed, using localStorage") }

        // AGAR API FAIL TO LOCAL SE UTHA LE
        if(!shop){
            shop = {
                shopName: localStorage.getItem('shopName_'+shopId) || 'Fresh Fruits',
                ownerPhotoUrl: localStorage.getItem('ownerPhoto_'+shopId+'_cloud') || '',
                announcement: localStorage.getItem('announcement_'+shopId) || '',
                isOpen: localStorage.getItem('shopStatus_'+shopId) !== 'false',
                items: JSON.parse(localStorage.getItem('shopFruits_'+shopId)) || [],
                shopSettings: JSON.parse(localStorage.getItem('shopTimings_'+shopId)) || {openTime: '08:00', closeTime: '22:00'}
            }
        }

        // 1. Shop Name + Photo + Settings
        document.getElementById('shopName').innerText = shop.shopName || 'Fresh Fruits';
        if(shop.ownerPhotoUrl) document.getElementById('ownerPhoto').src = shop.ownerPhotoUrl;

        document.getElementById('announcementText').value = shop.announcement || '';
        document.getElementById('openTime').value = shop.shopSettings?.openTime || '08:00';
        document.getElementById('closeTime').value = shop.shopSettings?.closeTime || '22:00';

        // 2. Load Fruits
        allShopFruits = shop.items && shop.items.length > 0 ? shop.items : [...window.FRUIT_PRODUCTS_DATA];

        // 3. Stats
        const totalStock = allShopFruits.reduce((sum, f) => sum + (f.stock || 0), 0);
        document.getElementById('totalFruits').innerText = allShopFruits.length;
        document.getElementById('totalStock').innerText = totalStock;
        document.getElementById('todaySales').innerText = Math.floor(Math.random()*20) + 5;
        document.getElementById('revenue').innerText = allShopFruits.reduce((sum, f) => sum + (f.price * 2), 0);
        document.getElementById('totalCustomers').innerText = Math.floor(Math.random()*200) + 50;

        loadFruits(allShopFruits);
        document.getElementById('loader').style.display = 'none';
        document.getElementById('fruitTable').style.display = 'table';

        // 4. OPEN/CLOSE
        document.getElementById('shopToggle').checked = shop.isOpen;
        updateStatusBadge(shop.isOpen);

        generateQR();
        if(typeof loadShopLocationBadge === 'function') loadShopLocationBadge();

    } catch (err) {
        console.error(err);
        document.getElementById('loader').innerText = 'Error loading data';
    }
}

function updateStatusBadge(isOpen){
    const badge = document.getElementById('shopStatusBadge');
    if(isOpen) {
        badge.className = 'status-badge status-open';
        badge.innerHTML = '<i class="fa fa-circle"></i> OPEN NOW';
    } else {
        badge.className = 'status-badge status-close';
        badge.innerHTML = '<i class="fa fa-circle"></i> CLOSED';
    }
}

async function loadShopLocationBadge(){ /*... same ...*/ }

function loadFruits(fruits) {
    const tbody = document.getElementById('fruitTableBody');
    if (fruits.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:40px;"><i class="fa fa-inbox" style="font-size:32px; color:#cbd5e1; margin-bottom:10px;"></i><br>No fruits added yet. Click "Add Fruit" to start</td></tr>`;
        return;
    }
    tbody.innerHTML = fruits.map(fruit => {
        const pid = fruit._id || fruit.id; // CHANGED: _id support
        const stock = fruit.stock || 0;
        const days = fruit.expiryDays || 7;
        const status = days <= 2 ? `<span class="expiry"><i class="fa fa-exclamation"></i> Expiring Soon</span>` : `<span class="fresh"><i class="fa fa-check"></i> Fresh</span>`;
        const stockClass = stock < 10 ? 'low-stock' : '';
        return `<tr><td><div style="display:flex; align-items:center; gap:10px;"><img src="${fruit.image || 'https://via.placeholder.com/40?text=F'}" style="width:40px; height:40px; border-radius:8px; object-fit:cover;"><strong>${fruit.name}</strong></div></td><td>₹<strong>${fruit.price}</strong> <span style="font-size:12px; color:#64748b;">/${fruit.unit}</span></td><td class="${stockClass}"><strong>${stock}</strong> ${fruit.unit}</td><td>${status}</td><td style="display:flex; gap:5px; flex-wrap:wrap;"><button onclick="editFruit('${pid}')" style="background:#22c55e; color:white; border:none; padding:6px 10px; border-radius:8px; cursor:pointer;"><i class="fa fa-edit"></i></button><button onclick="deleteFruit('${pid}')" style="background:#ef4444; color:white; border:none; padding:6px 10px; border-radius:8px; cursor:pointer;"><i class="fa fa-trash"></i></button></td></tr>`;
    }).join('');
}

// CHANGED: DELETE API + LOCAL DONO
async function deleteFruit(fruitId) {
    if(confirm('Are you sure?')) {
        allShopFruits = allShopFruits.filter(f => (f._id || f.id) !== fruitId);
        try{
            await fetch(`/api/shops/${shopId}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ items: allShopFruits }) });
        }catch(e){}
        localStorage.setItem('shopFruits_'+shopId, JSON.stringify(allShopFruits)); // backup
        loadShopData();
    }
}

// BUTTONS - YE SAB SAME
document.getElementById('addFruitBtn').onclick = () => { window.location.href = `/shop-templates/fruit/fruit-form.html?shopId=${shopId}`; };
function editFruit(fruitId) { window.location.href = `/shop-templates/fruit/fruit-form.html?shopId=${shopId}&fruitId=${fruitId}`; }
document.getElementById('shareBtn').onclick = () => { navigator.clipboard.writeText(window.location.href); alert('Shop Link Copied!'); }
document.getElementById('viewShopBtn').onclick = () => { window.open(`fruit-shop.html?shopId=${shopId}`, '_blank'); };

if(shopId) ShopCore.bindImageUpload('ownerPhoto', 'photoUpload', 'profile', 'owner');

// CHANGED: TOGGLE API + LOCAL
document.getElementById('shopToggle').onchange = async (e) => {
    updateStatusBadge(e.target.checked);
    try{ await fetch(`/api/shops/${shopId}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ isOpen: e.target.checked }) }); }catch(e){}
    localStorage.setItem('shopStatus_'+shopId, e.target.checked);
}

// CHANGED: SAVE TIMINGS API + LOCAL
async function saveTimings() {
    const open = document.getElementById('openTime').value;
    const close = document.getElementById('closeTime').value;
    try{ await fetch(`/api/shops/${shopId}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ shopSettings: { openTime: open, closeTime: close } }) }); }catch(e){}
    localStorage.setItem('shopTimings_'+shopId, JSON.stringify({open, close}));
    alert('Timings Saved!');
}

// CHANGED: SAVE ANNOUNCEMENT API + LOCAL  
async function saveAnnouncement() {
    const text = document.getElementById('announcementText').value;
    try{ await fetch(`/api/shops/${shopId}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ announcement: text }) }); }catch(e){}
    localStorage.setItem('announcement_'+shopId, text);
    alert('Announcement Updated!');
}

function generateQR() { /* same */ }
function downloadQR() { /* same */ }

document.getElementById('searchFruit').onkeyup = (e) => { const term = e.target.value.toLowerCase(); loadFruits(allShopFruits.filter(f => f.name.toLowerCase().includes(term))); }

// INIT
loadShopData();
const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
const TEMPLATE_NAME = 'fruit';

document.getElementById('shopIdDisplay').innerText = shopId? shopId.substring(0, 8) + '...' : 'Demo';

// GLOBAL
let allShopFruits = [];

// 1. CORE INIT SABSE PEHLE - SIRF 1 BAAR
if(shopId) {
    ShopCore.init(shopId, TEMPLATE_NAME);
    if(typeof ShopLocationManager!== 'undefined') {
        ShopLocationManager.init(shopId);
    }
} else {
    console.error("ShopId URL me nahi mila");
}

// FINAL: SIRF DB SE DATA
async function loadShopData() {
    try {
        document.getElementById('loader').innerText = 'Loading...';
        let shop = null;

        // STEP 1: DB SE DATA LAO
        const res = await fetch(`/api/shops/${shopId}`);
        if(!res.ok) throw new Error('Shop not found');
        shop = await res.json(); // seedha shop lelo

        // STEP 2: AGAR DB FAIL HO GAYI TO ERROR DIKHAO
        if(!shop || shop.error){
            document.getElementById('loader').innerText = 'Error: Server on nahi hai. npm start karo';
            alert('Error: Shop data DB se load nahi hui. Server on hai kya?');
            return;
        }

        // 1. Shop Name + Photo + Settings
        document.getElementById('shopName').innerText = shop.shopName || 'Fresh Fruits';
        if(shop.ownerPhotoUrl) document.getElementById('ownerPhoto').src = shop.ownerPhotoUrl;

        document.getElementById('announcementText').value = shop.announcement || '';
        document.getElementById('openTime').value = shop.shopSettings?.openTime || '08:00';
        document.getElementById('closeTime').value = shop.shopSettings?.closeTime || '22:00';

        // 2. Load Fruits: SIRF DB SE
        allShopFruits = shop.items || [];

        // 3. Stats Calculate - DB se, nahi to 0
        const totalStock = allShopFruits.reduce((sum, f) => sum + (f.stock || 0), 0);
        const totalCustomers = shop.totalCustomers || 0;
        const revenue = shop.revenue || 0;
        const todaySales = shop.todaySales || 0;

        document.getElementById('totalFruits').innerText = allShopFruits.length;
        document.getElementById('totalStock').innerText = totalStock;
        document.getElementById('todaySales').innerText = todaySales;
        document.getElementById('revenue').innerText = revenue;
        document.getElementById('totalCustomers').innerText = totalCustomers;

        loadFruits(allShopFruits);
        document.getElementById('loader').style.display = 'none';
        document.getElementById('fruitTable').style.display = 'table';

        // 4. OPEN/CLOSE
        document.getElementById('shopToggle').checked = shop.isOpen;
        updateStatusBadge(shop.isOpen);

        generateQR();

        if(typeof loadShopLocationBadge === 'function') {
            loadShopLocationBadge();
        }

    } catch (err) {
        console.error(err);
        document.getElementById('loader').innerText = 'Failed to load data. Server check karo';
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

// LOCATION BADGE LOAD KARNE KA FUNCTION
async function loadShopLocationBadge(){
    try {
        const res = await fetch(`/api/location/shop/${shopId}`);
        const data = await res.json();
        if(data.success && data.data){
            document.getElementById('locationTypeBadge').innerText = data.data.locationType === 'fixed'? 'Fixed' : 'Mobile';
            document.getElementById('rangeText').innerText = `Delivery Range: ${data.data.deliveryRange} KM`;
            if(data.data.address) document.getElementById('shopAddress').value = data.data.address;
        }
    } catch(err) {
        console.error('Location load failed', err);
    }
}

function loadFruits(fruits) {
    const tbody = document.getElementById('fruitTableBody');
    if (fruits.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:40px;">
            <i class="fa fa-inbox" style="font-size:32px; color:#cbd5e1; margin-bottom:10px;"></i><br>
            No fruits added yet. Click "Add Fruit" to start
        </td></tr>`;
        return;
    }

    tbody.innerHTML = fruits.map(fruit => {
        const pid = fruit._id || fruit.id; // DB ka _id bhi support
        const stock = fruit.stock || 0;
        const days = fruit.expiryDays || 7;
        const status = days <= 2? `<span class="expiry"><i class="fa fa-exclamation"></i> Expiring Soon</span>` : `<span class="fresh"><i class="fa fa-check"></i> Fresh</span>`;
        const stockClass = stock < 10? 'low-stock' : '';

        return `
        <tr>
            <td>
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${fruit.image || fruit.img || 'https://via.placeholder.com/40?text=F'}" style="width:40px; height:40px; border-radius:8px; object-fit:cover;">
                    <strong>${fruit.name}</strong>
                </div>
            </td>
            <td>₹<strong>${fruit.price}</strong> <span style="font-size:12px; color:#64748b;">/${fruit.unit}</span></td>
            <td class="${stockClass}"><strong>${stock}</strong> ${fruit.unit}</td>
            <td>${status}</td>
            <td style="display:flex; gap:5px; flex-wrap:wrap;">
                <button onclick="editFruit('${pid}')" style="background:#22c55e; color:white; border:none; padding:6px 10px; border-radius:8px; cursor:pointer;">
                    <i class="fa fa-edit"></i>
                </button>
                <button onclick="deleteFruit('${pid}')" style="background:#ef4444; color:white; border:none; padding:6px 10px; border-radius:8px; cursor:pointer;">
                    <i class="fa fa-trash"></i>
                </button>
                <button onclick="manualCloudUpload()" style="background:#3b82f6; color:white; border:none; padding:6px 10px; border-radius:8px; cursor:pointer;" title="Save Photo to Cloud - Premium">
                    <i class="fa fa-cloud-upload-alt"></i>
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

// FINAL: DELETE SIRF DB SE
async function deleteFruit(fruitId) {
    if(confirm('Are you sure you want to delete this fruit?')) {
        allShopFruits = allShopFruits.filter(f => (f._id || f.id)!== fruitId);
        await fetch(`/api/shops/${shopId}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ items: allShopFruits }) });
        loadShopData();
    }
}

// ADD FRUIT BUTTON
document.getElementById('addFruitBtn').onclick = () => {
    window.location.href = `/shop-templates/fruit/fruit-form.html?shopId=${shopId}`;
};

// EDIT FRUIT
function editFruit(fruitId) {
    window.location.href = `/shop-templates/fruit/fruit-form.html?shopId=${shopId}&fruitId=${fruitId}`;
}

// SHARE BUTTON
document.getElementById('shareBtn').onclick = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Shop Link Copied!');
}

// VIEW SHOP BUTTON
document.getElementById('viewShopBtn').onclick = () => {
    window.open(`fruit-shop.html?shopId=${shopId}`, '_blank');
};

// 2. PHOTO UPLOAD BIND
if(shopId) {
    ShopCore.bindImageUpload('ownerPhoto', 'photoUpload', 'profile', 'owner');
}

// FINAL: TOGGLE SIRF DB
document.getElementById('shopToggle').onchange = async (e) => {
    updateStatusBadge(e.target.checked);
    await fetch(`/api/shops/${shopId}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ isOpen: e.target.checked }) });
}

// FINAL: SAVE TIMINGS SIRF DB
async function saveTimings() {
    const open = document.getElementById('openTime').value;
    const close = document.getElementById('closeTime').value;
    await fetch(`/api/shops/${shopId}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ shopSettings: { openTime: open, closeTime: close } }) });
    alert('Timings Saved!');
}

// FINAL: SAVE ANNOUNCEMENT SIRF DB
async function saveAnnouncement() {
    const text = document.getElementById('announcementText').value;
    await fetch(`/api/shops/${shopId}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ announcement: text }) });
    alert('Announcement Updated!');
}

// GENERATE QR
function generateQR() {
    const url = `fruit-shop.html?shopId=${shopId}`;
    document.getElementById("shopQR").innerHTML = "";
    new QRCode(document.getElementById("shopQR"), { text: url, width: 150, height: 150 });
}
function downloadQR() {
    const img = document.getElementById('shopQR').querySelector('img');
    if(img){
        const a = document.createElement('a');
        a.href = img.src;
        a.download = 'shop-qr.png';
        a.click();
    }
}

// SEARCH FUNCTION
document.getElementById('searchFruit').onkeyup = (e) => {
    const term = e.target.value.toLowerCase();
    loadFruits(allShopFruits.filter(f => f.name.toLowerCase().includes(term)));
}

// PREMIUM FEATURE: MANUAL CLOUD UPLOAD
async function manualCloudUpload() {
    const fileInput = document.getElementById('photoUpload');
    const currentImg = document.getElementById('ownerPhoto').src;

    if(currentImg.startsWith('data:image')) {
        fileInput.click();
        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if(!file) return;
            if(confirm('Kya is photo ko Cloudinary pe save karna hai?')) {
                const url = await ShopCore.uploadImage(file, 'profile');
                if(url) {
                    alert('Photo Cloud + DB pe Save ho gayi! ✅');
                }
            }
        }
    } else if(currentImg.includes('cloudinary.com')) {
        alert('Photo already Cloud pe hai');
    } else {
        alert('Pehle photo select karo');
        fileInput.click();
    }
}

// INIT
loadShopData();
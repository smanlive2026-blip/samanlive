const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
const TEMPLATE_NAME = 'fruit';

document.getElementById('shopIdDisplay').innerText = shopId? shopId.substring(0, 8) + '...' : 'Demo';

// GLOBAL
let allShopFruits = [];

// 1. CORE INIT SABSE PEHLE
ShopCore.init(shopId, TEMPLATE_NAME);

function loadShopData() {
    try {
        // 1. Shop Name - Photo wala shop-core.js khud handle karega
        const shopName = localStorage.getItem('shopName_'+shopId) || 'Fresh Fruits';
        document.getElementById('shopName').innerText = shopName;

        // 2. Load Fruits: Pehle localStorage dekho, nahi to 104 seed wale
        const savedFruits = JSON.parse(localStorage.getItem('shopFruits_'+shopId)) || [];
        allShopFruits = savedFruits.length > 0? savedFruits : [...window.FRUIT_PRODUCTS_DATA];

        // 3. Stats Calculate
        const totalStock = allShopFruits.reduce((sum, f) => sum + (f.stock || 0), 0);
        const totalCustomers = localStorage.getItem('customers_'+shopId) || Math.floor(Math.random()*200) + 50;
        const revenue = localStorage.getItem('revenue_'+shopId) || allShopFruits.reduce((sum, f) => sum + (f.price * 2), 0);
        const todaySales = localStorage.getItem('sales_'+shopId) || Math.floor(Math.random()*20) + 5;

        document.getElementById('totalFruits').innerText = allShopFruits.length;
        document.getElementById('totalStock').innerText = totalStock;
        document.getElementById('todaySales').innerText = todaySales;
        document.getElementById('revenue').innerText = revenue;
        document.getElementById('totalCustomers').innerText = totalCustomers;

        loadFruits(allShopFruits);
        document.getElementById('loader').style.display = 'none';
        document.getElementById('fruitTable').style.display = 'table';

        // 4. Load Saved Settings
        const savedAnn = localStorage.getItem('announcement_'+shopId);
        if(savedAnn) document.getElementById('announcementText').value = savedAnn;

        const savedTimings = JSON.parse(localStorage.getItem('shopTimings_'+shopId));
        if(savedTimings){
            document.getElementById('openTime').value = savedTimings.open;
            document.getElementById('closeTime').value = savedTimings.close;
        }

        const savedStatus = localStorage.getItem('shopStatus_'+shopId);
        if(savedStatus === 'false') {
            document.getElementById('shopToggle').checked = false;
            document.getElementById('shopToggle').dispatchEvent(new Event('change'));
        }

        generateQR();

    } catch (err) {
        console.error(err);
        document.getElementById('loader').innerText = 'Failed to load data';
    }
}

function loadFruits(fruits) {
    const tbody = document.getElementById('fruitTableBody');
    if (fruits.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px;">
            <i class="fa fa-inbox" style="font-size:32px; color:#cbd5e1; margin-bottom:10px;"></i><br>
            No fruits added yet. Click "Add Fruit" to start
        </td></tr>`;
        return;
    }

    tbody.innerHTML = fruits.map(fruit => {
        const stock = fruit.stock || 0;
        const days = fruit.expiryDays || 7;
        const status = days <= 2? `<span class="expiry"><i class="fa fa-exclamation"></i> Expiring Soon</span>` : `<span class="fresh"><i class="fa fa-check"></i> Fresh</span>`;
        const stockClass = stock < 10? 'low-stock' : '';

        return `
        <tr>
            <td>
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${fruit.image || 'https://via.placeholder.com/40?text=F'}" style="width:40px; height:40px; border-radius:8px; object-fit:cover;">
                    <strong>${fruit.name}</strong>
                </div>
            </td>
            <td>₹<strong>${fruit.price}</strong> <span style="font-size:12px; color:#64748b;">/${fruit.unit}</span></td>
            <td class="${stockClass}"><strong>${stock}</strong> ${fruit.unit}</td>
            <td>${status}</td>
            <td style="display:flex; gap:5px; flex-wrap:wrap;">
                <button onclick="editFruit('${fruit.id}')" style="background:#22c55e; color:white; border:none; padding:6px 10px; border-radius:8px; cursor:pointer;">
                    <i class="fa fa-edit"></i>
                </button>
                <button onclick="deleteFruit('${fruit.id}')" style="background:#ef4444; color:white; border:none; padding:6px 10px; border-radius:8px; cursor:pointer;">
                    <i class="fa fa-trash"></i>
                </button>
                <!-- PREMIUM FEATURE: MANUAL CLOUD UPLOAD - FUTURE PAID -->
                <button onclick="manualCloudUpload()" style="background:#3b82f6; color:white; border:none; padding:6px 10px; border-radius:8px; cursor:pointer;" title="Save Photo to Cloud - Premium">
                    <i class="fa fa-cloud-upload-alt"></i>
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

// DELETE FRUIT
function deleteFruit(fruitId) {
    if(confirm('Are you sure you want to delete this fruit?')) {
        allShopFruits = allShopFruits.filter(f => f.id!== fruitId);
        localStorage.setItem('shopFruits_'+shopId, JSON.stringify(allShopFruits));
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

// 2. PHOTO UPLOAD BIND - CLOUDINARY WALA
ShopCore.bindOwnerPhotoUpload('ownerPhoto', 'photoUpload');

// SHOP OPEN/CLOSE TOGGLE
document.getElementById('shopToggle').onchange = (e) => {
    const badge = document.getElementById('shopStatusBadge');
    if(e.target.checked) {
        badge.className = 'status-badge status-open';
        badge.innerHTML = '<i class="fa fa-circle"></i> OPEN NOW';
    } else {
        badge.className = 'status-badge status-close';
        badge.innerHTML = '<i class="fa fa-circle"></i> CLOSED';
    }
    localStorage.setItem('shopStatus_'+shopId, e.target.checked);
}

// SAVE TIMINGS
function saveTimings() {
    const open = document.getElementById('openTime').value;
    const close = document.getElementById('closeTime').value;
    localStorage.setItem('shopTimings_'+shopId, JSON.stringify({open, close}));
    alert('Timings Saved!');
}

// SAVE ANNOUNCEMENT
function saveAnnouncement() {
    const text = document.getElementById('announcementText').value;
    localStorage.setItem('announcement_'+shopId, text);
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

/*

  PREMIUM FEATURE: MANUAL CLOUD UPLOAD
  Description: Ye feature shop owner ko manual photo cloud pe save karne deta hai
  Use Case: Laptop pe local photo select karne ke baad, is button se cloudinary pe upload
  Future: Isko paid plan me rakhna hai. Free me auto-upload band rahega

*/
async function manualCloudUpload() {
    const fileInput = document.getElementById('photoUpload');
    const currentImg = document.getElementById('ownerPhoto').src;

    // Check if current image is base64/local
    if(currentImg.startsWith('data:image')) {
        // Trigger file input to select new photo
        fileInput.click();
        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if(!file) return;

            if(confirm('Kya is photo ko Cloudinary pe save karna hai? Ye Premium Feature hai.')) {
                const loader = document.getElementById('uploadLoader');
                if(loader) loader.style.display = 'inline';

                const url = await ShopCore.uploadImage(file, 'profile');

                if(loader) loader.style.display = 'none';

                if(url) {
                    document.getElementById('ownerPhoto').src = url;
                    localStorage.setItem('ownerPhoto_'+shopId+'_cloud', url);
                    alert('Photo Cloud pe Save ho gayi! ✅ Ab mobile me dikhegi');
                } else {
                    alert('Upload Failed! Internet check karo');
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
const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId;

// RULE: 2 COMMON FILE INIT
ShopCore.init(shopId, 'furniture');
// ShopLocationManager.init(shopId); // ye bhi hai tere paas

let shopData = {};

async function loadData() {
    const res = await fetch(`/api/furniture/${shopId}`);
    const result = await res.json();
    if(result.success){
        shopData = result.data;
        renderStats();
        renderProducts();
        renderOrders();
        renderLowStock();
        renderCategories();

        // CHANGED: DB se photo load karne ke baad bind karo
        if(shopData.ownerPhotoUrl){
            localStorage.setItem(`photo_${shopId}_profile_cloud`, shopData.ownerPhotoUrl);
        }
        ShopCore.bindImageUpload('ownerImg', 'ownerInput', 'profile', 'profile'); // example
    }
}

function renderStats(){
    document.getElementById('shopName').innerText = shopData.shopName || 'Furniture Showroom';
    document.getElementById('items').innerText = shopData.items?.length || 0;

    const today = new Date().toDateString();
    const todayOrders = shopData.orders?.filter(o => new Date(o.createdAt).toDateString() === today) || [];
    document.getElementById('orders').innerText = todayOrders.length;

    const pending = shopData.orders?.filter(o => ['Pending','Confirmed','Packed'].includes(o.status)).length || 0;
    document.getElementById('delivery').innerText = pending;

    const revenue = todayOrders.reduce((a,b) => a + b.total, 0);
    document.getElementById('revenue').innerText = revenue;
}

function renderProducts(){
    const list = document.getElementById('productList');
    if(!shopData.items?.length) return list.innerHTML = '<p style="color:#64748b;">Koi product nahi hai</p>';

    list.innerHTML = shopData.items.map(item => `
        <div class="order-card" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <h4>${item.name}</h4>
                <p style="color:#64748b; font-size:13px;">${item.category} | Stock: ${item.stock}</p>
            </div>
            <div style="text-align:right;">
                <p style="font-weight:700;">₹${item.price}</p>
                <button onclick="deleteItem('${item.id}')" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:8px; cursor:pointer;"><i class="fa fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function renderOrders(){
    const list = document.getElementById('orderList');
    if(!shopData.orders?.length) return list.innerHTML = '<p style="color:#64748b;">Koi order nahi hai</p>';

    list.innerHTML = shopData.orders.slice(0,5).map(o => `
        <div class="order-card">
            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <h4>${o.customerName}</h4>
                <span class="delivery-badge">${o.status}</span>
            </div>
            <p>₹${o.total} | ${o.items.length} Items | ${o.phone}</p>
        </div>
    `).join('');
}

function renderLowStock(){
    const threshold = shopData.lowStockThreshold || 5;
    const low = shopData.items?.filter(i => i.stock <= threshold) || [];
    document.getElementById('lowStock').innerHTML = low.length?
        low.map(i => `<div style="padding:10px; background:#fef2f2; border-radius:10px; margin-bottom:8px;"><b>${i.name}</b> - ${i.stock} left</div>`).join('') :
        '<p style="color:#16a34a;">Sab stock me hai ✅</p>';
}

function renderCategories(){
    const cats = [...new Set(shopData.items?.map(i => i.category))];
    document.getElementById('categories').innerHTML = cats.map(c => `<div style="padding:8px; background:#fef3c7; border-radius:8px; margin-bottom:6px;">${c}</div>`).join('');
}

async function deleteItem(itemId){
    if(!confirm('Pakka delete karna hai?')) return;
    await fetch(`/api/furniture/${shopId}/item/${itemId}`, {method: 'DELETE'});
    loadData();
}

document.getElementById('addItemBtn').onclick = () => {
    alert('Yaha Add Item ka modal khulega');
}

loadData();
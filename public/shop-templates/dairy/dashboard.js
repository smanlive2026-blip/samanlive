// public/shop-templates/dairy/dashboard.js
// DAIRY OWNER DASHBOARD - FULL LOGIC WITH COMMON MODULES

let SHOP_ID = new URLSearchParams(window.location.search).get('shopId') || localStorage.getItem('lastShopId') || 'DAIRY123';
let PRODUCTS = [];

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DAIRY DASHBOARD INIT:", SHOP_ID);
    ShopCore.init(SHOP_ID, 'dairy');

    loadShopInfo();
    loadInventory();
    loadSubscriptions();
    loadOrders();
    loadWallet();
    loadAnalytics();
    checkExpiryAndLowStock();
});

// ===== 1. SHOP INFO - common/profile/shop-info.js =====
async function loadShopInfo() {
    try {
        const res = await fetch(`/api/shops/${SHOP_ID}`);
        const data = await res.json();
        if (data.shop) {
            document.getElementById('shopName').innerText = data.shop.shopName || 'Gopal Dairy';
            document.getElementById('todaySale').innerText = `₹${data.shop.todaySale || 0}`;
            // owner photo DB se - golden rule
            if (data.shop.ownerPhotoUrl) {
                document.getElementById('ownerPhoto').src = data.shop.ownerPhotoUrl;
                localStorage.setItem(`photo_${SHOP_ID}_owner_cloud`, data.shop.ownerPhotoUrl);
            }
        }
    } catch (e) { console.warn("Shop info load failed, local se chal raha"); }
}

// ===== 2. INVENTORY - common/inventory/inventory.js CONNECTED =====
async function loadInventory() {
    try {
        // Tera common API core use hoga agar hai
        const res = await fetch(`/api/products?shopId=${SHOP_ID}`);
        const data = await res.json();
        PRODUCTS = data.products || [];
        renderProducts(PRODUCTS);
        document.getElementById('milkStock').innerText = calculateMilkStock() + ' Ltr';
    } catch (e) {
        // Fallback local data
        PRODUCTS = JSON.parse(localStorage.getItem(`products_${SHOP_ID}`) || '[]');
        renderProducts(PRODUCTS);
    }
}

function renderProducts(list) {
    const box = document.getElementById('productList');
    if (!box) return;
    if (!list.length) { box.innerHTML = '<p style="color:gray">No products yet</p>'; return; }
    box.innerHTML = list.map(p => `
        <div class="list-item">
            <div><b>${p.name}</b><br><small>${p.stock} ${p.unit || 'Ltr'} | Exp: ${p.expiry || 'N/A'}</small></div>
            <div><b>₹${p.price}</b><br><span class="badge">${p.stock < 10? 'Low Stock' : 'In Stock'}</span></div>
        </div>
    `).join('');
}

function calculateMilkStock() {
    return PRODUCTS.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
}

// Quick Add - Dairy Special
window.addProduct = async function() {
    const name = document.getElementById('pName').value;
    const price = document.getElementById('pPrice').value;
    const stock = document.getElementById('pStock').value;
    const expiry = document.getElementById('pExpiry').value;

    if (!name ||!price) return alert('Naam aur Price bharo');

    const newProduct = { name, price, stock, expiry, unit: 'Ltr', shopId: SHOP_ID };

    // 1. Local save fast
    PRODUCTS.push(newProduct);
    localStorage.setItem(`products_${SHOP_ID}`, JSON.stringify(PRODUCTS));
    renderProducts(PRODUCTS);

    // 2. DB save
    try {
        await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct)
        });
        console.log('Product saved to DB');
    } catch (e) { console.error('DB save failed'); }

    document.getElementById('pName').value = '';
    alert('Dairy Product Added!');
    checkExpiryAndLowStock();
}

// ===== 3. LOW STOCK & EXPIRY - common/inventory/low-stock-alert.html =====
function checkExpiryAndLowStock() {
    const lowStock = PRODUCTS.filter(p => p.stock < 10);
    const expiryToday = PRODUCTS.filter(p => {
        if (!p.expiry) return false;
        const today = new Date().toISOString().split('T')[0];
        return p.expiry === today;
    });

    document.getElementById('expiryToday').innerText = expiryToday.length + ' Item';
    document.getElementById('lowStockCard')?.classList.toggle('alert', lowStock.length > 0);

    const box = document.getElementById('lowStockList');
    if (box) {
        box.innerHTML = [...lowStock,...expiryToday].map(p => `
            <div class="list-item" style="background:#fef2f2">
                <span>⚠️ ${p.name} - ${p.stock < 10? 'Low Stock' : 'Expiry Today'}</span>
                <button class="btn" style="width:auto;padding:6px 12px" onclick="reorder('${p.name}')">Reorder</button>
            </div>
        `).join('') || '<p style="color:green">Sab OK hai ✅</p>';
    }
}

window.reorder = (name) => alert(name + ' ke liye supplier ko message bheja - common/orders/bulk-orders.html');

// ===== 4. SUBSCRIPTION - DAIRY SPECIAL - common/subscription/subscription.js =====
async function loadSubscriptions() {
    try {
        const res = await fetch(`/api/subscriptions?shopId=${SHOP_ID}`);
        const data = await res.json();
        const subs = data.subscriptions || [
            { name: 'Ramesh Kumar', qty: '2 Ltr Daily', time: 'Subah 6 AM', status: 'Active' },
            { name: 'Sunita Devi', qty: '1 Ltr Daily', time: 'Sham 5 PM', status: 'Active' }
        ];
        document.getElementById('subCount').innerText = subs.length;
        document.getElementById('subscriptionList').innerHTML = subs.map(s => `
            <div class="list-item"><span>${s.name} - ${s.qty} (${s.time})</span><span class="badge">${s.status}</span></div>
        `).join('');
    } catch (e) {}
}

// ===== 5. ORDERS - common/orders/orders.js + live-orders.html =====
async function loadOrders() {
    try {
        const res = await fetch(`/api/orders?shopId=${SHOP_ID}&status=pending`);
        const data = await res.json();
        const orders = data.orders || [];
        document.getElementById('orderList').innerHTML = orders.length? orders.map(o => `
            <div class="list-item"><span>#${o._id?.slice(-5)} - ${o.customerName} - ₹${o.total}</span><button class="btn" style="width:auto">Accept</button></div>
        `).join('') : 'No pending orders - common/orders/live-orders.html se live ayega';

        // Socket - common/core/socket-core.js se connect hoga
        if (window.io) {
            const socket = io();
            socket.on(`new-order-${SHOP_ID}`, () => {
                loadOrders();
                new Audio('/shop-templates/common/orders/new-order-sound.mp3').play().catch(()=>{});
            });
        }
    } catch (e) {}
}

// ===== 6. WALLET - common/finance/wallet.js / wallet/wallet.js =====
async function loadWallet() {
    try {
        const res = await fetch(`/api/finance/wallet?shopId=${SHOP_ID}`);
        const data = await res.json();
        document.getElementById('walletBalance').innerText = `₹${data.balance || 0}`;
        document.getElementById('payoutHistory').innerHTML = (data.history || []).map(h => `<div class="list-item"><span>${h.date}</span><span>₹${h.amount}</span></div>`).join('') || 'No history';
    } catch (e) {}
}

// ===== 7. ANALYTICS - common/analytics/sales-chart.js =====
function loadAnalytics() {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    // Simple chart without library
    ctx.getContext('2d').fillStyle = '#0ea5e9';
    ctx.getContext('2d').fillRect(0, 0, 100, 100);
    // Agar chart.js hai toh - common/analytics/sales-chart.js load hoga shop-core.js se
    if (window.Chart) {
        new Chart(ctx, {
            type: 'line',
            data: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], datasets: [{ label: 'Milk Sale (Ltr)', data: [40, 60, 55, 80, 70, 90, 75], borderColor: '#0ea5e9' }] }
        });
    }
}
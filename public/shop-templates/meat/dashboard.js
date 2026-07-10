const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

// Real Time Clock
setInterval(() => {
    document.getElementById('currentTime').innerText = new Date().toLocaleTimeString();
}, 1000);

let shopData = {};

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    shopData = await res.json();
    if (!shopData._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shopData.shopName;

    const orders = shopData.orders || [];
    const inventory = shopData.inventory || [];
    const customers = shopData.customers || [];

    // Stats
    document.getElementById('todayOrders').innerText = orders.length;
    document.getElementById('totalKg').innerText = orders.reduce((sum, o) => sum + o.weight, 0);
    document.getElementById('revenue').innerText = orders.reduce((sum, o) => sum + o.total, 0);
    document.getElementById('customers').innerText = customers.length;
    document.getElementById('lowStock').innerText = inventory.filter(i => i.stock < 3).length;
    document.getElementById('deliveries').innerText = orders.filter(o => o.type === 'delivery').length;

    loadOrders(orders);
    loadInventory(inventory);
    loadStockAlerts(inventory);
    loadTopCustomers(customers);
}

function loadOrders(orders) {
    const container = document.getElementById('orderList');
    if (orders.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#94a3b8; padding:40px;">No orders today</p>`;
        return;
    }
    container.innerHTML = orders.map(o => `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <h4>Order #${o.id} - ${o.customerName}</h4>
                    <p style="color:#64748b; font-size:14px;">${o.items.map(i => `${i.name} ${i.weight}kg`).join(', ')}</p>
                </div>
                <span class="status ${o.status}">${o.status}</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong>₹${o.total} | ${o.weight}kg | ${o.type}</strong>
                <div style="display:flex; gap:8px;">
                    <button onclick="updateOrderStatus('${o.id}', 'ready')" class="btn btn-small">Mark Ready</button>
                    <button onclick="whatsappCustomer('${o.customerPhone}', o)" class="btn btn-small" style="background:#25D366;"><i class="fab fa-whatsapp"></i></button>
                </div>
            </div>
        </div>
    `).join('');
}

function loadInventory(inventory) {
    const tbody = document.getElementById('inventoryBody');
    tbody.innerHTML = inventory.map(item => `
        <tr>
            <td><strong>${item.name}</strong></td>
            <td>₹${item.price}</td>
            <td>${item.stock} kg ${item.stock < 3 ? '<span style="color:red;">LOW</span>' : ''}</td>
            <td>
                <button onclick="addStock('${item.id}')" class="btn btn-small"><i class="fa fa-plus"></i></button>
                <button onclick="editItem('${item.id}')" class="btn btn-small" style="background:#64748b;"><i class="fa fa-edit"></i></button>
            </td>
        </tr>
    `).join('');
}

function loadStockAlerts(inventory) {
    const container = document.getElementById('stockAlerts');
    const lowItems = inventory.filter(i => i.stock < 3);
    if (lowItems.length === 0) {
        container.innerHTML = `<p style="color:#16a34a;">All stock is good ✓</p>`;
        return;
    }
    container.innerHTML = lowItems.map(i => `
        <div class="stock-alert">
            <strong>${i.name}</strong> - Only ${i.stock}kg left
            <button onclick="addStock('${i.id}')" class="btn btn-small" style="float:right;">Restock</button>
        </div>
    `).join('');
}

function loadTopCustomers(customers) {
    const container = document.getElementById('topCustomers');
    container.innerHTML = customers.slice(0,5).map(c => `
        <div style="display:flex; justify-content:space-between; padding:12px; border-bottom:1px solid #fee2e2;">
            <div><strong>${c.name}</strong><br><span style="font-size:12px;">${c.orders} orders</span></div>
            <strong style="color:#dc2626;">₹${c.totalSpent}</strong>
        </div>
    `).join('');
}

// NEW FUNCTIONS ADDED
function updateOrderStatus(orderId, status) {
    alert(`Order ${orderId} marked as ${status}`);
    loadShopData();
}

function whatsappCustomer(phone, order) {
    const msg = `Hi ${order.customerName}, your order #${order.id} of ${order.weight}kg is ${order.status}. Total: ₹${order.total}`;
    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`, '_blank');
}

function addStock(itemId) {
    const qty = prompt('Enter kg to add:');
    if(qty) alert(`${qty}kg added to stock`);
    loadShopData();
}

function editItem(itemId) {
    window.location.href = `/shop-templates/meat/item-form.html?shopId=${shopId}&itemId=${itemId}`;
}

document.getElementById('newOrderBtn').onclick = () => {
    window.location.href = `/shop-templates/meat/order-form.html?shopId=${shopId}`;
};
document.getElementById('billingBtn').onclick = () => {
    window.location.href = `/shop-templates/meat/billing.html?shopId=${shopId}`;
};

loadShopData();
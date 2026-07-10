const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const orders = shop.orders || [
        {id: 'P001', customer: 'Rahul', items: 'Margherita + Coke', amount: 350, status: 'preparing', time: 15},
        {id: 'P002', customer: 'Priya', items: 'Farmhouse Pizza', amount: 450, status: 'baking', time: 20},
        {id: 'P003', customer: 'Aman', items: 'Burger + Fries', amount: 200, status: 'out', time: 5}
    ];

    const menu = shop.menu || [
        {name: 'Margherita Pizza', price: 199, type: 'Pizza', sold: 45},
        {name: 'Farmhouse Pizza', price: 399, type: 'Pizza', sold: 60},
        {name: 'Veg Burger', price: 80, type: 'Burger', sold: 70},
        {name: 'White Pasta', price: 150, type: 'Pasta', sold: 30}
    ];

    document.getElementById('pizza').innerText = orders.filter(o => o.items.includes('Pizza')).length;
    document.getElementById('active').innerText = orders.length;
    document.getElementById('revenue').innerText = orders.reduce((a,b) => a+b.amount, 0);

    loadOrders(orders);
    loadMenu(menu);
    loadStock();
    loadTopSelling(menu);
}

function loadOrders(orders) {
    const container = document.getElementById('orderList');
    container.innerHTML = orders.map(o => `
        <div class="order-card">
            <div style="display:flex; justify-content:space-between;">
                <div>
                    <h4>Order #${o.id} - ${o.customer}</h4>
                    <p style="color:#64748b; font-size:14px;">${o.items}</p>
                    <p style="color:#dc2626; font-weight:700;">₹${o.amount} | ${o.time} min left</p>
                </div>
                <span class="status ${o.status}">${o.status}</span>
            </div>
            <button onclick="updateStatus('${o.id}')" class="btn" style="margin-top:10px; width:100%;">Update Status</button>
        </div>
    `).join('');
}

function loadMenu(menu) {
    const container = document.getElementById('menuList');
    container.innerHTML = menu.map(m => `
        <div style="display:flex; justify-content:space-between; padding:12px; border-bottom:1px solid #fee2e2;">
            <span>${m.name}</span>
            <strong style="color:#dc2626;">₹${m.price}</strong>
        </div>
    `).join('');
}

function loadStock() {
    const stock = ['Cheese', 'Tomato', 'Onion', 'Capsicum', 'Chicken', 'Bread'];
    document.getElementById('stock').innerHTML = stock.map(s => `
        <div style="padding:8px; border-bottom:1px solid #fee2e2;">✓ ${s} - In Stock</div>
    `).join('');
}

function loadTopSelling(menu) {
    const sorted = [...menu].sort((a,b) => b.sold - a.sold).slice(0,5);
    document.getElementById('topSelling').innerHTML = sorted.map((m,i) => `
        <div style="display:flex; justify-content:space-between; padding:10px;">
            <span>${i+1}. ${m.name}</span>
            <span>${m.sold} sold</span>
        </div>
    `).join('');
}

function updateStatus(id) {
    alert(`Order ${id} status updated`);
    loadShopData();
}

document.getElementById('addItemBtn').onclick = () => {
    window.location.href = `/shop-templates/pizza/item-form.html?shopId=${shopId}`;
};
document.getElementById('newOrderBtn').onclick = () => {
    window.location.href = `/shop-templates/pizza/order-form.html?shopId=${shopId}`;
};

loadShopData();
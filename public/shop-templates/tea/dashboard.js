const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const orders = shop.orders || [];
    const menu = shop.menu || [];

    document.getElementById('todayOrders').innerText = orders.length;
    document.getElementById('teaSold').innerText = orders.reduce((sum, o) => sum + (o.teaCount || 0), 0);
    document.getElementById('todayRevenue').innerText = shop.todayRevenue || 0;
    document.getElementById('customers').innerText = shop.customers || 0;

    loadOrders(orders);
    loadMenu(menu);
}

function loadOrders(orders) {
    const container = document.getElementById('orderList');
    if (orders.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#94a3b8; padding:40px;">No orders today</p>`;
        return;
    }
    container.innerHTML = orders.slice(0, 10).map(o => `
        <div class="order-card">
            <div>
                <h4>Order #${o.id} - ${o.items?.join(', ')}</h4>
                <p style="color:#64748b; font-size:14px;">₹${o.total} | ${o.paymentType || 'Cash'}</p>
            </div>
            <div class="order-time">${o.time || 'Now'}</div>
        </div>
    `).join('');
}

function loadMenu(menu) {
    const grid = document.getElementById('menuGrid');
    const defaultMenu = [
        {name: 'Regular Chai', price: 10}, {name: 'Special Tea', price: 15}, {name: 'Ginger Tea', price: 12},
        {name: 'Coffee', price: 20}, {name: 'Samosa', price: 15}, {name: 'Bun Maska', price: 25}
    ];
    const data = menu.length > 0? menu : defaultMenu;

    grid.innerHTML = data.map(m => `
        <div class="menu-item">
            <h4>${m.name}</h4>
            <div class="price">₹${m.price}</div>
        </div>
    `).join('');
}

document.getElementById('addMenuBtn').onclick = () => {
    window.location.href = `/shop-templates/tea/menu-form.html?shopId=${shopId}`;
};

loadShopData();
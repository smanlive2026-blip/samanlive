const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: 'White Bread', price: 30, stock: 50, type: 'Bread', expiry: 3},
        {name: 'Brown Bread', price: 40, stock: 30, type: 'Bread', expiry: 3},
        {name: 'Pav', price: 20, stock: 100, type: 'Bread', expiry: 2},
        {name: 'Rusks', price: 60, stock: 40, type: 'Biscuit', expiry: 30},
        {name: 'Cookies', price: 80, stock: 60, type: 'Biscuit', expiry: 15},
        {name: 'Puff Pastry', price: 15, stock: 80, type: 'Pastry', expiry: 1},
        {name: 'Cream Roll', price: 20, stock: 60, type: 'Pastry', expiry: 1},
        {name: 'Donut', price: 30, stock: 50, type: 'Pastry', expiry: 2}
    ];

    const cakeOrders = shop.cakeOrders || [];

    document.getElementById('cakeOrders').innerText = cakeOrders.length;
    document.getElementById('breadSold').innerText = products.filter(p => p.type==='Bread').reduce((a,b) => a+b.stock, 0);
    document.getElementById('revenue').innerText = shop.todayRevenue || 0;
    document.getElementById('customOrders').innerText = cakeOrders.filter(c => c.isCustom).length;

    loadProducts(products);
    loadCakeOrders(cakeOrders);
    loadExpiryAlerts(products);
    loadBestSellers();
}

function loadProducts(products) {
    const container = document.getElementById('productList');
    container.innerHTML = products.map(p => `
        <div style="display:flex; justify-content:space-between; padding:15px; border-bottom:1px solid #fce7f3;">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">${p.type} | Stock: ${p.stock}</p>
            </div>
            <div style="text-align:right;">
                <strong style="color:#ec4899;">₹${p.price}</strong><br>
                <span class="${p.expiry<=2?'expiry-badge':'fresh-badge'}">${p.expiry} days left</span>
            </div>
        </div>
    `).join('');
}

function loadCakeOrders(orders) {
    const container = document.getElementById('cakeOrderList');
    if (orders.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#94a3b8; padding:40px;">No cake orders</p>`;
        return;
    }
    container.innerHTML = orders.map(o => `
        <div class="order-card">
            <h4>${o.customerName} - ${o.flavour} Cake ${o.weight}kg</h4>
            <p style="color:#64748b; font-size:14px;">Date: ${o.deliveryDate} | ₹${o.price}</p>
            <p style="color:#64748b; font-size:12px;">Message: "${o.message}"</p>
        </div>
    `).join('');
}

function loadExpiryAlerts(products) {
    const container = document.getElementById('expiryAlerts');
    const expiring = products.filter(p => p.expiry <= 2);
    if (expiring.length === 0) {
        container.innerHTML = `<p style="color:#16a34a;">All items fresh ✓</p>`;
        return;
    }
    container.innerHTML = expiring.map(p => `
        <div style="background:#fef3c7; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${p.name}</strong> - Only ${p.expiry} day left<br>
            <span style="font-size:12px;">Stock: ${p.stock} pcs</span>
        </div>
    `).join('');
}

function loadBestSellers() {
    const items = ['Chocolate Cake', 'White Bread', 'Puff Pastry', 'Cookies'];
    document.getElementById('bestSellers').innerHTML = items.map((i, idx) => `
        <div style="display:flex; justify-content:space-between; padding:10px;">
            <span>${idx+1}. ${i}</span>
        </div>
    `).join('');
}

document.getElementById('addCakeBtn').onclick = () => {
    window.location.href = `/shop-templates/bakery/cake-form.html?shopId=${shopId}`;
};
document.getElementById('addItemBtn').onclick = () => {
    window.location.href = `/shop-templates/bakery/item-form.html?shopId=${shopId}`;
};

loadShopData();
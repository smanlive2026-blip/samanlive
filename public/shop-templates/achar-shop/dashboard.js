const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: 'Aam Ka Achar', price: 200, stock: 40, weight: '500g,1kg', type: 'Aam', taste: 'Khatta Teekha', oil: 'Mustard Oil'},
        {name: 'Nimbu Ka Achar', price: 180, stock: 35, weight: '500g,1kg', type: 'Nimbu', taste: 'Khatta', oil: 'Oil Free'},
        {name: 'Mirchi Ka Achar', price: 220, stock: 25, weight: '500g', type: 'Mirchi', taste: 'Teekha', oil: 'Mustard Oil'},
        {name: 'Mix Achar', price: 250, stock: 30, weight: '1kg', type: 'Mix', taste: 'Khatta Meetha', oil: 'Mustard Oil'},
        {name: 'Gajar Gobhi Achar', price: 240, stock: 20, weight: '500g', type: 'Seasonal', taste: 'Khatta', oil: 'Oil Free'}
    ];

    const orders = shop.orders || [
        {id: 'AC001', customer: 'Ramesh', items: '2kg Aam + 1kg Mix', amount: 650},
        {id: 'AC002', customer: 'Sita', items: '500g Nimbu + 500g Mirchi', amount: 400}
    ];

    document.getElementById('products').innerText = products.length;
    document.getElementById('orders').innerText = orders.length;
    document.getElementById('kg').innerText = 15;
    document.getElementById('revenue').innerText = orders.reduce((a,b) => a+b.amount, 0);

    loadInventory(products);
    loadOrders(orders);
    loadCategories();
    loadStockAlert(products);
}

function loadInventory(products) {
    const container = document.getElementById('inventoryList');
    container.innerHTML = products.map(p => `
        <div class="achar-row">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">${p.type} | ${p.taste} | ${p.oil} | Stock: ${p.stock} Jar</p>
                <span class="weight-badge">${p.weight}</span>
            </div>
            <strong style="color:#eab308;">₹${p.price}</strong>
        </div>
    `).join('');
}

function loadOrders(orders) {
    const container = document.getElementById('orderList');
    container.innerHTML = orders.map(o => `
        <div style="border:2px solid #fef9c3; border-radius:12px; padding:15px; margin-bottom:12px;">
            <h4>${o.customer}</h4>
            <p style="color:#64748b; font-size:14px;">Order: ${o.id} | ${o.items}</p>
            <strong style="color:#eab308;">₹${o.amount}</strong>
        </div>
    `).join('');
}

function loadCategories() {
    const cats = ['Aam', 'Nimbu', 'Mirchi', 'Mix', 'Seasonal', 'Oil Free', 'Homemade', 'Gift Pack'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #fef9c3;">✓ ${c}</div>
    `).join('');
}

function loadStockAlert(products) {
    const low = products.filter(p => p.stock < 25);
    const container = document.getElementById('stockAlert');
    container.innerHTML = low.length === 0 ? '<p style="color:#16a34a;">Stock OK ✓</p>' : 
        low.map(p => `<div style="background:#fef3c7; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${p.name}</strong> - Only ${p.stock} Jar left
        </div>`).join('');
}

document.getElementById('addAcharBtn').onclick = () => {
    window.location.href = `/shop-templates/achar-shop/achar-form.html?shopId=${shopId}`;
};
document.getElementById('newOrderBtn').onclick = () => {
    window.location.href = `/shop-templates/achar-shop/billing.html?shopId=${shopId}`;
};

loadShopData();
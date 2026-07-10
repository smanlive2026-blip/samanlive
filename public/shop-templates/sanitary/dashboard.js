const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: 'Western Toilet Seat', price: 4500, stock: 10, category: 'Toilet', brand: 'Cera'},
        {name: 'Wash Basin', price: 2200, stock: 15, category: 'Basin', brand: 'Jaquar'},
        {name: 'Tap Set', price: 1200, stock: 25, category: 'Tap', brand: 'Hindware'},
        {name: 'Shower', price: 800, stock: 20, category: 'Shower', brand: 'Kohler'}
    ];

    const orders = shop.orders || [
        {id: 'SA001', customer: 'Rahul', item: 'Toilet + Basin', amount: 8000, status: 'delivered'},
        {id: 'SA002', customer: 'Priya', item: 'Full Bathroom Set', amount: 25000, status: 'pending'}
    ];

    document.getElementById('items').innerText = products.length;
    document.getElementById('sale').innerText = orders.length;
    document.getElementById('install').innerText = orders.filter(o => o.status === 'pending').length;
    document.getElementById('revenue').innerText = orders.reduce((a,b) => a+b.amount, 0);

    loadInventory(products);
    loadOrders(orders);
    loadLowStock(products);
    loadCategories();
}

function loadInventory(products) {
    const container = document.getElementById('inventoryList');
    container.innerHTML = products.map(p => `
        <div style="display:flex; justify-content:space-between; padding:15px; border-bottom:1px solid #e0f2fe;">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">${p.category} | Stock: ${p.stock}</p>
                <span class="brand-badge">${p.brand}</span>
            </div>
            <strong style="color:#0ea5e9;">₹${p.price}</strong>
        </div>
    `).join('');
}

function loadOrders(orders) {
    const container = document.getElementById('orderList');
    container.innerHTML = orders.map(o => `
        <div class="product-card">
            <h4>${o.customer} - ${o.item}</h4>
            <p style="color:#64748b; font-size:14px;">Bill: ${o.id} | ₹${o.amount}</p>
        </div>
    `).join('');
}

function loadLowStock(products) {
    const low = products.filter(p => p.stock < 5);
    const container = document.getElementById('lowStock');
    container.innerHTML = low.length === 0 ? '<p style="color:#16a34a;">Stock OK ✓</p>' : 
        low.map(p => `<div style="background:#fef3c7; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${p.name}</strong> - Only ${p.stock} left
        </div>`).join('');
}

function loadCategories() {
    const cats = ['Toilet Seat', 'Wash Basin', 'Tap & Faucet', 'Shower', 'Flush Tank', 'Tiles', 'Accessories', 'Plumbing'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #e0f2fe;">✓ ${c}</div>
    `).join('');
}

document.getElementById('addItemBtn').onclick = () => {
    window.location.href = `/shop-templates/sanitary/item-form.html?shopId=${shopId}`;
};
document.getElementById('newOrderBtn').onclick = () => {
    window.location.href = `/shop-templates/sanitary/order-form.html?shopId=${shopId}`;
};

loadShopData();
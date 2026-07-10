const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: 'Ganesh Ji Marble', price: 4500, stock: 8, height: '18 inch', material: 'Marble', category: 'Ganesh'},
        {name: 'Krishna Radha', price: 6500, stock: 5, height: '24 inch', material: 'Fiber', category: 'Krishna'},
        {name: 'Laxmi Ganesh', price: 3200, stock: 15, height: '12 inch', material: 'Brass', category: 'Laxmi'},
        {name: 'Shivling', price: 2800, stock: 10, height: '15 inch', material: 'Marble', category: 'Shiv'},
        {name: 'Hanuman Ji', price: 3800, stock: 7, height: '20 inch', material: 'Fiber', category: 'Hanuman'}
    ];

    const orders = shop.orders || [
        {id: 'M001', customer: 'Rahul', item: 'Ganesh Murti 18"', amount: 4500, type: 'Ready'},
        {id: 'M002', customer: 'Priya', item: 'Custom Radha Krishna', amount: 12000, type: 'Custom'}
    ];

    document.getElementById('products').innerText = products.length;
    document.getElementById('customers').innerText = orders.length;
    document.getElementById('custom').innerText = orders.filter(o => o.type === 'Custom').length;
    document.getElementById('revenue').innerText = orders.reduce((a,b) => a+b.amount, 0);

    loadInventory(products);
    loadOrders(orders);
    loadCategories();
    loadFestival();
}

function loadInventory(products) {
    const container = document.getElementById('inventoryList');
    container.innerHTML = products.map(p => `
        <div style="display:flex; justify-content:space-between; padding:15px; border-bottom:1px solid #ffedd5;">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">Height: ${p.height} | Stock: ${p.stock}</p>
                <span class="material-badge">${p.material}</span>
                <span class="material-badge">${p.category}</span>
            </div>
            <strong style="color:#f97316;">₹${p.price}</strong>
        </div>
    `).join('');
}

function loadOrders(orders) {
    const container = document.getElementById('ordersList');
    container.innerHTML = orders.map(o => `
        <div class="murti-card">
            <h4>${o.customer}</h4>
            <p style="color:#64748b; font-size:14px;">Order: ${o.id} | ${o.item}</p>
            <strong style="color:#f97316;">₹${o.amount}</strong>
            <span class="material-badge">${o.type}</span>
        </div>
    `).join('');
}

function loadCategories() {
    const cats = ['Ganesh', 'Krishna', 'Laxmi', 'Shiv', 'Hanuman', 'Durga', 'Sai Baba', 'Buddha'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #ffedd5;">🛕 ${c}</div>
    `).join('');
}

function loadFestival() {
    const festivals = [
        {name: 'Diwali', date: '1 Nov 2026', demand: 'Laxmi Ganesh'},
        {name: 'Janmashtami', date: '16 Aug 2026', demand: 'Krishna Murti'}
    ];
    document.getElementById('festival').innerHTML = festivals.map(f => `
        <div style="background:#ffedd5; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${f.name}</strong>
            <p style="font-size:12px; color:#64748b;">${f.date} | Demand: ${f.demand}</p>
        </div>
    `).join('');
}

document.getElementById('addMurtiBtn').onclick = () => {
    window.location.href = `/shop-templates/murti-shop/murti-form.html?shopId=${shopId}`;
};
document.getElementById('newOrderBtn').onclick = () => {
    window.location.href = `/shop-templates/murti-shop/order-form.html?shopId=${shopId}`;
};

loadShopData();
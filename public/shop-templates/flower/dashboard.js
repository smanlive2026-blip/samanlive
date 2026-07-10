const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const flowers = shop.flowers || [
        {name: 'Rose', price: 20, stock: 200, type: 'Loose', freshness: 'Fresh'},
        {name: 'Marigold', price: 15, stock: 300, type: 'Garland', freshness: 'Fresh'},
        {name: 'Bouquet', price: 300, stock: 15, type: 'Bouquet', freshness: 'Fresh'},
        {name: 'Orchid', price: 50, stock: 50, type: 'Decor', freshness: 'Fresh'}
    ];

    const orders = shop.orders || [
        {id: 'F001', customer: 'Rahul', item: 'Wedding Bouquet', amount: 1500, status: 'delivered'},
        {id: 'F002', customer: 'Priya', item: 'Birthday Flowers', amount: 500, status: 'pending'}
    ];

    document.getElementById('flowers').innerText = flowers.length;
    document.getElementById('orders').innerText = orders.length;
    document.getElementById('delivery').innerText = orders.filter(o => o.status === 'pending').length;
    document.getElementById('revenue').innerText = orders.reduce((a,b) => a+b.amount, 0);

    loadFlowers(flowers);
    loadOrders(orders);
    loadFreshAlert(flowers);
    loadCategories();
}

function loadFlowers(flowers) {
    const container = document.getElementById('flowerList');
    container.innerHTML = flowers.map(f => `
        <div style="display:flex; justify-content:space-between; padding:15px; border-bottom:1px solid #fce7f3;">
            <div>
                <strong>${f.name}</strong>
                <p style="color:#64748b; font-size:12px;">${f.type} | Stock: ${f.stock}</p>
                <span class="fresh-badge">${f.freshness}</span>
            </div>
            <strong style="color:#ec4899;">₹${f.price}</strong>
        </div>
    `).join('');
}

function loadOrders(orders) {
    const container = document.getElementById('orderList');
    container.innerHTML = orders.map(o => `
        <div class="order-card">
            <h4>${o.customer} - ${o.item}</h4>
            <p style="color:#64748b; font-size:14px;">Bill: ${o.id} | ₹${o.amount}</p>
        </div>
    `).join('');
}

function loadFreshAlert(flowers) {
    const low = flowers.filter(f => f.stock < 30);
    const container = document.getElementById('freshAlert');
    container.innerHTML = low.length === 0 ? '<p style="color:#16a34a;">Stock Fresh ✓</p>' : 
        low.map(f => `<div style="background:#fef3c7; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${f.name}</strong> - Only ${f.stock} left. Restock!
        </div>`).join('');
}

function loadCategories() {
    const cats = ['Loose Flowers', 'Bouquet', 'Garland', 'Decoration', 'Pooja Flowers', 'Wedding', 'Gift'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #fce7f3;">✓ ${c}</div>
    `).join('');
}

document.getElementById('addFlowerBtn').onclick = () => {
    window.location.href = `/shop-templates/flower/flower-form.html?shopId=${shopId}`;
};
document.getElementById('newOrderBtn').onclick = () => {
    window.location.href = `/shop-templates/flower/order-form.html?shopId=${shopId}`;
};

loadShopData();
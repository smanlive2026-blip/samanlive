const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: '3 Seater Sofa', price: 25000, stock: 5, category: 'Sofa'},
        {name: 'King Size Bed', price: 35000, stock: 3, category: 'Bed'},
        {name: 'Dining Table 6 Seater', price: 28000, stock: 4, category: 'Table'},
        {name: 'Office Chair', price: 8000, stock: 15, category: 'Chair'}
    ];

    const orders = shop.orders || [
        {id: 'F001', customer: 'Rahul', item: 'Sofa Set', amount: 45000, status: 'delivered'},
        {id: 'F002', customer: 'Priya', item: 'King Bed', amount: 35000, status: 'pending'}
    ];

    document.getElementById('items').innerText = products.length;
    document.getElementById('orders').innerText = orders.length;
    document.getElementById('delivery').innerText = orders.filter(o => o.status === 'pending').length;
    document.getElementById('revenue').innerText = orders.reduce((a,b) => a+b.amount, 0);

    loadProducts(products);
    loadOrders(orders);
    loadLowStock(products);
    loadCategories();
}

function loadProducts(products) {
    const container = document.getElementById('productList');
    container.innerHTML = products.map(p => `
        <div style="display:flex; justify-content:space-between; padding:15px; border-bottom:1px solid #fef3c7;">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">${p.category} | Stock: ${p.stock}</p>
            </div>
            <strong style="color:#a16207;">₹${p.price}</strong>
        </div>
    `).join('');
}

function loadOrders(orders) {
    const container = document.getElementById('orderList');
    container.innerHTML = orders.map(o => `
        <div class="order-card">
            <h4>${o.customer} - ${o.item}</h4>
            <p style="color:#64748b; font-size:14px;">Order ID: ${o.id} | ₹${o.amount}</p>
            <span class="delivery-badge">${o.status}</span>
        </div>
    `).join('');
}

function loadLowStock(products) {
    const low = products.filter(p => p.stock < 3);
    const container = document.getElementById('lowStock');
    container.innerHTML = low.length === 0 ? '<p style="color:#16a34a;">Stock OK ✓</p>' : 
        low.map(p => `<div style="background:#fef3c7; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${p.name}</strong> - Only ${p.stock} left
        </div>`).join('');
}

function loadCategories() {
    const cats = ['Sofa', 'Bed', 'Dining Table', 'Wardrobe', 'Chair', 'Study Table', 'Office Furniture', 'Storage'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #fef3c7;">✓ ${c}</div>
    `).join('');
}

document.getElementById('addItemBtn').onclick = () => {
    window.location.href = `/shop-templates/furniture/item-form.html?shopId=${shopId}`;
};
document.getElementById('newOrderBtn').onclick = () => {
    window.location.href = `/shop-templates/furniture/order-form.html?shopId=${shopId}`;
};

loadShopData();
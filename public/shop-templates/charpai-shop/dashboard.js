const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: 'Wooden Charpai', price: 3500, stock: 15, size: '6x3 ft', type: 'Charpai', material: 'Sheesham Wood', bunai: 'Nylon Rassi'},
        {name: 'Iron Charpai', price: 2200, stock: 20, size: '6x3 ft', type: 'Charpai', material: 'Iron Pipe', bunai: 'Cotton Rassi'},
        {name: 'Nylon Rassi', price: 150, stock: 50, size: '20 Meter Roll', type: 'Rassi', material: 'Nylon', bunai: 'Heavy'},
        {name: 'Cotton Rassi', price: 120, stock: 40, size: '15 Meter Roll', type: 'Rassi', material: 'Cotton', bunai: 'Normal'},
        {name: 'Charpai Gadda', price: 800, stock: 25, size: '6x3 ft', type: 'Gadda', material: 'Foam', bunai: 'Cover'},
        {name: 'Bunai Service', price: 400, stock: 999, size: 'Per Charpai', type: 'Service', material: 'Labor', bunai: '1 Day'}
    ];

    const orders = shop.orders || [
        {id: 'CP001', customer: 'Ramesh', items: '2 Wooden Charpai', amount: 7000},
        {id: 'CP002', customer: 'Sita', items: '5 Nylon Rassi Roll', amount: 750}
    ];

    document.getElementById('products').innerText = products.length;
    document.getElementById('orders').innerText = orders.length;
    document.getElementById('bunai').innerText = 3;
    document.getElementById('revenue').innerText = orders.reduce((a,b) => a+b.amount, 0);

    loadInventory(products);
    loadOrders(orders);
    loadCategories();
    loadDelivery();
}

function loadInventory(products) {
    const container = document.getElementById('inventoryList');
    container.innerHTML = products.map(p => `
        <div class="item-row">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">${p.type} | ${p.material} | Stock: ${p.stock}</p>
                <span class="size-badge">${p.size}</span>
                <span class="size-badge">${p.bunai}</span>
            </div>
            <strong style="color:#92400e;">₹${p.price}</strong>
        </div>
    `).join('');
}

function loadOrders(orders) {
    const container = document.getElementById('orderList');
    container.innerHTML = orders.map(o => `
        <div style="border:2px solid #ffedd5; border-radius:12px; padding:15px; margin-bottom:12px;">
            <h4>${o.customer}</h4>
            <p style="color:#64748b; font-size:14px;">Order: ${o.id} | ${o.items}</p>
            <strong style="color:#92400e;">₹${o.amount}</strong>
        </div>
    `).join('');
}

function loadCategories() {
    const cats = ['Wooden Charpai', 'Iron Charpai', 'Nylon Rassi', 'Cotton Rassi', 'Charpai Gadda', 'Bunai Service', 'Repair'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #ffedd5;">✓ ${c}</div>
    `).join('');
}

function loadDelivery() {
    const delivers = [
        {customer: 'Amit', work: '3 Charpai Delivery', date: '15 Oct 2026'},
        {customer: 'Priya', work: 'Bunai Service', date: '16 Oct 2026'}
    ];
    document.getElementById('delivery').innerHTML = delivers.map(d => `
        <div style="background:#ffedd5; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${d.customer}</strong>
            <p style="font-size:12px; color:#64748b;">${d.work} | ${d.date}</p>
        </div>
    `).join('');
}

document.getElementById('addItemBtn').onclick = () => {
    window.location.href = `/shop-templates/charpai-shop/item-form.html?shopId=${shopId}`;
};
document.getElementById('newOrderBtn').onclick = () => {
    window.location.href = `/shop-templates/charpai-shop/billing.html?shopId=${shopId}`;
};

loadShopData();
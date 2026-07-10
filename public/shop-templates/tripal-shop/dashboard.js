const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: 'HDPE Tripal', price: 1800, stock: 25, size: '20x30 ft', gsm: '120 GSM', color: 'Blue', use: 'Truck'},
        {name: 'LDPE Tripal', price: 1200, stock: 30, size: '15x20 ft', gsm: '90 GSM', color: 'Orange', use: 'Kheti'},
        {name: 'Canvas Tripal', price: 3500, stock: 15, size: '25x40 ft', gsm: '200 GSM', color: 'Green', use: 'Mandi'},
        {name: 'UV Tripal', price: 2200, stock: 20, size: '18x24 ft', gsm: '140 GSM', color: 'White', use: 'Roof'},
        {name: 'Truck Body Cover', price: 4500, stock: 10, size: '32x8 ft', gsm: '160 GSM', color: 'Blue', use: 'Truck'}
    ];

    const bills = shop.bills || [
        {id: 'TR001', customer: 'Ramesh Transport', items: '2 Truck Tripal', amount: 9000},
        {id: 'TR002', customer: 'Sita Mandi', items: 'Canvas Tripal 25x40', amount: 3500}
    ];

    document.getElementById('products').innerText = products.length;
    document.getElementById('customers').innerText = bills.length;
    document.getElementById('truck').innerText = 2;
    document.getElementById('revenue').innerText = bills.reduce((a,b) => a+b.amount, 0);

    loadInventory(products);
    loadBills(bills);
    loadCategories();
    loadStockAlert(products);
}

function loadInventory(products) {
    const container = document.getElementById('inventoryList');
    container.innerHTML = products.map(p => `
        <div class="tripal-row">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">${p.use} | ${p.color}</p>
                <span class="size-badge">${p.size}</span>
                <span class="size-badge">${p.gsm}</span>
                <p style="color:#64748b; font-size:12px; margin-top:4px;">Stock: ${p.stock}</p>
            </div>
            <strong style="color:#f59e0b;">₹${p.price}</strong>
        </div>
    `).join('');
}

function loadBills(bills) {
    const container = document.getElementById('billsList');
    container.innerHTML = bills.map(b => `
        <div style="border:2px solid #fef3c7; border-radius:12px; padding:15px; margin-bottom:12px;">
            <h4>${b.customer}</h4>
            <p style="color:#64748b; font-size:14px;">Bill: ${b.id} | ${b.items}</p>
            <strong style="color:#f59e0b;">₹${b.amount}</strong>
        </div>
    `).join('');
}

function loadCategories() {
    const cats = ['Truck Tripal', 'Kheti Tripal', 'Mandi Tripal', 'Construction', 'Roof Cover', 'Canvas', 'HDPE', 'LDPE'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #fef3c7;">✓ ${c}</div>
    `).join('');
}

function loadStockAlert(products) {
    const low = products.filter(p => p.stock < 15);
    const container = document.getElementById('stockAlert');
    container.innerHTML = low.length === 0 ? '<p style="color:#16a34a;">Stock OK ✓</p>' : 
        low.map(p => `<div style="background:#fef3c7; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${p.name}</strong> - Only ${p.stock} left
        </div>`).join('');
}

document.getElementById('addTripalBtn').onclick = () => {
    window.location.href = `/shop-templates/tripal-shop/tripal-form.html?shopId=${shopId}`;
};
document.getElementById('newBillBtn').onclick = () => {
    window.location.href = `/shop-templates/tripal-shop/billing.html?shopId=${shopId}`;
};

loadShopData();
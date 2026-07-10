const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: 'Cotton Fabric', price: 120, stock: 200, unit: 'Per Meter', type: 'Cotton', use: 'Shirt, Suit', brand: 'Vimal'},
        {name: 'Silk Fabric', price: 450, stock: 80, unit: 'Per Meter', type: 'Silk', use: 'Saree, Kurta', brand: 'Bansari'},
        {name: 'Rayon Fabric', price: 180, stock: 150, unit: 'Per Meter', type: 'Rayon', use: 'Kurti, Gown', brand: 'Liva'},
        {name: 'Georgette Fabric', price: 250, stock: 100, unit: 'Per Meter', type: 'Georgette', use: 'Saree, Suit', brand: 'Imported'},
        {name: 'Polyester Fabric', price: 90, stock: 300, unit: 'Per Meter', type: 'Polyester', use: 'Uniform', brand: 'Local'}
    ];

    const bills = shop.bills || [
        {id: 'FB001', customer: 'Ramesh Tailor', items: '10m Cotton + 5m Silk', amount: 3450},
        {id: 'FB002', customer: 'Sita', items: '6m Georgette', amount: 1500}
    ];

    document.getElementById('products').innerText = products.length;
    document.getElementById('meter').innerText = 45;
    document.getElementById('customers').innerText = bills.length;
    document.getElementById('revenue').innerText = bills.reduce((a,b) => a+b.amount, 0);

    loadInventory(products);
    loadBills(bills);
    loadCategories();
    loadStockAlert(products);
}

function loadInventory(products) {
    const container = document.getElementById('inventoryList');
    container.innerHTML = products.map(p => `
        <div class="fabric-row">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">${p.type} | Use: ${p.use} | ${p.brand} | Stock: ${p.stock}m</p>
                <span class="meter-badge">${p.unit}</span>
            </div>
            <strong style="color:#16a34a;">₹${p.price}/m</strong>
        </div>
    `).join('');
}

function loadBills(bills) {
    const container = document.getElementById('billsList');
    container.innerHTML = bills.map(b => `
        <div style="border:2px solid #dcfce7; border-radius:12px; padding:15px; margin-bottom:12px;">
            <h4>${b.customer}</h4>
            <p style="color:#64748b; font-size:14px;">Bill: ${b.id} | ${b.items}</p>
            <strong style="color:#16a34a;">₹${b.amount}</strong>
        </div>
    `).join('');
}

function loadCategories() {
    const cats = ['Cotton', 'Silk', 'Rayon', 'Georgette', 'Polyester', 'Linen', 'Denim', 'Velvet', 'Lace', 'Asthar'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #dcfce7;">✓ ${c}</div>
    `).join('');
}

function loadStockAlert(products) {
    const low = products.filter(p => p.stock < 100);
    const container = document.getElementById('stockAlert');
    container.innerHTML = low.length === 0 ? '<p style="color:#16a34a;">Stock OK ✓</p>' : 
        low.map(p => `<div style="background:#fef3c7; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${p.name}</strong> - Only ${p.stock}m left
        </div>`).join('');
}

document.getElementById('addFabricBtn').onclick = () => {
    window.location.href = `/shop-templates/fabric-shop/fabric-form.html?shopId=${shopId}`;
};
document.getElementById('newBillBtn').onclick = () => {
    window.location.href = `/shop-templates/fabric-shop/billing.html?shopId=${shopId}`;
};

loadShopData();
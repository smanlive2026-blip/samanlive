const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: 'Yoga Mat Pro', price: 1299, stock: 30, size: '6x2 ft', thickness: '6mm', material: 'TPE', category: 'Yoga'},
        {name: 'Gym Exercise Mat', price: 2200, stock: 20, size: '8x4 ft', thickness: '15mm', material: 'Foam', category: 'Gym'},
        {name: 'Meditation Mat', price: 899, stock: 25, size: '5x2 ft', thickness: '4mm', material: 'Cotton', category: 'Meditation'},
        {name: 'Kids Play Mat', price: 1800, stock: 15, size: '6x6 ft', thickness: '20mm', material: 'EVA', category: 'Kids'},
        {name: 'Pilates Mat', price: 1500, stock: 18, size: '6x2 ft', thickness: '10mm', material: 'NBR', category: 'Pilates'}
    ];

    const sales = shop.sales || [
        {id: 'MT001', customer: 'Rahul', item: 'Yoga Mat Pro', amount: 1299},
        {id: 'MT002', customer: 'Yoga Center', item: '10 Gym Mats', amount: 22000, bulk: true}
    ];

    document.getElementById('products').innerText = products.length;
    document.getElementById('customers').innerText = sales.length;
    document.getElementById('bulk').innerText = sales.filter(s => s.bulk).length;
    document.getElementById('revenue').innerText = sales.reduce((a,b) => a+b.amount, 0);

    loadInventory(products);
    loadSales(sales);
    loadCategories();
    loadStockAlert(products);
}

function loadInventory(products) {
    const container = document.getElementById('inventoryList');
    container.innerHTML = products.map(p => `
        <div class="mat-row">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">${p.category}</p>
                <span class="spec-badge">${p.size}</span>
                <span class="spec-badge">${p.thickness}</span>
                <span class="spec-badge">${p.material}</span>
                <p style="color:#64748b; font-size:12px; margin-top:4px;">Stock: ${p.stock}</p>
            </div>
            <strong style="color:#22c55e;">₹${p.price}</strong>
        </div>
    `).join('');
}

function loadSales(sales) {
    const container = document.getElementById('salesList');
    container.innerHTML = sales.map(s => `
        <div style="border:2px solid #dcfce7; border-radius:12px; padding:15px; margin-bottom:12px;">
            <h4>${s.customer}</h4>
            <p style="color:#64748b; font-size:14px;">Bill: ${s.id} | ${s.item}</p>
            <strong style="color:#22c55e;">₹${s.amount}</strong>
            ${s.bulk ? '<span class="spec-badge">BULK</span>' : ''}
        </div>
    `).join('');
}

function loadCategories() {
    const cats = ['Yoga', 'Gym', 'Meditation', 'Pilates', 'Kids', 'Floor Mat', 'Anti-Slip'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #dcfce7;">✓ ${c}</div>
    `).join('');
}

function loadStockAlert(products) {
    const low = products.filter(p => p.stock < 20);
    const container = document.getElementById('stockAlert');
    container.innerHTML = low.length === 0 ? '<p style="color:#16a34a;">Stock OK ✓</p>' : 
        low.map(p => `<div style="background:#dcfce7; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${p.name}</strong> - Only ${p.stock} left
        </div>`).join('');
}

document.getElementById('addMatBtn').onclick = () => {
    window.location.href = `/shop-templates/mat-shop/mat-form.html?shopId=${shopId}`;
};
document.getElementById('newSaleBtn').onclick = () => {
    window.location.href = `/shop-templates/mat-shop/billing.html?shopId=${shopId}`;
};

loadShopData();
const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: 'Asian Apex Exterior', price: 2800, stock: 25, size: '20L', category: 'Exterior', brand: 'Asian Paints'},
        {name: 'Berger Silk', price: 3200, stock: 30, size: '10L', category: 'Interior', brand: 'Berger'},
        {name: 'JK Wall Putty', price: 450, stock: 50, size: '40kg', category: 'Putty', brand: 'JK'},
        {name: 'Nerolac Impressions', price: 2400, stock: 15, size: '10L', category: 'Interior', brand: 'Nerolac'},
        {name: 'Paint Brush Set', price: 350, stock: 40, size: '5pcs', category: 'Tools', brand: 'Local'}
    ];

    const bills = shop.bills || [
        {id: 'PA001', customer: 'Ramesh Contractor', items: '2 Asian Apex', amount: 5600},
        {id: 'PA002', customer: 'Sita', items: 'Berger Silk + Brush', amount: 3550}
    ];

    document.getElementById('products').innerText = products.length;
    document.getElementById('customers').innerText = bills.length;
    document.getElementById('lowStock').innerText = products.filter(p => p.stock < 20).length;
    document.getElementById('revenue').innerText = bills.reduce((a,b) => a+b.amount, 0);

    loadInventory(products);
    loadBills(bills);
    loadBrands();
    loadCategories();
}

function loadInventory(products) {
    const container = document.getElementById('inventoryList');
    container.innerHTML = products.map(p => `
        <div class="item-row">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">${p.category} | ${p.size} | Stock: ${p.stock}</p>
                <span class="brand-badge">${p.brand}</span>
            </div>
            <strong style="color:#f97316;">₹${p.price}</strong>
        </div>
    `).join('');
}

function loadBills(bills) {
    const container = document.getElementById('billsList');
    container.innerHTML = bills.map(b => `
        <div style="border:2px solid #ffedd5; border-radius:12px; padding:15px; margin-bottom:12px;">
            <h4>Bill #${b.id} - ${b.customer}</h4>
            <p style="color:#64748b; font-size:14px;">${b.items}</p>
            <strong style="color:#f97316;">₹${b.amount}</strong>
        </div>
    `).join('');
}

function loadBrands() {
    const brands = ['Asian Paints', 'Berger', 'Nerolac', 'Indigo', 'JK', 'Birla'];
    document.getElementById('brands').innerHTML = brands.map(b => `
        <div style="padding:8px; border-bottom:1px solid #ffedd5;">✓ ${b}</div>
    `).join('');
}

function loadCategories() {
    const cats = ['Interior Paint', 'Exterior Paint', 'Enamel', 'Primer', 'Putty', 'Tools', 'Distemper'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #ffedd5;">✓ ${c}</div>
    `).join('');
}

document.getElementById('addStockBtn').onclick = () => {
    window.location.href = `/shop-templates/paint-shop/stock-form.html?shopId=${shopId}`;
};
document.getElementById('newBillBtn').onclick = () => {
    window.location.href = `/shop-templates/paint-shop/billing.html?shopId=${shopId}`;
};

loadShopData();
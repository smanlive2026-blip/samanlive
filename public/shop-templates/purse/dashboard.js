const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: 'Tote Bag', price: 1299, stock: 25, category: 'Tote', material: 'Leather', color: '#000', trend: true},
        {name: 'Sling Bag', price: 799, stock: 40, category: 'Sling', material: 'PU', color: '#ec4899', trend: true},
        {name: 'Clutch', price: 599, stock: 15, category: 'Clutch', material: 'Silk', color: '#facc15', trend: false},
        {name: 'Ladies Wallet', price: 399, stock: 50, category: 'Wallet', material: 'PU', color: '#8b5cf6', trend: false}
    ];

    const sales = shop.sales || [
        {id: 'P001', customer: 'Priya', item: 'Sling Bag Pink', amount: 799},
        {id: 'P002', customer: 'Anita', item: 'Tote Bag Black', amount: 1299}
    ];

    document.getElementById('products').innerText = products.length;
    document.getElementById('customers').innerText = sales.length;
    document.getElementById('trending').innerText = products.filter(p => p.trend).length;
    document.getElementById('revenue').innerText = sales.reduce((a,b) => a+b.amount, 0);

    loadInventory(products);
    loadSales(sales);
    loadStockAlert(products);
    loadCategories();
}

function loadInventory(products) {
    const container = document.getElementById('inventoryList');
    container.innerHTML = products.map(p => `
        <div style="display:flex; justify-content:space-between; padding:15px; border-bottom:1px solid #fce7f3;">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">${p.category} | ${p.material} | Stock: ${p.stock}</p>
                <span class="color-dot" style="background:${p.color};"></span> ${p.color}
            </div>
            <strong style="color:#ec4899;">₹${p.price}</strong>
        </div>
    `).join('');
}

function loadSales(sales) {
    const container = document.getElementById('salesList');
    container.innerHTML = sales.map(s => `
        <div class="purse-card">
            <h4>${s.customer}</h4>
            <p style="color:#64748b; font-size:14px;">Bill: ${s.id} | ${s.item} | ₹${s.amount}</p>
        </div>
    `).join('');
}

function loadStockAlert(products) {
    const low = products.filter(p => p.stock < 20);
    const container = document.getElementById('stockAlert');
    container.innerHTML = low.length === 0 ? '<p style="color:#16a34a;">Stock OK ✓</p>' : 
        low.map(p => `<div style="background:#fce7f3; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${p.name}</strong> - Only ${p.stock} left
        </div>`).join('');
}

function loadCategories() {
    const cats = ['Tote', 'Sling', 'Clutch', 'Backpack', 'Wallet', 'College Bag', 'Office Bag'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #fce7f3;">✓ ${c}</div>
    `).join('');
}

document.getElementById('addProductBtn').onclick = () => {
    window.location.href = `/shop-templates/purse/product-form.html?shopId=${shopId}`;
};
document.getElementById('newSaleBtn').onclick = () => {
    window.location.href = `/shop-templates/purse/billing.html?shopId=${shopId}`;
};

loadShopData();
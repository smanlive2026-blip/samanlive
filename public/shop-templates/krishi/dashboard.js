const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: 'Urea 50kg', price: 266, stock: 100, category: 'Khad', brand: 'IFFCO'},
        {name: 'DAP 50kg', price: 1350, stock: 60, category: 'Khad', brand: 'Coromandel'},
        {name: 'Wheat Seed', price: 3200, stock: 40, category: 'Beej', brand: 'Nath'},
        {name: 'Pesticide', price: 850, stock: 25, category: 'Dawai', brand: 'Bayer'}
    ];

    const sales = shop.sales || [
        {id: 'K001', farmer: 'Ramesh Patel', item: 'Urea 2 Bag', amount: 532},
        {id: 'K002', farmer: 'Suresh', item: 'Wheat Seed 10kg', amount: 640}
    ];

    document.getElementById('products').innerText = products.length;
    document.getElementById('farmers').innerText = sales.length;
    document.getElementById('lowStock').innerText = products.filter(p => p.stock < 20).length;
    document.getElementById('revenue').innerText = sales.reduce((a,b) => a+b.amount, 0);

    loadInventory(products);
    loadSales(sales);
    loadStockAlert(products);
    loadCategories();
}

function loadInventory(products) {
    const container = document.getElementById('inventoryList');
    container.innerHTML = products.map(p => `
        <div style="display:flex; justify-content:space-between; padding:15px; border-bottom:1px solid #dcfce7;">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">${p.category} | Stock: ${p.stock}</p>
                <span class="category-badge">${p.brand}</span>
            </div>
            <strong style="color:#22c55e;">₹${p.price}</strong>
        </div>
    `).join('');
}

function loadSales(sales) {
    const container = document.getElementById('salesList');
    container.innerHTML = sales.map(s => `
        <div class="item-card">
            <h4>${s.farmer}</h4>
            <p style="color:#64748b; font-size:14px;">Bill: ${s.id} | ${s.item} | ₹${s.amount}</p>
        </div>
    `).join('');
}

function loadStockAlert(products) {
    const low = products.filter(p => p.stock < 20);
    const container = document.getElementById('stockAlert');
    container.innerHTML = low.length === 0 ? '<p style="color:#16a34a;">Stock OK ✓</p>' : 
        low.map(p => `<div style="background:#fef3c7; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${p.name}</strong> - Only ${p.stock} left
        </div>`).join('');
}

function loadCategories() {
    const cats = ['Khad', 'Beej', 'Dawai', 'Kheti Upkaran', 'Pashu Aahar', 'Sprayer'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #dcfce7;">✓ ${c}</div>
    `).join('');
}

document.getElementById('addStockBtn').onclick = () => {
    window.location.href = `/shop-templates/krishi/stock-form.html?shopId=${shopId}`;
};
document.getElementById('newSaleBtn').onclick = () => {
    window.location.href = `/shop-templates/krishi/sale-form.html?shopId=${shopId}`;
};

loadShopData();
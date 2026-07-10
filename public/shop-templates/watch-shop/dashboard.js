const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: 'Titan Neo', price: 3999, stock: 15, category: 'Men', brand: 'Titan', type: 'Analog', warranty: '2 Years'},
        {name: 'Fastrack Reflex', price: 2499, stock: 25, category: 'Smart', brand: 'Fastrack', type: 'Smartwatch', warranty: '1 Year'},
        {name: 'Fossil Women', price: 8999, stock: 10, category: 'Women', brand: 'Fossil', type: 'Luxury', warranty: '2 Years'},
        {name: 'Casio G-Shock', price: 12999, stock: 8, category: 'Sports', brand: 'Casio', type: 'Digital', warranty: '2 Years'}
    ];

    const sales = shop.sales || [
        {id: 'W001', customer: 'Rahul', item: 'Titan Neo Black', amount: 3999},
        {id: 'W002', customer: 'Priya', item: 'Fastrack Reflex', amount: 2499}
    ];

    document.getElementById('products').innerText = products.length;
    document.getElementById('customers').innerText = sales.length;
    document.getElementById('service').innerText = 3;
    document.getElementById('revenue').innerText = sales.reduce((a,b) => a+b.amount, 0);

    loadInventory(products);
    loadSales(sales);
    loadBrands();
    loadWarranty();
}

function loadInventory(products) {
    const container = document.getElementById('inventoryList');
    container.innerHTML = products.map(p => `
        <div class="watch-row">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">${p.category} | ${p.type} | Stock: ${p.stock}</p>
                <span class="brand-badge">${p.brand}</span>
                <span style="font-size:12px; color:#64748b;">Warranty: ${p.warranty}</span>
            </div>
            <strong style="color:#facc15;">₹${p.price}</strong>
        </div>
    `).join('');
}

function loadSales(sales) {
    const container = document.getElementById('salesList');
    container.innerHTML = sales.map(s => `
        <div style="border:2px solid #fef9c3; border-radius:12px; padding:15px; margin-bottom:12px;">
            <h4>${s.customer}</h4>
            <p style="color:#64748b; font-size:14px;">Bill: ${s.id} | ${s.item}</p>
            <strong style="color:#facc15;">₹${s.amount}</strong>
        </div>
    `).join('');
}

function loadBrands() {
    const brands = ['Titan', 'Fastrack', 'Fossil', 'Casio', 'Seiko', 'Timex', 'Sonata'];
    document.getElementById('brands').innerHTML = brands.map(b => `
        <div style="padding:8px; border-bottom:1px solid #f1f5f9;">✓ ${b}</div>
    `).join('');
}

function loadWarranty() {
    const due = [
        {customer: 'Amit', watch: 'Titan Edge', date: '15 Oct 2026'},
        {customer: 'Neha', watch: 'Fossil Chrono', date: '20 Oct 2026'}
    ];
    document.getElementById('warranty').innerHTML = due.map(w => `
        <div style="background:#fef9c3; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${w.customer}</strong>
            <p style="font-size:12px; color:#64748b;">${w.watch} | Warranty ends: ${w.date}</p>
        </div>
    `).join('');
}

document.getElementById('addWatchBtn').onclick = () => {
    window.location.href = `/shop-templates/watch-shop/product-form.html?shopId=${shopId}`;
};
document.getElementById('newSaleBtn').onclick = () => {
    window.location.href = `/shop-templates/watch-shop/billing.html?shopId=${shopId}`;
};

loadShopData();
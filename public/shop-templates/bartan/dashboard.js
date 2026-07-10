const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: 'Steel Cookware Set', price: 3500, stock: 10, category: 'Cookware'},
        {name: 'Non-Stick Pan', price: 800, stock: 25, category: 'Cookware'},
        {name: 'Dinner Set 6pc', price: 2200, stock: 15, category: 'Dinnerware'},
        {name: 'Steel Glass Set', price: 600, stock: 30, category: 'Glassware'}
    ];

    const sales = shop.sales || [
        {id: 'B001', customer: 'Rahul', item: 'Cookware Set', amount: 3500},
        {id: 'B002', customer: 'Priya', item: 'Gift Set', amount: 5000}
    ];

    document.getElementById('items').innerText = products.length;
    document.getElementById('sale').innerText = sales.length;
    document.getElementById('gift').innerText = products.filter(p => p.category === 'Gift').length;
    document.getElementById('revenue').innerText = sales.reduce((a,b) => a+b.amount, 0);

    loadInventory(products);
    loadSales(sales);
    loadLowStock(products);
    loadCategories();
}

function loadInventory(products) {
    const container = document.getElementById('inventoryList');
    container.innerHTML = products.map(p => `
        <div style="display:flex; justify-content:space-between; padding:15px; border-bottom:1px solid #f1f5f9;">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">${p.category} | Stock: ${p.stock}</p>
            </div>
            <strong style="color:#64748b;">₹${p.price}</strong>
        </div>
    `).join('');
}

function loadSales(sales) {
    const container = document.getElementById('salesList');
    container.innerHTML = sales.map(s => `
        <div class="product-card">
            <h4>${s.customer} - ${s.item}</h4>
            <p style="color:#64748b; font-size:14px;">Bill: ${s.id} | ₹${s.amount}</p>
        </div>
    `).join('');
}

function loadLowStock(products) {
    const low = products.filter(p => p.stock < 5);
    const container = document.getElementById('lowStock');
    container.innerHTML = low.length === 0 ? '<p style="color:#16a34a;">Stock OK ✓</p>' : 
        low.map(p => `<div style="background:#fef3c7; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${p.name}</strong> - Only ${p.stock} left
        </div>`).join('');
}

function loadCategories() {
    const cats = ['Cookware', 'Dinnerware', 'Glassware', 'Storage', 'Kitchen Tools', 'Gift Set', 'Plastic Items', 'Appliances'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #f1f5f9;">✓ ${c}</div>
    `).join('');
}

document.getElementById('addItemBtn').onclick = () => {
    window.location.href = `/shop-templates/bartan/item-form.html?shopId=${shopId}`;
};
document.getElementById('newSaleBtn').onclick = () => {
    window.location.href = `/shop-templates/bartan/sale-form.html?shopId=${shopId}`;
};

loadShopData();
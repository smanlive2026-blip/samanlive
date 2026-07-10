const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: 'Water Bucket 20L', price: 250, stock: 50, category: 'Bucket', brand: 'Cello'},
        {name: 'Plastic Chair', price: 600, stock: 30, category: 'Furniture', brand: 'Nilkamal'},
        {name: 'Storage Box', price: 400, stock: 25, category: 'Storage', brand: 'Tupperware'},
        {name: 'Kitchen Container', price: 150, stock: 100, category: 'Kitchen', brand: 'Borosil'}
    ];

    const sales = shop.sales || [
        {id: 'P001', customer: 'Rahul', item: 'Bucket Set', amount: 1200},
        {id: 'P002', customer: 'Priya', item: 'Chair 4pc', amount: 2400}
    ];

    document.getElementById('items').innerText = products.length;
    document.getElementById('sale').innerText = sales.length;
    document.getElementById('wholesale').innerText = products.filter(p => p.stock > 50).length;
    document.getElementById('revenue').innerText = sales.reduce((a,b) => a+b.amount, 0);

    loadInventory(products);
    loadSales(sales);
    loadLowStock(products);
    loadCategories();
}

function loadInventory(products) {
    const container = document.getElementById('inventoryList');
    container.innerHTML = products.map(p => `
        <div style="display:flex; justify-content:space-between; padding:15px; border-bottom:1px solid #dbeafe;">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">${p.category} | Stock: ${p.stock}</p>
                <span class="category-badge">${p.brand}</span>
            </div>
            <strong style="color:#3b82f6;">₹${p.price}</strong>
        </div>
    `).join('');
}

function loadSales(sales) {
    const container = document.getElementById('salesList');
    container.innerHTML = sales.map(s => `
        <div class="item-card">
            <h4>${s.customer} - ${s.item}</h4>
            <p style="color:#64748b; font-size:14px;">Bill: ${s.id} | ₹${s.amount}</p>
        </div>
    `).join('');
}

function loadLowStock(products) {
    const low = products.filter(p => p.stock < 10);
    const container = document.getElementById('lowStock');
    container.innerHTML = low.length === 0 ? '<p style="color:#16a34a;">Stock OK ✓</p>' : 
        low.map(p => `<div style="background:#fef3c7; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${p.name}</strong> - Only ${p.stock} left
        </div>`).join('');
}

function loadCategories() {
    const cats = ['Bucket', 'Chair', 'Storage', 'Kitchen', 'Toys', 'Home', 'Garden', 'Bathroom'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #dbeafe;">✓ ${c}</div>
    `).join('');
}

document.getElementById('addItemBtn').onclick = () => {
    window.location.href = `/shop-templates/plastic/item-form.html?shopId=${shopId}`;
};
document.getElementById('newSaleBtn').onclick = () => {
    window.location.href = `/shop-templates/plastic/sale-form.html?shopId=${shopId}`;
};

loadShopData();
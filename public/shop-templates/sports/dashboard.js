const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: 'Cricket Bat', price: 2500, stock: 15, category: 'Cricket', brand: 'MRF'},
        {name: 'Football', price: 800, stock: 20, category: 'Football', brand: 'Nivia'},
        {name: 'Badminton Racket', price: 1200, stock: 25, category: 'Badminton', brand: 'Yonex'},
        {name: 'Gym Gloves', price: 400, stock: 30, category: 'Gym', brand: 'Pro'}
    ];

    const sales = shop.sales || [
        {id: 'S001', customer: 'Rahul', item: 'Cricket Kit', amount: 5000},
        {id: 'S002', customer: 'Priya', item: 'Tennis Racket', amount: 2000}
    ];

    document.getElementById('items').innerText = products.length;
    document.getElementById('sale').innerText = sales.length;
    document.getElementById('jersey').innerText = products.filter(p => p.category === 'Jersey').length;
    document.getElementById('revenue').innerText = sales.reduce((a,b) => a+b.amount, 0);

    loadInventory(products);
    loadSales(sales);
    loadLowStock(products);
    loadCategories();
}

function loadInventory(products) {
    const container = document.getElementById('inventoryList');
    container.innerHTML = products.map(p => `
        <div style="display:flex; justify-content:space-between; padding:15px; border-bottom:1px solid #dcfce7;">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">${p.category} | Stock: ${p.stock}</p>
                <span class="brand-badge">${p.brand}</span>
            </div>
            <strong style="color:#16a34a;">₹${p.price}</strong>
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
    const cats = ['Cricket', 'Football', 'Badminton', 'Tennis', 'Gym', 'Jersey', 'Trophy', 'Accessories'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #dcfce7;">✓ ${c}</div>
    `).join('');
}

document.getElementById('addItemBtn').onclick = () => {
    window.location.href = `/shop-templates/sports/item-form.html?shopId=${shopId}`;
};
document.getElementById('newSaleBtn').onclick = () => {
    window.location.href = `/shop-templates/sports/sale-form.html?shopId=${shopId}`;
};

loadShopData();
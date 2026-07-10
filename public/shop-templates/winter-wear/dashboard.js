const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: 'Mens Woolen Jersey', price: 1200, stock: 30, size: 'M,L,XL', type: 'Jersey', gender: 'Men', brand: 'Monte Carlo'},
        {name: 'Ladies Cardigan', price: 1500, stock: 25, size: 'S,M,L', type: 'Cardigan', gender: 'Women', brand: 'H&M'},
        {name: 'Kids Sweater', price: 800, stock: 40, size: '26,28,30', type: 'Sweater', gender: 'Kids', brand: 'Gini & Jony'},
        {name: 'Mens Jacket', price: 2800, stock: 20, size: 'M,L,XL,XXL', type: 'Jacket', gender: 'Men', brand: 'Puma'},
        {name: 'Thermal Set', price: 900, stock: 35, size: 'M,L,XL', type: 'Thermal', gender: 'Unisex', brand: 'Lux'}
    ];

    const bills = shop.bills || [
        {id: 'WW001', customer: 'Ramesh', items: '2 Jersey + 1 Jacket', amount: 5200},
        {id: 'WW002', customer: 'Sita', items: '3 Cardigan', amount: 4500}
    ];

    document.getElementById('products').innerText = products.length;
    document.getElementById('customers').innerText = bills.length;
    document.getElementById('winter').innerText = products.length;
    document.getElementById('revenue').innerText = bills.reduce((a,b) => a+b.amount, 0);

    loadInventory(products);
    loadBills(bills);
    loadCategories();
    loadStockAlert(products);
}

function loadInventory(products) {
    const container = document.getElementById('inventoryList');
    container.innerHTML = products.map(p => `
        <div class="item-row">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">${p.type} | ${p.gender} | ${p.brand} | Stock: ${p.stock}</p>
                <span class="size-badge">Size: ${p.size}</span>
            </div>
            <strong style="color:#ec4899;">₹${p.price}</strong>
        </div>
    `).join('');
}

function loadBills(bills) {
    const container = document.getElementById('billsList');
    container.innerHTML = bills.map(b => `
        <div style="border:2px solid #fce7f3; border-radius:12px; padding:15px; margin-bottom:12px;">
            <h4>${b.customer}</h4>
            <p style="color:#64748b; font-size:14px;">Bill: ${b.id} | ${b.items}</p>
            <strong style="color:#ec4899;">₹${b.amount}</strong>
        </div>
    `).join('');
}

function loadCategories() {
    const cats = ['Jersey', 'Cardigan', 'Sweater', 'Jacket', 'Thermal', 'Hoodie', 'Muffler', 'Gloves', 'Kids Wear'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #fce7f3;">✓ ${c}</div>
    `).join('');
}

function loadStockAlert(products) {
    const low = products.filter(p => p.stock < 25);
    const container = document.getElementById('stockAlert');
    container.innerHTML = low.length === 0 ? '<p style="color:#16a34a;">Stock OK for Winter ✓</p>' : 
        low.map(p => `<div style="background:#fef3c7; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${p.name}</strong> - Only ${p.stock} left
        </div>`).join('');
}

document.getElementById('addItemBtn').onclick = () => {
    window.location.href = `/shop-templates/winter-wear/item-form.html?shopId=${shopId}`;
};
document.getElementById('newBillBtn').onclick = () => {
    window.location.href = `/shop-templates/winter-wear/billing.html?shopId=${shopId}`;
};

loadShopData();
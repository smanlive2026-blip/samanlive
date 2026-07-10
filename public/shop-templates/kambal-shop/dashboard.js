const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: 'Woolen Winter Kambal', price: 1200, stock: 50, size: '90x100 inch', type: 'Winter', weight: '2.5kg', brand: 'Bombay Dyeing'},
        {name: 'AC Blanket Single', price: 800, stock: 40, size: '60x90 inch', type: 'AC', weight: '1kg', brand: 'Raymond'},
        {name: 'Fleece Blanket Double', price: 1500, stock: 35, size: '90x100 inch', type: 'Fleece', weight: '2kg', brand: 'Trident'},
        {name: 'Rajai Cotton', price: 2200, stock: 25, size: '90x100 inch', type: 'Rajai', weight: '3kg', brand: 'Handmade'},
        {name: 'Quilt Designer', price: 3500, stock: 20, size: '90x100 inch', type: 'Quilt', weight: '2.8kg', brand: 'Portico'}
    ];

    const bills = shop.bills || [
        {id: 'KB001', customer: 'Ramesh', items: '5 Winter Kambal', amount: 6000},
        {id: 'KB002', customer: 'Sita', items: '2 AC Blanket', amount: 1600}
    ];

    document.getElementById('products').innerText = products.length;
    document.getElementById('customers').innerText = bills.length;
    document.getElementById('wholesale').innerText = 2;
    document.getElementById('revenue').innerText = bills.reduce((a,b) => a+b.amount, 0);

    loadInventory(products);
    loadBills(bills);
    loadCategories();
    loadStockAlert(products);
}

function loadInventory(products) {
    const container = document.getElementById('inventoryList');
    container.innerHTML = products.map(p => `
        <div class="kambal-row">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">${p.type} | ${p.brand} | Stock: ${p.stock}</p>
                <span class="size-badge">${p.size}</span>
                <span class="size-badge">${p.weight}</span>
            </div>
            <strong style="color:#0ea5e9;">₹${p.price}</strong>
        </div>
    `).join('');
}

function loadBills(bills) {
    const container = document.getElementById('billsList');
    container.innerHTML = bills.map(b => `
        <div style="border:2px solid #e0f2fe; border-radius:12px; padding:15px; margin-bottom:12px;">
            <h4>${b.customer}</h4>
            <p style="color:#64748b; font-size:14px;">Bill: ${b.id} | ${b.items}</p>
            <strong style="color:#0ea5e9;">₹${b.amount}</strong>
        </div>
    `).join('');
}

function loadCategories() {
    const cats = ['Winter Kambal', 'AC Blanket', 'Fleece Blanket', 'Rajai', 'Quilt', 'Travel Blanket', 'Baby Blanket', 'Wholesale Pack'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #e0f2fe;">✓ ${c}</div>
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

document.getElementById('addKambalBtn').onclick = () => {
    window.location.href = `/shop-templates/kambal-shop/kambal-form.html?shopId=${shopId}`;
};
document.getElementById('newBillBtn').onclick = () => {
    window.location.href = `/shop-templates/kambal-shop/billing.html?shopId=${shopId}`;
};

loadShopData();
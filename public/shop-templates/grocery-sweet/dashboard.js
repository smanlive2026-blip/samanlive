const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: 'Cheeni / Sugar', price: 45, stock: 500, unit: 'Per Kg', type: 'Cheeni', quality: 'Moti Dana'},
        {name: 'Shakkar / Brown Sugar', price: 55, stock: 200, unit: 'Per Kg', type: 'Shakkar', quality: 'Desi'},
        {name: 'Gud / Jaggery', price: 80, stock: 150, unit: 'Per Kg', type: 'Gud', quality: 'Organic'},
        {name: 'Bura Sugar', price: 60, stock: 100, unit: 'Per Kg', type: 'Bura', quality: 'Powder'},
        {name: 'Mishri', price: 300, stock: 50, unit: 'Per Kg', type: 'Mishri', quality: 'Dora'},
        {name: 'Khand', price: 50, stock: 250, unit: 'Per Kg', type: 'Khand', quality: 'Fine'}
    ];

    const bills = shop.bills || [
        {id: 'GS001', customer: 'Ramesh', items: '5kg Cheeni + 2kg Gud', amount: 385},
        {id: 'GS002', customer: 'Sita', items: '3kg Shakkar', amount: 165}
    ];

    document.getElementById('products').innerText = products.length;
    document.getElementById('kg').innerText = 120;
    document.getElementById('customers').innerText = bills.length;
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
                <p style="color:#64748b; font-size:12px;">${p.type} | ${p.quality} | Stock: ${p.stock}kg</p>
                <span class="kg-badge">${p.unit}</span>
            </div>
            <strong style="color:#d97706;">₹${p.price}/kg</strong>
        </div>
    `).join('');
}

function loadBills(bills) {
    const container = document.getElementById('billsList');
    container.innerHTML = bills.map(b => `
        <div style="border:2px solid #ffedd5; border-radius:12px; padding:15px; margin-bottom:12px;">
            <h4>${b.customer}</h4>
            <p style="color:#64748b; font-size:14px;">Bill: ${b.id} | ${b.items}</p>
            <strong style="color:#d97706;">₹${b.amount}</strong>
        </div>
    `).join('');
}

function loadCategories() {
    const cats = ['Cheeni', 'Shakkar', 'Gud', 'Bura', 'Mishri', 'Khand', 'Bulk Order', 'Mithai Use'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #ffedd5;">✓ ${c}</div>
    `).join('');
}

function loadStockAlert(products) {
    const low = products.filter(p => p.stock < 100);
    const container = document.getElementById('stockAlert');
    container.innerHTML = low.length === 0 ? '<p style="color:#16a34a;">Stock OK ✓</p>' : 
        low.map(p => `<div style="background:#fef3c7; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${p.name}</strong> - Only ${p.stock}kg left
        </div>`).join('');
}

document.getElementById('addItemBtn').onclick = () => {
    window.location.href = `/shop-templates/grocery-sweet/item-form.html?shopId=${shopId}`;
};
document.getElementById('newBillBtn').onclick = () => {
    window.location.href = `/shop-templates/grocery-sweet/billing.html?shopId=${shopId}`;
};

loadShopData();
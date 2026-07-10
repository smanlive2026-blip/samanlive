const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: 'Antibiotic Injection', price: 120, stock: 50, type: 'Injection', animal: 'Cow,Buffalo', brand: 'Intas'},
        {name: 'Calcium Tonic', price: 450, stock: 30, type: 'Tonic', animal: 'Cow,Buffalo,Goat', brand: 'Merck'},
        {name: 'Deworming Tablet', price: 80, stock: 100, type: 'Tablet', animal: 'All', brand: 'Zydus'},
        {name: 'Poultry Feed 50kg', price: 2200, stock: 20, type: 'Feed', animal: 'Poultry', brand: 'Godrej'},
        {name: 'Mineral Mixture', price: 650, stock: 25, type: 'Supplement', animal: 'Cow,Buffalo', brand: 'Bayer'}
    ];

    const bills = shop.bills || [
        {id: 'VT001', customer: 'Ramesh Patel', animals: '2 Cow', amount: 1250},
        {id: 'VT002', customer: 'Sita Devi', animals: '50 Poultry', amount: 2400}
    ];

    document.getElementById('products').innerText = products.length;
    document.getElementById('customers').innerText = bills.length;
    document.getElementById('vaccine').innerText = 4;
    document.getElementById('revenue').innerText = bills.reduce((a,b) => a+b.amount, 0);

    loadInventory(products);
    loadBills(bills);
    loadCategories();
    loadExpiry();
}

function loadInventory(products) {
    const container = document.getElementById('inventoryList');
    container.innerHTML = products.map(p => `
        <div class="medicine-row">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">${p.type} | Stock: ${p.stock}</p>
                <div>${p.animal.split(',').map(a => `<span class="animal-badge">${a}</span>`).join('')}</div>
            </div>
            <strong style="color:#84cc16;">₹${p.price}</strong>
        </div>
    `).join('');
}

function loadBills(bills) {
    const container = document.getElementById('billsList');
    container.innerHTML = bills.map(b => `
        <div style="border:2px solid #f7fee7; border-radius:12px; padding:15px; margin-bottom:12px;">
            <h4>${b.customer}</h4>
            <p style="color:#64748b; font-size:14px;">Bill: ${b.id} | ${b.animals}</p>
            <strong style="color:#84cc16;">₹${b.amount}</strong>
        </div>
    `).join('');
}

function loadCategories() {
    const cats = ['Antibiotic', 'Tonic', 'Injection', 'Feed', 'Supplement', 'Deworming', 'Vaccine', 'Equipment'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #f7fee7;">✓ ${c}</div>
    `).join('');
}

function loadExpiry() {
    const exp = [
        {name: 'Calcium Tonic', date: '20 Dec 2026', stock: 5},
        {name: 'Antibiotic', date: '15 Nov 2026', stock: 8}
    ];
    document.getElementById('expiry').innerHTML = exp.map(e => `
        <div style="background:#fef3c7; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${e.name}</strong>
            <p style="font-size:12px; color:#64748b;">Expiry: ${e.date} | Stock: ${e.stock}</p>
        </div>
    `).join('');
}

document.getElementById('addMedicineBtn').onclick = () => {
    window.location.href = `/shop-templates/vet-shop/medicine-form.html?shopId=${shopId}`;
};
document.getElementById('newBillBtn').onclick = () => {
    window.location.href = `/shop-templates/vet-shop/billing.html?shopId=${shopId}`;
};

loadShopData();
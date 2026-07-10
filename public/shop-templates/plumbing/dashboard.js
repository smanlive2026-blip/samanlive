const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: 'PVC Pipe 1 inch', price: 450, stock: 50, size: '20ft', type: 'Pipe', brand: 'Supreme'},
        {name: 'Submersible Pump 1HP', price: 8500, stock: 8, size: '1HP', type: 'Pump', brand: 'Crompton'},
        {name: 'Water Tank 1000L', price: 6500, stock: 12, size: '1000L', type: 'Tanki', brand: 'Sintex'},
        {name: 'CPVC Pipe 3/4"', price: 380, stock: 40, size: '20ft', type: 'Pipe', brand: 'Astral'},
        {name: 'Pressure Pump', price: 4200, stock: 10, size: '0.5HP', type: 'Pump', brand: 'Kirloskar'}
    ];

    const bills = shop.bills || [
        {id: 'PL001', customer: 'Ramesh', items: '2 Tanki + Pipes', amount: 14500},
        {id: 'PL002', customer: 'Sita', items: 'Submersible 1HP', amount: 8500}
    ];

    document.getElementById('products').innerText = products.length;
    document.getElementById('customers').innerText = bills.length;
    document.getElementById('install').innerText = 3;
    document.getElementById('revenue').innerText = bills.reduce((a,b) => a+b.amount, 0);

    loadInventory(products);
    loadBills(bills);
    loadCategories();
    loadServiceDue();
}

function loadInventory(products) {
    const container = document.getElementById('inventoryList');
    container.innerHTML = products.map(p => `
        <div class="item-row">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">${p.type} | ${p.size} | Stock: ${p.stock}</p>
                <span class="spec-badge">${p.brand}</span>
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
    const cats = ['PVC Pipe', 'CPVC Pipe', 'Submersible Pump', 'Pressure Pump', 'Water Tank', 'Fittings', 'Borewell Service'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #e0f2fe;">✓ ${c}</div>
    `).join('');
}

function loadServiceDue() {
    const services = [
        {customer: 'Amit', work: 'Pump Service', date: '12 Oct 2026'},
        {customer: 'Priya', work: 'Tank Cleaning', date: '15 Oct 2026'}
    ];
    document.getElementById('serviceDue').innerHTML = services.map(s => `
        <div style="background:#e0f2fe; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${s.customer}</strong>
            <p style="font-size:12px; color:#64748b;">${s.work} | ${s.date}</p>
        </div>
    `).join('');
}

document.getElementById('addStockBtn').onclick = () => {
    window.location.href = `/shop-templates/plumbing/stock-form.html?shopId=${shopId}`;
};
document.getElementById('serviceBtn').onclick = () => {
    window.location.href = `/shop-templates/plumbing/service-form.html?shopId=${shopId}`;
};

loadShopData();
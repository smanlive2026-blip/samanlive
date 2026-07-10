const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: 'Bridal Banarasi Saree', price: 12000, stock: 15, type: 'Bridal', fabric: 'Silk', work: 'Zari', brand: 'Varanasi'},
        {name: 'Cotton Daily Wear', price: 800, stock: 50, type: 'Cotton', fabric: 'Cotton', work: 'Print', brand: 'Local'},
        {name: 'Designer Party Wear', price: 4500, stock: 25, type: 'Designer', fabric: 'Georgette', work: 'Stone', brand: 'Mumbai'},
        {name: 'Silk Saree', price: 3500, stock: 30, type: 'Silk', fabric: 'Art Silk', work: 'Border', brand: 'Kanchipuram'},
        {name: 'Chiffon Saree', price: 1500, stock: 40, type: 'Chiffon', fabric: 'Chiffon', work: 'Plain', brand: 'Jaipur'}
    ];

    const bills = shop.bills || [
        {id: 'SR001', customer: 'Ramesh - Wife', items: '2 Bridal + 1 Designer', amount: 28500},
        {id: 'SR002', customer: 'Sita', items: '3 Cotton Saree', amount: 2400}
    ];

    document.getElementById('products').innerText = products.length;
    document.getElementById('customers').innerText = bills.length;
    document.getElementById('bridal').innerText = 2;
    document.getElementById('revenue').innerText = bills.reduce((a,b) => a+b.amount, 0);

    loadInventory(products);
    loadBills(bills);
    loadCategories();
    loadTailoring();
}

function loadInventory(products) {
    const container = document.getElementById('inventoryList');
    container.innerHTML = products.map(p => `
        <div class="saree-row">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">${p.fabric} | ${p.work} | ${p.brand} | Stock: ${p.stock}</p>
                <span class="type-badge">${p.type}</span>
            </div>
            <strong style="color:#f472b6;">₹${p.price}</strong>
        </div>
    `).join('');
}

function loadBills(bills) {
    const container = document.getElementById('billsList');
    container.innerHTML = bills.map(b => `
        <div style="border:2px solid #fce7f3; border-radius:12px; padding:15px; margin-bottom:12px;">
            <h4>${b.customer}</h4>
            <p style="color:#64748b; font-size:14px;">Bill: ${b.id} | ${b.items}</p>
            <strong style="color:#f472b6;">₹${b.amount}</strong>
        </div>
    `).join('');
}

function loadCategories() {
    const cats = ['Bridal', 'Designer', 'Silk', 'Cotton', 'Chiffon', 'Georgette', 'Banarasi', 'Bandhej', 'Blouse', 'Peticoat'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #fce7f3;">✓ ${c}</div>
    `).join('');
}

function loadTailoring() {
    const tailors = [
        {customer: 'Amit - Wife', work: 'Blouse Stitching 2pc', date: '15 Oct 2026'},
        {customer: 'Priya', work: 'Saree Fall & Pico', date: '16 Oct 2026'}
    ];
    document.getElementById('tailoring').innerHTML = tailors.map(t => `
        <div style="background:#fce7f3; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${t.customer}</strong>
            <p style="font-size:12px; color:#64748b;">${t.work} | ${t.date}</p>
        </div>
    `).join('');
}

document.getElementById('addSareeBtn').onclick = () => {
    window.location.href = `/shop-templates/saree-shop/saree-form.html?shopId=${shopId}`;
};
document.getElementById('newBillBtn').onclick = () => {
    window.location.href = `/shop-templates/saree-shop/billing.html?shopId=${shopId}`;
};

loadShopData();
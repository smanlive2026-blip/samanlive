const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: 'Mens Wedding Sherwani', price: 8000, stock: 15, size: '38,40,42', type: 'Sherwani', gender: 'Men', fabric: 'Silk'},
        {name: 'Ladies Salwar Suit', price: 2500, stock: 40, size: 'S,M,L,XL', type: 'Salwar Suit', gender: 'Women', fabric: 'Cotton'},
        {name: 'Mens Indo-Western', price: 5000, stock: 20, size: '38,40,42', type: 'Indo-Western', gender: 'Men', fabric: 'Jute Silk'},
        {name: 'Kids Kurta Pajama', price: 1200, stock: 30, size: '26,28,30', type: 'Kurta', gender: 'Kids', fabric: 'Cotton'},
        {name: 'Ladies Anarkali', price: 3500, stock: 25, size: 'S,M,L,XL', type: 'Anarkali', gender: 'Women', fabric: 'Georgette'}
    ];

    const bills = shop.bills || [
        {id: 'ST001', customer: 'Ramesh', items: 'Sherwani + Indo-Western', amount: 13000},
        {id: 'ST002', customer: 'Sita', items: '2 Salwar Suit', amount: 5000}
    ];

    document.getElementById('products').innerText = products.length;
    document.getElementById('customers').innerText = bills.length;
    document.getElementById('tailoring').innerText = 5;
    document.getElementById('revenue').innerText = bills.reduce((a,b) => a+b.amount, 0);

    loadInventory(products);
    loadBills(bills);
    loadCategories();
    loadDelivery();
}

function loadInventory(products) {
    const container = document.getElementById('inventoryList');
    container.innerHTML = products.map(p => `
        <div class="suit-row">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">${p.type} | ${p.gender} | ${p.fabric} | Stock: ${p.stock}</p>
                <span class="type-badge">Size: ${p.size}</span>
            </div>
            <strong style="color:#3b82f6;">₹${p.price}</strong>
        </div>
    `).join('');
}

function loadBills(bills) {
    const container = document.getElementById('billsList');
    container.innerHTML = bills.map(b => `
        <div style="border:2px solid #dbeafe; border-radius:12px; padding:15px; margin-bottom:12px;">
            <h4>${b.customer}</h4>
            <p style="color:#64748b; font-size:14px;">Bill: ${b.id} | ${b.items}</p>
            <strong style="color:#3b82f6;">₹${b.amount}</strong>
        </div>
    `).join('');
}

function loadCategories() {
    const cats = ['Sherwani', 'Kurta Pajama', 'Indo-Western', 'Salwar Suit', 'Anarkali', 'Palazzo', 'Lehenga', 'Tailoring'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #dbeafe;">✓ ${c}</div>
    `).join('');
}

function loadDelivery() {
    const delivers = [
        {customer: 'Amit', work: 'Sherwani Stitching', date: '18 Oct 2026'},
        {customer: 'Priya', work: 'Anarkali Alteration', date: '19 Oct 2026'}
    ];
    document.getElementById('delivery').innerHTML = delivers.map(d => `
        <div style="background:#dbeafe; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${d.customer}</strong>
            <p style="font-size:12px; color:#64748b;">${d.work} | ${d.date}</p>
        </div>
    `).join('');
}

document.getElementById('addSuitBtn').onclick = () => {
    window.location.href = `/shop-templates/suit-shop/suit-form.html?shopId=${shopId}`;
};
document.getElementById('newBillBtn').onclick = () => {
    window.location.href = `/shop-templates/suit-shop/billing.html?shopId=${shopId}`;
};

loadShopData();
const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: 'Remote Control Car', price: 1200, stock: 25, age: '3+ Years', type: 'Car', brand: 'Hot Wheels'},
        {name: 'Barbie Doll', price: 800, stock: 30, age: '4+ Years', type: 'Doll', brand: 'Mattel'},
        {name: 'Building Blocks', price: 650, stock: 40, age: '2+ Years', type: 'Educational', brand: 'Lego'},
        {name: 'Teddy Bear 2ft', price: 1500, stock: 20, age: '0+ Years', type: 'Soft Toy', brand: 'Hamleys'},
        {name: 'Chess Board', price: 900, stock: 15, age: '6+ Years', type: 'Puzzle', brand: 'ChessBase'}
    ];

    const bills = shop.bills || [
        {id: 'TY001', customer: 'Ramesh - Aarav', items: 'RC Car + Blocks', amount: 1850},
        {id: 'TY002', customer: 'Sita - Pari', items: 'Barbie + Teddy', amount: 2300}
    ];

    document.getElementById('products').innerText = products.length;
    document.getElementById('customers').innerText = bills.length;
    document.getElementById('gift').innerText = 3;
    document.getElementById('revenue').innerText = bills.reduce((a,b) => a+b.amount, 0);

    loadInventory(products);
    loadBills(bills);
    loadCategories();
    loadStockAlert(products);
}

function loadInventory(products) {
    const container = document.getElementById('inventoryList');
    container.innerHTML = products.map(p => `
        <div class="toy-row">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">${p.type} | ${p.brand} | Stock: ${p.stock}</p>
                <span class="age-badge">Age: ${p.age}</span>
            </div>
            <strong style="color:#f97316;">₹${p.price}</strong>
        </div>
    `).join('');
}

function loadBills(bills) {
    const container = document.getElementById('billsList');
    container.innerHTML = bills.map(b => `
        <div style="border:2px solid #ffedd5; border-radius:12px; padding:15px; margin-bottom:12px;">
            <h4>${b.customer}</h4>
            <p style="color:#64748b; font-size:14px;">Bill: ${b.id} | ${b.items}</p>
            <strong style="color:#f97316;">₹${b.amount}</strong>
        </div>
    `).join('');
}

function loadCategories() {
    const cats = ['Car', 'Doll', 'Soft Toy', 'Educational', 'Puzzle', 'Sports', 'Board Game', 'Gift Pack'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #ffedd5;">✓ ${c}</div>
    `).join('');
}

function loadStockAlert(products) {
    const low = products.filter(p => p.stock < 20);
    const container = document.getElementById('stockAlert');
    container.innerHTML = low.length === 0 ? '<p style="color:#16a34a;">Stock OK ✓</p>' : 
        low.map(p => `<div style="background:#fef3c7; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${p.name}</strong> - Only ${p.stock} left
        </div>`).join('');
}

document.getElementById('addToyBtn').onclick = () => {
    window.location.href = `/shop-templates/toy-shop/toy-form.html?shopId=${shopId}`;
};
document.getElementById('newBillBtn').onclick = () => {
    window.location.href = `/shop-templates/toy-shop/billing.html?shopId=${shopId}`;
};

loadShopData();
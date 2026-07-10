const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: 'Girls Frock', price: 800, stock: 25, size: '2-6 Years', type: 'Frock', gender: 'Girls', brand: 'Gini & Jony'},
        {name: 'Boys T-Shirt', price: 450, stock: 40, size: '3-10 Years', type: 'T-Shirt', gender: 'Boys', brand: 'H&M Kids'},
        {name: 'Baby Romper', price: 600, stock: 30, size: '0-2 Years', type: 'Romper', gender: 'Unisex', brand: 'Carter'},
        {name: 'Kids Jeans', price: 900, stock: 20, size: '4-12 Years', type: 'Jeans', gender: 'Boys', brand: 'Levi Kids'},
        {name: 'Winter Jacket Kids', price: 1200, stock: 15, size: '3-8 Years', type: 'Jacket', gender: 'Girls', brand: 'Zara Kids'}
    ];

    const bills = shop.bills || [
        {id: 'KC001', customer: 'Ramesh - Aarav', items: '2 T-Shirt + 1 Jeans', amount: 1800},
        {id: 'KC002', customer: 'Sita - Pari', items: 'Frock + Jacket', amount: 2000}
    ];

    document.getElementById('products').innerText = products.length;
    document.getElementById('customers').innerText = bills.length;
    document.getElementById('combo').innerText = 4;
    document.getElementById('revenue').innerText = bills.reduce((a,b) => a+b.amount, 0);

    loadInventory(products);
    loadBills(bills);
    loadCategories();
    loadStockAlert(products);
}

function loadInventory(products) {
    const container = document.getElementById('inventoryList');
    container.innerHTML = products.map(p => `
        <div class="cloth-row">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">${p.type} | ${p.gender} | ${p.brand} | Stock: ${p.stock}</p>
                <span class="size-badge">Age: ${p.size}</span>
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
    const cats = ['Frock', 'T-Shirt', 'Jeans', 'Romper', 'Jacket', 'Ethnic', 'Party Wear', 'Baby Set', 'Combo Pack'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #fce7f3;">✓ ${c}</div>
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

document.getElementById('addClothBtn').onclick = () => {
    window.location.href = `/shop-templates/child-clothes/cloth-form.html?shopId=${shopId}`;
};
document.getElementById('newBillBtn').onclick = () => {
    window.location.href = `/shop-templates/child-clothes/billing.html?shopId=${shopId}`;
};

loadShopData();
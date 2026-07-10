const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: 'Frock Pink', price: 799, stock: 25, sizes: ['2Y','3Y','4Y','5Y'], category: 'Girls', brand: 'H&M Kids', new: true},
        {name: 'Boys T-Shirt + Jeans', price: 999, stock: 30, sizes: ['4Y','5Y','6Y','7Y'], category: 'Boys', brand: 'US Polo', new: false},
        {name: 'Baby Romper', price: 499, stock: 15, sizes: ['0-3M','3-6M','6-9M'], category: 'Infant', brand: 'Carter', new: true},
        {name: 'Winter Jacket', price: 1299, stock: 20, sizes: ['6Y','7Y','8Y','9Y'], category: 'Winter', brand: 'Monte Carlo', new: false}
    ];

    const bills = shop.bills || [
        {id: 'K001', customer: 'Anita', items: '2 Frock', amount: 1598},
        {id: 'K002', customer: 'Rahul', items: 'Boys Set', amount: 999}
    ];

    document.getElementById('products').innerText = products.length;
    document.getElementById('customers').innerText = bills.length;
    document.getElementById('new').innerText = products.filter(p => p.new).length;
    document.getElementById('revenue').innerText = bills.reduce((a,b) => a+b.amount, 0);

    loadInventory(products);
    loadBills(bills);
    loadStockAlert(products);
    loadCategories();
}

function loadInventory(products) {
    const container = document.getElementById('inventoryList');
    container.innerHTML = products.map(p => `
        <div class="product-row">
            <div>
                <strong>${p.name} ${p.new ? '🔥' : ''}</strong>
                <p style="color:#64748b; font-size:12px;">${p.brand} | ${p.category} | Stock: ${p.stock}</p>
                <div style="margin-top:5px;">${p.sizes.map(s => `<span class="size-badge">${s}</span>`).join('')}</div>
            </div>
            <strong style="color:#ec4899;">₹${p.price}</strong>
        </div>
    `).join('');
}

function loadBills(bills) {
    const container = document.getElementById('billsList');
    container.innerHTML = bills.map(b => `
        <div style="border:2px solid #fce7f3; border-radius:12px; padding:15px; margin-bottom:12px;">
            <h4>Bill #${b.id} - ${b.customer}</h4>
            <p style="color:#64748b; font-size:14px;">${b.items}</p>
            <strong style="color:#ec4899;">₹${b.amount}</strong>
        </div>
    `).join('');
}

function loadStockAlert(products) {
    const low = products.filter(p => p.stock < 20);
    const container = document.getElementById('stockAlert');
    container.innerHTML = low.length === 0 ? '<p style="color:#16a34a;">Stock OK ✓</p>' : 
        low.map(p => `<div style="background:#fce7f3; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${p.name}</strong> - Only ${p.stock} left
        </div>`).join('');
}

function loadCategories() {
    const cats = ['Boys', 'Girls', 'Infant', 'Party Wear', 'Winter', 'Ethnic', 'Sports'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #fce7f3;">✓ ${c}</div>
    `).join('');
}

document.getElementById('addProductBtn').onclick = () => {
    window.location.href = `/shop-templates/kids-wear/product-form.html?shopId=${shopId}`;
};
document.getElementById('newBillBtn').onclick = () => {
    window.location.href = `/shop-templates/kids-wear/billing.html?shopId=${shopId}`;
};

loadShopData();
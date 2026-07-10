const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: 'Sports Running Shoe', price: 1299, stock: 40, sizes: [6,7,8,9,10], category: 'Sports', brand: 'Nike'},
        {name: 'Formal Leather Shoe', price: 1899, stock: 25, sizes: [7,8,9,10,11], category: 'Formal', brand: 'Bata'},
        {name: 'Ladies Sandal', price: 799, stock: 35, sizes: [5,6,7,8], category: 'Casual', brand: 'Paragon'},
        {name: 'Kids Sneakers', price: 599, stock: 15, sizes: [3,4,5,6], category: 'Kids', brand: 'Action'}
    ];

    const bills = shop.bills || [
        {id: 'F001', customer: 'Aman', items: '1 Sports Shoe', amount: 1299},
        {id: 'F002', customer: 'Priya', items: '2 Sandal', amount: 1598}
    ];

    document.getElementById('products').innerText = products.length;
    document.getElementById('customers').innerText = bills.length;
    document.getElementById('offers').innerText = 3;
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
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">${p.brand} | ${p.category} | Stock: ${p.stock}</p>
                <div style="margin-top:5px;">${p.sizes.map(s => `<span class="size-badge">Size ${s}</span>`).join('')}</div>
            </div>
            <strong style="color:#8b5cf6;">₹${p.price}</strong>
        </div>
    `).join('');
}

function loadBills(bills) {
    const container = document.getElementById('billsList');
    container.innerHTML = bills.map(b => `
        <div style="border:2px solid #ede9fe; border-radius:12px; padding:15px; margin-bottom:12px;">
            <h4>Bill #${b.id} - ${b.customer}</h4>
            <p style="color:#64748b; font-size:14px;">${b.items}</p>
            <strong style="color:#8b5cf6;">₹${b.amount}</strong>
        </div>
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

function loadCategories() {
    const cats = ['Sports', 'Formal', 'Casual', 'Sandals', 'Kids', 'Ladies'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #ede9fe;">✓ ${c}</div>
    `).join('');
}

document.getElementById('addProductBtn').onclick = () => {
    window.location.href = `/shop-templates/footwear/product-form.html?shopId=${shopId}`;
};
document.getElementById('newBillBtn').onclick = () => {
    window.location.href = `/shop-templates/footwear/billing.html?shopId=${shopId}`;
};

loadShopData();
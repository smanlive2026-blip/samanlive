const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const menu = shop.menu || [
        {name: 'Orange Juice', price: 40, type: 'Juice', sold: 45},
        {name: 'Mango Shake', price: 60, type: 'Shake', sold: 60},
        {name: 'Banana Shake', price: 50, type: 'Shake', sold: 55},
        {name: 'Pineapple Juice', price: 50, type: 'Juice', sold: 30},
        {name: 'Pomegranate Juice', price: 70, type: 'Juice', sold: 25}
    ];

    const fruits = shop.fruits || [
        {name: 'Apple', stock: 20}, {name: 'Banana', stock: 5}, {name: 'Orange', stock: 15},
        {name: 'Mango', stock: 10}, {name: 'Pomegranate', stock: 8}, {name: 'Pineapple', stock: 6}
    ];

    document.getElementById('glasses').innerText = menu.reduce((a,b) => a+b.sold, 0);
    document.getElementById('fruits').innerText = fruits.reduce((a,b) => a+b.stock, 0);
    document.getElementById('revenue').innerText = shop.todayRevenue || 0;

    loadMenu(menu);
    loadFruits(fruits);
    loadBestSelling(menu);
}

function loadMenu(menu) {
    const container = document.getElementById('menuList');
    container.innerHTML = menu.map(m => `
        <div style="display:flex; justify-content:space-between; padding:15px; border-bottom:1px solid #dcfce7;">
            <div>
                <strong>${m.name}</strong>
                <p style="color:#64748b; font-size:12px;">${m.type}</p>
            </div>
            <strong style="color:#16a34a;">₹${m.price}</strong>
        </div>
    `).join('');
}

function loadFruits(fruits) {
    const container = document.getElementById('fruitStock');
    container.innerHTML = fruits.map(f => `
        <div class="fruit-stock">
            <span>${f.name}</span>
            <span class="${f.stock<5?'expiry-badge':'fresh-badge'}">${f.stock} kg</span>
        </div>
    `).join('');
}

function loadBestSelling(menu) {
    const sorted = [...menu].sort((a,b) => b.sold - a.sold).slice(0,5);
    document.getElementById('bestSelling').innerHTML = sorted.map((m,i) => `
        <div style="display:flex; justify-content:space-between; padding:10px;">
            <span>${i+1}. ${m.name}</span>
            <span>${m.sold} sold</span>
        </div>
    `).join('');
}

document.getElementById('addItemBtn').onclick = () => {
    window.location.href = `/shop-templates/juice/item-form.html?shopId=${shopId}`;
};

loadShopData();
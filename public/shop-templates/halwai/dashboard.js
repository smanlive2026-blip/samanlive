const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const items = shop.items || [
        {name: 'Gulab Jamun', price: 300, stock: 10, type: 'Sweet', fresh: 'Today'},
        {name: 'Rasgulla', price: 280, stock: 8, type: 'Sweet', fresh: 'Today'},
        {name: 'Samosa', price: 15, stock: 50, type: 'Snack', fresh: 'Hot'},
        {name: 'Bread Pakoda', price: 20, stock: 40, type: 'Snack', fresh: 'Hot'}
    ];

    document.getElementById('sale').innerText = shop.todaySale || 25;
    document.getElementById('revenue').innerText = shop.todayRevenue || 0;
    document.getElementById('fresh').innerText = items.filter(i => i.fresh === 'Today' || i.fresh === 'Hot').length;

    loadItems(items);
    loadFreshAlert(items);
    loadBestSellers();
}

function loadItems(items) {
    const container = document.getElementById('itemList');
    container.innerHTML = items.map(i => `
        <div style="display:flex; justify-content:space-between; padding:15px; border-bottom:1px solid #fee2e2;">
            <div>
                <strong>${i.name}</strong>
                <p style="color:#64748b; font-size:12px;">${i.type} | Stock: ${i.stock} ${i.type==='Sweet'?'kg':'pcs'}</p>
            </div>
            <div style="text-align:right;">
                <strong style="color:#dc2626;">₹${i.price}</strong><br>
                <span class="${i.fresh==='Hot'?'expiry-badge':'fresh-badge'}">${i.fresh}</span>
            </div>
        </div>
    `).join('');
}

function loadFreshAlert(items) {
    const fresh = items.filter(i => i.fresh === 'Today' || i.fresh === 'Hot');
    const container = document.getElementById('freshAlert');
    container.innerHTML = fresh.map(i => `
        <div style="background:#dcfce7; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${i.name}</strong> - ${i.fresh}
        </div>
    `).join('');
}

function loadBestSellers() {
    const best = ['Gulab Jamun', 'Samosa', 'Jalebi', 'Bread Pakoda', 'Kaju Katli'];
    document.getElementById('bestSellers').innerHTML = best.map((b,i) => `
        <div style="display:flex; justify-content:space-between; padding:10px;">
            <span>${i+1}. ${b}</span>
        </div>
    `).join('');
}

document.getElementById('addSweetBtn').onclick = () => {
    window.location.href = `/shop-templates/halwai/sweet-form.html?shopId=${shopId}`;
};
document.getElementById('addSnackBtn').onclick = () => {
    window.location.href = `/shop-templates/halwai/snack-form.html?shopId=${shopId}`;
};

loadShopData();
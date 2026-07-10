const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const subscriptions = shop.subscriptions || [];
    const products = shop.products || [
        {name: 'Cow Milk', price: 60, stock: 50, unit: 'L'}, 
        {name: 'Buffalo Milk', price: 70, stock: 40, unit: 'L'},
        {name: 'Curd', price: 80, stock: 20, unit: 'kg'},
        {name: 'Paneer', price: 320, stock: 15, unit: 'kg'},
        {name: 'Ghee', price: 600, stock: 10, unit: 'kg'}
    ];

    document.getElementById('subscriptions').innerText = subscriptions.filter(s => s.status === 'active').length;
    document.getElementById('milkSold').innerText = shop.todayMilkSold || 0;
    document.getElementById('products').innerText = products.length;
    document.getElementById('collection').innerText = shop.todayCollection || 0;

    loadSubscriptions(subscriptions);
    loadProducts(products);
}

function loadSubscriptions(subs) {
    const container = document.getElementById('subscriptionList');
    if (subs.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#94a3b8; padding:40px;">No subscriptions yet</p>`;
        return;
    }
    container.innerHTML = subs.map(s => `
        <div class="subscription-card">
            <div>
                <h4>${s.customerName} - ${s.product}</h4>
                <p style="color:#64748b; font-size:14px;">Qty: ${s.qty} ${s.unit} | Time: ${s.deliveryTime} | ₹${s.monthlyAmount}/month</p>
            </div>
            <span class="status ${s.status}">${s.status}</span>
        </div>
    `).join('');
}

function loadProducts(products) {
    const container = document.getElementById('productList');
    container.innerHTML = products.map(p => `
        <div style="display:flex; justify-content:space-between; padding:15px; border-bottom:1px solid #e0f2fe;">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">Stock: ${p.stock} ${p.unit}</p>
            </div>
            <strong style="color:#0284c7;">₹${p.price}/${p.unit}</strong>
        </div>
    `).join('');
}

document.getElementById('addProductBtn').onclick = () => {
    window.location.href = `/shop-templates/dairy/product-form.html?shopId=${shopId}`;
};

loadShopData();
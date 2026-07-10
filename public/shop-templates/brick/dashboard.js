const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const materials = shop.materials || [
        {name: 'Lal Eent', price: 8, stock: 50000, unit: 'pcs', type: 'Brick'},
        {name: 'Fly Ash Brick', price: 10, stock: 30000, unit: 'pcs', type: 'Brick'},
        {name: 'Cement 50kg', price: 400, stock: 200, unit: 'bag', type: 'Cement'},
        {name: 'Sand', price: 2500, stock: 10, unit: 'truck', type: 'Sand'}
    ];

    const orders = shop.orders || [
        {id: 'B001', customer: 'Rahul Construction', material: '5000 Eent', amount: 40000, status: 'delivered'},
        {id: 'B002', customer: 'Aman Builders', material: '2 Truck Sand', amount: 5000, status: 'pending'}
    ];

    document.getElementById('stock').innerText = materials.reduce((a,b) => a+b.stock, 0);
    document.getElementById('truck').innerText = orders.length;
    document.getElementById('site').innerText = orders.filter(o => o.status === 'pending').length;
    document.getElementById('revenue').innerText = orders.reduce((a,b) => a+b.amount, 0);

    loadMaterials(materials);
    loadOrders(orders);
    loadLowStock(materials);
    loadCategories();
}

function loadMaterials(materials) {
    const container = document.getElementById('materialList');
    container.innerHTML = materials.map(m => `
        <div style="display:flex; justify-content:space-between; padding:15px; border-bottom:1px solid #fee2e2;">
            <div>
                <strong>${m.name}</strong>
                <p style="color:#64748b; font-size:12px;">${m.type} | Stock: ${m.stock} ${m.unit}</p>
            </div>
            <strong style="color:#dc2626;">₹${m.price}/${m.unit}</strong>
        </div>
    `).join('');
}

function loadOrders(orders) {
    const container = document.getElementById('orderList');
    container.innerHTML = orders.map(o => `
        <div class="order-card">
            <h4>${o.customer}</h4>
            <p style="color:#64748b; font-size:14px;">${o.material} | ₹${o.amount}</p>
            <span class="truck-badge">${o.status}</span>
        </div>
    `).join('');
}

function loadLowStock(materials) {
    const low = materials.filter(m => m.stock < 100);
    const container = document.getElementById('lowStock');
    container.innerHTML = low.length === 0 ? '<p style="color:#16a34a;">Stock OK ✓</p>' : 
        low.map(m => `<div style="background:#fef3c7; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${m.name}</strong> - Only ${m.stock} ${m.unit} left
        </div>`).join('');
}

function loadCategories() {
    const cats = ['Brick', 'Cement', 'Sand', 'Gitti', 'Steel', 'Block', 'Pipe', 'Hardware'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #fee2e2;">✓ ${c}</div>
    `).join('');
}

document.getElementById('addItemBtn').onclick = () => {
    window.location.href = `/shop-templates/brick/material-form.html?shopId=${shopId}`;
};
document.getElementById('newOrderBtn').onclick = () => {
    window.location.href = `/shop-templates/brick/order-form.html?shopId=${shopId}`;
};

loadShopData();
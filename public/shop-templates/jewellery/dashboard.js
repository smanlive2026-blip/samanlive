const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const items = shop.items || [
        {name: 'Gold Ring 22K', weight: 5.2, making: 12, category: 'Ring', type: 'Gold'},
        {name: 'Diamond Necklace', weight: 18.5, making: 15, category: 'Necklace', type: 'Diamond'},
        {name: 'Silver Payal', weight: 60, making: 8, category: 'Payal', type: 'Silver'},
        {name: 'Gold Bangles', weight: 40, making: 10, category: 'Bangles', type: 'Gold'}
    ];

    const bills = shop.bills || [
        {id: 'J001', customer: 'Rita Devi', item: 'Gold Earrings', amount: 45000},
        {id: 'J002', customer: 'Amit', item: 'Silver Chain', amount: 8500}
    ];

    const customOrders = [
        {customer: 'Priya', item: 'Bridal Set', delivery: '15 Oct 2026', status: 'Making'},
        {customer: 'Rahul', item: 'Name Ring', delivery: '10 Oct 2026', status: 'Ready'}
    ];

    document.getElementById('items').innerText = items.length;
    document.getElementById('customers').innerText = bills.length;
    document.getElementById('revenue').innerText = bills.reduce((a,b) => a+b.amount, 0);

    loadInventory(items);
    loadBills(bills);
    loadCustomOrders(customOrders);
    loadCategories();
}

function loadInventory(items) {
    const container = document.getElementById('inventoryList');
    container.innerHTML = items.map(i => `
        <div style="display:flex; justify-content:space-between; padding:15px; border-bottom:1px solid #fef9c3;">
            <div>
                <strong>${i.name}</strong>
                <p style="color:#64748b; font-size:12px;">Weight: ${i.weight}g | Making: ${i.making}%</p>
                <span class="gold-badge">${i.type} | ${i.category}</span>
            </div>
        </div>
    `).join('');
}

function loadBills(bills) {
    const container = document.getElementById('billsList');
    container.innerHTML = bills.map(b => `
        <div class="jewellery-card">
            <h4>Bill #${b.id} - ${b.customer}</h4>
            <p style="color:#64748b; font-size:14px;">${b.item}</p>
            <strong style="color:#facc15;">₹${b.amount}</strong>
        </div>
    `).join('');
}

function loadCustomOrders(orders) {
    const container = document.getElementById('customOrders');
    container.innerHTML = orders.map(o => `
        <div style="background:#fef9c3; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${o.customer}</strong> - ${o.item}
            <p style="font-size:12px; color:#64748b;">Delivery: ${o.delivery} | ${o.status}</p>
        </div>
    `).join('');
}

function loadCategories() {
    const cats = ['Ring', 'Necklace', 'Bangles', 'Earrings', 'Chain', 'Payal', 'Nath', 'Mangalsutra'];
    document.getElementById('categories').innerHTML = cats.map(c => `
        <div style="padding:8px; border-bottom:1px solid #fef9c3;">✓ ${c}</div>
    `).join('');
}

document.getElementById('addItemBtn').onclick = () => {
    window.location.href = `/shop-templates/jewellery/item-form.html?shopId=${shopId}`;
};
document.getElementById('newOrderBtn').onclick = () => {
    window.location.href = `/shop-templates/jewellery/billing.html?shopId=${shopId}`;
};

loadShopData();
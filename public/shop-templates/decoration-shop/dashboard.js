const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const products = shop.products || [
        {name: 'Wedding Stage Setup', price: 25000, stock: 5, type: 'Stage', category: 'Wedding', size: '20x15 ft'},
        {name: 'Balloon Decoration', price: 5000, stock: 50, type: 'Balloon', category: 'Birthday', size: 'Per Event'},
        {name: 'LED Lights Set', price: 3000, stock: 30, type: 'Lights', category: 'All Event', size: '50 Meter'},
        {name: 'Flower Decoration', price: 8000, stock: 20, type: 'Flowers', category: 'Wedding', size: 'Stage + Entry'},
        {name: 'Sound System', price: 7000, stock: 10, type: 'Sound', category: 'All Event', size: '4 Speaker'}
    ];

    const bookings = shop.bookings || [
        {id: 'DC001', customer: 'Ramesh - Shaadi', event: 'Wedding Stage', date: '20 Oct 2026', amount: 35000},
        {id: 'DC002', customer: 'Sita - Birthday', event: 'Balloon Decor', date: '22 Oct 2026', amount: 6000}
    ];

    document.getElementById('products').innerText = products.length;
    document.getElementById('events').innerText = bookings.length;
    document.getElementById('team').innerText = 8;
    document.getElementById('revenue').innerText = bookings.reduce((a,b) => a+b.amount, 0);

    loadInventory(products);
    loadBookings(bookings);
    loadServices();
    loadDelivery();
}

function loadInventory(products) {
    const container = document.getElementById('inventoryList');
    container.innerHTML = products.map(p => `
        <div class="event-row">
            <div>
                <strong>${p.name}</strong>
                <p style="color:#64748b; font-size:12px;">${p.type} | ${p.category} | Stock: ${p.stock}</p>
                <span class="date-badge">${p.size}</span>
            </div>
            <strong style="color:#a855f7;">₹${p.price}</strong>
        </div>
    `).join('');
}

function loadBookings(bookings) {
    const container = document.getElementById('bookingList');
    container.innerHTML = bookings.map(b => `
        <div style="border:2px solid #f3e8ff; border-radius:12px; padding:15px; margin-bottom:12px;">
            <h4>${b.customer}</h4>
            <p style="color:#64748b; font-size:14px;">${b.event} | Booking: ${b.id}</p>
            <span class="date-badge">📅 ${b.date}</span>
            <strong style="color:#a855f7; float:right;">₹${b.amount}</strong>
        </div>
    `).join('');
}

function loadServices() {
    const services = ['Wedding Stage', 'Birthday Decor', 'Anniversary', 'Haldi/Mehndi', 'Baby Shower', 'Corporate Event', 'Lighting', 'Sound'];
    document.getElementById('services').innerHTML = services.map(s => `
        <div style="padding:8px; border-bottom:1px solid #f3e8ff;">✓ ${s}</div>
    `).join('');
}

function loadDelivery() {
    const delivers = [
        {customer: 'Amit', work: 'Birthday Balloon Setup', place: 'City Garden', time: '5 PM'},
        {customer: 'Priya', work: 'Stage Lights Delivery', place: 'Royal Hall', time: '10 AM'}
    ];
    document.getElementById('delivery').innerHTML = delivers.map(d => `
        <div style="background:#f3e8ff; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${d.customer}</strong>
            <p style="font-size:12px; color:#64748b;">${d.work} | ${d.place} | ${d.time}</p>
        </div>
    `).join('');
}

document.getElementById('addItemBtn').onclick = () => {
    window.location.href = `/shop-templates/decoration-shop/item-form.html?shopId=${shopId}`;
};
document.getElementById('newBookingBtn').onclick = () => {
    window.location.href = `/shop-templates/decoration-shop/booking.html?shopId=${shopId}`;
};

loadShopData();
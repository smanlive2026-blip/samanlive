const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const bookings = shop.bookings || [];
    const services = shop.services || [
        {name: 'Facial', price: 800, type: 'Service'}, {name: 'Haircut', price: 300, type: 'Service'},
        {name: 'Manicure', price: 400, type: 'Service'}, {name: 'Bridal Makeup', price: 5000, type: 'Service'},
        {name: 'Lipstick', price: 450, type: 'Product'}, {name: 'Face Cream', price: 600, type: 'Product'}
    ];

    document.getElementById('todayBookings').innerText = bookings.length;
    document.getElementById('clients').innerText = shop.clients || 0;
    document.getElementById('productsSold').innerText = shop.productsSold || 0;
    document.getElementById('revenue').innerText = shop.todayRevenue || 0;

    loadBookings(bookings);
    loadServices(services);
}

function loadBookings(bookings) {
    const container = document.getElementById('bookingList');
    if (bookings.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#94a3b8; padding:40px;">No appointments today</p>`;
        return;
    }
    container.innerHTML = bookings.map(b => `
        <div class="booking-card">
            <div>
                <h4>${b.clientName} - ${b.service}</h4>
                <p style="color:#64748b; font-size:14px;">Time: ${b.time} | ₹${b.price} | ${b.phone}</p>
            </div>
            <span class="status ${b.status}">${b.status}</span>
        </div>
    `).join('');
}

function loadServices(services) {
    const container = document.getElementById('serviceList');
    container.innerHTML = services.map(s => `
        <div style="display:flex; justify-content:space-between; padding:15px; border-bottom:1px solid #fce7f3;">
            <div>
                <strong>${s.name}</strong>
                <span style="font-size:12px; color:#64748b; margin-left:10px;">${s.type}</span>
            </div>
            <strong style="color:#ec4899;">₹${s.price}</strong>
        </div>
    `).join('');
}

document.getElementById('addServiceBtn').onclick = () => {
    window.location.href = `/shop-templates/beauty/service-form.html?shopId=${shopId}`;
};

loadShopData();
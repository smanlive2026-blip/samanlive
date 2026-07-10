const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;
    
    const items = shop.rentalItems || [];
    const bookings = shop.bookings || [];
    
    document.getElementById('totalItems').innerText = items.length;
    document.getElementById('activeRentals').innerText = bookings.filter(b => b.status === 'active').length;
    document.getElementById('monthEarning').innerText = shop.monthEarning || 0;
    
    const today = new Date().toDateString();
    document.getElementById('dueToday').innerText = bookings.filter(b => new Date(b.endDate).toDateString() === today).length;
    
    loadBookings(bookings);
    loadItems(items);
}

function loadBookings(bookings) {
    const container = document.getElementById('bookingList');
    if (bookings.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#94a3b8; padding:40px;">No bookings yet</p>`;
        return;
    }
    container.innerHTML = bookings.map(b => `
        <div class="booking-card">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                <h4>${b.itemName} - ${b.customerName}</h4>
                <span class="status-badge ${b.status}">${b.status.toUpperCase()}</span>
            </div>
            <p><i class="fa fa-calendar"></i> ${b.startDate} to ${b.endDate}</p>
            <p><i class="fa fa-phone"></i> ${b.phone} | <i class="fa fa-rupee-sign"></i> ${b.totalAmount}</p>
        </div>
    `).join('');
}

function loadItems(items) {
    const grid = document.getElementById('itemGrid');
    if (items.length === 0) {
        grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#94a3b8;">No items added</p>`;
        return;
    }
    grid.innerHTML = items.map(item => `
        <div class="item-card">
            <h4>${item.name}</h4>
            <p style="color:#64748b; font-size:12px;">${item.category}</p>
            <div class="rent">₹${item.rentPerDay}/day</div>
            <span class="availability ${item.isAvailable? 'available' : 'rented'}">
                ${item.isAvailable? 'Available' : 'Rented'}
            </span>
        </div>
    `).join('');
}

document.getElementById('addItemBtn').onclick = () => {
    window.location.href = `/shop-templates/rental/item-form.html?shopId=${shopId}`;
};

loadShopData();
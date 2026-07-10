const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;
    
    const appointments = shop.appointments || [];
    const today = new Date().toDateString();
    const todayAppts = appointments.filter(a => new Date(a.date).toDateString() === today);
    
    document.getElementById('todayAppt').innerText = todayAppts.length;
    document.getElementById('activeStylists').innerText = shop.stylists?.length || 0;
    document.getElementById('todayRevenue').innerText = shop.todayRevenue || 0;
    
    loadAppointments(todayAppts);
    loadServices(shop.services || []);
}

function loadAppointments(appts) {
    const container = document.getElementById('appointmentList');
    if (appts.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#94a3b8; padding:40px;">No appointments for today</p>`;
        return;
    }
    container.innerHTML = appts.map(a => `
        <div class="appointment-card">
            <div>
                <h4>${a.customerName} - ${a.service}</h4>
                <p style="color:#64748b; font-size:14px;"><i class="fa fa-phone"></i> ${a.phone}</p>
            </div>
            <div class="time-badge"><i class="fa fa-clock"></i> ${a.time}</div>
        </div>
    `).join('');
}

function loadServices(services) {
    const grid = document.getElementById('serviceGrid');
    const defaultServices = [
        {name: 'Haircut', price: 200}, {name: 'Hair Spa', price: 800}, {name: 'Facial', price: 1200},
        {name: 'Manicure', price: 400}, {name: 'Pedicure', price: 500}, {name: 'Bridal Makeup', price: 8000}
    ];
    const data = services.length > 0 ? services : defaultServices;
    
    grid.innerHTML = data.map(s => `
        <div class="service-item">
            <h4>${s.name}</h4>
            <div class="price">₹${s.price}</div>
        </div>
    `).join('');
}

document.getElementById('addServiceBtn').onclick = () => {
    window.location.href = `/shop-templates/salon/service-form.html?shopId=${shopId}`;
};

loadShopData();
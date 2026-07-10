const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const jobs = shop.jobs || [];
    const services = shop.services || [
        {name: 'Sole Change', price: 200}, {name: 'Stitching', price: 80}, 
        {name: 'Polish', price: 50}, {name: 'Heel Repair', price: 120}
    ];

    document.getElementById('pendingJobs').innerText = jobs.filter(j => j.status === 'pending').length;
    document.getElementById('completedJobs').innerText = jobs.filter(j => j.status === 'done').length;
    document.getElementById('todayEarning').innerText = shop.todayEarning || 0;
    document.getElementById('customers').innerText = shop.customers || 0;

    loadJobs(jobs);
    loadServices(services);
}

function loadJobs(jobs) {
    const container = document.getElementById('jobList');
    if (jobs.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#94a3b8; padding:40px;">No jobs today</p>`;
        return;
    }
    container.innerHTML = jobs.map(j => `
        <div class="job-card">
            <div>
                <h4>${j.customerName} - ${j.work}</h4>
                <p style="color:#64748b; font-size:14px;">Token: ${j.token} | ₹${j.price} | Delivery: ${j.deliveryDate}</p>
            </div>
            <span class="status ${j.status}">${j.status === 'pending'? 'Pending' : 'Done'}</span>
        </div>
    `).join('');
}

function loadServices(services) {
    const container = document.getElementById('serviceList');
    container.innerHTML = services.map(s => `
        <div style="display:flex; justify-content:space-between; padding:15px; border-bottom:1px solid #fef3c7;">
            <strong>${s.name}</strong>
            <strong style="color:#a16207;">₹${s.price}</strong>
        </div>
    `).join('');
}

document.getElementById('newJobBtn').onclick = () => {
    window.location.href = `/shop-templates/mochi/job-form.html?shopId=${shopId}`;
};

loadShopData();
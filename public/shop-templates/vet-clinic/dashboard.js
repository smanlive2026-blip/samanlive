const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Clinic not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const appointments = shop.appointments || [
        {id: 'C001', owner: 'Ramesh Patel', animal: 'Cow', problem: 'Fever', time: '10:00 AM', status: 'pending'},
        {id: 'C002', owner: 'Sita Devi', animal: 'Buffalo', problem: 'Vaccination', time: '11:30 AM', status: 'done'},
        {id: 'C003', owner: 'Mohan', animal: 'Goat', problem: 'Wound', time: '12:00 PM', status: 'pending'}
    ];

    const treatments = shop.treatments || [
        {id: 'T001', owner: 'Rahul', animal: 'Cow', treatment: 'Antibiotic + IV', fee: 800},
        {id: 'T002', owner: 'Priya', animal: 'Dog', treatment: 'Surgery', fee: 2500}
    ];

    document.getElementById('patients').innerText = appointments.length;
    document.getElementById('treatments').innerText = treatments.length;
    document.getElementById('vaccine').innerText = appointments.filter(a => a.problem.includes('Vaccination')).length;
    document.getElementById('revenue').innerText = treatments.reduce((a,b) => a+b.fee, 0);

    loadAppointments(appointments);
    loadTreatments(treatments);
    loadServices();
    loadFollowup();
}

function loadAppointments(apps) {
    const container = document.getElementById('appointmentList');
    container.innerHTML = apps.map(a => `
        <div class="patient-card">
            <div style="display:flex; justify-content:space-between;">
                <h4>${a.owner}</h4>
                <span class="status ${a.status}">${a.status === 'pending' ? 'Waiting' : 'Done'}</span>
            </div>
            <p style="color:#64748b; font-size:14px; margin-top:5px;">${a.animal} | Problem: ${a.problem}</p>
            <p style="color:#64748b; font-size:12px;">Time: ${a.time}</p>
        </div>
    `).join('');
}

function loadTreatments(treats) {
    const container = document.getElementById('treatmentList');
    container.innerHTML = treats.map(t => `
        <div style="background:#d1fae5; padding:15px; border-radius:12px; margin-bottom:12px;">
            <h4>${t.owner} - ${t.animal}</h4>
            <p style="color:#64748b; font-size:14px;">Treatment: ${t.treatment}</p>
            <strong style="color:#10b981;">Fee: ₹${t.fee}</strong>
        </div>
    `).join('');
}

function loadServices() {
    const services = ['General Checkup', 'Surgery', 'Vaccination', 'Ultrasound', 'Delivery Case', 'Home Visit', 'Deworming', 'IV Treatment'];
    document.getElementById('services').innerHTML = services.map(s => `
        <div style="padding:8px; border-bottom:1px solid #d1fae5;">✓ ${s}</div>
    `).join('');
}

function loadFollowup() {
    const follow = [
        {owner: 'Anita', animal: 'Buffalo', date: '15 Oct 2026', reason: 'Post Surgery'},
        {owner: 'Vikram', animal: 'Cow', date: '16 Oct 2026', reason: 'Vaccination 2nd Dose'}
    ];
    document.getElementById('followup').innerHTML = follow.map(f => `
        <div style="background:#fef3c7; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${f.owner} - ${f.animal}</strong>
            <p style="font-size:12px; color:#64748b;">${f.reason} | ${f.date}</p>
        </div>
    `).join('');
}

document.getElementById('newCaseBtn').onclick = () => {
    window.location.href = `/shop-templates/vet-clinic/case-form.html?shopId=${shopId}`;
};
document.getElementById('homeVisitBtn').onclick = () => {
    window.location.href = `/shop-templates/vet-clinic/visit-form.html?shopId=${shopId}`;
};

loadShopData();
const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadClinicData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const clinic = await res.json();
    if (!clinic._id) { alert('Clinic not found'); return; }

    document.getElementById('clinicName').innerText = clinic.shopName;

    const appointments = clinic.appointments || [];
    const patients = clinic.patients || [];
    const services = clinic.services || [
        {name: 'General Checkup', price: 300}, {name: 'BP Check', price: 50},
        {name: 'Injection', price: 100}, {name: 'Dressing', price: 150},
        {name: 'ECG', price: 500}, {name: 'Lab Test', price: 400}
    ];

    document.getElementById('todayPatients').innerText = appointments.length;
    document.getElementById('waiting').innerText = appointments.filter(a => a.status === 'waiting').length;
    document.getElementById('totalRecords').innerText = patients.length;
    document.getElementById('todayRevenue').innerText = clinic.todayRevenue || 0;

    loadAppointments(appointments);
    loadServices(services);
}

function loadAppointments(appointments) {
    const container = document.getElementById('appointmentList');
    if (appointments.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#94a3b8; padding:40px;">No appointments today</p>`;
        return;
    }
    container.innerHTML = appointments.map(a => `
        <div class="appointment-card">
            <div>
                <h4>${a.patientName} - ${a.age} yrs, ${a.gender}</h4>
                <p style="color:#64748b; font-size:14px;">Token: ${a.token} | Problem: ${a.problem} | Time: ${a.time}</p>
            </div>
            <div style="display:flex; gap:10px; align-items:center;">
                <span class="status ${a.status}">${a.status}</span>
                <button onclick="viewPatient('${a.patientId}')" style="background:#0ea5e9; color:white; border:none; padding:8px 12px; border-radius:8px; cursor:pointer;">
                    <i class="fa fa-eye"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function loadServices(services) {
    const container = document.getElementById('serviceList');
    container.innerHTML = services.map(s => `
        <div style="display:flex; justify-content:space-between; padding:15px; border-bottom:1px solid #e0f2fe;">
            <strong>${s.name}</strong>
            <strong style="color:#0ea5e9;">₹${s.price}</strong>
        </div>
    `).join('');
}

document.getElementById('newAppointmentBtn').onclick = () => {
    window.location.href = `/shop-templates/clinic/appointment-form.html?shopId=${shopId}`;
};
document.getElementById('addPatientBtn').onclick = () => {
    window.location.href = `/shop-templates/clinic/patient-form.html?shopId=${shopId}`;
};
function viewPatient(id) {
    window.location.href = `/shop-templates/clinic/patient-record.html?shopId=${shopId}&patientId=${id}`;
}

loadClinicData();
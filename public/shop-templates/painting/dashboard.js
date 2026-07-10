const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) { alert('Shop not found'); return; }

    document.getElementById('shopName').innerText = shop.shopName;

    const projects = shop.projects || [
        {id: 'PT001', client: 'Rahul Sharma', type: 'Home Interior', area: '1200 sqft', status: 'In Progress', amount: 45000},
        {id: 'PT002', client: 'XYZ Office', type: 'Office Painting', area: '800 sqft', status: 'Pending', amount: 28000},
        {id: 'PT003', client: 'Priya', type: 'Texture Work', area: '500 sqft', status: 'Completed', amount: 35000}
    ];

    const quotes = [
        {id: 'Q001', client: 'Amit', work: 'Exterior + Waterproof', estimate: 65000},
        {id: 'Q002', client: 'Neha', work: '2BHK Interior', estimate: 52000}
    ];

    document.getElementById('projects').innerText = projects.filter(p => p.status !== 'Completed').length;
    document.getElementById('clients').innerText = 45;
    document.getElementById('completed').innerText = projects.filter(p => p.status === 'Completed').length;
    document.getElementById('revenue').innerText = projects.reduce((a,b) => a+b.amount, 0);

    loadProjects(projects);
    loadQuotes(quotes);
    loadSchedule();
    loadServices();
}

function loadProjects(projects) {
    const container = document.getElementById('projectList');
    container.innerHTML = projects.map(p => `
        <div class="project-card">
            <div style="display:flex; justify-content:space-between;">
                <h4>${p.client}</h4>
                <span class="status-badge ${p.status==='Completed'?'status-done':p.status==='In Progress'?'status-progress':'status-pending'}">${p.status}</span>
            </div>
            <p style="color:#64748b; font-size:14px; margin-top:5px;">${p.type} | ${p.area}</p>
            <strong style="color:#3b82f6;">₹${p.amount}</strong>
        </div>
    `).join('');
}

function loadQuotes(quotes) {
    const container = document.getElementById('quoteList');
    container.innerHTML = quotes.map(q => `
        <div style="padding:15px; border-bottom:1px solid #dbeafe;">
            <strong>${q.client}</strong>
            <p style="color:#64748b; font-size:12px;">${q.work}</p>
            <strong style="color:#3b82f6;">Est: ₹${q.estimate}</strong>
        </div>
    `).join('');
}

function loadSchedule() {
    const schedule = [
        {date: '8 Oct', work: 'Rahul Sharma - 2nd Coat'},
        {date: '10 Oct', work: 'XYZ Office - Start'},
        {date: '12 Oct', work: 'Site Visit - Neha'}
    ];
    document.getElementById('schedule').innerHTML = schedule.map(s => `
        <div style="background:#dbeafe; padding:12px; border-radius:10px; margin-bottom:10px;">
            <strong>${s.date}</strong> - ${s.work}
        </div>
    `).join('');
}

function loadServices() {
    const services = ['Interior Painting', 'Exterior Painting', 'Texture Design', 'Waterproofing', 'Wall Putty', 'Stenciling'];
    document.getElementById('services').innerHTML = services.map(s => `
        <div style="padding:8px; border-bottom:1px solid #dbeafe;">✓ ${s}</div>
    `).join('');
}

document.getElementById('addProjectBtn').onclick = () => {
    window.location.href = `/shop-templates/painting/project-form.html?shopId=${shopId}`;
};
document.getElementById('estimateBtn').onclick = () => {
    window.location.href = `/shop-templates/painting/estimate.html?shopId=${shopId}`;
};

loadShopData();
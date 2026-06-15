const API_BASE = '/api';
let allModules = [];
let allCategories = [];
let allShops = [];
let allManagers = [];
let allContent = [];
let allAreas = []; // Added for Areas

// ========== UTILITY FUNCTIONS ==========
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = { method, headers: {} };
        if (data) {
            if (data instanceof FormData) options.body = data;
            else {
                options.headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(data);
            }
        }
        const response = await fetch(API_BASE + endpoint, options);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        return await response.json();
    } catch (err) {
        showToast(err.message || 'Something went wrong', 'error');
        throw err;
    }
}

function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = `position:fixed;top:20px;right:20px;padding:14px 20px;background:${type==='error'?'#ef4444':'#10b981'};color:white;border-radius:8px;font-weight:600;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15);max-width:350px;`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showLoading(tableId) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (tbody) {
        const colCount = tbody.closest('table').querySelectorAll('thead th').length;
        tbody.innerHTML = `<tr><td colspan="${colCount}" style="text-align:center;padding:40px;color:#64748b;">Loading...</td></tr>`;
    }
}

function filterTable(tableId, query) {
    const table = document.getElementById(tableId);
    if (!table) return;
    const rows = table.querySelectorAll('tbody tr');
    const searchTerm = query.toLowerCase().trim();
    rows.forEach(row => {
        if (row.cells.length === 1 && row.cells[0].colSpan > 1) return;
        row.style.display = row.textContent.toLowerCase().includes(searchTerm)? '' : 'none';
    });
}

function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
}

// ========== URL PARAM HELPER ==========
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// ========== PAGE LOADER ==========
async function loadPage(pageName, btnElement) {
    // Active class update
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    if (btnElement) {
        btnElement.classList.add('active');
    } else if (event && event.target) {
        event.target.classList.add('active');
    }

    try {
        // Cleanup previous maps
        if (window.moduleMap) { window.moduleMap.remove(); window.moduleMap = null; }
        if (window.shopMap) { window.shopMap.remove(); window.shopMap = null; }
        if (window.areaMap) { window.areaMap.remove(); window.areaMap = null; }

        const res = await fetch(pageName + '.html');
        if (!res.ok) throw new Error('Page not found');
        const html = await res.text();
        document.getElementById('mainContainer').innerHTML = html;

        // Page ke scripts execute karo
        const container = document.getElementById('mainContainer');
        const scripts = container.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            if (oldScript.src) {
                newScript.src = oldScript.src;
            } else {
                newScript.textContent = oldScript.textContent;
            }
            // Remove old script to prevent duplicate
            oldScript.remove();
            document.body.appendChild(newScript);
        });

        // Update URL without reload
        if (history.pushState) {
            const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?page=' + pageName;
            window.history.pushState({path: newUrl}, '', newUrl);
        }
    } catch (err) {
        document.getElementById('mainContainer').innerHTML = `
            <div class="card" style="text-align:center;padding:60px;">
                <h2 style="color:#ef4444;">⚠️ Error loading ${pageName}</h2>
                <p style="color:#64748b;margin-top:10px;">${err.message}</p>
                <button class="btn btn-primary" onclick="location.reload()" style="margin-top:20px;">Reload Page</button>
            </div>`;
    }
}

// ========== AREA HELPER FUNCTIONS ==========
async function loadAllAreas() {
    try {
        const data = await apiCall('/areas');
        allAreas = data || [];
        return allAreas;
    } catch (err) {
        allAreas = [];
        return [];
    }
}

async function loadAreaByCode(areaCode) {
    try {
        return await apiCall('/area/' + areaCode);
    } catch (err) {
        return null;
    }
}

// 15 Bucket List - Global constant
const BUCKET_LIST = [
    { id: 'Grocery', name: 'Grocery Manager', icon: '🛒', desc: 'Ration, FMCG, Oil, Masala' },
    { id: 'Fresh', name: 'Fresh Manager', icon: '🥬', desc: 'Sabzi, Fruit, Dairy, Bakery' },
    { id: 'Food', name: 'Food Manager', icon: '🍕', desc: 'Restaurant, Tiffin, Cloud Kitchen' },
    { id: 'Medicine', name: 'Medicine Manager', icon: '💊', desc: 'Dawai, Medical, Surgical' },
    { id: 'Electronics', name: 'Electronics Manager', icon: '📱', desc: 'Mobile, TV, Fridge, Appliances' },
    { id: 'Fashion', name: 'Fashion Manager', icon: '👗', desc: 'Kapde, Footwear, Accessories' },
    { id: 'Home', name: 'Home Manager', icon: '🏠', desc: 'Furniture, Decor, Kitchenware' },
    { id: 'Hardware', name: 'Hardware Manager', icon: '🔧', desc: 'Cement, Paint, Tools, Electric' },
    { id: 'Beauty', name: 'Beauty Manager', icon: '💄', desc: 'Cosmetics, Salon, Parlour' },
    { id: 'Auto', name: 'Auto Manager', icon: '🚗', desc: 'Bike/Car, Parts, Garage, Petrol' },
    { id: 'Stationery', name: 'Stationery Manager', icon: '📚', desc: 'Books, School, Office Supply' },
    { id: 'Service', name: 'Service Manager', icon: '⚙️', desc: 'Plumber, Electrician, Carpenter' },
    { id: 'Meat', name: 'Meat Manager', icon: '🍖', desc: 'Chicken, Mutton, Fish, Eggs' },
    { id: 'Puja', name: 'Puja Manager', icon: '🪔', desc: 'Agarbatti, Murti, Religious Items' },
    { id: 'Others', name: 'Others Manager', icon: '🎁', desc: 'Pet, Toy, Gift, Sports' }
];

function generateManagerCode(areaCode, bucket) {
    return `${areaCode}-${bucket}`.toUpperCase();
}

// ========== GLOBAL MAPS CLEANUP ==========
window.addEventListener('beforeunload', () => {
    if (window.moduleMap) window.moduleMap.remove();
    if (window.shopMap) window.shopMap.remove();
    if (window.areaMap) window.areaMap.remove();
});

// ========== INITIALIZE ON LOAD ==========
document.addEventListener('DOMContentLoaded', () => {
    // URL se page param pakdo
    const pageParam = getUrlParam('page') || 'dashboard';
    const navBtn = document.querySelector(`.nav-btn[onclick*="'${pageParam}'"]`);
    loadPage(pageParam, navBtn);
});

// Make functions globally available
window.loadPage = loadPage;
window.apiCall = apiCall;
window.showToast = showToast;
window.escapeHtml = escapeHtml;
window.showLoading = showLoading;
window.filterTable = filterTable;
window.formatDate = formatDate;
window.getUrlParam = getUrlParam;
window.loadAllAreas = loadAllAreas;
window.loadAreaByCode = loadAreaByCode;
window.BUCKET_LIST = BUCKET_LIST;
window.generateManagerCode = generateManagerCode;
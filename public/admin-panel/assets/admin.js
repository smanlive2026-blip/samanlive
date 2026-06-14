const API_BASE = '/api';
let allModules = [];
let allCategories = [];
let allShops = [];
let allManagers = [];
let allContent = [];

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

// ========== PAGE LOADER ==========
async function loadPage(pageName) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    try {
        const res = await fetch(pageName + '.html');
        const html = await res.text();
        document.getElementById('mainContainer').innerHTML = html;

        // Page ke scripts execute karo
        const scripts = document.getElementById('mainContainer').querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            if (oldScript.src) newScript.src = oldScript.src;
            else newScript.textContent = oldScript.textContent;
            document.body.appendChild(newScript);
        });
    } catch (err) {
        document.getElementById('mainContainer').innerHTML = `<div class="card"><h2>Error loading ${pageName}</h2></div>`;
    }
}

// Global maps cleanup
window.addEventListener('beforeunload', () => {
    if (window.moduleMap) window.moduleMap.remove();
    if (window.shopMap) window.shopMap.remove();
});
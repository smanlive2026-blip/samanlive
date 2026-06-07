// ==================== GLOBAL UTILS ONLY ====================
// Ye file ab sirf common functions ke liye hai
// Page-specific code har HTML file me hi hai

const API = '/api';

// ==================== TOAST ====================
function showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;top:20px;right:20px;padding:15px 25px;background:${type==='success'?'#10b981':'#ef4444'};color:white;border-radius:8px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15);`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ==================== API CALL ====================
async function apiCall(endpoint, method = 'GET', body = null) {
    try {
        const opts = { method, headers: {} };
        if (body &&!(body instanceof FormData)) {
            opts.headers['Content-Type'] = 'application/json';
            opts.body = JSON.stringify(body);
        } else if (body) {
            opts.body = body;
        }
        const res = await fetch(API + endpoint, opts);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'API Error');
        return data;
    } catch (err) {
        showToast(err.message, 'error');
        throw err;
    }
}

// ==================== NAV HIGHLIGHT ====================
document.addEventListener('DOMContentLoaded', () => {
    // Current page highlight karo
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
    document.querySelectorAll('.nav-btn').forEach(btn => {
        const href = btn.getAttribute('href');
        if (href && href.includes(currentPage)) {
            btn.classList.add('active');
        }
    });
});

// ==================== UNIVERSAL FILTER ====================
window.filterTable = (tableId, query) => {
    const rows = document.querySelectorAll(`#${tableId} tbody tr`);
    const q = query.toLowerCase();
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
    });
};

// ==================== UNIVERSAL MODAL CLOSE ====================
window.closeModal = () => {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(m => m.style.display = 'none');
};

window.onclick = (e) => {
    if (e.target.classList.contains('modal')) {
        closeModal();
    }
};

document.querySelectorAll('.close').forEach(btn => {
    btn.onclick = () => btn.closest('.modal').style.display = 'none';
});
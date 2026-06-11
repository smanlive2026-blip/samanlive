console.log('admin.js loaded successfully');

const API = '/api';

// ==================== ESCAPE HTML - XSS Protection ====================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
}

// ==================== TOAST ====================
function showToast(msg, type) {
    if (type === undefined) type = 'success';
    const oldToast = document.querySelector('.toast');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.style.cssText = 'position:fixed;top:20px;right:20px;padding:15px 25px;background:' + (type==='success'?'#10b981':'#ef4444') + ';color:white;border-radius:8px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15);font-family:system-ui;font-size:14px;';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 3000);
}

// ==================== API CALL - FIXED FOR NO LOGIN ====================
async function apiCall(endpoint, method, body) {
    if (method === undefined) method = 'GET';
    const token = localStorage.getItem('adminToken');
    try {
        const opts = {
            method: method,
            headers: {}
        };

        // Token hai to hi bhejo, warna skip karo
        if (token) {
            opts.headers['Authorization'] = 'Bearer ' + token;
        }

        if (body && !(body instanceof FormData)) {
            opts.headers['Content-Type'] = 'application/json';
            opts.body = JSON.stringify(body);
        } else if (body) {
            opts.body = body;
        }

        const res = await fetch(API + endpoint, opts);

        const contentType = res.headers.get('content-type');
        if (!contentType || contentType.indexOf('application/json') === -1) {
            throw new Error('Server error - Invalid response');
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'API Error');
        return data;
    } catch (err) {
        console.error('API Error:', err);
        showToast(err.message, 'error');
        throw err;
    }
}

// ==================== NAV HIGHLIGHT ====================
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
    document.querySelectorAll('.nav-btn').forEach(function(btn) {
        btn.classList.remove('active');
        const href = btn.getAttribute('href');
        if (href && href.indexOf(currentPage) !== -1) {
            btn.classList.add('active');
        }
    });
});

// ==================== UNIVERSAL FILTER ====================
function filterTable(tableId, query) {
    const rows = document.querySelectorAll('#' + tableId + ' tbody tr');
    const q = query.toLowerCase();
    rows.forEach(function(row) {
        const text = row.textContent.toLowerCase();
        row.style.display = text.indexOf(q) !== -1 ? '' : 'none';
    });
}

// ==================== UNIVERSAL MODAL CLOSE ====================
function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(function(m) {
        m.style.display = 'none';
        m.classList.remove('active');
    });
}

// Background click pe modal close
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        closeModal();
    }
});

// Close button pe modal close
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.close-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal();
        });
    });
});

// ==================== COPY TO CLIPBOARD ====================
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        showToast('Copied to clipboard!');
    }).catch(function() {
        showToast('Copy failed', 'error');
    });
}

// ==================== FORMAT DATE ====================
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ==================== EXPORT UTILITIES FOR PAGES ====================
window.escapeHtml = escapeHtml;
window.showToast = showToast;
window.apiCall = apiCall;
window.filterTable = filterTable;
window.closeModal = closeModal;
window.copyToClipboard = copyToClipboard;
window.formatDate = formatDate;
window.API = API;
console.log('admin.js loaded successfully');

const API = '/api';

// ==================== ESCAPE HTML - XSS Protection ====================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
}

// ==================== TOAST ====================
function showToast(msg, type = 'success') {
    document.querySelectorAll('.toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.style.cssText = `position:fixed;top:20px;right:20px;padding:15px 25px;background:${type==='success'?'#10b981':'#ef4444'};color:white;border-radius:8px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15);font-family:system-ui;font-size:14px;font-weight:600;animation:slideIn 0.3s ease;`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => { 
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300); 
    }, 3000);
}

// Add toast animation
if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// ==================== API CALL - PROFESSIONAL ====================
async function apiCall(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('adminToken');
    try {
        const opts = {
            method: method,
            headers: {}
        };

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
        if (!res.ok) {
            if (res.status === 401) {
                localStorage.removeItem('adminToken');
                showToast('Session expired. Please login again.', 'error');
                setTimeout(() => window.location.href = '/login.html', 1500);
            }
            throw new Error(data.error || 'API Error');
        }
        return data;
    } catch (err) {
        console.error('API Error:', err);
        if (!err.message.includes('Session expired')) {
            showToast(err.message || 'Network error', 'error');
        }
        throw err;
    }
}

// ==================== NAV HIGHLIGHT - FIXED ====================
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-btn').forEach(function(btn) {
        btn.classList.remove('active');
        const href = btn.getAttribute('href');
        if (href === currentPage || (currentPage === 'index.html' && href === 'index.html')) {
            btn.classList.add('active');
        }
    });
});

// ==================== UNIVERSAL FILTER ====================
function filterTable(tableId, query) {
    const rows = document.querySelectorAll('#' + tableId + ' tbody tr');
    const q = query.toLowerCase().trim();
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
    document.body.style.overflow = 'auto';
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

// ESC key se modal close
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
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

// ==================== LOGOUT FUNCTION ====================
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('adminToken');
        showToast('Logged out successfully');
        setTimeout(() => window.location.href = '/login.html', 1000);
    }
}

// ==================== LOADING STATE ====================
function showLoading(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
        el.innerHTML = '<div style="text-align:center;padding:40px;color:#64748b;"><div style="display:inline-block;width:40px;height:40px;border:4px solid #e5e7eb;border-top-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite;"></div><p style="margin-top:10px;">Loading...</p></div>';
    }
}

// Add spinner animation
if (!document.getElementById('spinner-styles')) {
    const style = document.createElement('style');
    style.id = 'spinner-styles';
    style.textContent = `
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

// ==================== EXPORT UTILITIES ====================
window.escapeHtml = escapeHtml;
window.showToast = showToast;
window.apiCall = apiCall;
window.filterTable = filterTable;
window.closeModal = closeModal;
window.copyToClipboard = copyToClipboard;
window.formatDate = formatDate;
window.logout = logout;
window.showLoading = showLoading;
window.API = API;
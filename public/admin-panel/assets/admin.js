// ==================== GLOBAL CONFIG ====================
const API_BASE = '/api'; // Tera backend URL. Render pe ye hi rahega

// ==================== UTILITY FUNCTIONS ====================

/**
 * API Call karne ka main function
 */
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method: method,
            headers: {}
        };

        if (data) {
            if (data instanceof FormData) {
                // FormData ke liye Content-Type browser khud set karega
                options.body = data;
            } else {
                options.headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(data);
            }
        }

        const response = await fetch(API_BASE + endpoint, options);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
        }

        // Agar response empty hai to
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        return { success: true };

    } catch (err) {
        console.error('API Error:', err);
        showToast(err.message || 'Something went wrong', 'error');
        throw err;
    }
}

/**
 * Toast notification dikhane ke liye
 */
function showToast(message, type = 'success') {
    // Purana toast hatao
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 14px 20px;
        background: ${type === 'error'? '#ef4444' : type === 'warning'? '#f59e0b' : '#10b981'};
        color: white;
        border-radius: 8px;
        font-weight: 600;
        font-size: 14px;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
        max-width: 350px;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * HTML escape karne ke liye - XSS se bachne ke liye
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Table me loading dikhane ke liye
 */
function showLoading(tableId) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (tbody) {
        const colCount = tbody.closest('table').querySelectorAll('thead th').length;
        tbody.innerHTML = `<tr><td colspan="${colCount}" style="text-align:center;padding:40px;color:#64748b;">Loading...</td></tr>`;
    }
}

/**
 * Table search/filter karne ke liye
 */
function filterTable(tableId, query) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const rows = table.querySelectorAll('tbody tr');
    const searchTerm = query.toLowerCase().trim();

    rows.forEach(row => {
        // Agar "No data" wala row hai to skip karo
        if (row.cells.length === 1 && row.cells[0].colSpan > 1) return;

        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm)? '' : 'none';
    });
}

/**
 * Clipboard me copy karne ke liye
 */
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard!');
        }).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const input = document.createElement('input');
    input.value = text;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    try {
        document.execCommand('copy');
        showToast('Copied to clipboard!');
    } catch (err) {
        showToast('Failed to copy', 'error');
    }
    document.body.removeChild(input);
}

/**
 * Date format karne ke liye
 */
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

/**
 * Number format karne ke liye
 */
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

/**
 * Debounce function - search ke liye
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ==================== ADD ANIMATIONS ====================
if (!document.getElementById('toastStyles')) {
    const style = document.createElement('style');
    style.id = 'toastStyles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// ==================== GLOBAL ERROR HANDLER ====================
window.addEventListener('error', function(e) {
    console.error('Global Error:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled Promise Rejection:', e.reason);
});

// ==================== EXPORT FOR USE ====================
// Ye functions global scope me available hain
window.apiCall = apiCall;
window.showToast = showToast;
window.escapeHtml = escapeHtml;
window.showLoading = showLoading;
window.filterTable = filterTable;
window.copyToClipboard = copyToClipboard;
window.formatDate = formatDate;
window.formatNumber = formatNumber;
window.debounce = debounce;
console.log('admin.js loaded successfully');

const API = '/api';

// ==================== ESCAPE HTML - XSS Protection ====================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text?? '';
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

        if (body &&!(body instanceof FormData)) {
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

    // Load managers if on managers page
    if (currentPage === 'managers.html') {
        loadManagers();
    }
});

// ==================== UNIVERSAL FILTER ====================
function filterTable(tableId, query) {
    const rows = document.querySelectorAll('#' + tableId + ' tbody tr');
    const q = query.toLowerCase().trim();
    rows.forEach(function(row) {
        const text = row.textContent.toLowerCase();
        row.style.display = text.indexOf(q)!== -1? '' : 'none';
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

window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        closeModal();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.close-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal();
        });
    });
});

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

// ==================== MANAGER FUNCTIONS ====================

let editingManagerId = null;
let allModules = [];

// Load all managers
async function loadManagers() {
    try {
        showLoading('managersTableBody');
        const managers = await apiCall('/managers');
        renderManagersTable(managers);
    } catch (err) {
        document.getElementById('managersTableBody').innerHTML = '<tr><td colspan="7" class="text-center">Error loading managers</td></tr>';
    }
}

// Render managers table
function renderManagersTable(managers) {
    const tbody = document.getElementById('managersTableBody');
    if (!tbody) return;
    
    if (!managers || managers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No managers found</td></tr>';
        return;
    }

    tbody.innerHTML = managers.map(manager => `
        <tr>
            <td>${escapeHtml(manager.name)}</td>
            <td>${escapeHtml(manager.area)}</td>
            <td>${escapeHtml(manager.email)}</td>
            <td>${escapeHtml(manager.phone)}</td>
            <td>
                <span class="badge ${manager.status? 'bg-success' : 'bg-danger'}">
                    ${manager.status? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>${manager.moduleAccess? manager.moduleAccess.length : 0} Modules</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editManager('${manager._id}')">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteManager('${manager._id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Open Add Manager Modal
async function openAddManagerModal() {
    editingManagerId = null;
    document.getElementById('managerForm').reset();
    document.getElementById('managerModalTitle').textContent = 'Add Manager';
    document.getElementById('previewContainer').innerHTML = '';
    
    await loadModulesForManager();
    
    document.getElementById('managerModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Load modules for manager form
async function loadModulesForManager() {
    try {
        const modules = await apiCall('/admin/data');
        allModules = modules.modules || [];
        
        const container = document.getElementById('moduleAccessContainer');
        if (!container) return;
        
        container.innerHTML = allModules.map(module => `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${module.name}" id="module_${module.id}">
                <label class="form-check-label" for="module_${module.id}">
                    ${escapeHtml(module.name)}
                </label>
            </div>
        `).join('');
    } catch (err) {
        console.error('Error loading modules:', err);
    }
}

// Edit Manager
async function editManager(id) {
    try {
        const managers = await apiCall('/managers');
        const manager = managers.find(m => m._id === id);
        if (!manager) return;
        
        editingManagerId = id;
        document.getElementById('managerModalTitle').textContent = 'Edit Manager';
        
        document.getElementById('managerName').value = manager.name;
        document.getElementById('managerArea').value = manager.area;
        document.getElementById('managerEmail').value = manager.email;
        document.getElementById('managerPhone').value = manager.phone;
        document.getElementById('managerServiceCharge').value = manager.serviceCharge || 5;
        document.getElementById('managerStatus').value = manager.status.toString();
        
        await loadModulesForManager();
        setTimeout(() => {
            if (manager.moduleAccess) {
                manager.moduleAccess.forEach(modName => {
                    const checkbox = document.querySelector(`input[value="${modName}"]`);
                    if (checkbox) checkbox.checked = true;
                });
            }
        }, 100);
        
        if (manager.documents) {
            let previewHTML = '';
            if (manager.documents.photo) {
                previewHTML += `<div class="col-3"><img src="${manager.documents.photo}" class="img-thumbnail" alt="Photo"><p class="small">Photo</p></div>`;
            }
            if (manager.documents.aadhar) {
                previewHTML += `<div class="col-3"><img src="${manager.documents.aadhar}" class="img-thumbnail" alt="Aadhar"><p class="small">Aadhar</p></div>`;
            }
            if (manager.documents.pan) {
                previewHTML += `<div class="col-3"><img src="${manager.documents.pan}" class="img-thumbnail" alt="PAN"><p class="small">PAN</p></div>`;
            }
            if (manager.documents.addressProof) {
                previewHTML += `<div class="col-3"><img src="${manager.documents.addressProof}" class="img-thumbnail" alt="Address"><p class="small">Address Proof</p></div>`;
            }
            document.getElementById('previewContainer').innerHTML = previewHTML;
        }
        
        document.getElementById('managerModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    } catch (err) {
        showToast('Error loading manager: ' + err.message, 'error');
    }
}

// Save Manager - Form Submit
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('managerForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('name', document.getElementById('managerName').value);
            formData.append('area', document.getElementById('managerArea').value);
            formData.append('email', document.getElementById('managerEmail').value);
            formData.append('phone', document.getElementById('managerPhone').value);
            formData.append('serviceCharge', document.getElementById('managerServiceCharge').value);
            formData.append('status', document.getElementById('managerStatus').value);
            
            const selectedModules = [];
            document.querySelectorAll('#moduleAccessContainer input:checked').forEach(cb => {
                selectedModules.push(cb.value);
            });
            formData.append('moduleAccess', JSON.stringify(selectedModules));
            
            const photoFile = document.getElementById('managerPhoto').files[0];
            const aadharFile = document.getElementById('managerAadhar').files[0];
            const panFile = document.getElementById('managerPan').files[0];
            const addressFile = document.getElementById('managerAddressProof').files[0];
            
            if (photoFile) formData.append('photo', photoFile);
            if (aadharFile) formData.append('aadhar', aadharFile);
            if (panFile) formData.append('pan', panFile);
            if (addressFile) formData.append('addressProof', addressFile);
            
            try {
                const saveBtn = document.getElementById('saveManagerBtn');
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving...';
                
                let response;
                if (editingManagerId) {
                    response = await apiCall(`/managers/${editingManagerId}`, 'PUT', formData);
                    showToast('Manager updated successfully', 'success');
                } else {
                    response = await apiCall('/admin/create-manager', 'POST', formData);
                    showToast('Manager created! Temp Password: ' + response.tempPassword, 'success');
                }
                
                closeModal();
                loadManagers();
                
            } catch (err) {
                // Error already shown by apiCall
            } finally {
                const saveBtn = document.getElementById('saveManagerBtn');
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = 'Save Manager';
                }
            }
        });
    }
});

// Delete Manager
async function deleteManager(id) {
    if (!confirm('Are you sure you want to delete this manager?')) return;
    
    try {
        await apiCall(`/managers/${id}`, 'DELETE');
        showToast('Manager deleted successfully', 'success');
        loadManagers();
    } catch (err) {
        // Error already shown by apiCall
    }
}

// File preview
function previewFile(input, previewId) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById(previewId).src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
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
window.openAddManagerModal = openAddManagerModal;
window.editManager = editManager;
window.deleteManager = deleteManager;
window.previewFile = previewFile;
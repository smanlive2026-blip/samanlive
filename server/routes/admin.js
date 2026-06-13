const API_BASE = '/api';
const token = localStorage.getItem('adminToken');

if (!token) {
    window.location.href = '/admin/login.html';
}

// API Helper
async function apiCall(endpoint, method = 'GET', body = null, isFormData = false) {
    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    if (body) {
        if (isFormData) {
            options.body = body;
        } else {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }
    }

    try {
        const response = await fetch(API_BASE + endpoint, options);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Server error');
        }
        return await response.json();
    } catch (err) {
        console.error('API Error:', err);
        throw err;
    }
}

// Logout
function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login.html';
}

// Check Auth on Load
document.addEventListener('DOMContentLoaded', () => {
    console.log('admin.js loaded successfully');
    
    // Load managers on page load if we're on managers page
    if (window.location.pathname.includes('managers.html')) {
        loadManagers();
    }
});

// ========================================
// MANAGER FUNCTIONS
// ========================================

let editingManagerId = null;
let allModules = [];

// Load all managers
async function loadManagers() {
    try {
        const managers = await apiCall('/managers');
        renderManagersTable(managers);
    } catch (err) {
        showToast('Error loading managers: ' + err.message, 'error');
    }
}

// Render managers table
function renderManagersTable(managers) {
    const tbody = document.getElementById('managersTableBody');
    if (!tbody) return;
    
    if (managers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No managers found</td></tr>';
        return;
    }

    tbody.innerHTML = managers.map(manager => `
        <tr>
            <td>${manager.name}</td>
            <td>${manager.area}</td>
            <td>${manager.email}</td>
            <td>${manager.phone}</td>
            <td>
                <span class="badge ${manager.status ? 'bg-success' : 'bg-danger'}">
                    ${manager.status ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>${manager.moduleAccess ? manager.moduleAccess.length : 0} Modules</td>
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
    
    // Load modules for checkboxes
    await loadModulesForManager();
    
    const modal = new bootstrap.Modal(document.getElementById('managerModal'));
    modal.show();
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
                    ${module.name}
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
        
        // Fill form
        document.getElementById('managerName').value = manager.name;
        document.getElementById('managerArea').value = manager.area;
        document.getElementById('managerEmail').value = manager.email;
        document.getElementById('managerPhone').value = manager.phone;
        document.getElementById('managerServiceCharge').value = manager.serviceCharge || 5;
        document.getElementById('managerStatus').value = manager.status.toString();
        
        // Load modules and check selected ones
        await loadModulesForManager();
        setTimeout(() => {
            if (manager.moduleAccess) {
                manager.moduleAccess.forEach(modName => {
                    const checkbox = document.querySelector(`input[value="${modName}"]`);
                    if (checkbox) checkbox.checked = true;
                });
            }
        }, 100);
        
        // Show existing documents
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
        
        const modal = new bootstrap.Modal(document.getElementById('managerModal'));
        modal.show();
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
            
            // Get selected modules
            const selectedModules = [];
            document.querySelectorAll('#moduleAccessContainer input:checked').forEach(cb => {
                selectedModules.push(cb.value);
            });
            formData.append('moduleAccess', JSON.stringify(selectedModules));
            
            // Add files
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
                    response = await apiCall(`/managers/${editingManagerId}`, 'PUT', formData, true);
                    showToast('Manager updated successfully', 'success');
                } else {
                    response = await apiCall('/admin/create-manager', 'POST', formData, true);
                    showToast('Manager created! Login: ' + response.loginLink, 'success');
                }
                
                bootstrap.Modal.getInstance(document.getElementById('managerModal')).hide();
                loadManagers();
                
            } catch (err) {
                showToast('Save error: ' + err.message, 'error');
            } finally {
                const saveBtn = document.getElementById('saveManagerBtn');
                saveBtn.disabled = false;
                saveBtn.innerHTML = 'Save Manager';
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
        showToast('Delete error: ' + err.message, 'error');
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

// Toast notification
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toastId = 'toast-' + Date.now();
    const bgClass = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-info';
    
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// Make functions global
window.openAddManagerModal = openAddManagerModal;
window.editManager = editManager;
window.deleteManager = deleteManager;
window.previewFile = previewFile;
window.logout = logout;
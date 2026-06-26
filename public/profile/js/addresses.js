// ========================================
// MY ADDRESSES - ADDRESS MANAGEMENT LOGIC
// app.js se LocationManager + currentUser use karega
// ========================================

let currentUser = null;
let allAddresses = [];
let editingAddressId = null;

// ========================================
// PAGE LOAD - Init
// ========================================
window.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('userToken');
    if (!token) {
        window.location.href = '/';
        return;
    }

    // app.js se user check karo pehle
    if (window.currentUser) {
        currentUser = window.currentUser;
    } else {
        // Agar app.js me nahi mila to API se
        try {
            const res = await fetch('/api/auth/me', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            if (data.success) {
                currentUser = data.user;
                window.currentUser = data.user;
            } else {
                localStorage.removeItem('userToken');
                window.location.href = '/';
                return;
            }
        } catch (err) {
            window.location.href = '/';
            return;
        }
    }

    await loadAddresses();
});

// ========================================
// LOAD ADDRESSES - API se
// ========================================
async function loadAddresses() {
    const token = localStorage.getItem('userToken');
    try {
        const res = await fetch('/api/user/addresses', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (data.success) {
            allAddresses = data.addresses || [];
            renderAddresses();
        }
    } catch (err) {
        console.error('Failed to load addresses:', err);
    }
}

// ========================================
// RENDER ADDRESSES - UI me dikhao
// ========================================
function renderAddresses() {
    const container = document.getElementById('addressesContainer');

    if (allAddresses.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📍</div>
                <h2>No Addresses Saved</h2>
                <p>Add your delivery addresses to get faster checkout</p>
            </div>
        `;
        return;
    }

    container.innerHTML = allAddresses.map(addr => `
        <div class="address-card">
            ${addr.isDefault? '<div class="default-badge">DEFAULT</div>' : ''}
            <div class="address-type">
                ${addr.type === 'Home'? '🏠' : addr.type === 'Work'? '🏢' : '📍'} ${addr.type}
            </div>
            <div class="address-name">${addr.name}</div>
            <div class="address-text">
                ${addr.line1}<br>
                ${addr.line2}<br>
                ${addr.city}, ${addr.state} - ${addr.pincode}<br>
                📱 ${addr.phone}
                ${addr.location? `<br>📍 GPS: ${addr.location.coordinates[1].toFixed(4)}, ${addr.location.coordinates[0].toFixed(4)}` : ''}
            </div>
            <div class="address-actions">
                ${!addr.isDefault? `<button class="action-btn btn-default" onclick="setDefaultAddress('${addr._id}')">Set Default</button>` : ''}
                <button class="action-btn btn-edit" onclick="editAddress('${addr._id}')">Edit</button>
                <button class="action-btn btn-delete" onclick="deleteAddress('${addr._id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// ========================================
// OPEN ADDRESS MODAL - Add/Edit
// ========================================
window.openAddressModal = function(addressId = null) {
    editingAddressId = addressId;
    document.getElementById('modalTitle').textContent = addressId? 'Edit Address' : 'Add New Address';

    if (addressId) {
        const addr = allAddresses.find(a => a._id === addressId);
        document.getElementById('addressId').value = addr._id;
        document.getElementById('addressType').value = addr.type;
        document.getElementById('addressName').value = addr.name;
        document.getElementById('addressPhone').value = addr.phone;
        document.getElementById('addressLine1').value = addr.line1;
        document.getElementById('addressLine2').value = addr.line2;
        document.getElementById('addressCity').value = addr.city;
        document.getElementById('addressPincode').value = addr.pincode;
        document.getElementById('addressState').value = addr.state;
        document.getElementById('setDefault').checked = addr.isDefault;

        if (addr.location) {
            document.getElementById('addressLat').value = addr.location.coordinates[1];
            document.getElementById('addressLng').value = addr.location.coordinates[0];
            document.getElementById('locationCoords').innerHTML = `
                <strong>Lat:</strong> ${addr.location.coordinates[1].toFixed(6)}<br>
                <strong>Lng:</strong> ${addr.location.coordinates[0].toFixed(6)}
            `;
            document.getElementById('locationCoords').classList.add('success');
        }
    } else {
        document.getElementById('addressId').value = '';
        document.getElementById('addressType').value = 'Home';
        document.getElementById('addressName').value = '';
        document.getElementById('addressPhone').value = '';
        document.getElementById('addressLine1').value = '';
        document.getElementById('addressLine2').value = '';
        document.getElementById('addressCity').value = '';
        document.getElementById('addressPincode').value = '';
        document.getElementById('addressState').value = '';
        document.getElementById('setDefault').checked = false;
        document.getElementById('addressLat').value = '';
        document.getElementById('addressLng').value = '';
        document.getElementById('locationCoords').innerHTML = 'Loading your current location...';
        document.getElementById('locationCoords').classList.remove('success');
        autoFillLocation();
    }

    document.getElementById('addressModal').classList.add('active');
}

window.closeAddressModal = function() {
    document.getElementById('addressModal').classList.remove('active');
}

// ========================================
// AUTO FILL LOCATION - app.js se
// ========================================
function autoFillLocation() {
    const coordsEl = document.getElementById('locationCoords');

    if (window.currentUserLocation) {
        const lat = window.currentUserLocation.lat;
        const lng = window.currentUserLocation.lng;
        document.getElementById('addressLat').value = lat;
        document.getElementById('addressLng').value = lng;
        coordsEl.innerHTML = `
            <strong>Lat:</strong> ${lat.toFixed(6)}<br>
            <strong>Lng:</strong> ${lng.toFixed(6)}
        `;
        coordsEl.classList.add('success');
    } else {
        coordsEl.innerHTML = '⏳ Waiting for location... Make sure GPS is enabled';
        setTimeout(() => {
            if (window.currentUserLocation) {
                autoFillLocation();
            } else {
                coordsEl.innerHTML = '❌ Location not available. Please enable GPS in app settings';
            }
        }, 2000);
    }
}

// ========================================
// SAVE ADDRESS - Create/Update API
// ========================================
window.saveAddress = async function() {
    const btn = document.getElementById('saveBtn');
    btn.textContent = 'Saving...';
    btn.disabled = true;

    const token = localStorage.getItem('userToken');
    const lat = document.getElementById('addressLat').value;
    const lng = document.getElementById('addressLng').value;

    const addressData = {
        type: document.getElementById('addressType').value,
        name: document.getElementById('addressName').value.trim(),
        phone: document.getElementById('addressPhone').value.trim(),
        line1: document.getElementById('addressLine1').value.trim(),
        line2: document.getElementById('addressLine2').value.trim(),
        city: document.getElementById('addressCity').value.trim(),
        pincode: document.getElementById('addressPincode').value.trim(),
        state: document.getElementById('addressState').value.trim(),
        isDefault: document.getElementById('setDefault').checked,
        location: lat && lng? {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
        } : null
    };

    if (!addressData.name ||!addressData.phone ||!addressData.line1 ||!addressData.city ||!addressData.pincode ||!addressData.state) {
        alert('Please fill all required fields!');
        btn.textContent = 'Save Address';
        btn.disabled = false;
        return;
    }

    try {
        const url = editingAddressId
           ? `/api/user/addresses/${editingAddressId}`
            : '/api/user/addresses';
        const method = editingAddressId? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(addressData)
        });
        const data = await res.json();

        if (data.success) {
            await loadAddresses();
            closeAddressModal();
            alert('✅ Address saved successfully!');
        } else {
            alert('Error: ' + data.error);
        }
    } catch (err) {
        alert('Failed to save address. Try again.');
    }

    btn.textContent = 'Save Address';
    btn.disabled = false;
}

// ========================================
// EDIT ADDRESS
// ========================================
window.editAddress = function(addressId) {
    openAddressModal(addressId);
}

// ========================================
// DELETE ADDRESS
// ========================================
window.deleteAddress = async function(addressId) {
    if (!confirm('Delete this address?')) return;

    const token = localStorage.getItem('userToken');
    try {
        const res = await fetch(`/api/user/addresses/${addressId}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (data.success) {
            await loadAddresses();
            alert('Address deleted!');
        }
    } catch (err) {
        alert('Failed to delete address');
    }
}

// ========================================
// SET DEFAULT ADDRESS
// ========================================
window.setDefaultAddress = async function(addressId) {
    const token = localStorage.getItem('userToken');
    try {
        const res = await fetch(`/api/user/addresses/${addressId}/default`, {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (data.success) {
            await loadAddresses();
            alert('✅ Default address updated!');
        }
    } catch (err) {
        alert('Failed to set default');
    }
}
// ========================================
// MY DETAILS - USER PROFILE UPDATE LOGIC
// app.js se LocationManager + currentUser use karega
// ========================================

let currentUser = null;
let newProfilePic = null;

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
        loadUserData();
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
                loadUserData();
            } else {
                localStorage.removeItem('userToken');
                window.location.href = '/';
            }
        } catch (err) {
            window.location.href = '/';
        }
    }

    // Auto fill location from global
    autoFillLocation();
});

// ========================================
// LOAD USER DATA - Form me fill karo
// ========================================
function loadUserData() {
    document.getElementById('userName').value = currentUser.name || '';
    document.getElementById('userEmail').value = currentUser.email || '';
    document.getElementById('userPhone').value = currentUser.phone || '';
    document.getElementById('userAddress').value = currentUser.address?.street || '';
    document.getElementById('userCity').value = currentUser.address?.city || '';
    document.getElementById('userPincode').value = currentUser.address?.pincode || '';
    document.getElementById('userLang').value = currentUser.language || 'hi';
    document.getElementById('userProfilePic').src = currentUser.profilePic || '/assets/default-avatar.png';

    // Agar purani location hai to dikha do
    if (currentUser.location?.coordinates) {
        const lat = currentUser.location.coordinates[1];
        const lng = currentUser.location.coordinates[0];
        updateLocationUI(lat, lng, false);
    }
}

// ========================================
// AUTO FILL LOCATION - app.js se
// ========================================
function autoFillLocation() {
    const coordsEl = document.getElementById('locationCoords');

    if (window.currentUserLocation) {
        const lat = window.currentUserLocation.lat;
        const lng = window.currentUserLocation.lng;
        updateLocationUI(lat, lng, true);
    } else {
        coordsEl.innerHTML = '⏳ Waiting for location... Make sure GPS is enabled';
        // 2 sec baad fir check karo
        setTimeout(() => {
            if (window.currentUserLocation) {
                autoFillLocation();
            } else {
                coordsEl.innerHTML = '❌ Location not available. Please enable GPS in app settings';
            }
        }, 2000);
    }
}

function updateLocationUI(lat, lng, isAuto = false) {
    document.getElementById('userLat').value = lat;
    document.getElementById('userLng').value = lng;
    const coordsEl = document.getElementById('locationCoords');
    coordsEl.innerHTML = `
        <strong>Lat:</strong> ${lat.toFixed(6)}<br>
        <strong>Lng:</strong> ${lng.toFixed(6)}
        ${isAuto? '<br><small style="color:#10b981;">✅ Auto-updated from current location</small>' : ''}
    `;
    coordsEl.classList.add('success');
}

// ========================================
// PROFILE PIC CHANGE
// ========================================
function handlePicChange(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) {
            alert('Image size should be less than 2MB');
            return;
        }

        newProfilePic = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('userProfilePic').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// ========================================
// SAVE DETAILS - API Call
// ========================================
async function saveDetails() {
    const btn = document.getElementById('saveBtn');
    btn.textContent = 'Saving...';
    btn.disabled = true;

    const token = localStorage.getItem('userToken');
    const lat = document.getElementById('userLat').value;
    const lng = document.getElementById('userLng').value;

    const data = {
        name: document.getElementById('userName').value.trim(),
        email: document.getElementById('userEmail').value.trim(),
        phone: document.getElementById('userPhone').value.trim(),
        address: {
            street: document.getElementById('userAddress').value.trim(),
            city: document.getElementById('userCity').value.trim(),
            pincode: document.getElementById('userPincode').value.trim()
        },
        language: document.getElementById('userLang').value,
        location: lat && lng? {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
        } : undefined
    };

    if (!data.name ||!data.phone) {
        alert('Name and Phone are required!');
        btn.textContent = 'Save Details';
        btn.disabled = false;
        return;
    }

    try {
        const res = await fetch('/api/user/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(data)
        });
        const result = await res.json();

        if (result.success) {
            document.getElementById('successMsg').style.display = 'block';
            setTimeout(() => {
                document.getElementById('successMsg').style.display = 'none';
            }, 3000);
            currentUser = result.user;
            window.currentUser = result.user; // app.js me bhi update

            // Profile pic upload agar new hai to
            if (newProfilePic) {
                await uploadProfilePic(newProfilePic, token);
            }
        } else {
            alert('Update failed: ' + result.error);
        }
    } catch (err) {
        alert('Update failed. Please try again.');
    }

    btn.textContent = 'Save Details';
    btn.disabled = false;
}

// ========================================
// UPLOAD PROFILE PIC - Optional
// ========================================
async function uploadProfilePic(file, token) {
    const formData = new FormData();
    formData.append('profilePic', file);

    try {
        const res = await fetch('/api/user/upload-pic', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            body: formData
        });
        const result = await res.json();
        if (result.success) {
            currentUser.profilePic = result.url;
            window.currentUser.profilePic = result.url;
            document.getElementById('userProfilePic').src = result.url;
        }
    } catch (err) {
        console.log('Pic upload failed:', err);
    }
}
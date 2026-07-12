let newProfilePic = null;

window.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('userToken');
    if (!token) {
        window.location.href = '/';
        return;
    }

    if (window.currentUser) {
        currentUser = window.currentUser;
        loadUserData();
    } else {
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
    // autoFillLocation(); // COMMENTED: Location auto fill band
});

function loadUserData() {
    document.getElementById('userName').value = window.currentUser.name || '';
    document.getElementById('userEmail').value = window.currentUser.email || '';
    document.getElementById('userPhone').value = window.currentUser.phone || '';
    document.getElementById('userAddress').value = window.currentUser.address?.street || '';
    document.getElementById('userCity').value = window.currentUser.address?.city || '';
    document.getElementById('userPincode').value = window.currentUser.address?.pincode || '';
    document.getElementById('userLang').value = window.currentUser.language || 'hi';
    document.getElementById('userProfilePic').src = window.currentUser.profilePic || '/assets/default-avatar.png';

    // COMMENTED: Location load karna band
    /*
    if (window.currentUser.location?.coordinates) {
        const lat = window.currentUser.location.coordinates[1];
        const lng = window.currentUser.location.coordinates[0];
        updateLocationUI(lat, lng, false);
    }
    */
}

/*
function autoFillLocation() {
    const coordsEl = document.getElementById('locationCoords');
    if (window.currentUserLocation) {
        const lat = window.currentUserLocation.lat;
        const lng = window.currentUserLocation.lng;
        updateLocationUI(lat, lng, true);
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
*/

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

async function saveDetails() {
    const btn = document.getElementById('saveBtn');
    btn.textContent = 'Saving...';
    btn.disabled = true;

    const token = localStorage.getItem('userToken');
    // const lat = document.getElementById('userLat').value; // COMMENTED
    // const lng = document.getElementById('userLng').value; // COMMENTED

    const data = {
        name: document.getElementById('userName').value.trim(),
        email: document.getElementById('userEmail').value.trim(),
        phone: document.getElementById('userPhone').value.trim(),
        address: {
            street: document.getElementById('userAddress').value.trim(),
            city: document.getElementById('userCity').value.trim(),
            pincode: document.getElementById('userPincode').value.trim()
        },
        language: document.getElementById('userLang').value
        // location: lat && lng? { // COMMENTED: location bhejna band
        // type: 'Point',
        // coordinates: [parseFloat(lng), parseFloat(lat)]
        // } : undefined
    };

    if (!data.name ||!data.phone) {
        alert('Name and Phone are required!');
        btn.textContent = 'Save Details';
        btn.disabled = false;
        return;
    }

    try {
        // STEP 1: Pehle pic upload karo
        if (newProfilePic) {
            const picUrl = await uploadProfilePic(newProfilePic, token);
            if(picUrl) {
                data.profilePic = picUrl;
            } else {
                btn.textContent = 'Save Details';
                btn.disabled = false;
                return; // agar pic upload fail to aage mat jao
            }
        }

        // STEP 2: Fir saara data save karo
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
            currentUser = result.user;
            window.currentUser = result.user;
            newProfilePic = null;

            // 1.5 sec baad profile page pe redirect
            setTimeout(() => {
                document.getElementById('successMsg').style.display = 'none';
                window.location.href = '/profile.html'; // yaha apna page ka naam daal
            }, 1500);

        } else {
            alert('Update failed: ' + (result.error || result.message));
            btn.textContent = 'Save Details';
            btn.disabled = false;
        }
    } catch (err) {
        console.log(err);
        alert('Update failed. Please try again.');
        btn.textContent = 'Save Details';
        btn.disabled = false;
    }
}

async function uploadProfilePic(file, token) {
    const formData = new FormData();
    formData.append('profilePic', file);

    try {
        const res = await fetch('/api/upload/upload-pic', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            body: formData
        });
        const result = await res.json();
        console.log('Upload result:', result);
        if (result.success) {
            document.getElementById('userProfilePic').src = result.url;
            return result.url;
        } else {
            alert('Upload failed: ' + (result.error || result.message));
        }
    } catch (err) {
        console.log('Pic upload failed:', err);
        alert('Profile pic upload failed: ' + err.message);
    }
    return null;
}
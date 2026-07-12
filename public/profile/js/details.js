let newProfilePic = null;

window.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('userToken');
    if (!token) {
        window.location.href = '/';
        return;
    }

    if (window.currentUser) {
        window.currentUser = window.currentUser; // FIX: currentUser ko window se hi lo
        loadUserData();
    } else {
        try {
            const res = await fetch('/api/auth/me', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            if (data.success) {
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
});

function loadUserData() {
    const user = window.currentUser;
    document.getElementById('userName').value = user.name || '';
    document.getElementById('userEmail').value = user.email || '';
    document.getElementById('userPhone').value = user.phone || '';
    document.getElementById('userAddress').value = user.address?.street || '';
    document.getElementById('userCity').value = user.address?.city || '';
    document.getElementById('userPincode').value = user.address?.pincode || '';
    document.getElementById('userLang').value = user.language || 'hi';
    document.getElementById('userProfilePic').src = user.profilePic || user.avatar || '/assets/default-avatar.png'; // FIX: avatar bhi check karo
}

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
                data.profilePic = picUrl; // backend isko avatar me convert karega
            } else {
                btn.textContent = 'Save Details';
                btn.disabled = false;
                return;
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
            window.currentUser = result.user;
            newProfilePic = null;

            setTimeout(() => {
                document.getElementById('successMsg').style.display = 'none';
                window.location.href = '/profile.html';
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

// FIX: URL 1 hi rakho
async function uploadProfilePic(file, token) {
    const formData = new FormData();
    formData.append('profilePic', file);

    try {
        const res = await fetch('/api/upload/upload-pic', { // <-- YEHI FINAL URL
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
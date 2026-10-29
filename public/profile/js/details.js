// LOCATION: public/profile/js/details.js - V2 WORLD CLASS - CLOUDINARY MANDATORY + COMMON PROFILE CONNECTED
let newProfilePic = null;
let newProfilePicUrl = null;

window.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('userToken') || localStorage.getItem('TOKEN') || localStorage.getItem('token') || '';
    if (!token) {
        window.location.href = '/';
        return;
    }

    await loadCurrentUserData();
});

async function loadCurrentUserData(){
  try{
    const token = localStorage.getItem('userToken') || localStorage.getItem('TOKEN') || '';
    const buyerId = getBuyerIdForProfile();

    // 1. Try common profile - NEW - main + common dono ka same API
    let user = null;
    try{
      const res = await fetch(`/api/common/profile/me?buyerId=${encodeURIComponent(buyerId)}`, {
        headers: { 'Authorization': 'Bearer ' + token, 'x-buyer-id': buyerId }
      });
      const data = await res.json();
      if(data.success && data.user){
        user = data.user;
      }
    }catch(e){ console.log('common profile fail', e.message); }

    // 2. Fallback /api/auth/me - old
    if(!user){
      try{
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (data.success) {
          user = data.user;
        }
      }catch(e){}
    }

    if(user){
      window.currentUser = user;
      // Sync localStorage for common/core/user-core.js
      try{
        localStorage.setItem('USER_ID', user._id || '');
        localStorage.setItem('USER_NAME', user.name || '');
        localStorage.setItem('USER_PHONE', user.phone || '');
        localStorage.setItem('USER_ROLE', user.role || 'customer');
        if(user.profilePic || user.avatar){
          localStorage.setItem('userPic', user.profilePic || user.avatar);
        }
      }catch(e){}
      loadUserData();
    } else {
      localStorage.removeItem('userToken');
      window.location.href = '/';
    }
  }catch(err){
    console.error(err);
    window.location.href = '/';
  }
}

function getBuyerIdForProfile(){
  if(window.UserCore && window.UserCore.getBuyerId) return window.UserCore.getBuyerId();
  if(window.CartCore && window.CartCore.getBuyerId) return window.CartCore.getBuyerId();
  return localStorage.getItem('USER_ID') || localStorage.getItem('userId') || window.USER_ID || '';
}

function loadUserData() {
    const user = window.currentUser;
    if(!user) return;
    document.getElementById('userName').value = user.name || '';
    document.getElementById('userEmail').value = user.email || '';
    document.getElementById('userPhone').value = user.phone || '';
    
    // address can be string or object
    let addr = user.address || user.city || '';
    if(typeof user.address === 'object' && user.address?.street){
      addr = user.address.street;
    } else if(user.addresses && user.addresses[0]){
      addr = user.addresses[0].line1 || user.addresses[0].full || '';
    }
    document.getElementById('userAddress').value = addr || '';
    document.getElementById('userCity').value = user.city || user.address?.city || user.addresses?.[0]?.city || '';
    document.getElementById('userPincode').value = user.address?.pincode || user.addresses?.[0]?.pincode || '';
    document.getElementById('userLang').value = user.language || user.preferences?.language || 'hi';
    
    // FIX: avatar + profilePic dono check karo + Cloudinary URL
    const picUrl = user.profilePic || user.avatar || user.profilePic || '/assets/default-avatar.png';
    document.getElementById('userProfilePic').src = picUrl;
}

function handlePicChange(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }
        if(!file.type.startsWith('image/')){
          alert('Only image allowed');
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
    btn.textContent = 'Saving... ⏳';
    btn.disabled = true;

    const token = localStorage.getItem('userToken') || localStorage.getItem('TOKEN') || '';
    const buyerId = getBuyerIdForProfile();

    const data = {
        name: document.getElementById('userName').value.trim(),
        email: document.getElementById('userEmail').value.trim(),
        phone: document.getElementById('userPhone').value.trim(),
        address: {
            street: document.getElementById('userAddress').value.trim(),
            city: document.getElementById('userCity').value.trim(),
            pincode: document.getElementById('userPincode').value.trim()
        },
        city: document.getElementById('userCity').value.trim(),
        language: document.getElementById('userLang').value,
        buyerId: buyerId
    };

    if (!data.name || !data.phone) {
        alert('Name and Phone are required!');
        btn.textContent = 'Save Details';
        btn.disabled = false;
        return;
    }

    try {
        // STEP 1: Pehle pic upload karo - CLOUDINARY MANDATORY - NEW FLOW
        if (newProfilePic) {
            const picUrl = await uploadProfilePicCloudinary(newProfilePic, token, buyerId);
            if(picUrl) {
                data.profilePic = picUrl;
                data.avatar = picUrl;
                newProfilePicUrl = picUrl;
            } else {
                btn.textContent = 'Save Details';
                btn.disabled = false;
                return;
            }
        }

        // STEP 2: Fir saara data save karo - 2 API try - common + user
        let result = null;
        
        // Try 1: /api/common/profile/update - NEW - main + common connected
        try{
          const res = await fetch('/api/common/profile/update', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token,
              'x-buyer-id': buyerId
            },
            body: JSON.stringify(data)
          });
          result = await res.json();
        }catch(e){ console.log('common update fail', e.message); }

        // Try 2: Fallback /api/user/update - old main app
        if(!result || !result.success){
          const res = await fetch('/api/user/update', {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer ' + token
              },
              body: JSON.stringify(data)
          });
          result = await res.json();
        }

        if (result.success) {
            document.getElementById('successMsg').style.display = 'block';
            window.currentUser = result.user;
            newProfilePic = null;
            newProfilePicUrl = null;

            // Sync localStorage for UserCore
            try{
              localStorage.setItem('USER_ID', result.user._id);
              localStorage.setItem('USER_NAME', result.user.name||'');
              if(result.user.profilePic) localStorage.setItem('userPic', result.user.profilePic);
            }catch(e){}

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

// FIX: CLOUDINARY MANDATORY UPLOAD - V2 - 3 LAYER TRY
async function uploadProfilePicCloudinary(file, token, buyerId) {
    const formData = new FormData();
    formData.append('profilePic', file);
    formData.append('buyerId', buyerId || '');

    // Try 1: /api/common/profile/upload-avatar - NEW - MAIN - Cloudinary
    try {
        const res = await fetch('/api/common/profile/upload-avatar', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'x-buyer-id': buyerId || ''
            },
            body: formData
        });
        const result = await res.json();
        console.log('Upload result common/profile:', result);
        if (result.success && result.url) {
            document.getElementById('userProfilePic').src = result.url;
            return result.url;
        }
    } catch (err) {
        console.log('Common profile upload fail:', err.message);
    }

    // Try 2: /api/media/upload-pic - LEGACY + Cloudinary - main app
    try {
        const res = await fetch('/api/media/upload-pic', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'x-buyer-id': buyerId || ''
            },
            body: formData
        });
        const result = await res.json();
        console.log('Upload result media/upload-pic:', result);
        if (result.success && result.url) {
            document.getElementById('userProfilePic').src = result.url;
            return result.url;
        }
    } catch (err) {
        console.log('Media upload fail:', err.message);
    }

    // Try 3: /api/upload/upload-pic - VERY OLD LEGACY
    try {
        const res = await fetch('/api/upload/upload-pic', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            body: formData
        });
        const result = await res.json();
        if (result.success && result.url) {
            document.getElementById('userProfilePic').src = result.url;
            return result.url;
        } else {
            alert('Upload failed: ' + (result.error || result.message || 'Unknown'));
        }
    } catch (err) {
        console.log('Legacy upload failed:', err);
        alert('Profile pic upload failed: ' + err.message);
    }
    return null;
}

// Legacy alias for old HTML onclick
async function uploadProfilePic(file, token){
  return await uploadProfilePicCloudinary(file, token, getBuyerIdForProfile());
}
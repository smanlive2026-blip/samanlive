// LOCATION: public/profile/js/details.js - V23 UNIFIED PROFILE - FULL CODE - NO CUT
// FLOW: Load -> UnifiedProfile.loadMyProfile -> Fill Form -> Photo change -> UnifiedProfile.handleFileInput -> Cloudinary -> URL -> Save Details
// RULE: DB me kabhi base64 nahi jayega, sirf Cloudinary URL jayega

let newProfilePicFile = null;
let newProfilePicUrl = null;
let currentUser = null;

window.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('userToken') || localStorage.getItem('TOKEN') || localStorage.getItem('token') || '';
    if (!token) {
        window.location.href = '/';
        return;
    }

    // Photo input - UnifiedProfile se Cloudinary pe jayegi - turant upload, Save ka wait nahi karega
    const picInput = document.getElementById('picInput');
    if(picInput){
        picInput.addEventListener('change', async () => {
            if(!picInput.files || !picInput.files[0]) return;
            // UnifiedProfile hi handle karega - compress + Cloudinary + localStorage
            const r = await window.UnifiedProfile.handleFileInput(picInput, {
                role: 'customer',
                previewSelector: '#userProfilePic',
                msgId: 'picMsg',
                btnId: 'saveBtn'
            });
            if(r && r.success){
                newProfilePicUrl = r.url;
                newProfilePicFile = null; // Ab file ki jarurat nahi, URL mil gaya
                const msg = document.getElementById('picMsg');
                if(msg){ msg.textContent = '✅ Photo save ho gayi - Cloudinary URL mil gaya'; msg.style.color = 'green'; }
            }
        });
    }

    await loadCurrentUserData();
});

function getBuyerIdForProfile(){
  if(window.UnifiedProfile) return window.UnifiedProfile.getIds().userId;
  if(window.UserCore && window.UserCore.getBuyerId) return window.UserCore.getBuyerId();
  if(window.CartCore && window.CartCore.getBuyerId) return window.CartCore.getBuyerId();
  return localStorage.getItem('USER_ID') || localStorage.getItem('userId') || window.USER_ID || '';
}

async function loadCurrentUserData(){
  try{
    const token = localStorage.getItem('userToken') || localStorage.getItem('TOKEN') || '';
    const buyerId = getBuyerIdForProfile();

    let user = null;

    // 1. Try UnifiedProfile - NEW - common + main dono ka same API
    if(window.UnifiedProfile){
        try{
            const prof = await window.UnifiedProfile.loadMyProfile();
            if(prof && prof.success && prof.user) user = prof.user;
        }catch(e){ console.log('unified profile fail', e.message); }
    }

    // 2. Fallback /api/common/profile/me - direct
    if(!user){
      try{
        const res = await fetch(`/api/common/profile/me?buyerId=${encodeURIComponent(buyerId)}`, {
          headers: { 'Authorization': 'Bearer ' + token, 'x-buyer-id': buyerId }
        });
        const data = await res.json();
        if(data.success && data.user) user = data.user;
      }catch(e){ console.log('common profile fail', e.message); }
    }

    // 3. Fallback /api/auth/me - old
    if(!user){
      try{
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (data.success) user = data.user;
      }catch(e){}
    }

    if(user){
      currentUser = user;
      window.currentUser = user;
      // Sync localStorage for common/core/user-core.js
      try{
        localStorage.setItem('USER_ID', user._id || '');
        localStorage.setItem('USER_NAME', user.name || '');
        localStorage.setItem('USER_PHONE', user.phone || '');
        localStorage.setItem('USER_ROLE', user.role || 'customer');
        if(user.profilePic || user.avatar || user.photo){
          const pic = user.profilePic || user.avatar || user.photo;
          localStorage.setItem('userPic', pic);
          localStorage.setItem('USER_PIC', pic);
        }
      }catch(e){}
      // Role badge
      const badge = document.getElementById('roleBadge');
      if(badge) badge.textContent = (user.role || 'customer').toUpperCase();
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
    } else if(typeof user.address === 'object' && user.address?.line1){
      addr = user.address.line1;
    } else if(user.addresses && user.addresses[0]) {
      addr = user.addresses[0].line1 || user.addresses[0].full || '';
    } else if(typeof user.address === 'string'){
      addr = user.address;
    }
    document.getElementById('userAddress').value = addr || '';
    document.getElementById('userCity').value = user.city || user.address?.city || user.addresses?.[0]?.city || '';
    document.getElementById('userState').value = user.state || user.address?.state || user.addresses?.[0]?.state || '';
    document.getElementById('userPincode').value = user.pincode || user.address?.pincode || user.addresses?.[0]?.pincode || '';
    document.getElementById('userLang').value = user.language || user.preferences?.language || 'hi';
    document.getElementById('userGender').value = user.gender || '';

    // FIX: avatar + profilePic + photo teeno check karo + Cloudinary URL
    const picUrl = user.profilePic || user.avatar || user.photo || '/assets/default-avatar.png';
    document.getElementById('userProfilePic').src = picUrl;
}

// OLD FUNCTION - ab UnifiedProfile use karta hai, par purana code na tute isliye rakha hai
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
        newProfilePicFile = file;
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
        gender: document.getElementById('userGender').value,
        address: {
            street: document.getElementById('userAddress').value.trim(),
            line1: document.getElementById('userAddress').value.trim(),
            city: document.getElementById('userCity').value.trim(),
            state: document.getElementById('userState').value.trim(),
            pincode: document.getElementById('userPincode').value.trim()
        },
        city: document.getElementById('userCity').value.trim(),
        state: document.getElementById('userState').value.trim(),
        pincode: document.getElementById('userPincode').value.trim(),
        language: document.getElementById('userLang').value,
        buyerId: buyerId
    };

    if (!data.name || !data.phone) {
        alert('Name and Phone are required!');
        btn.textContent = 'Save Details';
        btn.disabled = false;
        return;
    }

    try{
        // STEP 1: Agar photo abhi tak upload nahi hui hai (purana flow se aayi hai) toh ab upload karo
        // Naya flow me photo pehle hi upload ho chuki hoti hai - newProfilePicUrl me URL hota hai
        if (newProfilePicFile && !newProfilePicUrl) {
            const picInput = document.getElementById('picInput');
            const r = await window.UnifiedProfile.handleFileInput(picInput, {
                role: 'customer',
                previewSelector: '#userProfilePic'
            });
            if(r && r.success) newProfilePicUrl = r.url;
            else {
                btn.textContent = 'Save Details';
                btn.disabled = false;
                return;
            }
        }

        if(newProfilePicUrl){
            data.profilePic = newProfilePicUrl;
            data.avatar = newProfilePicUrl;
            data.photo = newProfilePicUrl;
        }

        // STEP 2: Saara data save karo - 2 API try - common + user
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
            // Local sync
            try{
                localStorage.setItem('USER_NAME', data.name);
                if(newProfilePicUrl){
                    localStorage.setItem('userPic', newProfilePicUrl);
                    localStorage.setItem('USER_PIC', newProfilePicUrl);
                }
            }catch(e){}
            setTimeout(()=>{ document.getElementById('successMsg').style.display = 'none'; }, 3000);
            // Reset
            newProfilePicFile = null;
            // newProfilePicUrl ko rakho taaki dobara upload na ho
        } else {
            alert('Save failed: ' + (result.message || result.error || 'unknown'));
        }

        btn.textContent = '💾 Save Details';
        btn.disabled = false;

    }catch(e){
        console.error('saveDetails error', e);
        alert('Save failed: ' + e.message);
        btn.textContent = 'Save Details';
        btn.disabled = false;
    }
}
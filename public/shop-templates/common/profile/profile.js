// LOCATION: public/shop-templates/common/profile/profile.js - V2 WORLD CLASS - SHOP TEMPLATE PROFILE + MAIN APP CONNECTED + CLOUDINARY MANDATORY
let currentUserData = null;
let newShopProfilePic = null;

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔵 Shop Profile V2 init');
  await initShopProfile();
});

async function initShopProfile(){
  try{
    // Show loading
    const nameEl = document.getElementById('profileName');
    if(nameEl) nameEl.textContent = 'Loading...';

    // Load user via UserCore - main app + shop template connected
    let user = null;
    if(window.UserCore && window.UserCore.getUser){
      user = await window.UserCore.getUser();
    } else {
      // fallback direct fetch
      const buyerId = localStorage.getItem('USER_ID') || localStorage.getItem('userId') || window.USER_ID || '';
      const token = localStorage.getItem('TOKEN') || localStorage.getItem('userToken') || '';
      try{
        const res = await fetch(`/api/common/profile/me?buyerId=${encodeURIComponent(buyerId)}`, {
          headers: { 'x-buyer-id': buyerId, 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if(data.success) user = data.user;
      }catch(e){}
    }

    if(!user){
      console.log('❌ No user - redirect to login');
      // Show guest UI
      if(document.getElementById('profileGuest')) document.getElementById('profileGuest').style.display = 'block';
      if(document.getElementById('profileMain')) document.getElementById('profileMain').style.display = 'none';
      return;
    }

    currentUserData = user;
    window.currentUser = user;
    renderShopProfile(user);

    // Load stats
    loadShopProfileStats(user._id);

  }catch(e){
    console.error('initShopProfile error', e);
    const errEl = document.getElementById('profileError');
    if(errEl){ errEl.textContent = e.message; errEl.style.display='block'; }
  }
}

function renderShopProfile(user){
  try{
    // Name, phone, email
    const nameEls = document.querySelectorAll('#profileName, #shopProfileName, .profile-name');
    nameEls.forEach(el=> el.textContent = user.name || 'User');

    const phoneEls = document.querySelectorAll('#profilePhone, #shopProfilePhone, .profile-phone');
    phoneEls.forEach(el=> el.textContent = user.phone || '');

    const emailEls = document.querySelectorAll('#profileEmail, #shopProfileEmail, .profile-email');
    emailEls.forEach(el=> {
      el.textContent = user.email || '';
      if(el.tagName==='INPUT') el.value = user.email || '';
    });

    const inputs = {
      'profileNameInput': user.name,
      'shopProfileNameInput': user.name,
      'userName': user.name,
      'profilePhoneInput': user.phone,
      'shopProfilePhoneInput': user.phone,
      'userPhone': user.phone,
      'profileEmailInput': user.email,
      'userEmail': user.email
    };
    Object.keys(inputs).forEach(id=>{
      const el = document.getElementById(id);
      if(el) el.value = inputs[id] || '';
    });

    // Profile pic - CLOUDINARY - WORLD CLASS - MAIN APP CONNECTED
    const picUrl = user.profilePic || user.avatar || (window.UserCore && window.UserCore.getProfilePic && window.UserCore.getProfilePic()) || localStorage.getItem('userPic') || '/assets/default-avatar.png';
    
    const picEls = document.querySelectorAll('#profilePic, #shopProfilePic, #userProfilePic, .profile-pic, .user-avatar-img, img[data-user-avatar]');
    picEls.forEach(img=>{
      if(img && picUrl){
        img.src = picUrl;
        img.onerror = function(){ this.src = '/assets/default-avatar.png'; };
      }
    });

    // Role badge
    const roleEl = document.getElementById('profileRole');
    if(roleEl) roleEl.textContent = (user.role||'customer').toUpperCase();

    // UserId
    const idEl = document.getElementById('profileUserId');
    if(idEl) idEl.textContent = 'SL' + String(user._id).slice(-6).toUpperCase();

    // Show main, hide guest
    const guestEl = document.getElementById('profileGuest');
    const mainEl = document.getElementById('profileMain');
    if(guestEl) guestEl.style.display = 'none';
    if(mainEl) mainEl.style.display = 'block';

    // Sync localStorage - main app ke liye
    try{
      localStorage.setItem('USER_ID', user._id);
      localStorage.setItem('USER_NAME', user.name||'');
      localStorage.setItem('USER_PHONE', user.phone||'');
      if(picUrl && picUrl.startsWith('http')){
        localStorage.setItem('userPic', picUrl);
        localStorage.setItem('USER_PIC', picUrl);
      }
    }catch(e){}

    console.log('✅ Shop Profile rendered - pic:', picUrl.slice(0,50));
  }catch(e){
    console.error('render error', e);
  }
}

function handleShopProfilePicChange(event){
  const file = event.target.files[0];
  if(!file) return;
  if(file.size > 5*1024*1024){
    alert('Image should be less than 5MB');
    return;
  }
  if(!file.type.startsWith('image/')){
    alert('Only image allowed');
    return;
  }
  newShopProfilePic = file;
  const reader = new FileReader();
  reader.onload = (e)=>{
    document.querySelectorAll('#profilePic, #shopProfilePic, #userProfilePic, .profile-pic').forEach(img=>{
      img.src = e.target.result;
    });
  };
  reader.readAsDataURL(file);
}

async function saveShopProfile(){
  const btn = document.getElementById('saveProfileBtn') || document.getElementById('saveBtn');
  if(btn){ btn.textContent = 'Saving... ⏳'; btn.disabled = true; }

  try{
    const name = (document.getElementById('profileNameInput')?.value || document.getElementById('userName')?.value || document.getElementById('shopProfileNameInput')?.value || currentUserData?.name || '').trim();
    const email = (document.getElementById('profileEmailInput')?.value || document.getElementById('userEmail')?.value || '').trim();
    const buyerId = (window.UserCore && window.UserCore.getBuyerId && window.UserCore.getBuyerId()) || localStorage.getItem('USER_ID') || '';
    const token = (window.UserCore && window.UserCore.getToken && window.UserCore.getToken()) || localStorage.getItem('TOKEN') || '';

    if(!name){ alert('Name required'); if(btn){ btn.textContent='Save'; btn.disabled=false; } return; }

    let uploadedUrl = null;

    // STEP 1: Pic upload - CLOUDINARY MANDATORY - via UserCore
    if(newShopProfilePic){
      if(window.UserCore && window.UserCore.uploadProfilePic){
        const result = await window.UserCore.uploadProfilePic(newShopProfilePic);
        if(result.success && result.url){
          uploadedUrl = result.url;
        } else {
          alert('Pic upload failed: ' + (result.message||'unknown'));
          if(btn){ btn.textContent='Save'; btn.disabled=false; } return;
        }
      } else {
        // fallback direct
        const formData = new FormData();
        formData.append('profilePic', newShopProfilePic);
        formData.append('buyerId', buyerId);
        const res = await fetch('/api/common/profile/upload-avatar', {
          method: 'POST',
          headers: { 'x-buyer-id': buyerId, 'Authorization': `Bearer ${token}` },
          body: formData
        });
        const data = await res.json();
        if(data.success && data.url) uploadedUrl = data.url;
      }
    }

    // STEP 2: Update name/email
    const updateData = { name, email, buyerId };
    if(uploadedUrl){
      updateData.profilePic = uploadedUrl;
      updateData.avatar = uploadedUrl;
    }

    let result = null;
    if(window.UserCore && window.UserCore.updateProfile){
      result = await window.UserCore.updateProfile(updateData);
    } else {
      const res = await fetch('/api/common/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-buyer-id': buyerId, 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updateData)
      });
      result = await res.json();
    }

    if(result && result.success){
      currentUserData = result.user;
      window.currentUser = result.user;
      renderShopProfile(result.user);
      newShopProfilePic = null;

      // Success msg
      const successEl = document.getElementById('successMsg') || document.getElementById('profileSuccess');
      if(successEl){
        successEl.textContent = '✅ Profile updated - Cloudinary';
        successEl.style.display = 'block';
        setTimeout(()=> successEl.style.display='none', 2000);
      } else {
        alert('✅ Profile updated');
      }

      // Emit for other parts
      window.dispatchEvent(new CustomEvent('profile-updated', { detail: result.user }));
      if(window.global && window.global.io){ /* socket */ }

    } else {
      alert('Update failed: ' + (result?.message||'unknown'));
    }

  }catch(e){
    console.error('saveShopProfile error', e);
    alert('Failed: ' + e.message);
  } finally {
    if(btn){ btn.textContent = 'Save'; btn.disabled = false; }
  }
}

async function loadShopProfileStats(userId){
  try{
    const buyerId = userId || (window.UserCore && window.UserCore.getBuyerId && window.UserCore.getBuyerId()) || '';
    const res = await fetch(`/api/common/profile/stats/${encodeURIComponent(buyerId)}`, {
      headers: { 'x-buyer-id': buyerId }
    }).catch(()=>null);
    const data = res ? await res.json().catch(()=>null) : null;
    if(data && data.success && data.stats){
      const s = data.stats;
      const totalEl = document.getElementById('statTotalOrders');
      if(totalEl) totalEl.textContent = s.totalOrders||0;
      const pendingEl = document.getElementById('statPendingOrders');
      if(pendingEl) pendingEl.textContent = s.pendingOrders||0;
      const deliveredEl = document.getElementById('statDeliveredOrders');
      if(deliveredEl) deliveredEl.textContent = s.deliveredOrders||0;
    }
  }catch(e){}
}

function logoutShopProfile(){
  try{
    if(window.AuthCore && window.AuthCore.logout) window.AuthCore.logout();
    else {
      localStorage.removeItem('TOKEN');
      localStorage.removeItem('userToken');
      localStorage.removeItem('USER_ID');
      localStorage.removeItem('USER_ROLE');
      localStorage.removeItem('lm_user');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userPic');
      window.location.href = '/';
    }
  }catch(e){ window.location.href = '/'; }
}

// Expose for HTML onclick
window.handleShopProfilePicChange = handleShopProfilePicChange;
window.saveShopProfile = saveShopProfile;
window.logoutShopProfile = logoutShopProfile;
window.initShopProfile = initShopProfile;
window.saveDetails = saveShopProfile; // legacy alias - public/profile/js/details.js uses same name
window.handlePicChange = handleShopProfilePicChange; // legacy alias
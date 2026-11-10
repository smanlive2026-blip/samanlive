// LOCATION: public/shop-templates/common/profile/profile.js - V24 - UNIFIED - FULL CODE - NO CUT
// FLOW: Load -> /api/common/profile/me?role=shop_owner -> Fill -> Photo change -> UnifiedProfile -> Cloudinary
// RULE: DB me kabhi base64 nahi jayega, sirf Cloudinary URL jayega. Base64 sirf preview ke liye.
// RULE 2: Is file me koi bhi browser storage use NAHI hoga. Sab kuch Server + Cloudinary se aayega.
//         shopId = sirf URL se. token = sirf AuthCore se. userId = sirf AuthCore / currentUser se.
//         Load hamesha Server se hoga. Render sirf screen pe hoga, kahin save NAHI hoga.

let currentShopData = null;
let currentShopId = '';

function getShopIdFromUrl(){
  try{ return new URLSearchParams(location.search).get('shopId') || ''; }catch(e){ return ''; }
}
function getToken(){
  try{
    if(window.AuthCore && window.AuthCore.getToken) return window.AuthCore.getToken() || '';
  }catch(e){}
  return window.USER_TOKEN || '';
}
function getUserId(){
  try{
    if(window.AuthCore && window.AuthCore.getUserId) return window.AuthCore.getUserId() || '';
  }catch(e){}
  if(window.currentUser && window.currentUser._id) return window.currentUser._id;
  return '';
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔵 Shop Profile V24 init - NO BROWSER STORAGE');
  // shopId SIRF URL se - kahi aur se NAHI
  currentShopId = getShopIdFromUrl();
  if(!currentShopId){
    const msg = document.getElementById('profileMsg');
    if(msg) msg.textContent = 'Shop not found - shopId missing hai. URL me ?shopId=XXX hona chahiye. Dashboard / Shop List se dobara kholo.';
    return;
  }

  // 1. Shop Logo input - UnifiedProfile
  const avatarInput = document.getElementById('avatarInput');
  if(avatarInput){
    avatarInput.addEventListener('change', async () => {
      if(!avatarInput.files[0]) return;
      const r = await window.UnifiedProfile.handleFileInput(avatarInput, {
        role: 'shop_logo',
        field: 'logo',
        type: 'logo',
        shopId: currentShopId,
        userId: getUserId(),
        previewSelector: '#shopAvatar',
        msgId: 'profileMsg'
      });
      if(r && r.success){
        currentShopData = currentShopData || {};
        currentShopData.logo = r.url;
        currentShopData.shopLogo = r.url;
        // Verify - Server me save hui ya nahi, dobara Server se mang ke dekho
        await initShopProfile();
      }
    });
  }

  // 2. Cover / Banner input
  const coverInput = document.getElementById('coverInput');
  if(coverInput){
    coverInput.addEventListener('change', async () => {
      if(!coverInput.files[0]) return;
      const r = await window.UnifiedProfile.handleFileInput(coverInput, {
        role: 'shop_cover',
        field: 'banner',
        type: 'banner',
        shopId: currentShopId,
        userId: getUserId(),
        previewSelector: '#profileCoverImg',
        msgId: 'coverMsg'
      });
      if(r && r.success){
        currentShopData = currentShopData || {};
        currentShopData.banner = r.url;
        currentShopData.coverPhoto = r.url;
        await initShopProfile();
      }
    });
  }

  // 3. Owner Photo input - alag se
  const ownerInput = document.getElementById('ownerPhotoInput');
  if(ownerInput){
    ownerInput.addEventListener('change', async () => {
      if(!ownerInput.files[0]) return;
      const r = await window.UnifiedProfile.handleFileInput(ownerInput, {
        role: 'shop_owner',
        field: 'ownerPhotoUrl',
        type: 'avatar',
        shopId: currentShopId,
        userId: getUserId(),
        previewSelector: '#ownerPhotoDisplay',
        msgId: 'profileMsg'
      });
      if(r && r.success){
        currentShopData = currentShopData || {};
        currentShopData.ownerPhotoUrl = r.url;
        await initShopProfile();
      }
    });
  }

  // 4. Change buttons - already onclick me hai, yahan backup
  const changeAvatar = document.getElementById('changeAvatarBtn');
  if(changeAvatar) changeAvatar.onclick = () => document.getElementById('avatarInput').click();
  const changeCover = document.getElementById('changeCoverBtn');
  if(changeCover) changeCover.onclick = () => document.getElementById('coverInput').click();

  await initShopProfile();
});

async function initShopProfile(){
  try{
    const msg = document.getElementById('profileMsg');
    if(msg) msg.textContent = 'Loading...';

    let shop = null;

    // Try 1: UnifiedProfile.loadMyProfile - role shop_owner - opts me shopId deke
    if(window.UnifiedProfile){
      try{
        const prof = await window.UnifiedProfile.loadMyProfile({
          shopId: currentShopId,
          role: 'shop_owner',
          userId: getUserId()
        });
        if(prof && prof.success && (prof.shop || prof.user)){
          shop = prof.shop || prof.user;
        }
      }catch(e){ console.log('unified profile fail', e.message); }
    }

    // Try 2: Direct /api/common/profile/me - token AuthCore se
    if(!shop){
      try{
        const token = getToken();
        const buyerId = getUserId();
        const res = await fetch(`/api/common/profile/me?buyerId=${encodeURIComponent(buyerId)}&role=shop_owner&shopId=${encodeURIComponent(currentShopId)}`, {
          headers: { 'Authorization': 'Bearer ' + token, 'x-buyer-id': buyerId }
        });
        const data = await res.json();
        if(data.success && (data.shop || data.user)) shop = data.shop || data.user;
      }catch(e){}
    }

    // NO Try 3 - Browser storage wala fallback DELETE kar diya hai.
    // Server se nahi mila toh khaali dikhega, galat / purani photo nahi dikhegi.
    // Mobile me dikh rahi hai, Laptop me nahi - wala dhokha ab khatam.

    if(!shop){
      if(msg) msg.textContent = 'Shop not found - Server me Shop nahi mila. Shop List se dobara kholo. shopId: ' + currentShopId;
      return;
    }

    currentShopData = shop;
    renderShopProfile(shop);

    // Stats load - orders / products count - Server se
    loadShopProfileStats(currentShopId);

    if(msg) msg.textContent = '';
  }catch(e){
    console.error('initShopProfile error', e);
    const errEl = document.getElementById('profileMsg');
    if(errEl) errEl.textContent = e.message;
  }
}

function renderShopProfile(shop){
  if(!shop) return;
  const name = shop.shopName || shop.name || 'My Shop';
  const category = shop.shopType || shop.category || shop.template || 'Kirana';
  const logo = shop.logo || shop.shopLogo || shop.uploadedLogo || shop.image || shop.avatar || '/assets/default-avatar.png';
  const cover = shop.banner || shop.coverPhoto || shop.cover || '';
  const ownerPhoto = shop.ownerPhotoUrl || shop.ownerPhoto || shop.ownerAvatar || logo;

  const nameEl = document.getElementById('shopNameDisplay');
  if(nameEl) nameEl.textContent = name;
  const catEl = document.getElementById('shopCategoryDisplay');
  if(catEl) catEl.textContent = category + ' • General Store';
  const ownerNameEl = document.getElementById('ownerNameDisplay');
  if(ownerNameEl) ownerNameEl.textContent = shop.ownerName || shop.owner || '-';
  const ownerPhoneEl = document.getElementById('ownerPhoneDisplay');
  if(ownerPhoneEl) ownerPhoneEl.textContent = shop.phone || shop.ownerPhone || '';

  const avatarImg = document.getElementById('shopAvatar');
  if(avatarImg && logo) avatarImg.src = logo;
  const coverImg = document.getElementById('profileCoverImg');
  if(coverImg && cover) coverImg.src = cover;
  const ownerImg = document.getElementById('ownerPhotoDisplay');
  if(ownerImg && ownerPhoto) ownerImg.src = ownerPhoto;

  const ratingEl = document.getElementById('shopRating');
  if(ratingEl) ratingEl.textContent = '⭐ ' + (shop.rating || 4.5);
  const verifiedEl = document.getElementById('shopVerified');
  if(verifiedEl && shop.isVerified) verifiedEl.style.display = 'inline-block';
  const verStatus = document.getElementById('verificationStatus');
  if(verStatus) verStatus.textContent = shop.isVerified ? 'Verified' : 'Pending';

  // NO SAVE HERE - Render sirf screen pe hoga, kahin save NAHI hoga.
  // Pehle yahan browser storage me shop_{id} + shopLogo save hota tha, wahi dhokha tha.
}

async function loadShopProfileStats(shopId){
  if(!shopId) return;
  try{
    const token = getToken();
    const buyerId = getUserId();
    const res = await fetch(`/api/common/profile/${shopId}/stats`, {
      headers: { 'Authorization': 'Bearer ' + token, 'x-buyer-id': buyerId }
    }).then(r=>r.json()).catch(()=>null);
    if(res && res.success){
      if(document.getElementById('profileOrders')) document.getElementById('profileOrders').textContent = res.totalOrders || 0;
      if(document.getElementById('profileProducts')) document.getElementById('profileProducts').textContent = res.totalProducts || 0;
      if(document.getElementById('profileCustomers')) document.getElementById('profileCustomers').textContent = res.totalCustomers || 0;
    }
  }catch(e){}
}

// OLD FUNCTIONS - purana code na tute isliye rakha hai - ab UnifiedProfile use karte hai
function handleShopProfilePicChange(event){
  const input = event.target;
  if(window.UnifiedProfile && input.files[0]){
    window.UnifiedProfile.handleFileInput(input, { role: 'shop_logo', shopId: currentShopId, userId: getUserId(), previewSelector: '#shopAvatar', msgId: 'profileMsg' });
  }
}
async function saveShopProfile(){ alert('Photo ab turant save hoti hai - Change pe click karte hi Cloudinary pe save ho jati hai. Save dabane ki jarurat nahi hai.'); }
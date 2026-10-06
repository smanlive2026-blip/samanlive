// ========================================
// SHOP CREATE - AREA MANAGER
// File: /public/assets/js/shop-create.js
// Dropdown: shop-template-map.js (70+)
// Dashboard hit: /shop-templates/{folder}/dashboard.html?shopId=
// Fallback folder: common
// API: POST /api/manager/create-shop-v2
// ========================================

let shopCreateManagers = [];
let shopCreateAreas = [];
let shopCreateCategories = [];
let shopCreateCurrentManager = null;
let selectedCreateShopIcon = '🏪';
let createShopLogoBase64 = '';

// area-manager.js se call hoga
window.initShopCreateModule = function (allManagers, allAreas, categories, currentManager) {
    shopCreateManagers = allManagers || [];
    shopCreateAreas = allAreas || [];
    shopCreateCategories = categories || [];
    shopCreateCurrentManager = currentManager || null;
    fillCreateShopCategoryDropdown();
    bindCreateShopIconPicker();
    bindCreateShopForm();
    renderCreateShopManagerBox();
    renderCreateShopCityBox();
};

// ========== CATEGORY DROPDOWN - TEMPLATE MAP SE ==========
function fillCreateShopCategoryDropdown() {
    const sel = document.getElementById('createShopModule');
    if (!sel) return;
    let list = [];
    if (typeof window.getAllShopTemplates === 'function') {
        list = window.getAllShopTemplates();
    } else if (shopCreateCategories && shopCreateCategories.length) {
        list = shopCreateCategories.map(c => ({ id: c.id || c._id, name: c.name, icon: c.icon || '🏪' }));
    }
    sel.innerHTML = '<option value="">Select Shop Category</option>' +
        list.map(c => `<option value="${c.id}">${c.icon || '🏪'} ${c.name}</option>`).join('');
}

// ========== MODAL OPEN / CLOSE ==========
function openCreateShopModal() {
    if (!shopCreateCurrentManager && typeof window.currentManager !== 'undefined') {
        shopCreateCurrentManager = window.currentManager;
    }
    fillCreateShopCategoryDropdown();
    renderCreateShopManagerBox();
    renderCreateShopCityBox();
    document.getElementById('createShopModal')?.classList.add('active');
}
function closeCreateShopModal() {
    document.getElementById('createShopModal')?.classList.remove('active');
}

// ========== CITY BOX - MANAGER AREA SE ==========
function renderCreateShopCityBox() {
    const box = document.getElementById('createShopCityBox');
    if (!box || !shopCreateCurrentManager) return;
    const area = shopCreateAreas.find(a => a.areaCode === shopCreateCurrentManager.areaCode) || {};
    const city = area.city || shopCreateCurrentManager.city || '';
    const state = area.state || shopCreateCurrentManager.state || '';
    const pincode = area.pincode || '';
    if (!city) { box.style.display = 'none'; return; }
    box.style.display = 'flex';
    document.getElementById('createShopDetectedCityName').textContent = city;
    document.getElementById('createShopDetectedCityMeta').textContent =
        `${state}${pincode ? ' • ' + pincode : ''} • Area: ${shopCreateCurrentManager.areaCode || ''}`;
    document.getElementById('createShopCity').value = city;
    document.getElementById('createShopState').value = state;
    document.getElementById('createShopPincode').value = pincode;
}

// ========== MANAGER BOX - AUTO CONNECTED ==========
function renderCreateShopManagerBox() {
    const listEl = document.getElementById('createShopManagerList');
    const countEl = document.getElementById('createShopManagerCountText');
    const hiddenEl = document.getElementById('createShopManagerCodes');
    if (!listEl || !shopCreateCurrentManager) return;
    const m = shopCreateCurrentManager;
    if (countEl) countEl.textContent = '1 Manager Auto-connected';
    if (hiddenEl) hiddenEl.value = m.managerCode || '';
    listEl.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:12px">
            <div style="width:42px;height:42px;border-radius:50%;background:#2563eb;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;overflow:hidden">
                ${m.photo ? `<img src="${m.photo}" style="width:100%;height:100%;object-fit:cover">` : (m.name || 'M').charAt(0).toUpperCase()}
            </div>
            <div style="flex:1">
                <strong style="display:block;font-size:14px">${escapeHtmlSC(m.name || 'Area Manager')}</strong>
                <span style="font-size:12px;color:#64748b">${escapeHtmlSC(m.managerCode || '')} • ${escapeHtmlSC(m.areaName || m.areaCode || '')}</span>
            </div>
            <span style="background:#dcfce7;color:#166534;font-size:11px;font-weight:800;padding:6px 10px;border-radius:999px">CONNECTED</span>
        </div>`;
}

// ========== ICON PICKER ==========
function bindCreateShopIconPicker() {
    const picker = document.getElementById('createShopIconPicker');
    if (!picker || picker.dataset.bound) return;
    picker.dataset.bound = '1';
    picker.addEventListener('click', e => {
        const opt = e.target.closest('.icon-option');
        if (!opt) return;
        picker.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
        opt.classList.add('selected');
        selectedCreateShopIcon = opt.dataset.icon || '🏪';
        // icon chuna to logo hata do taaki confusion na ho
        // removeCreateShopLogo(); // chaahe to enable kar lena
    });
}

// ========== LOGO PREVIEW ==========
function previewCreateShopLogo(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Image size should be less than 2MB.'); event.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = e => {
        createShopLogoBase64 = e.target.result;
        document.getElementById('createShopLogoPreview').innerHTML = `<img src="${createShopLogoBase64}" alt="Shop Logo">`;
        document.getElementById('createShopRemoveLogoBtn').style.display = 'inline-flex';
    };
    reader.readAsDataURL(file);
}
function removeCreateShopLogo() {
    createShopLogoBase64 = '';
    const input = document.getElementById('createShopLogoInput');
    if (input) input.value = '';
    document.getElementById('createShopLogoPreview').innerHTML = `<i class="fa fa-camera"></i><p>Upload Shop Photo</p><span style="font-size:12px;color:#64748b">JPG, PNG • Max 2MB</span>`;
    document.getElementById('createShopRemoveLogoBtn').style.display = 'none';
}

// ========== FORM SUBMIT - TEMPLATE KE HISAB SE SAVE ==========
function bindCreateShopForm() {
    const form = document.getElementById('createShopForm');
    if (!form || form.dataset.bound) return;
    form.dataset.bound = '1';

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = document.getElementById('createShopSaveBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Shop...';

        const templateId = document.getElementById('createShopModule').value;
        if (!templateId) { alert('Pehle Shop Category select karo'); btn.disabled = false; btn.innerHTML = '<i class="fas fa-plus"></i> Create Shop'; return; }

        // ✅ Template Map se folder + type nikalo, na mile to common
        const folder = (typeof window.getShopTemplateFolder === 'function')
            ? window.getShopTemplateFolder(templateId) : 'common';
        const shopType = (typeof window.mapShopType === 'function')
            ? window.mapShopType(templateId) : 'common';

        const payload = {
            shopName: document.getElementById('createShopName').value.trim(),
            ownerName: document.getElementById('createShopOwnerName').value.trim(),
            serviceType: templateId,
            categoryId: templateId,
            template: templateId,
            templateFolder: folder,
            folder: folder,
            shopType: shopType,
            icon: selectedCreateShopIcon || '🏪',
            logo: createShopLogoBase64 || '',
            phone: document.getElementById('createShopPhone').value.trim(),
            contact: document.getElementById('createShopPhone').value.trim(),
            range: parseInt(document.getElementById('createShopRange').value),
            email: document.getElementById('createShopEmail').value.trim(),
            address: document.getElementById('createShopAddress').value.trim(),
            description: document.getElementById('createShopDesc').value.trim()
        };

        try {
            let data;
            if (typeof window.apiCall === 'function') {
                data = await window.apiCall('/manager/create-shop-v2', { method: 'POST', body: payload });
            } else {
                const token = localStorage.getItem('managerToken');
                const res = await fetch('/api/manager/create-shop-v2', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });
                data = await res.json();
                if (!res.ok) throw new Error(data.error || data.message || 'Shop create failed');
            }

            if (data.success) {
                const shop = data.shop || {};
                const finalFolder = shop.templateFolder || shop.template || folder || 'common';
                const dashFolder = (typeof window.getShopTemplateFolder === 'function' && shop.template)
                    ? window.getShopTemplateFolder(shop.template) : finalFolder;
                const dashboardUrl = `${window.location.origin}/shop-templates/${dashFolder}/dashboard.html?shopId=${shop._id || ''}`;

                alert(`✅ Shop Created Successfully!\n\nShop: ${payload.shopName}\nCategory: ${templateId}\nDashboard: ${dashFolder}\n\nLink owner ko bhej do:\n${dashboardUrl}`);
                form.reset();
                removeCreateShopLogo();
                selectedCreateShopIcon = '🏪';
                document.querySelectorAll('#createShopIconPicker .icon-option').forEach((el, i) => el.classList.toggle('selected', i === 0));
                closeCreateShopModal();
                if (typeof window.loadDashboard === 'function') window.loadDashboard();
            } else {
                alert(data.error || data.message || 'Shop create nahi hui');
            }
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-plus"></i> Create Shop';
        }
    });
}

// purana function naam bhi rakh diya taaki koi purana onclick na tute
function toggleSelectAllCreateShopManagers() { /* auto mode me kuch nahi karna */ }

function escapeHtmlSC(text) {
    const d = document.createElement('div');
    d.textContent = text == null ? '' : String(text);
    return d.innerHTML;
}

// Export for onclick
window.openCreateShopModal = openCreateShopModal;
window.closeCreateShopModal = closeCreateShopModal;
window.previewCreateShopLogo = previewCreateShopLogo;
window.removeCreateShopLogo = removeCreateShopLogo;
window.toggleSelectAllCreateShopManagers = toggleSelectAllCreateShopManagers;

console.log('✅ shop-create.js loaded - Template Dropdown + Folder Dashboard Hit + Common Fallback');
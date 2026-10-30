// LOCATION: public/assets/js/shop-create.js - V22 - NO COMMON FALLBACK - INDIVIDUAL DASHBOARD FIX - FULL CODE
let shopCreateManagers = [];
let shopCreateAreas = [];
let shopCreateCategories = [];
let shopCreateCurrentManager = null;
let selectedCreateShopIcon = '🏪';
let createShopLogoBase64 = '';
let selectedMode = '';

window.initShopCreateModule = function (allManagers, allAreas, categories, currentManager) {
    shopCreateManagers = allManagers || [];
    shopCreateAreas = allAreas || [];
    shopCreateCategories = categories || [];
    shopCreateCurrentManager = currentManager || null;
    fillModeDropdown();
    fillCreateShopCategoryDropdown();
    bindCreateShopIconPicker();
    bindCreateShopForm();
    renderCreateShopManagerBox();
    renderCreateShopCityBox();
};

// ========== MODE DROPDOWN - NAYA - 50 MODES ==========
function fillModeDropdown() {
    const sel = document.getElementById('createShopMode');
    if (!sel) return;
    if (!window.SHOP_MODES) {
        sel.innerHTML = '<option value="retail">Retail</option>';
        return;
    }
    const modes = Object.keys(window.SHOP_MODES).map(key => {
        const m = window.SHOP_MODES[key];
        return { id: key, name: m.name, icon: m.icon };
    });
    sel.innerHTML = '<option value="">Select Business Mode *</option>' +
        modes.map(m => `<option value="${m.id}">${m.icon} ${m.name}</option>`).join('');
    
    // Change pe category filter karo
    sel.onchange = function() {
        selectedMode = this.value;
        fillCreateShopCategoryDropdown(selectedMode);
        // Mode info dikhao
        const infoBox = document.getElementById('modeInfoBox');
        if (infoBox && window.SHOP_MODES[selectedMode]) {
            const mode = window.SHOP_MODES[selectedMode];
            infoBox.style.display = 'block';
            infoBox.innerHTML = `<div style="display:flex;gap:8px;align-items:center"><span style="font-size:20px">${mode.icon}</span><div><strong>${mode.name}</strong><br><small style="color:#64748b">Fields: ${mode.fields.join(', ')} | Tabs: ${mode.tabs.join(', ')}</small></div></div>`;
        }
    };
}

// ========== CATEGORY DROPDOWN - MODE SE FILTER ==========
function fillCreateShopCategoryDropdown(filterMode) {
    const sel = document.getElementById('createShopModule');
    if (!sel) return;
    let list = [];
    if (typeof window.getAllShopTemplates === 'function') {
        list = window.getAllShopTemplates();
    } else if (shopCreateCategories && shopCreateCategories.length) {
        list = shopCreateCategories.map(c => ({ id: c.id || c._id, name: c.name, icon: c.icon || '🏪', mode: 'retail' }));
    }
    // Mode se filter
    if (filterMode) {
        list = list.filter(c => c.mode === filterMode);
    }
    if (list.length === 0) {
        sel.innerHTML = '<option value="">No shops in this mode - choose another</option>';
        return;
    }
    sel.innerHTML = '<option value="">Select Shop Category *</option>' +
        list.map(c => `<option value="${c.id}">${c.icon || '🏪'} ${c.name}</option>`).join('');
}

function openCreateShopModal() {
    if (!shopCreateCurrentManager && typeof window.currentManager !== 'undefined') {
        shopCreateCurrentManager = window.currentManager;
    }
    fillModeDropdown();
    fillCreateShopCategoryDropdown();
    renderCreateShopManagerBox();
    renderCreateShopCityBox();
    document.getElementById('createShopModal')?.classList.add('active');
}
function closeCreateShopModal() {
    document.getElementById('createShopModal')?.classList.remove('active');
    selectedMode = '';
    const infoBox = document.getElementById('modeInfoBox');
    if (infoBox) infoBox.style.display = 'none';
}

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
    });
}

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

function bindCreateShopForm() {
    const form = document.getElementById('createShopForm');
    if (!form || form.dataset.bound) return;
    form.dataset.bound = '1';

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = document.getElementById('createShopSaveBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Shop...';

        const modeId = document.getElementById('createShopMode')?.value;
        const templateId = document.getElementById('createShopModule').value;
        if (!modeId) { alert('Pehle Business Mode select karo'); btn.disabled = false; btn.innerHTML = '<i class="fas fa-plus"></i> Create Shop'; return; }
        if (!templateId) { alert('Pehle Shop Category select karo'); btn.disabled = false; btn.innerHTML = '<i class="fas fa-plus"></i> Create Shop'; return; }

        const folder = (typeof window.getShopTemplateFolder === 'function')
            ? window.getShopTemplateFolder(templateId) : templateId;
        const shopType = templateId;
        const businessMode = modeId;

        const payload = {
            shopName: document.getElementById('createShopName').value.trim(),
            ownerName: document.getElementById('createShopOwnerName').value.trim(),
            serviceType: templateId,
            categoryId: templateId,
            template: templateId,
            templateFolder: folder,
            folder: folder,
            shopType: shopType,
            businessMode: businessMode,
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
                // ✅ FIXED V22 - NO COMMON FALLBACK - DIRECT TEMPLATE
                let finalFolder = shop.templateFolder || shop.template || shop.folder || templateId || folder;
                if (finalFolder === 'common' || finalFolder === 'general') finalFolder = templateId;
                let dashFolder = (typeof window.getShopTemplateFolder === 'function' && shop.template)
                    ? window.getShopTemplateFolder(shop.template) : finalFolder;
                if (dashFolder === 'common' || dashFolder === 'general') dashFolder = templateId;
                let dashboardUrl = '';
                if (typeof window.getDashboardUrl === 'function') {
                    dashboardUrl = window.location.origin + window.getDashboardUrl(templateId, shop._id || '');
                } else {
                    dashboardUrl = `${window.location.origin}/shop-templates/${dashFolder}/dashboard.html?shopId=${shop._id || ''}`;
                }

                alert(`✅ Shop Created Successfully!\n\nShop: ${payload.shopName}\nMode: ${businessMode}\nCategory: ${templateId}\nDashboard: ${dashFolder}\n\nLink owner ko bhej do:\n${dashboardUrl}`);
                form.reset();
                removeCreateShopLogo();
                selectedCreateShopIcon = '🏪';
                selectedMode = '';
                document.querySelectorAll('#createShopIconPicker .icon-option').forEach((el, i) => el.classList.toggle('selected', i === 0));
                const infoBox = document.getElementById('modeInfoBox');
                if (infoBox) infoBox.style.display = 'none';
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

function toggleSelectAllCreateShopManagers() {}
function escapeHtmlSC(text) {
    const d = document.createElement('div');
    d.textContent = text == null ? '' : String(text);
    return d.innerHTML;
}

window.openCreateShopModal = openCreateShopModal;
window.closeCreateShopModal = closeCreateShopModal;
window.previewCreateShopLogo = previewCreateShopLogo;
window.removeCreateShopLogo = removeCreateShopLogo;
window.toggleSelectAllCreateShopManagers = toggleSelectAllCreateShopManagers;

console.log('✅ shop-create.js V22 loaded - No Common - Individual Dashboard Direct');
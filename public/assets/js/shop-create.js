// LOCATION: public/assets/js/shop-create.js - V23 - MODE ONLY FILTER - NO RELATION TO SHOP CREATE - TREE MATCHED
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
    fillCreateShopCategoryDropdown(''); // default all
    bindCreateShopIconPicker();
    bindCreateShopForm();
    renderCreateShopManagerBox();
    renderCreateShopCityBox();
};

// ========== MODE DROPDOWN - ONLY FILTER - 16 MODES - TREE MATCHED ==========
function fillModeDropdown() {
    const sel = document.getElementById('createShopMode');
    if (!sel) return;
    if (!window.SHOP_MODES) {
        sel.innerHTML = '<option value="">All Shops (No Filter)</option>';
        return;
    }
    // V23 - Mode sirf filter hai, required nahi - default All
    let html = '<option value="">All Shops (No Filter) - 72 shops</option>';
    Object.keys(window.SHOP_MODES).forEach(key => {
        const m = window.SHOP_MODES[key];
        const count = (m.shops && m.shops.length) || 0;
        if (count > 0) {
            html += `<option value="${key}">${m.icon} ${m.name} - ${count} shops</option>`;
        }
    });
    sel.innerHTML = html;
    
    sel.onchange = function() {
        selectedMode = this.value;
        fillCreateShopCategoryDropdown(selectedMode);
        const infoBox = document.getElementById('modeInfoBox');
        if (infoBox) {
            if (selectedMode && window.SHOP_MODES[selectedMode]) {
                const mode = window.SHOP_MODES[selectedMode];
                infoBox.style.display = 'block';
                infoBox.innerHTML = `<div style="display:flex;gap:8px;align-items:center"><span style="font-size:20px">${mode.icon}</span><div><strong>Filter: ${mode.name}</strong><br><small style="color:#64748b">${mode.shops.length} shops filtered | Shop category se banegi, mode sirf filter hai</small></div></div>`;
            } else {
                infoBox.style.display = 'block';
                infoBox.innerHTML = `<div><strong>All Shops</strong><br><small style="color:#64748b">Saari shops dikh rahi hai - mode filter nahi hai</small></div>`;
            }
        }
    };
}

// ========== CATEGORY DROPDOWN - MODE = ONLY FILTER ==========
function fillCreateShopCategoryDropdown(filterMode) {
    const sel = document.getElementById('createShopModule');
    if (!sel) return;
    let list = [];
    if (typeof window.getAllShopTemplates === 'function') {
        list = window.getAllShopTemplates();
    } else if (shopCreateCategories && shopCreateCategories.length) {
        list = shopCreateCategories.map(c => ({ id: c.id || c._id, name: c.name, icon: c.icon || '🏪', folder: c.folder || c.id, mode: c.mode || 'retail' }));
    }

    // V23 FILTER LOGIC - Mode sirf filter, relation nahi
    if (filterMode && window.SHOP_MODES[filterMode] && window.SHOP_MODES[filterMode].shops) {
        const allowedIds = window.SHOP_MODES[filterMode].shops.map(s => String(s).toLowerCase());
        list = list.filter(c => {
            const id = String(c.id || '').toLowerCase();
            const folder = String(c.folder || '').toLowerCase();
            return allowedIds.includes(id) || allowedIds.includes(folder);
        });
    }
    // Agar filterMode empty hai toh saari list dikhao

    if (list.length === 0) {
        sel.innerHTML = '<option value="">No shops in this filter - select All</option>';
        return;
    }
    sel.innerHTML = '<option value="">Select Shop Category * (Category se shop banegi)</option>' +
        list.map(c => `<option value="${c.id}">${c.icon || '🏪'} ${c.name} - /${c.folder}/</option>`).join('');
}

function openCreateShopModal() {
    if (!shopCreateCurrentManager && typeof window.currentManager !== 'undefined') {
        shopCreateCurrentManager = window.currentManager;
    }
    fillModeDropdown();
    fillCreateShopCategoryDropdown('');
    renderCreateShopManagerBox();
    renderCreateShopCityBox();
    document.getElementById('createShopModal')?.classList.add('active');
}
function closeCreateShopModal() {
    document.getElementById('createShopModal')?.classList.remove('active');
    selectedMode = '';
    const modeSel = document.getElementById('createShopMode');
    if (modeSel) modeSel.value = '';
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
    const nameEl = document.getElementById('createShopDetectedCityName');
    const metaEl = document.getElementById('createShopDetectedCityMeta');
    if (nameEl) nameEl.textContent = city;
    if (metaEl) metaEl.textContent = `${state}${pincode ? ' • ' + pincode : ''} • Area: ${shopCreateCurrentManager.areaCode || ''}`;
    const cityEl = document.getElementById('createShopCity');
    const stateEl = document.getElementById('createShopState');
    const pinEl = document.getElementById('createShopPincode');
    if (cityEl) cityEl.value = city;
    if (stateEl) stateEl.value = state;
    if (pinEl) pinEl.value = pincode;
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
        const prev = document.getElementById('createShopLogoPreview');
        if (prev) prev.innerHTML = `<img src="${createShopLogoBase64}" alt="Shop Logo">`;
        const rmBtn = document.getElementById('createShopRemoveLogoBtn');
        if (rmBtn) rmBtn.style.display = 'inline-flex';
    };
    reader.readAsDataURL(file);
}
function removeCreateShopLogo() {
    createShopLogoBase64 = '';
    const input = document.getElementById('createShopLogoInput');
    if (input) input.value = '';
    const prev = document.getElementById('createShopLogoPreview');
    if (prev) prev.innerHTML = `<i class="fa fa-camera"></i><p>Upload Shop Photo</p><span style="font-size:12px;color:#64748b">JPG, PNG • Max 2MB</span>`;
    const rmBtn = document.getElementById('createShopRemoveLogoBtn');
    if (rmBtn) rmBtn.style.display = 'none';
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

        const templateId = document.getElementById('createShopModule').value;
        const modeId = document.getElementById('createShopMode')?.value || ''; // V23 - sirf filter, required nahi

        if (!templateId) { 
            alert('Shop Category select karo - Mode sirf filter hai, category se shop banegi'); 
            btn.disabled = false; btn.innerHTML = '<i class="fas fa-plus"></i> Create Shop'; 
            return; 
        }

        const folder = (typeof window.getShopTemplateFolder === 'function')
            ? window.getShopTemplateFolder(templateId) : templateId;

        const payload = {
            shopName: document.getElementById('createShopName').value.trim(),
            ownerName: document.getElementById('createShopOwnerName').value.trim(),
            serviceType: templateId,
            categoryId: templateId,
            template: templateId,
            templateFolder: folder,
            folder: folder,
            shopType: templateId,
            businessMode: modeId || 'all', // V23 - info ke liye save, logic category se
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

                alert(`✅ Shop Created Successfully!\n\nShop: ${payload.shopName}\nCategory: ${templateId}\nFolder: ${dashFolder}\nFilter Mode: ${modeId || 'All'}\n\nDashboard:\n${dashboardUrl}`);
                form.reset();
                removeCreateShopLogo();
                selectedCreateShopIcon = '🏪';
                selectedMode = '';
                const modeSel = document.getElementById('createShopMode');
                if (modeSel) modeSel.value = '';
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

console.log('✅ shop-create.js V23 - MODE ONLY FILTER - Shop category se banegi - Tree matched - No common fallback');
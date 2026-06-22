// ========================================
// MODULE + CATEGORY MANAGEMENT - category.js
// Path: /public/admin-panel/assets/category.js
// ========================================

let allModulesData = [];
let expandedModule = null;

// Init function - modules.html me call karna
window.initModuleCategoryManager = async function() {
    await loadModules();
    setupEventListeners();
}

// ==================== LOAD MODULES ====================
async function loadModules() {
    const container = document.getElementById('modulesList');
    if (!container) return;

    container.innerHTML = '<div class="loading" style="text-align:center;padding:40px;">Loading modules...</div>';

    try {
        const [moduleData, categoryData] = await Promise.all([
            apiCall('/modules'),
            apiCall('/categories')
        ]);

        allModulesData = moduleData.modules || moduleData || [];

        // Category collection se data lo, fallback mat use karo
        window.CATEGORIES_FALLBACK = categoryData.categories || categoryData || [];

        renderModules();
        populateCategoryDropdown();
    } catch (err) {
        console.error('Load modules error:', err);
        container.innerHTML = `<div style="text-align:center;padding:40px;color:#ef4444;">Failed to load: ${escapeHtml(err.message)}</div>`;
    }
}

// ==================== RENDER MODULES ====================
function renderModules(searchTerm = '') {
    const container = document.getElementById('modulesList');
    if (!container) return;

    let filtered = allModulesData;
    if (searchTerm) {
        filtered = allModulesData.filter(m =>
            m.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;">No modules found</div>';
        return;
    }

    container.innerHTML = filtered.map(m => {
        const moduleId = m._id || m.id;
        const categories = m.categoryDetails || [];
        const isExpanded = expandedModule === moduleId;

        return `
        <div class="module-card" style="background:#fff;border:2px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:16px;background:#f8fafc;cursor:pointer;" onclick="toggleModule('${moduleId}')">
                <div style="display:flex;align-items:center;gap:12px;">
                    <span style="font-size:28px;">${m.icon}</span>
                    <div>
                        <h3 style="margin:0;font-size:18px;">${escapeHtml(m.name)}</h3>
                        <p style="margin:0;color:#64748b;font-size:13px;">${categories.length} categories</p>
                    </div>
                </div>
                <div style="display:flex;gap:8px;align-items:center;">
                    <button class="btn btn-success btn-sm" onclick="event.stopPropagation(); openAddCategory('${moduleId}', '${escapeHtml(m.name)}')">➕ Add Category</button>
                    <span style="font-size:20px;transform:rotate(${isExpanded? '180deg' : '0deg'});transition:0.3s;">▼</span>
                </div>
            </div>

            ${isExpanded? `
            <div style="padding:16px;border-top:2px solid #e2e8f0;">
                ${categories.length === 0?
                    '<p style="text-align:center;color:#94a3b8;padding:20px;">No categories yet. Click "Add Category" to add.</p>' :
                    `<div style="overflow-x:auto;">
                        <table style="width:100%;border-collapse:collapse;">
                            <thead>
                                <tr style="background:#f8fafc;">
                                    <th style="padding:10px;text-align:left;">Icon</th>
                                    <th style="padding:10px;text-align:left;">Name</th>
                                    <th style="padding:10px;text-align:left;">Group</th>
                                    <th style="padding:10px;text-align:left;">Color</th>
                                    <th style="padding:10px;text-align:left;">Priority</th>
                                    <th style="padding:10px;text-align:left;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${categories.map((c, idx) => `
                                    <tr style="border-bottom:1px solid #e2e8f0;">
                                        <td style="padding:10px;font-size:22px;">${c.icon}</td>
                                        <td style="padding:10px;"><b>${escapeHtml(c.name)}</b></td>
                                        <td style="padding:10px;">${escapeHtml(c.group || '-')}</td>
                                        <td style="padding:10px;"><span style="background:${c.color};padding:4px 12px;border-radius:6px;color:#fff;font-size:12px;">${c.color}</span></td>
                                        <td style="padding:10px;">${c.priority || 0}</td>
                                        <td style="padding:10px;">
                                            <button class="btn btn-primary btn-sm" onclick="editCategory('${moduleId}', ${idx})">Edit</button>
                                            <button class="btn btn-danger btn-sm" onclick="deleteCategory('${moduleId}', ${idx})">Delete</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>`
                }
            </div>
            ` : ''}
        </div>
        `;
    }).join('');
}

// ==================== TOGGLE & FILTER ====================
window.toggleModule = (moduleId) => {
    expandedModule = expandedModule === moduleId? null : moduleId;
    const searchBox = document.querySelector('.search-box');
    renderModules(searchBox? searchBox.value : '');
};

window.filterModules = (val) => {
    renderModules(val);
};

// ==================== CATEGORY DROPDOWN ====================
function populateCategoryDropdown() {
    const select = document.getElementById('catSelectFromList');
    if (!select) return;

    if (!window.CATEGORIES_FALLBACK || window.CATEGORIES_FALLBACK.length === 0) {
        select.innerHTML = '<option value="">⚠️ No categories found</option>';
        return;
    }

    select.innerHTML = '<option value="">-- Choose Category --</option>' +
        window.CATEGORIES_FALLBACK.map((c, idx) =>
            `<option value="${idx}">${c.icon} ${escapeHtml(c.name)} - ${c.group}</option>`
        ).join('');
}

window.fillCategoryFromList = function(index) {
    if (index === '') return;
    const cat = window.CATEGORIES_FALLBACK[parseInt(index)];
    document.getElementById('catName').value = cat.name;
    document.getElementById('catIcon').value = cat.icon;
    document.getElementById('catColor').value = cat.color;
    document.getElementById('catGroup').value = cat.group;
}

// ==================== ADD/EDIT CATEGORY - FIXED ====================
window.openAddCategory = (moduleId, moduleName) => {
    document.getElementById('categoryModalTitle').textContent = 'Add Category to ' + moduleName;
    document.getElementById('catModuleId').value = moduleId;
    document.getElementById('catIndex').value = '';
    document.getElementById('catName').value = '';
    document.getElementById('catIcon').value = '📦';
    document.getElementById('catColor').value = '#6366f1';
    document.getElementById('catGroup').value = moduleName; // Auto fill group
    document.getElementById('catPriority').value = '0';
    document.getElementById('catSelectFromList').value = '';
    document.getElementById('categoryModal').classList.add('active');
};

window.editCategory = (moduleId, catIndex) => {
    const m = allModulesData.find(x => (x._id || x.id) === moduleId);
    if (!m ||!m.categoryDetails ||!m.categoryDetails[catIndex]) {
        showToast('Category not found', 'error');
        return;
    }

    const c = m.categoryDetails[catIndex];
    document.getElementById('categoryModalTitle').textContent = 'Edit Category';
    document.getElementById('catModuleId').value = moduleId;
    document.getElementById('catIndex').value = catIndex;
    document.getElementById('catName').value = c.name || '';
    document.getElementById('catIcon').value = c.icon || '📦';
    document.getElementById('catColor').value = c.color || '#6366f1';
    document.getElementById('catGroup').value = c.group || '';
    document.getElementById('catPriority').value = c.priority || 0;
    document.getElementById('catSelectFromList').value = '';
    document.getElementById('categoryModal').classList.add('active');
};

window.saveCategory = async () => {
    const btn = document.getElementById('saveCatBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const moduleId = document.getElementById('catModuleId').value;
    const catIndex = document.getElementById('catIndex').value;
    const m = allModulesData.find(x => (x._id || x.id) === moduleId);

    const categoryData = {
        name: document.getElementById('catName').value.trim(),
        icon: document.getElementById('catIcon').value.trim(),
        color: document.getElementById('catColor').value,
        group: document.getElementById('catGroup').value.trim() || m.name,
        priority: parseInt(document.getElementById('catPriority').value || 0),
        moduleId: moduleId,
        status: 'active'
    };

    if (!categoryData.name ||!categoryData.icon) {
        showToast('Name and Icon are required', 'error');
        btn.disabled = false;
        btn.textContent = '💾 Save Category';
        return;
    }

    try {
        if (catIndex === '') {
            // NEW - POST to /categories
            await apiCall('/categories', 'POST', categoryData);
            showToast('Category added!', 'success');
        } else {
            // UPDATE - Category collection me update karo
            const oldCatId = m.categoryDetails[parseInt(catIndex)].id;
            await apiCall('/categories/' + oldCatId, 'PUT', categoryData);
            showToast('Category updated!', 'success');
        }

        closeCategoryModal();
        await loadModules(); // Hook auto Module.categoryDetails update karega
        expandedModule = moduleId;
        renderModules();
    } catch (err) {
        console.error('Save error:', err);
        showToast('Failed: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '💾 Save Category';
    }
};

window.deleteCategory = async (moduleId, catIndex) => {
    if (!confirm('Delete this category?')) return;

    const m = allModulesData.find(x => (x._id || x.id) === moduleId);
    if (!m ||!m.categoryDetails) return;

    const catId = m.categoryDetails[catIndex].id;

    try {
        // Category collection se delete - hook auto Module se hata dega
        await apiCall('/categories/' + catId, 'DELETE');
        showToast('Category deleted!', 'success');
        await loadModules();
        expandedModule = moduleId;
        renderModules();
    } catch (err) {
        showToast('Failed: ' + err.message, 'error');
    }
};

window.closeCategoryModal = () => {
    document.getElementById('categoryModal').classList.remove('active');
};

// ==================== IMPORT - FIXED ====================
window.openImportCategories = () => {
    if (!window.CATEGORIES_FALLBACK || window.CATEGORIES_FALLBACK.length === 0) {
        showToast('No categories found', 'error');
        return;
    }

    const preview = document.getElementById('importPreview');
    const totalCount = document.getElementById('totalCatCount');
    totalCount.textContent = `Total ${window.CATEGORIES_FALLBACK.length} categories found.`;

    const groupCount = {};
    window.CATEGORIES_FALLBACK.forEach(cat => {
        const group = cat.group || 'General';
        groupCount[group] = (groupCount[group] || 0) + 1;
    });

    preview.innerHTML = Object.entries(groupCount).map(([group, count]) => {
        const moduleExists = allModulesData.some(m => {
            const moduleName = (m.name || '').trim().toLowerCase().replace(/\s+/g, '');
            const catGroup = group.toLowerCase().replace(/\s+/g, '');
            return moduleName === catGroup;
        });

        return `<div style="display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid #e2e8f0;">
            <span><b>${group}</b> ${moduleExists? '✅' : '⚠️ Module Not Found'}</span>
            <span class="badge badge-info">${count} cats</span>
        </div>`;
    }).join('');

    document.getElementById('importModal').classList.add('active');
};

window.importCategories = async () => {
    const btn = document.getElementById('confirmImportBtn');
    btn.disabled = true;
    btn.textContent = 'Importing...';

    let imported = 0;
    let skipped = 0;
    let notFoundGroups = [];

    try {
        for(let i = 0; i < window.CATEGORIES_FALLBACK.length; i++) {
            const cat = window.CATEGORIES_FALLBACK[i];
            const groupName = (cat.group || 'General').trim();

            btn.textContent = `Importing ${i+1}/${window.CATEGORIES_FALLBACK.length}...`;

            const module = allModulesData.find(m => {
                const moduleName = (m.name || '').trim().toLowerCase().replace(/\s+/g, '');
                const catGroup = groupName.toLowerCase().replace(/\s+/g, '');
                return moduleName === catGroup;
            });

            if(!module) {
                if (!notFoundGroups.includes(groupName)) notFoundGroups.push(groupName);
                skipped++;
                continue;
            }

            // Check if already exists in Category collection
            try {
                await apiCall('/categories', 'POST', {
                    name: cat.name,
                    icon: cat.icon,
                    color: cat.color,
                    group: cat.group,
                    moduleId: module._id || module.id,
                    status: 'active',
                    priority: 0
                });
                imported++;
            } catch (err) {
                if (err.message.includes('duplicate') || err.message.includes('E11000')) {
                    skipped++;
                } else {
                    console.error(`Failed ${cat.name}:`, err);
                    skipped++;
                }
            }

            await new Promise(resolve => setTimeout(resolve, 50));
        }

        showToast(`✅ Imported: ${imported} | ⏭️ Skipped: ${skipped}`, 'success');
        closeImportModal();
        await loadModules();

    } catch (err) {
        console.error('Import error:', err);
        showToast('Import failed: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '✅ Import Now';
    }
};

window.closeImportModal = () => {
    document.getElementById('importModal').classList.remove('active');
};

// ==================== HELPERS ====================
function setupEventListeners() {
    // Search box
    const searchBox = document.querySelector('.search-box');
    if (searchBox) {
        searchBox.addEventListener('keyup', (e) => filterModules(e.target.value));
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Auto init agar modulesList div hai to
if (document.getElementById('modulesList')) {
    initModuleCategoryManager();
}
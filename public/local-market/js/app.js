// ==================== LOCAL MARKET - ADMIN CONNECT ====================
let allModules = [];
let allCategories = [];

// Page load pe modules + categories fetch karo
document.addEventListener('DOMContentLoaded', async () => {
    await loadMarketData();
    setupSearch();
    setupFilters();
});

// Admin panel se modules fetch karo
async function loadMarketData() {
    try {
        const res = await fetch('/api/modules');
        allModules = await res.json();
        
        // Sab modules ki categories extract karo
        allCategories = [];
        allModules.forEach(module => {
            if (module.categoryDetails && module.categoryDetails.length > 0) {
                module.categoryDetails.forEach(cat => {
                    allCategories.push({
                        id: cat.id,
                        name: cat.name,
                        icon: cat.icon,
                        color: cat.color,
                        group: cat.group,
                        moduleName: module.name,
                        moduleIcon: module.icon,
                        moduleLink: module.link
                    });
                });
            }
        });

        console.log(`Loaded ${allModules.length} modules, ${allCategories.length} categories`);
        renderCategories(allCategories);
        
    } catch (err) {
        console.error('Error loading market:', err);
        document.getElementById('categoriesBox').innerHTML = 
            '<div class="error">Failed to load categories. Refresh karo.</div>';
    }
}

// Categories render karo
function renderCategories(categories) {
    const box = document.getElementById('categoriesBox');
    const count = document.getElementById('totalCount');
    
    count.textContent = categories.length;
    
    if (categories.length === 0) {
        box.innerHTML = '<div class="no-data">Koi category nahi mili</div>';
        return;
    }

    box.innerHTML = categories.map(cat => `
        <div class="category-card" onclick="openCategory('${cat.moduleLink}', '${cat.name}')">
            <div class="category-icon" style="background: ${cat.color}20; color: ${cat.color}">
                ${cat.icon}
            </div>
            <div class="category-name">${cat.name}</div>
            <div class="category-module">${cat.moduleIcon} ${cat.moduleName}</div>
        </div>
    `).join('');
}

// Category click pe module page kholo
function openCategory(moduleLink, categoryName) {
    // Query param me category bhej do
    window.location.href = `${moduleLink}?category=${encodeURIComponent(categoryName)}`;
}

// Search setup
function setupSearch() {
    const search = document.getElementById('categorySearch');
    search.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        if (!query) {
            renderCategories(allCategories);
            return;
        }
        
        const filtered = allCategories.filter(cat => 
            cat.name.toLowerCase().includes(query) ||
            cat.moduleName.toLowerCase().includes(query) ||
            cat.group.toLowerCase().includes(query)
        );
        
        renderCategories(filtered);
    });
}

// Filter buttons setup
function setupFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.dataset.filter;
            let filtered = [...allCategories];
            
            if (filter === 'popular') {
                // Top modules ki categories pehle
                filtered.sort((a, b) => {
                    const aMod = allModules.find(m => m.name === a.moduleName);
                    const bMod = allModules.find(m => m.name === b.moduleName);
                    return (bMod?.priority || 0) - (aMod?.priority || 0);
                });
                filtered = filtered.slice(0, 50); // Top 50 popular
            } else if (filter === 'az') {
                filtered.sort((a, b) => a.name.localeCompare(b.name));
            }
            
            renderCategories(filtered);
        });
    });
}
const API = '/api';
let allMasterProducts = [];
let allCategories = [];
let selectedCategory = '';

async function apiCall(endpoint, method = 'GET', body = null) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API + endpoint, opts);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

// LOAD DATA
async function loadLibrary() {
    try {
        const [products, categories] = await Promise.all([
            apiCall('/master-products'),
            apiCall('/categories')
        ]);
        allMasterProducts = products || [];
        allCategories = categories || [];

        document.getElementById('totalCount').textContent = `${allMasterProducts.length} Products`;

        // Render Categories
        document.getElementById('categoryList').innerHTML = 
            `<div class="cat-item active" onclick="filterByCategory('')">All Categories</div>` +
            allCategories.map(c => `
                <div class="cat-item" data-id="${c._id}" onclick="filterByCategory('${c._id}')">${c.name}</div>
            `).join('');

        // Category dropdown in modal
        document.getElementById('prodCategory').innerHTML = allCategories.map(c => `
            <option value="${c._id}">${c.name}</option>
        `).join('');

        renderProducts(allMasterProducts);
    } catch (err) {
        console.error(err);
        document.getElementById('productGrid').innerHTML = '<div class="loader">Failed to load</div>';
    }
}

// RENDER PRODUCTS
function renderProducts(products) {
    const grid = document.getElementById('productGrid');
    if (products.length === 0) {
        grid.innerHTML = '<div class="loader">No Products Found</div>';
        return;
    }
    grid.innerHTML = products.map(p => `
        <div class="product-card">
            <img src="${p.image || p.images?.[0] || 'https://via.placeholder.com/240x160?text=No+Image'}" alt="${p.name}">
            <h4>${p.name}</h4>
            <p>${p.brand || 'No Brand'} • ${p.category?.name || ''}</p>
            <button onclick="selectProduct('${p._id}')"><i class="fa fa-check"></i> Select Product</button>
        </div>
    `).join('');
}

// FILTER
window.filterByCategory = (catId) => {
    selectedCategory = catId;
    document.querySelectorAll('.cat-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`.cat-item[data-id="${catId}"]`)?.classList.add('active');
    if (catId === '') {
        renderProducts(allMasterProducts);
    } else {
        renderProducts(allMasterProducts.filter(p => p.categoryId === catId));
    }
}

// SEARCH
document.getElementById('searchInput').oninput = (e) => {
    const q = e.target.value.toLowerCase();
    let filtered = allMasterProducts.filter(p => p.name.toLowerCase().includes(q));
    if (selectedCategory) filtered = filtered.filter(p => p.categoryId === selectedCategory);
    renderProducts(filtered);
}

// MODAL
window.openAddProductModal = () => {
    document.getElementById('addProductForm').reset();
    document.getElementById('libProductId').value = '';
    document.getElementById('addProductModal').classList.add('active');
};
window.closeAddProductModal = () => document.getElementById('addProductModal').classList.remove('active');

// SAVE MASTER PRODUCT
window.saveLibraryProduct = async () => {
    const data = {
        name: document.getElementById('prodName').value,
        categoryId: document.getElementById('prodCategory').value,
        brand: document.getElementById('prodBrand').value,
        description: document.getElementById('prodDesc').value,
    };
    try {
        await apiCall('/master-products', 'POST', data);
        alert('✅ Master Product Added');
        closeAddProductModal();
        loadLibrary();
    } catch (err) {
        alert('Error: ' + err.message);
    }
};

// SEND TO PARENT WINDOW
window.selectProduct = (id) => {
    const p = allMasterProducts.find(x => x._id === id);
    if (window.parent) {
        window.parent.postMessage({ type: 'SELECT_MASTER_PRODUCT', product: p }, '*');
    }
};

document.addEventListener('DOMContentLoaded', loadLibrary);
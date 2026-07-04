const API = '/api/library';
let allProducts = [];
let allCategories = [];
let selectedCategory = '';

document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadProducts();
    document.getElementById('searchInput').addEventListener('input', handleSearch);
});

// ========== LOAD CATEGORIES ==========
async function loadCategories() {
    try {
        const res = await fetch(`${API}/categories`);
        allCategories = await res.json();
        renderCategories();
    } catch(err) {
        console.error(err);
    }
}

function renderCategories() {
    const container = document.getElementById('categoryList');
    container.innerHTML = `<div class="category-item">
        <div class="category-header ${selectedCategory === ''? 'active' : ''}" onclick="filterByCategory('')">
            All Categories <span>${allCategories.reduce((a,b)=>a+b.count,0)}</span>
        </div>
    </div>` +
    allCategories.map(cat => `
        <div class="category-item">
            <div class="category-header ${selectedCategory === cat._id? 'active' : ''}" onclick="filterByCategory('${cat._id}')">
                ${cat.name} <span>${cat.count}</span>
            </div>
        </div>
    `).join('');
}

window.filterByCategory = (catId) => {
    selectedCategory = catId;
    renderCategories();
    loadProducts();
}

// ========== LOAD PRODUCTS ==========
async function loadProducts() {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = `<div class="loader">Loading...</div>`;

    try {
        const search = document.getElementById('searchInput').value;
        const url = `${API}/products?search=${search}&category=${selectedCategory}&limit=100`;
        const res = await fetch(url);
        const data = await res.json();

        allProducts = data.products || [];
        document.getElementById('totalCount').textContent = `${data.total} Products`;
        renderProducts();
    } catch(err) {
        grid.innerHTML = `<div class="loader" style="color:red;">Error loading</div>`;
    }
}

function renderProducts() {
    const grid = document.getElementById('productGrid');
    if(allProducts.length === 0) {
        grid.innerHTML = `<div class="loader">No products found 😔</div>`;
        return;
    }

    grid.innerHTML = allProducts.map(p => `
        <div class="product-card">
            <img src="${p.image || 'https://via.placeholder.com/240x160'}" onerror="this.src='https://via.placeholder.com/240x160'">
            <h3 title="${p.name}">${p.name}</h3>
            <p>${p.brand || ''} • ${p.categoryId?.name || ''}</p>
            <span class="photo-count">${p.photos?.length || 1} Photos</span>
            <button onclick="selectProduct('${p._id}')">Select for Shop</button>
        </div>
    `).join('');
}

function handleSearch() {
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(loadProducts, 500);
}

// ========== ADD/EDIT MASTER PRODUCT ==========
window.openAddProductModal = async () => {
    document.getElementById('libModalTitle').textContent = 'Add Master Product';
    document.getElementById('addProductForm').reset();
    document.getElementById('libProductId').value = '';

    // Load categories in dropdown
    const catSelect = document.getElementById('prodCategory');
    const res = await fetch('/api/categories'); // tumhara main category api
    const cats = await res.json();
    catSelect.innerHTML = '<option value="">Select Category</option>' + cats.map(c=>`<option value="${c._id}">${c.name}</option>`).join('');

    document.getElementById('addProductModal').style.display = 'flex';
}

window.closeAddProductModal = () => {
    document.getElementById('addProductModal').style.display = 'none';
}

window.saveLibraryProduct = async () => {
    const form = document.getElementById('addProductForm');
    const formData = new FormData();
    formData.append('name', document.getElementById('prodName').value);
    formData.append('category', document.getElementById('prodCategory').value);
    formData.append('brand', document.getElementById('prodBrand').value);
    formData.append('description', document.getElementById('prodDesc').value);

    const files = document.getElementById('prodPhotos').files;
    for(let i=0; i<files.length; i++) {
        formData.append('photos', files[i]);
    }

    try {
        const res = await fetch(`${API}/add-product`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if(data.success) {
            alert('Master Product Added!');
            closeAddProductModal();
            loadProducts();
            loadCategories();
        }
    } catch(err) {
        alert('Error: ' + err.message);
    }
}

// ========== SELECT PRODUCT FOR ADMIN ==========
window.selectProduct = (productId) => {
    const product = allProducts.find(p => p._id === productId);
    if(!product) return;

    // Parent window ko message bhejo - Admin page sun raha hai
    window.parent.postMessage({
        type: 'SELECT_MASTER_PRODUCT',
        product: product
    }, '*');
}
const API = '/api';
const token = localStorage.getItem('adminToken') || localStorage.getItem('token') || localStorage.getItem('managerToken') || '';
let allProducts = [];
let allCategories = [];
let selectedCategory = 'all';

// PAGE LOAD
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadProducts();
    document.getElementById('searchInput').addEventListener('input', filterProducts);
});

// 1. LOAD CATEGORIES FROM MODULES
async function loadCategories() {
    try {
        const res = await fetch(API + '/modules', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        allCategories = data.modules || data || [];
        
        document.getElementById('categoryList').innerHTML = 
            `<div class="cat-item active" onclick="selectCategory('all')">All Categories</div>` +
            allCategories.map(c => 
                `<div class="cat-item" onclick="selectCategory('${c._id || c.id}')">
                    ${c.icon || '📦'} ${c.name}
                </div>`
            ).join('');

        // Dropdown bhi bhar de
        document.getElementById('prodCategory').innerHTML =
            '<option value="">Select Category</option>' +
            allCategories.map(c => `<option value="${c._id || c.id}">${c.name}</option>`).join('');

    } catch(err) { console.error(err) }
}

// 2. LOAD PRODUCTS
async function loadProducts() {
    try {
        const res = await fetch(API + '/master-products', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        allProducts = await res.json();
        document.getElementById('totalCount').textContent = `${allProducts.length} Products`;
        renderProducts(allProducts);
    } catch(err) {
        document.getElementById('productGrid').innerHTML = 'Error loading products';
    }
}

// 3. RENDER PRODUCTS
function renderProducts(products) {
    if(products.length === 0) {
        document.getElementById('productGrid').innerHTML = '<p>No products found</p>';
        return;
    }
    document.getElementById('productGrid').innerHTML = products.map(p => {
        const cat = allCategories.find(c => c._id === p.categoryId || c.id === p.categoryId);
        return `
        <div class="product-card" onclick='selectProduct(${JSON.stringify(p)})'>
            <img src="${p.image || 'https://via.placeholder.com/200'}">
            <div class="info">
                <h3>${p.name}</h3>
                <p>${p.brand || ''}</p>
                <span class="cat-badge">${cat?.name || ''}</span>
            </div>
            <button class="btn-select">Select</button>
        </div>`
    }).join('');
}

// 4. SELECT PRODUCT - YEH SABSE ZARURI HAI
function selectProduct(product) {
    window.parent.postMessage({
        type: 'SELECT_MASTER_PRODUCT',
        product: {
            name: product.name,
            brand: product.brand,
            categoryId: product.categoryId,
            image: product.image
        }
    }, '*');
}

// 5. SEARCH + CATEGORY FILTER
function selectCategory(catId) {
    selectedCategory = catId;
    document.querySelectorAll('.cat-item').forEach(el => el.classList.remove('active'));
    event.target.classList.add('active');
    filterProducts();
}

function filterProducts() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    let filtered = allProducts.filter(p => p.name.toLowerCase().includes(q));
    if(selectedCategory !== 'all') {
        filtered = filtered.filter(p => p.categoryId === selectedCategory);
    }
    renderProducts(filtered);
}

// 6. ADD PRODUCT MODAL
window.openAddProductModal = () => {
    document.getElementById('addProductModal').classList.add('active');
}
window.closeAddProductModal = () => {
    document.getElementById('addProductModal').classList.remove('active');
}

window.saveLibraryProduct = async () => {
    const data = {
        name: document.getElementById('prodName').value,
        categoryId: document.getElementById('prodCategory').value,
        brand: document.getElementById('prodBrand').value,
        description: document.getElementById('prodDesc').value,
    };
    try {
        await fetch(API + '/master-products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        alert('✅ Product Added');
        closeAddProductModal();
        loadProducts();
    } catch(err) { alert('Error: '+err.message) }
}
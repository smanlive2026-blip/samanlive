let allProducts = [];
const limit = 50;
let selectedCategory = null;

document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadProducts();
    document.getElementById('searchInput').addEventListener('keyup', (e) => loadProducts(1, e.target.value));
});

// ========== LOAD CATEGORIES ==========
async function loadCategories() {
    try {
        const res = await fetch('/api/library/categories'); //. hata diya
        const allCategories = await res.json();
        let html = '';
        allCategories.forEach(cat => {
            html += `<div class="category-item">
                <div class="category-header" onclick="this.nextElementSibling.classList.toggle('open')">
                    <span>${cat.name} (${cat.count})</span><i class="fa fa-chevron-down"></i>
                </div>
                <div class="category-products">
                    <div class="product-sub-item" onclick="filterByCategory('${cat._id}')">All ${cat.name}</div> <!-- _id bhejo -->
                </div>
            </div>`;
        });
        document.getElementById('categoryList').innerHTML = html;
    } catch(err) {
        console.log(err);
    }
}

function filterByCategory(catId) {
    selectedCategory = catId;
    loadProducts(1);
}

// ========== LOAD PRODUCTS ==========
async function loadProducts(page = 1, search = '') {
    let url = `/api/library/products?page=${page}&limit=${limit}`; //. hata diya
    if(search) url += `&search=${encodeURIComponent(search)}`;
    if(selectedCategory) url += `&category=${selectedCategory}`;

    const res = await fetch(url);
    const data = await res.json();
    allProducts = data.products;
    displayProducts(data.products);
    document.getElementById('totalCount').innerText = `${data.total} Products`;
}

function displayProducts(products) {
    let html = '';
    products.forEach(p => {
        html += `<div class="product-card">
            <img src="${p.image || p.photos?.[0] || '/placeholder.jpg'}" alt="${p.name}">
            <h3>${p.name}</h3>
            <p>${p.categoryId?.name || ''} • ${p.brand || 'No Brand'}</p>
            <div class="photo-count"><i class="fa fa-images"></i> ${p.photos?.length || 1} Photos</div>
            <button onclick='selectProduct("${p._id}")'><i class="fa fa-check"></i> Select</button>
        </div>`;
    });
    document.getElementById('productGrid').innerHTML = html || 'No products';
}

// ========== SELECT PRODUCT FOR ADMIN ==========
function selectProduct(productId) {
    const product = allProducts.find(p => p._id === productId);
    if(!product) return;

    // Admin wala yehi type sun raha hai
    window.parent.postMessage({
        type: 'SELECT_MASTER_PRODUCT',
        product: product
    }, '*');
}

// ========== ADD MASTER PRODUCT ==========
function openAddProductModal() {
    document.getElementById('addProductModal').style.display = 'flex';
    loadCategoryDropdown(); // dropdown bhi bhar de
}
function closeAddProductModal() {
    document.getElementById('addProductModal').style.display = 'none';
}

async function loadCategoryDropdown() {
    const res = await fetch('/api/categories'); // main category list
    const cats = await res.json();
    document.getElementById('prodCategory').innerHTML =
        '<option value="">Select Category</option>' +
        cats.map(c=>`<option value="${c._id}">${c.name}</option>`).join('');
}

async function saveProduct() {
    const formData = new FormData();
    formData.append('name', document.getElementById('prodName').value);
    formData.append('category', document.getElementById('prodCategory').value);
    formData.append('brand', document.getElementById('prodBrand').value);
    formData.append('description', document.getElementById('prodDesc')?.value || '');

    const files = document.getElementById('prodPhotos').files;
    for(let i=0; i<files.length; i++) formData.append('photos', files[i]);

    const res = await fetch('/api/library/add-product', { method: 'POST', body: formData });
    if(res.ok) {
        alert('Master Product Added!');
        closeAddProductModal();
        loadProducts();
        loadCategories();
    } else {
        alert('Error adding product');
    }
}

// Modal ke bahar click karne se band ho
window.onclick = function(event) {
    if (event.target.id == 'addProductModal') {
        closeAddProductModal();
    }
}
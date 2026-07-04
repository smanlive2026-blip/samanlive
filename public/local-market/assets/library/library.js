let allProducts = []; const limit = 50; let selectedCategory = null;

document.addEventListener('DOMContentLoaded', () => {
    loadCategories(); loadProducts();
    document.getElementById('searchInput').addEventListener('keyup', (e) => loadProducts(1, e.target.value));
});

async function loadCategories() {
    const res = await fetch('./api/library/categories'); // PATH FIX KIYA
    const allCategories = await res.json();
    let html = '';
    allCategories.forEach(cat => {
        html += `<div class="category-item">
            <div class="category-header" onclick="this.nextElementSibling.classList.toggle('open')">
                <span>${cat.name} (${cat.count})</span><i class="fa fa-chevron-down"></i>
            </div>
            <div class="category-products">
                <div class="product-sub-item" onclick="filterByCategory('${cat.name}')">All ${cat.name}</div>
            </div>
        </div>`;
    });
    document.getElementById('categoryList').innerHTML = html;
}

function filterByCategory(catName) { selectedCategory = catName; loadProducts(1); }

async function loadProducts(page = 1, search = '') {
    let url = `./api/library/products?page=${page}&limit=${limit}`;
    if(search) url += `&search=${search}`;
    if(selectedCategory) url += `&category=${selectedCategory}`;

    const res = await fetch(url); const data = await res.json();
    allProducts = data.products; displayProducts(data.products);
    document.getElementById('totalCount').innerText = `${data.total} Products`;
}

function displayProducts(products) {
    let html = '';
    products.forEach(p => {
        html += `<div class="product-card">
            <img src="${p.photos[0] || '/placeholder.jpg'}" alt="${p.name}">
            <h3>${p.name}</h3><p>${p.category} • ${p.brand || 'No Brand'}</p>
            <div class="photo-count"><i class="fa fa-images"></i> ${p.photos.length} Photos</div>
            <button onclick='selectProduct(${JSON.stringify(p)})'><i class="fa fa-check"></i> Select</button>
        </div>`;
    });
    document.getElementById('productGrid').innerHTML = html || 'No products';
}

function selectProduct(product) {
    window.parent.postMessage({type: 'ADD_FROM_LIBRARY', data: product}, '*');
}

function openAddProductModal() { document.getElementById('addProductModal').style.display = 'flex'; }
function closeAddProductModal() { document.getElementById('addProductModal').style.display = 'none'; }

async function saveProduct() {
    const formData = new FormData();
    formData.append('name', document.getElementById('prodName').value);
    formData.append('category', document.getElementById('prodCategory').value);
    formData.append('brand', document.getElementById('prodBrand').value);
    const files = document.getElementById('prodPhotos').files;
    for(let i=0; i<files.length; i++) formData.append('photos', files[i]);

    const res = await fetch('./api/library/add-product', { method: 'POST', body: formData });
    if(res.ok) { alert('Product Added!'); closeAddProductModal(); loadProducts(); }
}
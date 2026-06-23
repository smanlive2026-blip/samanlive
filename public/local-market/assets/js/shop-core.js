let currentShop = null;
let currentShopType = null;
const token = localStorage.getItem('userToken');

async function initDashboard(type) {
    currentShopType = type;
    const shopId = window.location.pathname.split('/').pop();
    
    const res = await fetch(`/api/local-market/shops/${shopId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    currentShop = await res.json();
    
    document.getElementById('shopName').innerText = currentShop.shopName;
    document.getElementById('shopStatus').innerText = currentShop.status;
    document.getElementById('shopStatus').className = `badge badge-${currentShop.status}`;
    
    loadProducts();
}

async function loadProducts() {
    const res = await fetch(`/api/local-market/shops/${currentShop._id}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const products = await res.json();
    renderProducts(products);
}

function renderProducts(products) {
    const tbody = document.getElementById('productTableBody');
    document.getElementById('totalProducts').innerText = products.length;
    
    if (currentShopType === 'kirana') {
        tbody.innerHTML = products.map(p => `
            <tr>
                <td>${p.name}</td>
                <td>${p.productData.weight}</td>
                <td>₹${p.productData.mrp}</td>
                <td>₹${p.price}</td>
                <td>${p.stock}</td>
                <td>
                    <button onclick="editProduct('${p._id}')">Edit</button>
                    <button onclick="deleteProduct('${p._id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    }
    
    if (currentShopType === 'cloth') {
        tbody.innerHTML = products.map(p => `
            <tr>
                <td>${p.name}</td>
                <td>${p.productData.category}</td>
                <td>${p.productData.size}</td>
                <td>${p.productData.color}</td>
                <td>${p.productData.fabric || '-'}</td>
                <td>₹${p.price}</td>
                <td>${p.stock}</td>
                <td>
                    <button onclick="editProduct('${p._id}')">Edit</button>
                    <button onclick="deleteProduct('${p._id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    }
    
    if (currentShopType === 'medical') {
        tbody.innerHTML = products.map(p => `
            <tr>
                <td>${p.name}</td>
                <td>${p.productData.company}</td>
                <td>${p.productData.batch}</td>
                <td>${new Date(p.productData.expiry).toLocaleDateString()}</td>
                <td>₹${p.productData.mrp}</td>
                <td>${p.stock}</td>
                <td>
                    <button onclick="editProduct('${p._id}')">Edit</button>
                    <button onclick="deleteProduct('${p._id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    }
    
    if (currentShopType === 'restaurant') {
        tbody.innerHTML = products.map(p => `
            <tr>
                <td>${p.name}</td>
                <td>${p.productData.category}</td>
                <td><span class="badge badge-${p.productData.foodType}">${p.productData.foodType}</span></td>
                <td>₹${p.price}</td>
                <td>${p.productData.available ? 'Yes' : 'No'}</td>
                <td>
                    <button onclick="editProduct('${p._id}')">Edit</button>
                    <button onclick="deleteProduct('${p._id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    }
}

async function loadTemplate(templateName) {
    const res = await fetch(`/shop-templates/${currentShopType}/${templateName}.html`);
    const html = await res.text();
    document.getElementById('modalContainer').innerHTML = html;
    document.getElementById('modalContainer').style.display = 'block';
    document.getElementById('productForm').onsubmit = saveProduct;
}

function closeModal() {
    document.getElementById('modalContainer').style.display = 'none';
}

async function saveProduct(e) {
    e.preventDefault();
    const id = document.getElementById('productId').value;
    
    let productData = {};
    let baseData = {
        name: document.getElementById('pName').value,
        price: document.getElementById('pPrice').value,
        shopId: currentShop._id,
        shopType: currentShopType
    };
    
    if (currentShopType === 'kirana') {
        productData = {
            weight: document.getElementById('pWeight').value,
            unit: document.getElementById('pUnit').value,
            mrp: document.getElementById('pMrp').value,
            brand: document.getElementById('pBrand').value,
            expiry: document.getElementById('pExpiry').value
        };
        baseData.stock = document.getElementById('pStock').value;
    }
    
    if (currentShopType === 'cloth') {
        productData = {
            category: document.getElementById('pCategory').value,
            size: document.getElementById('pSize').value,
            color: document.getElementById('pColor').value,
            fabric: document.getElementById('pFabric').value,
            description: document.getElementById('pDesc').value
        };
        baseData.stock = document.getElementById('pStock').value;
        baseData.mrp = document.getElementById('pMrp').value;
    }
    
    if (currentShopType === 'medical') {
        productData = {
            company: document.getElementById('pCompany').value,
            batch: document.getElementById('pBatch').value,
            expiry: document.getElementById('pExpiry').value,
            type: document.getElementById('pType').value,
            packSize: document.getElementById('pPack').value,
            prescription: document.getElementById('pPrescription').checked,
            mrp: document.getElementById('pMrp').value
        };
        baseData.stock = document.getElementById('pStock').value;
    }
    
    if (currentShopType === 'restaurant') {
        productData = {
            category: document.getElementById('pCategory').value,
            foodType: document.getElementById('pFoodType').value,
            spiceLevel: document.getElementById('pSpice').value,
            prepTime: document.getElementById('pTime').value,
            description: document.getElementById('pDesc').value,
            available: document.getElementById('pAvailable').checked
        };
        baseData.stock = 999; // Restaurant me stock nahi hota
    }
    
    const url = id ? `/api/local-market/products/${id}` : `/api/local-market/products`;
    const method = id ? 'PUT' : 'POST';
    
    await fetch(url, {
        method,
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...baseData, productData })
    });
    
    closeModal();
    loadProducts();
}

async function deleteProduct(id) {
    if (!confirm('Delete this item?')) return;
    await fetch(`/api/local-market/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    loadProducts();
}
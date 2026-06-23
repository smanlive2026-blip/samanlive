// ===== SAMANLIVE SHOP CORE JS =====
// Common functions for dashboard + user-view
// Updated for Live Shop Schema: product, food, service, rental, fashion

// Shop Type Config - Tere live schema ke hisaab se
const SHOP_CONFIG = {
    product: { // Kirana / General Product
        stats: [
            { label: 'Total Products', key: 'totalProducts' },
            { label: 'Low Stock Items', key: 'lowStock' },
            { label: 'Today Orders', key: 'todayOrders' }
        ],
        tableHeaders: ['Product', 'Price', 'Unit', 'Stock', 'Available', 'Actions'],
        addBtnText: 'Add Product',
        formTemplate: 'product-form',
        fields: ['name', 'price', 'unit', 'stock', 'desc', 'image', 'available']
    },
    fashion: { // Cloth / Fashion
        stats: [
            { label: 'Total Items', key: 'totalProducts' },
            { label: 'Total Variants', key: 'totalVariants' },
            { label: 'Today Orders', key: 'todayOrders' }
        ],
        tableHeaders: ['Item', 'Size', 'Color', 'Price', 'Available', 'Actions'],
        addBtnText: 'Add Fashion Item',
        formTemplate: 'product-form',
        fields: ['name', 'size', 'color', 'price', 'desc', 'image', 'available']
    },
    food: { // Restaurant / Food
        stats: [
            { label: 'Menu Items', key: 'totalProducts' },
            { label: 'Active Orders', key: 'activeOrders' },
            { label: 'Today Orders', key: 'todayOrders' }
        ],
        tableHeaders: ['Dish Name', 'Type', 'Price', 'Available', 'Actions'],
        addBtnText: 'Add Menu Item',
        formTemplate: 'menu-form',
        fields: ['name', 'veg', 'price', 'desc', 'image', 'available', 'duration'],
        extraButtons: ['toggleShopStatus']
    },
    service: { // Medical / Doctor / Salon
        stats: [
            { label: 'Total Services', key: 'totalProducts' },
            { label: 'Active Bookings', key: 'activeOrders' },
            { label: 'Today Orders', key: 'todayOrders' }
        ],
        tableHeaders: ['Service', 'Duration', 'Price', 'Available', 'Actions'],
        addBtnText: 'Add Service',
        formTemplate: 'product-form',
        fields: ['name', 'duration', 'price', 'desc', 'image', 'available']
    },
    rental: { // Bike / Car / Equipment Rental
        stats: [
            { label: 'Total Items', key: 'totalProducts' },
            { label: 'Active Rentals', key: 'activeOrders' },
            { label: 'Today Orders', key: 'todayOrders' }
        ],
        tableHeaders: ['Item', 'Duration', 'Price', 'Available', 'Actions'],
        addBtnText: 'Add Rental Item',
        formTemplate: 'product-form',
        fields: ['name', 'duration', 'price', 'unit', 'desc', 'image', 'available']
    }
};

let currentShopId = null;
let currentShopType = null;
let currentShopData = null;

// ===== DASHBOARD INIT =====
async function initDashboard(shopType, shopId) {
    currentShopId = shopId;
    currentShopType = shopType;
    const config = SHOP_CONFIG[shopType];

    if (!config) {
        alert('Invalid shop type: ' + shopType);
        return;
    }

    showLoader(true);

    // 1. Stats labels set karo
    document.getElementById('stat1Label').textContent = config.stats[0].label;
    document.getElementById('stat2Label').textContent = config.stats[1].label;
    document.getElementById('stat3Label').textContent = config.stats[2].label;

    // 2. Table headers set karo
    const thead = document.getElementById('tableHead');
    thead.innerHTML = '<tr>' + config.tableHeaders.map(h => `<th>${h}</th>`).join('') + '</tr>';

    // 3. Add button text
    document.getElementById('addBtnText').textContent = config.addBtnText;

    // 4. Food/Restaurant ke liye extra button
    if (shopType === 'food' && config.extraButtons) {
        const btn = `<button class="btn btn-warning" onclick="toggleShopStatus()">
            <i class="fa fa-power-off"></i> Open/Close Shop
        </button>`;
        document.getElementById('actionBar').insertAdjacentHTML('beforeend', btn);
    }

    // 5. Data load karo
    await loadShopData(shopId);
    await loadDashboardStats(shopId, shopType);
    await loadProducts(shopId, shopType);

    showLoader(false);
}

// ===== LOAD SHOP DATA =====
async function loadShopData(shopId) {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/local-market/shops/${shopId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Shop not found');

        currentShopData = await res.json();
        document.getElementById('shopName').textContent = currentShopData.shopName;
        document.getElementById('shopTypeLabel').textContent = currentShopData.shopType.toUpperCase();

        const statusEl = document.getElementById('shopStatus');
        statusEl.textContent = currentShopData.status;
        statusEl.className = `badge ${currentShopData.status === 'approved'? 'badge-success' : 'badge-warning'}`;

    } catch (err) {
        alert('Error loading shop: ' + err.message);
        window.location.href = '/local-market/my-shops';
    }
}

// ===== LOAD STATS =====
async function loadDashboardStats(shopId, shopType) {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/local-market/shops/${shopId}/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const stats = await res.json();
        const config = SHOP_CONFIG[shopType];

        document.getElementById('stat1Value').textContent = stats[config.stats[0].key] || 0;
        document.getElementById('stat2Value').textContent = stats[config.stats[1].key] || 0;
        document.getElementById('stat3Value').textContent = stats[config.stats[2].key] || 0;
    } catch (err) {
        console.error('Stats error:', err);
    }
}

// ===== LOAD PRODUCTS =====
async function loadProducts(shopId, shopType) {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/local-market/shops/${shopId}/products`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const products = await res.json();
        renderProductTable(products, shopType);
    } catch (err) {
        document.getElementById('productTableBody').innerHTML =
            '<tr><td colspan="10" class="text-center">Error loading products</td></tr>';
    }
}

// ===== RENDER TABLE =====
function renderProductTable(products, shopType) {
    const tbody = document.getElementById('productTableBody');

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center">No products found</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(p => {
        let cells = '';

        switch(shopType) {
            case 'product': // Kirana
                cells = `
                    <td>${p.name}</td>
                    <td>₹${p.price}</td>
                    <td>${p.unit || '-'}</td>
                    <td>${p.stock || '-'}</td>
                    <td>${p.available!== false? '<i class="fa fa-check text-success"></i>' : '<i class="fa fa-times text-danger"></i>'}</td>
                `;
                break;
            case 'fashion': // Cloth
                cells = `
                    <td>${p.name}</td>
                    <td>${p.size || '-'}</td>
                    <td>${p.color || '-'}</td>
                    <td>₹${p.price}</td>
                    <td>${p.available!== false? '<i class="fa fa-check text-success"></i>' : '<i class="fa fa-times text-danger"></i>'}</td>
                `;
                break;
            case 'food': // Restaurant
                cells = `
                    <td>${p.name}</td>
                    <td><span class="badge ${p.veg!== false? 'badge-success' : 'badge-danger'}">${p.veg!== false? 'Veg' : 'Non-Veg'}</span></td>
                    <td>₹${p.price}</td>
                    <td>${p.available!== false? '<i class="fa fa-check text-success"></i>' : '<i class="fa fa-times text-danger"></i>'}</td>
                `;
                break;
            case 'service': // Medical/Service
                cells = `
                    <td>${p.name}</td>
                    <td>${p.duration || '-'}</td>
                    <td>₹${p.price}</td>
                    <td>${p.available!== false? '<i class="fa fa-check text-success"></i>' : '<i class="fa fa-times text-danger"></i>'}</td>
                `;
                break;
            case 'rental': // Rental
                cells = `
                    <td>${p.name}</td>
                    <td>${p.duration || '-'}</td>
                    <td>₹${p.price}</td>
                    <td>${p.available!== false? '<i class="fa fa-check text-success"></i>' : '<i class="fa fa-times text-danger"></i>'}</td>
                `;
                break;
        }

        cells += `
            <td>
                <button class="btn btn-sm btn-primary" onclick="editProduct('${p._id}')">
                    <i class="fa fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct('${p._id}')">
                    <i class="fa fa-trash"></i>
                </button>
            </td>
        `;

        return `<tr>${cells}</tr>`;
    }).join('');
}

// ===== LOAD TEMPLATE MODAL =====
async function loadTemplate(templateName, shopType) {
    showLoader(true);
    try {
        const res = await fetch(`/shop-templates/${shopType}/${templateName}.html`);
        const html = await res.text();
        document.getElementById('modalContainer').innerHTML = html;
        document.getElementById('modalContainer').style.display = 'block';

        // Form submit handler attach karo
        const form = document.getElementById('productForm');
        if (form) {
            form.onsubmit = (e) => saveProduct(e, shopType);
        }
    } catch (err) {
        alert('Error loading form');
    }
    showLoader(false);
}

function closeModal() {
    document.getElementById('modalContainer').style.display = 'none';
    document.getElementById('modalContainer').innerHTML = '';
}

// ===== SAVE PRODUCT =====
async function saveProduct(e, shopType) {
    e.preventDefault();
    showLoader(true);

    const productId = document.getElementById('productId').value;
    const config = SHOP_CONFIG[shopType];
    const productData = { shopId: currentShopId };

    // Form se data nikalo
    config.fields.forEach(field => {
        const el = document.getElementById('p' + field.charAt(0).toUpperCase() + field.slice(1));
        if (el) {
            let val = el.value;
            if (el.type === 'number') val = Number(val);
            if (el.type === 'checkbox') val = el.checked;
            productData[field] = val;
        }
    });

    try {
        const token = localStorage.getItem('token');
        const url = productId
          ? `/api/local-market/products/${currentShopId}/${productId}`
            : '/api/local-market/products';
        const method = productId? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });

        if (!res.ok) throw new Error('Save failed');

        closeModal();
        await loadProducts(currentShopId, shopType);
        await loadDashboardStats(currentShopId, shopType);
        alert('Product saved successfully!');
    } catch (err) {
        alert('Error: ' + err.message);
    }
    showLoader(false);
}

// ===== EDIT PRODUCT =====
async function editProduct(productId) {
    showLoader(true);
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/local-market/products/${currentShopId}/${productId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const product = await res.json();

        await loadTemplate(SHOP_CONFIG[currentShopType].formTemplate, currentShopType);

        // Form fill karo
        document.getElementById('productId').value = product._id;
        document.getElementById('formTitle').textContent = 'Edit Product';

        SHOP_CONFIG[currentShopType].fields.forEach(field => {
            const el = document.getElementById('p' + field.charAt(0).toUpperCase() + field.slice(1));
            if (el && product[field]!== undefined) {
                if (el.type === 'checkbox') {
                    el.checked = product[field];
                } else if (el.type === 'date' && product[field]) {
                    el.value = new Date(product[field]).toISOString().split('T')[0];
                } else {
                    el.value = product[field];
                }
            }
        });
    } catch (err) {
        alert('Error loading product');
    }
    showLoader(false);
}

// ===== DELETE PRODUCT =====
async function deleteProduct(productId) {
    if (!confirm('Delete this product?')) return;

    showLoader(true);
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/local-market/products/${currentShopId}/${productId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Delete failed');

        await loadProducts(currentShopId, currentShopType);
        await loadDashboardStats(currentShopId, currentShopType);
        alert('Product deleted!');
    } catch (err) {
        alert('Error: ' + err.message);
    }
    showLoader(false);
}

// ===== TOGGLE SHOP STATUS =====
async function toggleShopStatus() {
    const newStatus =!currentShopData.isOpen;
    showLoader(true);

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/local-market/shops/${currentShopId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ isOpen: newStatus })
        });

        if (!res.ok) throw new Error('Update failed');

        currentShopData.isOpen = newStatus;
        const statusEl = document.getElementById('shopStatus');
        statusEl.innerHTML = newStatus? '<i class="fa fa-circle"></i> Open' : '<i class="fa fa-circle"></i> Closed';
        alert(`Shop is now ${newStatus? 'Open' : 'Closed'}`);
    } catch (err) {
        alert('Error: ' + err.message);
    }
    showLoader(false);
}

// ===== LOAD ORDERS =====
function loadOrders() {
    window.location.href = `/local-market/shop/orders.html?shopId=${currentShopId}`;
}

// ===== UTILITY =====
function showLoader(show) {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = show? 'flex' : 'none';
}

// ===== USER VIEW FUNCTIONS =====
async function initUserView(shopId, shopType) {
    currentShopId = shopId;
    currentShopType = shopType;
    await loadShopData(shopId);
    await loadShopProducts(shopId, shopType);
}

async function loadShopProducts(shopId, shopType) {
    try {
        const res = await fetch(`/api/local-market/shops/${shopId}/products`);
        const products = await res.json();
        if (typeof renderProducts === 'function') {
            renderProducts(products, shopType);
        }
    } catch (err) {
        console.error('Error loading products:', err);
    }
}
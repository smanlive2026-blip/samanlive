const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
let currentShop = null;

if (!shopId) {
    alert('Invalid shop link');
    window.location.href = '/local-market/create-shop.html';
}

// Shop ID show karo header me
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    try {
        const res = await fetch(`/api/local-market/shops/${shopId}`);
        const shop = await res.json();

        if (!shop._id) {
            alert('Shop not found');
            window.location.href = '/local-market/create-shop.html';
            return;
        }

        currentShop = shop;
        
        // Header data
        document.getElementById('shopName').innerText = shop.shopName;
        
        // Stats
        const items = shop.items || shop.products || [];
        const lowStock = items.filter(i => (i.stock || 0) < 5).length;
        
        document.getElementById('totalProducts').innerText = items.length;
        document.getElementById('todayOrders').innerText = shop.todayOrders || 0;
        document.getElementById('lowStock').innerText = lowStock;
        document.getElementById('warrantyClaims').innerText = shop.warrantyClaims || 0;

        loadProducts(items);
        document.getElementById('loader').style.display = 'none';
        document.getElementById('productTable').style.display = 'table';

    } catch (err) {
        console.error(err);
        alert('Failed to load shop: ' + err.message);
        document.getElementById('loader').innerText = 'Failed to load data';
    }
}

function loadProducts(items) {
    const tbody = document.getElementById('productTableBody');
    
    if (!items || items.length === 0) {
        tbody.innerHTML = `<tr>
            <td colspan="6" style="text-align:center; padding:40px;">
                <i class="fa fa-box-open" style="font-size:40px; color:#cbd5e1;"></i>
                <h4 style="color:#475569; margin:16px 0 8px 0;">No Products Yet</h4>
                <p style="color:#94a3b8;">Add Mobile, Laptop, TV, AC etc to start</p>
            </td>
        </tr>`;
        return;
    }

    tbody.innerHTML = items.map(item => {
        const stock = item.stock || 0;
        const stockBadge = stock < 5 ? `<span class="badge stock-low">Low: ${stock}</span>` : `${stock}`;
        const warranty = item.warranty || '1 Year';
        
        return `
        <tr>
            <td><strong>${item.name}</strong></td>
            <td>${item.brand || '-'}</td>
            <td><strong>₹${item.price}</strong></td>
            <td>${stockBadge}</td>
            <td><span class="badge warranty">${warranty}</span></td>
            <td>
                <button onclick="editItem('${item._id}')" style="background:#667eea; color:white; border:none; padding:6px 12px; border-radius:8px; cursor:pointer;">
                    <i class="fa fa-edit"></i>
                </button>
                <button onclick="deleteItem('${item._id}')" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:8px; cursor:pointer; margin-left:5px;">
                    <i class="fa fa-trash"></i>
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

// Add Product Button
document.getElementById('addProductBtn').onclick = function() {
    window.location.href = `/shop-templates/electronics/product-form.html?shopId=${shopId}`;
};

// Edit Shop
function editShopInfo() {
    window.location.href = `/local-market/edit-shop.html?shopId=${shopId}`;
}

// Edit Item
function editItem(itemId) {
    window.location.href = `/shop-templates/electronics/product-form.html?shopId=${shopId}&itemId=${itemId}`;
}

// Delete Item
async function deleteItem(itemId) {
    if (!confirm('Delete this product?')) return;
    try {
        await fetch(`/api/local-market/products/${itemId}`, { method: 'DELETE' });
        alert('Product deleted!');
        loadShopData();
    } catch (err) {
        alert('Failed to delete: ' + err.message);
    }
}

// Page load hote hi data lao
loadShopData();
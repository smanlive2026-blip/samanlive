const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    try {
        const res = await fetch(`/api/local-market/shops/${shopId}`);
        const shop = await res.json();
        if (!shop._id) { alert('Shop not found'); return; }

        document.getElementById('shopName').innerText = shop.shopName;
        
        const products = shop.products || shop.items || [];
        const medicines = products.filter(p => p.category === 'Ayurvedic' || p.category === 'Medicine').length;
        
        document.getElementById('totalProducts').innerText = products.length;
        document.getElementById('medicineCount').innerText = medicines;
        document.getElementById('todaySales').innerText = shop.todaySales || 0;
        document.getElementById('revenue').innerText = shop.revenue || 0;

        loadProducts(products);
        document.getElementById('loader').style.display = 'none';
        document.getElementById('productTable').style.display = 'table';

    } catch (err) {
        document.getElementById('loader').innerText = 'Failed to load data';
    }
}

function loadProducts(products) {
    const tbody = document.getElementById('productTableBody');
    if (products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:40px;">No products yet</td></tr>`;
        return;
    }

    tbody.innerHTML = products.map(item => {
        const badgeClass = item.category === 'Ayurvedic' ? 'ayurved' : item.category === 'Food' ? 'food' : 'cosmetic';
        
        return `
        <tr>
            <td><strong>${item.name}</strong></td>
            <td><span class="category-badge ${badgeClass}">${item.category}</span></td>
            <td><strong>₹${item.price}</strong></td>
            <td>${item.stock} ${item.unit || 'pcs'}</td>
            <td>
                <button onclick="editItem('${item._id}')" style="background:#16a34a; color:white; border:none; padding:6px 12px; border-radius:8px; cursor:pointer;">
                    <i class="fa fa-edit"></i>
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

document.getElementById('addProductBtn').onclick = () => {
    window.location.href = `/shop-templates/patanjali/product-form.html?shopId=${shopId}`;
};

function editItem(itemId) {
    window.location.href = `/shop-templates/patanjali/product-form.html?shopId=${shopId}&itemId=${itemId}`;
}

loadShopData();
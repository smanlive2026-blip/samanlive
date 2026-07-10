const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    try {
        const res = await fetch(`/api/local-market/shops/${shopId}`);
        const shop = await res.json();
        if (!shop._id) { alert('Shop not found'); return; }

        document.getElementById('shopName').innerText = shop.shopName;
        
        const items = shop.items || shop.products || [];
        const lowStock = items.filter(i => (i.stock || 0) < 10).length;
        
        document.getElementById('totalProducts').innerText = items.length;
        document.getElementById('lowStock').innerText = lowStock;
        document.getElementById('todaySales').innerText = shop.todaySales || 0;
        document.getElementById('revenue').innerText = shop.revenue || 0;

        loadProducts(items);
        document.getElementById('loader').style.display = 'none';
        document.getElementById('productTable').style.display = 'table';

    } catch (err) {
        document.getElementById('loader').innerText = 'Failed to load data';
    }
}

function loadProducts(items) {
    const tbody = document.getElementById('productTableBody');
    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:40px;">No products yet</td></tr>`;
        return;
    }

    tbody.innerHTML = items.map(item => {
        const stock = item.stock || 0;
        const stockBadge = stock < 10 ? `<span class="stock-low">Low: ${stock}</span>` : `${stock}`;
        
        return `
        <tr>
            <td><strong>${item.name}</strong></td>
            <td>${item.category || 'General'}</td>
            <td><strong>₹${item.price}</strong></td>
            <td>${stockBadge}</td>
            <td>
                <button onclick="editItem('${item._id}')" style="background:#10b981; color:white; border:none; padding:6px 12px; border-radius:8px; cursor:pointer;">
                    <i class="fa fa-edit"></i>
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

document.getElementById('addProductBtn').onclick = () => {
    window.location.href = `/shop-templates/stationery/product-form.html?shopId=${shopId}`;
};

function editItem(itemId) {
    window.location.href = `/shop-templates/stationery/product-form.html?shopId=${shopId}&itemId=${itemId}`;
}

loadShopData();
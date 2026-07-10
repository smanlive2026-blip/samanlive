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
        const lowStock = items.filter(i => (i.stock || 0) < 20).length;
        
        document.getElementById('totalItems').innerText = items.length;
        document.getElementById('lowStock').innerText = lowStock;
        document.getElementById('pendingOrders').innerText = shop.pendingOrders || 0;
        document.getElementById('todaySales').innerText = shop.todaySales || 0;

        loadItems(items);
        document.getElementById('loader').style.display = 'none';
        document.getElementById('itemTable').style.display = 'table';

    } catch (err) {
        document.getElementById('loader').innerText = 'Failed to load data';
    }
}

function loadItems(items) {
    const tbody = document.getElementById('itemTableBody');
    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:40px;">No items in inventory</td></tr>`;
        return;
    }

    tbody.innerHTML = items.map(item => {
        const stock = item.stock || 0;
        const stockDisplay = stock < 20 ? `<span class="stock-alert">Low: ${stock} ${item.unit || 'pcs'}</span>` : `${stock} <span class="unit">${item.unit || 'pcs'}</span>`;
        
        return `
        <tr>
            <td><strong>${item.name}</strong></td>
            <td>${item.category || 'General'}</td>
            <td><strong>₹${item.price}</strong> <span class="unit">/${item.unit || 'pc'}</span></td>
            <td>${stockDisplay}</td>
            <td>
                <button onclick="editItem('${item._id}')" style="background:#64748b; color:white; border:none; padding:6px 12px; border-radius:8px; cursor:pointer;">
                    <i class="fa fa-edit"></i>
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

document.getElementById('addProductBtn').onclick = () => {
    window.location.href = `/shop-templates/hardware/product-form.html?shopId=${shopId}`;
};

function editItem(itemId) {
    window.location.href = `/shop-templates/hardware/product-form.html?shopId=${shopId}&itemId=${itemId}`;
}

loadShopData();
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
        const lowStock = items.filter(i => (i.stock || 0) < 5).length;
        
        document.getElementById('totalItems').innerText = items.length;
        document.getElementById('lowStock').innerText = lowStock;
        document.getElementById('todayBills').innerText = shop.todayBills || 0;
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
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:40px;">No products yet</td></tr>`;
        return;
    }

    tbody.innerHTML = items.map(item => {
        const stock = item.stock || 0;
        const stockBadge = stock < 5 ? `<span class="stock-low">Low: ${stock} ${item.unit || 'kg'}</span>` : `${stock} ${item.unit || 'kg'}`;
        
        return `
        <tr>
            <td><strong>${item.name}</strong></td>
            <td>${item.category || 'General'}</td>
            <td><strong>₹${item.price}</strong> <span style="font-size:12px;">/${item.unit || 'kg'}</span></td>
            <td>${stockBadge}</td>
            <td>
                <button onclick="editItem('${item._id}')" style="background:#f59e0b; color:white; border:none; padding:6px 12px; border-radius:8px; cursor:pointer;">
                    <i class="fa fa-edit"></i>
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

document.getElementById('addItemBtn').onclick = () => {
    window.location.href = `/shop-templates/pansari/item-form.html?shopId=${shopId}`;
};

function editItem(itemId) {
    window.location.href = `/shop-templates/pansari/item-form.html?shopId=${shopId}&itemId=${itemId}`;
}

loadShopData();
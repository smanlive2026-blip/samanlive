const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    try {
        const res = await fetch(`/api/local-market/shops/${shopId}`);
        const shop = await res.json();
        if (!shop._id) { alert('Shop not found'); return; }

        document.getElementById('shopName').innerText = shop.shopName;

        const sabjis = shop.sabjis || shop.items || [];
        const totalStock = sabjis.reduce((sum, s) => sum + (s.stock || 0), 0);

        document.getElementById('totalItems').innerText = sabjis.length;
        document.getElementById('totalStock').innerText = totalStock;
        document.getElementById('todaySales').innerText = shop.todaySales || 0;
        document.getElementById('revenue').innerText = shop.revenue || 0;

        loadSabjis(sabjis);
        document.getElementById('loader').style.display = 'none';
        document.getElementById('sabjiTable').style.display = 'table';

    } catch (err) {
        document.getElementById('loader').innerText = 'Failed to load data';
    }
}

function loadSabjis(sabjis) {
    const tbody = document.getElementById('sabjiTableBody');
    if (sabjis.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px;">No sabji added yet</td></tr>`;
        return;
    }

    tbody.innerHTML = sabjis.map(sabji => {
        const stock = sabji.stock || 0;
        const status = stock < 5? `<span class="stock-low">Low Stock</span>` : `<span class="stock-ok">Available</span>`;

        return `
        <tr>
            <td><strong>${sabji.name}</strong></td>
            <td>${sabji.category || 'Vegetable'}</td>
            <td><strong>₹${sabji.price}</strong> <span style="font-size:12px; color:#64748b;">/kg</span></td>
            <td>${stock} KG</td>
            <td>${status}</td>
            <td>
                <button onclick="editSabji('${sabji._id}')" style="background:#16a34a; color:white; border:none; padding:6px 12px; border-radius:8px; cursor:pointer;">
                    <i class="fa fa-edit"></i>
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

document.getElementById('addSabjiBtn').onclick = () => {
    window.location.href = `/shop-templates/sabji/sabji-form.html?shopId=${shopId}`;
};

function editSabji(sabjiId) {
    window.location.href = `/shop-templates/sabji/sabji-form.html?shopId=${shopId}&sabjiId=${sabjiId}`;
}

loadShopData();
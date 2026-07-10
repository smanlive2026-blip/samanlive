const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

async function loadShopData() {
    try {
        const res = await fetch(`/api/local-market/shops/${shopId}`);
        const shop = await res.json();
        if (!shop._id) { alert('Shop not found'); return; }

        document.getElementById('shopName').innerText = shop.shopName;

        const fruits = shop.fruits || shop.items || [];
        const totalStock = fruits.reduce((sum, f) => sum + (f.stock || 0), 0);

        document.getElementById('totalFruits').innerText = fruits.length;
        document.getElementById('totalStock').innerText = totalStock;
        document.getElementById('todaySales').innerText = shop.todaySales || 0;
        document.getElementById('revenue').innerText = shop.revenue || 0;

        loadFruits(fruits);
        document.getElementById('loader').style.display = 'none';
        document.getElementById('fruitTable').style.display = 'table';

    } catch (err) {
        document.getElementById('loader').innerText = 'Failed to load data';
    }
}

function loadFruits(fruits) {
    const tbody = document.getElementById('fruitTableBody');
    if (fruits.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px;">No fruits added yet</td></tr>`;
        return;
    }

    tbody.innerHTML = fruits.map(fruit => {
        const stock = fruit.stock || 0;
        const days = fruit.expiryDays || 7;
        const status = days <= 2? `<span class="expiry">Expiring Soon</span>` : `<span class="fresh">Fresh</span>`;

        return `
        <tr>
            <td><strong>${fruit.name}</strong></td>
            <td>${fruit.category || 'Fresh'}</td>
            <td><strong>₹${fruit.price}</strong> <span style="font-size:12px; color:#64748b;">/kg</span></td>
            <td>${stock} KG</td>
            <td>${status}</td>
            <td>
                <button onclick="editFruit('${fruit._id}')" style="background:#22c55e; color:white; border:none; padding:6px 12px; border-radius:8px; cursor:pointer;">
                    <i class="fa fa-edit"></i>
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

document.getElementById('addFruitBtn').onclick = () => {
    window.location.href = `/shop-templates/fruit/fruit-form.html?shopId=${shopId}`;
};

function editFruit(fruitId) {
    window.location.href = `/shop-templates/fruit/fruit-form.html?shopId=${shopId}&fruitId=${fruitId}`;
}

loadShopData();
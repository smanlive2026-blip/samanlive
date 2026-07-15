const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId.substring(0, 8) + '...';

// GLOBAL
let allShopFruits = [];

function loadShopData() {
    try {
        // 1. Shop Name
        const shopName = localStorage.getItem('shopName_'+shopId) || 'Fresh Fruits';
        document.getElementById('shopName').innerText = shopName;

        // 2. Load Fruits: Pehle localStorage dekho, nahi to 104 seed wale
        const savedFruits = JSON.parse(localStorage.getItem('shopFruits_'+shopId)) || [];
        allShopFruits = savedFruits.length > 0 ? savedFruits : [...window.FRUIT_PRODUCTS_DATA];

        // 3. Stats Calculate
        const totalStock = allShopFruits.reduce((sum, f) => sum + (f.stock || 0), 0);
        const totalCustomers = localStorage.getItem('customers_'+shopId) || Math.floor(Math.random()*200) + 50;
        const revenue = localStorage.getItem('revenue_'+shopId) || allShopFruits.reduce((sum, f) => sum + (f.price * 2), 0);
        const todaySales = localStorage.getItem('sales_'+shopId) || Math.floor(Math.random()*20) + 5;

        document.getElementById('totalFruits').innerText = allShopFruits.length;
        document.getElementById('totalStock').innerText = totalStock;
        document.getElementById('todaySales').innerText = todaySales;
        document.getElementById('revenue').innerText = revenue;
        document.getElementById('totalCustomers').innerText = totalCustomers;

        loadFruits(allShopFruits);
        document.getElementById('loader').style.display = 'none';
        document.getElementById('fruitTable').style.display = 'table';

    } catch (err) {
        console.error(err);
        document.getElementById('loader').innerText = 'Failed to load data';
    }
}

function loadFruits(fruits) {
    const tbody = document.getElementById('fruitTableBody');
    if (fruits.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px;">
            <i class="fa fa-inbox" style="font-size:32px; color:#cbd5e1; margin-bottom:10px;"></i><br>
            No fruits added yet. Click "Add Fruit" to start
        </td></tr>`;
        return;
    }

    tbody.innerHTML = fruits.map(fruit => {
        const stock = fruit.stock || 0;
        const days = fruit.expiryDays || 7;
        const status = days <= 2 ? `<span class="expiry"><i class="fa fa-exclamation"></i> Expiring Soon</span>` : `<span class="fresh"><i class="fa fa-check"></i> Fresh</span>`;
        const stockClass = stock < 10 ? 'low-stock' : '';

        return `
        <tr>
            <td>
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${fruit.image || 'https://via.placeholder.com/40?text=F'}" style="width:40px; height:40px; border-radius:8px; object-fit:cover;">
                    <strong>${fruit.name}</strong>
                </div>
            </td>
            <td>₹<strong>${fruit.price}</strong> <span style="font-size:12px; color:#64748b;">/${fruit.unit}</span></td>
            <td class="${stockClass}"><strong>${stock}</strong> ${fruit.unit}</td>
            <td>${status}</td>
            <td>
                <button onclick="editFruit('${fruit.id}')" style="background:#22c55e; color:white; border:none; padding:6px 10px; border-radius:8px; cursor:pointer; margin-right:5px;">
                    <i class="fa fa-edit"></i>
                </button>
                <button onclick="deleteFruit('${fruit.id}')" style="background:#ef4444; color:white; border:none; padding:6px 10px; border-radius:8px; cursor:pointer;">
                    <i class="fa fa-trash"></i>
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

// DELETE FRUIT
function deleteFruit(fruitId) {
    if(confirm('Are you sure you want to delete this fruit?')) {
        allShopFruits = allShopFruits.filter(f => f.id !== fruitId);
        localStorage.setItem('shopFruits_'+shopId, JSON.stringify(allShopFruits));
        loadShopData(); // reload
    }
}

// ADD FRUIT BUTTON
document.getElementById('addFruitBtn').onclick = () => {
    window.location.href = `/shop-templates/fruit/fruit-form.html?shopId=${shopId}`;
};

// EDIT FRUIT
function editFruit(fruitId) {
    window.location.href = `/shop-templates/fruit/fruit-form.html?shopId=${shopId}&fruitId=${fruitId}`;
}

// SHARE BUTTON
document.getElementById('shareBtn').onclick = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Shop Link Copied!');
}

// INIT
loadShopData();
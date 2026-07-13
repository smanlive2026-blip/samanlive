const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
document.getElementById('shopIdDisplay').innerText = shopId ? shopId.substring(0, 8) + '...' : 'N/A';
let allCatalogProducts = [];

async function loadShopData() {
    const res = await fetch(`/api/local-market/shops/${shopId}`);
    const shop = await res.json();
    if (!shop._id) return alert('Shop not found');

    document.getElementById('shopName').innerText = shop.shopName;
    const items = shop.items || [];
    document.getElementById('items').innerText = items.length;
    document.getElementById('tests').innerText = shop.eyeTests || 0;
    loadInventory(items);
}

function loadInventory(items) {
    document.getElementById('inventoryList').innerHTML = items.length ? items.map(i => `
        <div class="product-card">
            <div><strong>${i.name}</strong><br><small style="color:#64748b;">${i.category} - ${i.description}</small></div>
            <strong>₹${i.price}</strong>
        </div>
    `).join('') : '<p>No products</p>';
}

// CATALOG FUNCTIONS
async function openCatalog() {
    document.getElementById('catalogModal').style.display = 'flex';
    const res = await fetch(`/api/admin/shop/${shopId}/catalog/optical`, {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    const data = await res.json();
    allCatalogProducts = data.products || [];
    showCatalog(allCatalogProducts);
}

function showCatalog(products) {
    document.getElementById('catalogList').innerHTML = products.map(p => `
        <div class="product-card">
            <div><strong>${p.name}</strong><br><small>${p.category} - ${p.description}</small></div>
            <button onclick="addFromCatalog('${p._id}', '${p.name}')" class="btn btn-success"><i class="fa fa-plus"></i> Add</button>
        </div>
    `).join('');
}

async function addFromCatalog(templateId, name) {
    const price = prompt(`${name} ka Price daalo: ₹`);
    if(!price) return;
    const stock = prompt(`${name} ka Stock:`);
    const res = await fetch(`/api/admin/shop/${shopId}/add-from-catalog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify({ templateId, price: Number(price), stock: Number(stock) })
    });
    const data = await res.json();
    alert(data.success ? '✅ Added!' : '❌ ' + data.error);
    loadShopData();
}

function closeCatalog() { document.getElementById('catalogModal').style.display = 'none'; }
function filterCatalog() {
    const val = document.getElementById('searchCatalog').value.toLowerCase();
    showCatalog(allCatalogProducts.filter(p => p.name.toLowerCase().includes(val)));
}

loadShopData();
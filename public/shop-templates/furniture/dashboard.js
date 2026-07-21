const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');

let shopData = {};
let editingItemIndex = null;

document.addEventListener('DOMContentLoaded', () => {
    if(!shopId) return alert('URL me?shopId=xxx missing hai');
    document.getElementById('shopIdDisplay').innerText = shopId;
    document.getElementById('userViewBtn').href = `/shop/furniture/${shopId}`;
    document.getElementById('addProductBtn').href = `/shop-templates/furniture/add-product.html?shopId=${shopId}`;
    document.getElementById('libraryBtn').href = `/shop-templates/furniture/product-library.html?shopId=${shopId}`;

    ShopCore.init(shopId, 'furniture');
    loadDashboard();
    setupEventListeners();
});

async function loadDashboard(){
    try{
        const res = await fetch(`/api/shops/${shopId}`);
        const result = await res.json();
        shopData = result.shop || result.data || result;
        shopData.items = shopData.items || [];

        console.log("DASHBOARD LOADED ITEMS:", shopData.items);

        document.getElementById('shopName').innerText = shopData.name || 'Furniture Showroom';
        document.getElementById('items').innerText = shopData.items.length;
        document.getElementById('orders').innerText = shopData.orders?.length || 0;
        document.getElementById('toggleText').innerText = shopData.isOpen? 'Open' : 'Closed';
        document.getElementById('shopToggle').classList.toggle('off',!shopData.isOpen);
        document.getElementById('announcementInput').value = shopData.announcement || '';
        document.getElementById('ownerImg').src = shopData.ownerImage || 'https://placehold.co/60/a16207/fff?text=U';
        document.getElementById('shopBanner').src = shopData.bannerImage || 'https://placehold.co/400x150/a16207/fff?text=Upload+Banner';

        renderProductList();
        renderLowStock();
        renderOrders();
    }catch(err){
        console.log(err);
        alert('Dashboard load error: ' + err.message);
    }
}

function renderProductList(){
    const list = document.getElementById('productList');
    if(!shopData.items.length){
        list.innerHTML = '<p style="text-align:center; color:#64748b;">Abhi koi product nahi hai</p>';
        return;
    }
    list.innerHTML = shopData.items.map((item, index) => `
        <div class="product-item">
            <img src="${item.image || item.img || 'https://placehold.co/80x80/a16207/fff?text=No+Img'}"
                 onclick="uploadProductImage(${index})" />
            <div style="flex:1;">
                <h4>${item.name}</h4>
                <p>₹${item.price} | Stock: ${item.stock} ${item.unit}</p>
            </div>
            <div style="display:flex; gap:8px;">
                <button class="btn-sm" style="background:#2563eb;" onclick="openEditModal(${index})"><i class="fa fa-pen"></i></button>
                <button class="btn-sm" style="background:#ef4444;" onclick="deleteItem('${item.id}')"><i class="fa fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function renderLowStock(){
    const low = shopData.items.filter(i => i.stock < 5);
    document.getElementById('lowStock').innerHTML = low.length?
        low.map(i => `<p>⚠️ ${i.name} - Only ${i.stock} left</p>`).join('') :
        '<p style="color:#166534;">All stock is good</p>';
}

function renderOrders(){
    document.getElementById('orderList').innerHTML = '<p style="text-align:center; color:#64748b;">Order system baad me</p>';
}

async function deleteItem(itemId){
    if(!confirm('Delete karna hai?')) return;
    await fetch(`/api/shops/${shopId}/item/${itemId}`, {method: 'DELETE'});
    loadDashboard();
}

function openEditModal(index){
    editingItemIndex = index;
    const item = shopData.items[index];
    document.getElementById('editName').value = item.name;
    document.getElementById('editPrice').value = item.price;
    document.getElementById('editStock').value = item.stock;
    document.getElementById('editUnit').value = item.unit;
    document.getElementById('editDesc').value = item.desc;
    document.getElementById('editModal').style.display = 'flex';
}

function closeEditModal(){
    document.getElementById('editModal').style.display = 'none';
    editingItemIndex = null;
}

async function saveEditedItem(){
    const item = shopData.items[editingItemIndex];
    const updatedItem = {
       ...item,
        name: document.getElementById('editName').value,
        price: Number(document.getElementById('editPrice').value),
        stock: Number(document.getElementById('editStock').value),
        unit: document.getElementById('editUnit').value,
        desc: document.getElementById('editDesc').value,
    };
    await fetch(`/api/shops/${shopId}/item/${item.id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ item: updatedItem }) // MATCHED WITH BACKEND
    });
    closeEditModal();
    loadDashboard();
}

async function uploadProductImage(index){
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async e => {
        const file = e.target.files[0];
        const url = await ShopCore.uploadImage(file, 'product');
        shopData.items[index].image = url;
        shopData.items[index].img = url;
        await fetch(`/api/shops/${shopId}/item/${shopData.items[index].id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ item: shopData.items[index] })
        });
        loadDashboard();
    };
    input.click();
}

function setupEventListeners(){
    document.getElementById('shopToggle').onclick = async () => {
        await fetch(`/api/shops/${shopId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ item: { isOpen:!shopData.isOpen } })
        });
        loadDashboard();
    };
    document.getElementById('saveAnnouncement').onclick = async () => {
        const ann = document.getElementById('announcementInput').value;
        await fetch(`/api/shops/${shopId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ item: { announcement: ann } })
        });
        alert('Saved ✅');
    };
    document.getElementById('ownerImg').onclick = () => document.getElementById('ownerInput').click();
    document.getElementById('ownerInput').onchange = async e => {
        const url = await ShopCore.uploadImage(e.target.files[0], 'owner');
        await fetch(`/api/shops/${shopId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ item: { ownerImage: url } })
        });
        loadDashboard();
    };
    document.getElementById('shopBanner').onclick = () => document.getElementById('bannerInput').click();
    document.getElementById('bannerInput').onchange = async e => {
        const url = await ShopCore.uploadImage(e.target.files[0], 'banner');
        await fetch(`/api/shops/${shopId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ item: { bannerImage: url } })
        });
        loadDashboard();
    };
}